import test from 'node:test';import assert from 'node:assert/strict';
import {makePayment} from '../src/canonical.mjs';import {MockSigner} from '../src/signing/mockSigner.mjs';import {MockBank} from '../src/bank.mjs';
test('T2 MOCK ONLY: direct bank bypass without signature',()=>{
 const signer=new MockSigner();const bank=new MockBank({pinnedPublicKey:signer.publicKey});
 const p=makePayment({invoiceId:'I-2',amountMinor:50000,currency:'USD',payeeId:'acme-labs',payeeAccount:'ACME-DEMO-001'},{nonce:'attack-t2-001'});
 assert.equal(bank.execute(p,undefined).code,'MISSING_SIGNATURE');
});
