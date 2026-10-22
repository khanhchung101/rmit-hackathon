import test from 'node:test';import assert from 'node:assert/strict';
import {makePayment} from '../src/canonical.mjs';import {MockSigner} from '../src/signing/mockSigner.mjs';import {MockBank} from '../src/bank.mjs';
test('T5 MOCK ONLY: replay nonce forbidden by same receiver instance',()=>{
 const p=makePayment({invoiceId:'I-5',amountMinor:50000,currency:'USD',payeeId:'acme-labs',payeeAccount:'ACME-DEMO-001'},{nonce:'attack-t5-001'});
 const s=new MockSigner(),b=new MockBank({pinnedPublicKey:s.publicKey});
 const sig=s.signIfAllowed(p,{approvals:[{approverId:'finance-a'}]}).signature;
 assert.equal(b.execute(p,sig).code,'EXECUTED');assert.equal(b.execute(p,sig).code,'REPLAY_NONCE');
});
