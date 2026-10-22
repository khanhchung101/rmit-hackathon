import test from 'node:test';import assert from 'node:assert/strict';
import {makePayment} from '../src/canonical.mjs';import {MockSigner} from '../src/signing/mockSigner.mjs';
test('T3 MOCK ONLY: distinct approvers for high-value; reject self and duplicate',()=>{
 const p=makePayment({invoiceId:'I-3',amountMinor:120000,currency:'USD',payeeId:'acme-labs',payeeAccount:'ACME-DEMO-001'},{nonce:'attack-t3-001'});
 const s=new MockSigner();
 assert.equal(s.signIfAllowed(p,{approvals:[{approverId:'finance-a'}]}).detail,'APPROVALS_REQUIRED');
 assert.equal(s.signIfAllowed(p,{approvals:[{approverId:'finance-a'},{approverId:'finance-a'}]}).detail,'DUPLICATE_APPROVER');
 assert.equal(s.signIfAllowed(p,{executor:'finance-a',approvals:[{approverId:'finance-a'},{approverId:'finance-b'}]}).detail,'SELF_APPROVAL');
 assert.equal(s.signIfAllowed(p,{approvals:[{approverId:'finance-a'},{approverId:'finance-b'}]}).ok,true);
});
