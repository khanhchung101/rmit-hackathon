import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {simulateCompromisedAgent} from '../src/parser.mjs';import {makePayment} from '../src/canonical.mjs';import {MockSigner} from '../src/signing/mockSigner.mjs';
test('T1 MOCK ONLY: attack-following proposer cannot self-authorize hostile payee',()=>{
 const text=readFileSync(new URL('../fixtures/invoices/malicious-prompt-injection.txt',import.meta.url),'utf8');
 const proposal=simulateCompromisedAgent(text);assert.equal(proposal.payeeId,'evil-vendor');
 const result=new MockSigner().signIfAllowed(makePayment(proposal,{nonce:'attack-t1-001'}),{approvals:[{approverId:'finance-a'}]});
 assert.equal(result.code,'POLICY_DENIED');assert.equal(result.detail,'UNTRUSTED_PAYEE');
});
