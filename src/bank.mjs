/** Independent MOCK BANK: verifies signature against a PINNED key and exact signed bytes.
 * Supports both in-memory and durable file-backed nonce ledger with atomic locking to prevent
 * multi-process and post-restart replay attacks.
 */
import {verify,createPublicKey} from 'node:crypto';
import {readFileSync,appendFileSync,existsSync,mkdirSync,openSync,closeSync,unlinkSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {tmpdir} from 'node:os';
import {canonicalize} from './canonical.mjs';
import {getBankPinnedPublicKey} from './trustAnchor.mjs';

export const DEFAULT_DURABLE_STORAGE_PATH = process.env.LEASH_BANK_STORAGE_PATH || join(tmpdir(), 'leash-bank-durable-nonces.jsonl');

function withLock(lockPath, fn) {
  const maxRetries = 100;
  let acquired = false;
  let fd = null;
  for (let i = 0; i < maxRetries; i++) {
    try {
      fd = openSync(lockPath, 'wx');
      acquired = true;
      break;
    } catch (e) {
      if (e.code === 'EEXIST') {
        const start = Date.now();
        while (Date.now() - start < 5) {}
        continue;
      }
      throw e;
    }
  }
  if (!acquired) throw new Error('LOCK_TIMEOUT');
  try {
    return fn();
  } finally {
    if (fd !== null) {
      try { closeSync(fd); } catch {}
      try { unlinkSync(lockPath); } catch {}
    }
  }
}

export class MockBank {
  constructor({pinnedPublicKey, pinnedKeyId, pinnedPolicyId, durablePath, preventDuplicateInvoices=false}={}){
    const trustedKey = pinnedPublicKey || getBankPinnedPublicKey();
    this.pinnedPublicKey = trustedKey?.type === 'public' ? trustedKey : createPublicKey(trustedKey);
    this.pinnedKeyId = pinnedKeyId || null;
    this.pinnedPolicyId = pinnedPolicyId || null;
    this.durablePath = durablePath || null;
    this.preventDuplicateInvoices = Boolean(preventDuplicateInvoices);
    this.consumed = new Set();
    this.settledInvoices = new Set();

    if(this.durablePath){
      mkdirSync(dirname(this.durablePath),{recursive:true});
      this._reloadDurableLedger();
    }
  }

  _reloadDurableLedger(){
    if(!existsSync(this.durablePath))return;
    const content=readFileSync(this.durablePath,'utf8');
    const lines=content.split('\n');
    for(const line of lines){
      const trimmed=line.trim();
      if(!trimmed)continue;
      try{
        const entry=JSON.parse(trimmed);
        if(entry?.nonce)this.consumed.add(entry.nonce);
        if(entry?.invoiceId)this.settledInvoices.add(entry.invoiceId);
      }catch{}
    }
  }

  _executeDurable(payment){
    const lockPath=this.durablePath+'.lock';
    return withLock(lockPath,()=>{
      this._reloadDurableLedger();
      if(this.consumed.has(payment.nonce))return {accepted:false,code:'REPLAY_NONCE'};
      if(this.preventDuplicateInvoices && this.settledInvoices.has(payment.invoiceId)){
        return {accepted:false,code:'DUPLICATE_INVOICE'};
      }
      const record=JSON.stringify({nonce:payment.nonce,timestamp:Date.now(),invoiceId:payment.invoiceId})+'\n';
      appendFileSync(this.durablePath,record,'utf8');
      this.consumed.add(payment.nonce);
      this.settledInvoices.add(payment.invoiceId);
      return {accepted:true,code:'EXECUTED',invoiceId:payment.invoiceId};
    });
  }

  execute(paymentOrEnvelope, signatureBase64){
    let payment=paymentOrEnvelope;
    let sig=signatureBase64;

    if(paymentOrEnvelope && typeof paymentOrEnvelope==='object' && 'payment' in paymentOrEnvelope && 'authorization' in paymentOrEnvelope){
      payment=paymentOrEnvelope.payment;
      const auth=paymentOrEnvelope.authorization;
      if(!auth || typeof auth!=='object')return {accepted:false,code:'INVALID_ENVELOPE'};
      if(auth.mode!=='MOCK_ONLY' && auth.mode!=='REAL_TIDE'){
        return {accepted:false,code:'INVALID_ENVELOPE_MODE'};
      }
      if(this.pinnedKeyId && auth.keyId!==this.pinnedKeyId){
        return {accepted:false,code:'UNTRUSTED_KEY_ID'};
      }
      if(this.pinnedPolicyId && auth.policyId!==this.pinnedPolicyId){
        return {accepted:false,code:'UNTRUSTED_POLICY_ID'};
      }
      sig=auth.signatureBase64;
    }

    if(!sig)return {accepted:false,code:'MISSING_SIGNATURE'};
    let bytes;
    try{bytes=canonicalize(payment);}catch(err){return {accepted:false,code:err.message.split(':')[0]};}

    const expiryEpoch = Math.floor(Date.parse(payment.expiresAt) / 1000);
    const nowEpoch = Math.floor(Date.now() / 1000);
    if (expiryEpoch <= nowEpoch - 30) {
      return {accepted: false, code: 'EXPIRED'};
    }

    if(!/^[A-Za-z0-9+/]+={0,2}$/.test(sig)||sig.length>256)
      return {accepted:false,code:'BAD_SIGNATURE'};
    const signature=Buffer.from(sig,'base64');
    if(signature.length!==64 || !verify(null,bytes,this.pinnedPublicKey,signature))
      return {accepted:false,code:'BAD_SIGNATURE'};

    if(this.durablePath){
      return this._executeDurable(payment);
    }

    if(this.consumed.has(payment.nonce))return {accepted:false,code:'REPLAY_NONCE'};
    if(this.preventDuplicateInvoices && this.settledInvoices.has(payment.invoiceId)){
      return {accepted:false,code:'DUPLICATE_INVOICE'};
    }
    // Single-threaded mock atomic section: no await between check and mark.
    this.consumed.add(payment.nonce);
    this.settledInvoices.add(payment.invoiceId);
    return {accepted:true,code:'EXECUTED',invoiceId:payment.invoiceId};
  }
}

export function buildBankEnvelope(payment, signResult, {keyId='mock-key-v1', policyId='leash.payment.v1', mode='MOCK_ONLY'}={}){
  return {
    payment,
    authorization: {
      mode,
      signatureBase64: signResult.signature,
      keyId,
      policyId
    }
  };
}
