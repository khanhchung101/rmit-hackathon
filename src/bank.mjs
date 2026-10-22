/** Independent MOCK BANK: verifies signature against a PINNED key and exact signed bytes.
 * Replay state is in-memory/single-process. For multi-worker deployment use SQL UNIQUE(nonce)
 * in a transaction with payment recording; a JS Set is insufficient after restarts.
 */
import {verify,createPublicKey} from 'node:crypto';
import {canonicalize} from './canonical.mjs';
export class MockBank {
  constructor({pinnedPublicKey}={}){
    if(!pinnedPublicKey)throw Error('BANK_MISSING_PINNED_KEY');
    this.pinnedPublicKey=pinnedPublicKey?.type === 'public' ? pinnedPublicKey : createPublicKey(pinnedPublicKey);
    this.consumed=new Set();
  }
  execute(payment, signatureBase64){
    if(!signatureBase64)return {accepted:false,code:'MISSING_SIGNATURE'};
    let bytes;
    try{bytes=canonicalize(payment);}catch(err){return {accepted:false,code:err.message.split(':')[0]};}
    if(!/^[A-Za-z0-9+/]+={0,2}$/.test(signatureBase64)||signatureBase64.length>128)
      return {accepted:false,code:'BAD_SIGNATURE'};
    const signature=Buffer.from(signatureBase64,'base64');
    if(signature.length!==64 || !verify(null,bytes,this.pinnedPublicKey,signature))
      return {accepted:false,code:'BAD_SIGNATURE'};
    if(this.consumed.has(payment.nonce))return {accepted:false,code:'REPLAY_NONCE'};
    // Single-threaded mock atomic section: no await between check and mark.
    this.consumed.add(payment.nonce);
    return {accepted:true,code:'EXECUTED',invoiceId:payment.invoiceId};
  }
}
