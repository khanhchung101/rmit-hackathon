import test from 'node:test';import assert from 'node:assert/strict';import {generateKeyPairSync} from 'node:crypto';
import {makePayment} from '../src/canonical.mjs';import {MockSigner} from '../src/signing/mockSigner.mjs';import {MockBank} from '../src/bank.mjs';
import {TideForsetiSigner} from '../src/signing/tideForsetiSigner.mjs';
const p=()=>makePayment({invoiceId:'I-EXTRA',amountMinor:50000,currency:'USD',payeeId:'acme-labs',payeeAccount:'ACME-DEMO-001'},{nonce:'attack-extra-001'});
test('T7 wrong receiver signing key rejects signature',()=>{
 const signer=new MockSigner(),other=generateKeyPairSync('ed25519');
 const bank=new MockBank({pinnedPublicKey:other.publicKey});
 const sig=signer.signIfAllowed(p(),{approvals:[{approverId:'finance-a'}]}).signature;
 assert.equal(bank.execute(p(),sig).code,'BAD_SIGNATURE');
});
test('T7 cross-domain signing does not validate',()=>{
 const signer=new MockSigner(),bank=new MockBank({pinnedPublicKey:signer.publicKey});
 const signed=signer.signIfAllowed(p(),{approvals:[{approverId:'finance-a'}]});
 assert.equal(bank.execute({...p(),domain:'other-app'},signed.signature).code,'INVALID_PAYLOAD');
});
test('T8 REAL Tide adapter fails closed, never silently uses mock',async()=>{
 await assert.rejects(new TideForsetiSigner().signIfAllowed(p()),{code:'REAL_TIDE_NOT_WIRED'});
});
