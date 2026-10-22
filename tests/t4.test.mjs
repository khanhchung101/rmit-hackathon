import test from 'node:test';import assert from 'node:assert/strict';
import {makePayment} from '../src/canonical.mjs';import {MockSigner} from '../src/signing/mockSigner.mjs';import {MockBank} from '../src/bank.mjs';
test('T4 MOCK ONLY: tamper with amount or payee after signing',()=>{
 const p=makePayment({invoiceId:'I-4',amountMinor:50000,currency:'USD',payeeId:'acme-labs',payeeAccount:'ACME-DEMO-001'},{nonce:'attack-t4-001'});
 const s=new MockSigner(),b=new MockBank({pinnedPublicKey:s.publicKey});
 const sig=s.signIfAllowed(p,{approvals:[{approverId:'finance-a'}]}).signature;
 assert.equal(b.execute({...p,amountMinor:99999},sig).code,'BAD_SIGNATURE');
 assert.equal(b.execute({...p,payeeId:'beta-supply'},sig).code,'BAD_SIGNATURE');
 assert.equal(b.execute(p,sig).code,'EXECUTED');
});
