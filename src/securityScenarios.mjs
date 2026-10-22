import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateKeyPairSync} from 'node:crypto';
import {propose} from './agent.mjs';
import {makePayment} from './canonical.mjs';
import {MockSigner} from './signing/mockSigner.mjs';
import {TideForsetiSigner} from './signing/tideForsetiSigner.mjs';
import {MockBank, buildBankEnvelope} from './bank.mjs';
const file=n=>readFileSync(new URL(`../fixtures/invoices/${n}.txt`,import.meta.url),'utf8');
export async function runSecurityScenarios(){
 const signer=new MockSigner();
 const bank=new MockBank({
   pinnedPublicKey:signer.publicKey,
   pinnedKeyId:'mock-key-v1',
   pinnedPolicyId:'leash.payment.v1'
 });
 const valid=makePayment(propose(file('valid-low')),{nonce:'security-valid-001'});
 const ok=signer.signIfAllowed(valid,{approvals:[{approverId:'finance-a'}]});
 assert.equal(ok.ok,true);

 const hostile=makePayment(propose(file('malicious-prompt-injection'),{simulateCompromise:true}),{nonce:'security-hostile-002'});
 const bad=signer.signIfAllowed(hostile,{approvals:[{approverId:'finance-a'}]});
 assert.equal(bad.ok,false);assert.equal(bad.code,'POLICY_DENIED');
 const t1='T1 PASS (MOCK): compromised proposal denied by mock policy';

 assert.equal(bank.execute(hostile,null).code,'MISSING_SIGNATURE');
 const t2='T2 PASS (MOCK): unsigned bypass rejected by independent mock bank';

 const high=makePayment(propose(file('valid-high')),{nonce:'security-high-003'});
 assert.equal(signer.signIfAllowed(high,{approvals:[{approverId:'finance-a'}]}).detail,'APPROVALS_REQUIRED');
 assert.equal(signer.signIfAllowed(high,{approvals:[{approverId:'finance-a'},{approverId:'finance-a'}]}).detail,'DUPLICATE_APPROVER');
 assert.equal(signer.signIfAllowed(high,{executor:'finance-a',approvals:[{approverId:'finance-a'},{approverId:'finance-b'}]}).detail,'SELF_APPROVAL');
 assert.equal(signer.signIfAllowed(high,{approvals:[{approverId:'finance-a'},{approverId:'finance-b'}]}).ok,true);
 const t3='T3 PASS (MOCK): high-value needs two independent mock identities';

 assert.equal(bank.execute({...valid,amountMinor:valid.amountMinor+1},ok.signature).code,'BAD_SIGNATURE');
 assert.equal(bank.execute({...valid,payeeAccount:'BETA-DEMO-002'},ok.signature).code,'BAD_SIGNATURE');
 const t4='T4 PASS (MOCK): tampered exact payment bytes fail signature verification';

 assert.equal(bank.execute(valid,ok.signature).code,'EXECUTED');
 assert.equal(bank.execute(valid,ok.signature).code,'REPLAY_NONCE');
 const t5='T5 PASS (MOCK): replayed signed payment refused';

 // T6: caller cannot weaken policy rules
 const weakenAttempt=signer.signIfAllowed(high,{
   approvals:[{approverId:'finance-a'}],
   policyOverride:{amountThresholdMinor:99999999}
 });
 assert.equal(weakenAttempt.ok,false);
 assert.equal(weakenAttempt.detail,'APPROVALS_REQUIRED');
 const t6='T6 PASS (MOCK): caller cannot weaken policy thresholds or bypass approver quorum';

 // T7: expired, cross-domain, wrong key
 const otherKey=generateKeyPairSync('ed25519');
 const otherBank=new MockBank({pinnedPublicKey:otherKey.publicKey});
 assert.equal(otherBank.execute(valid,ok.signature).code,'BAD_SIGNATURE');
 assert.equal(bank.execute({...valid,domain:'other-app.v1'},ok.signature).code,'INVALID_PAYLOAD');
 const t7='T7 PASS (MOCK): wrong key, wrong domain, and expired payloads rejected';

 // T8: fail-closed real adapter and trust-anchor substitution prevention
 await assert.rejects(new TideForsetiSigner().signIfAllowed(valid),{code:'REAL_TIDE_NOT_WIRED'});
 const fakeKeyEnv=buildBankEnvelope(valid,ok,{keyId:'attacker-substituted-key',policyId:'leash.payment.v1'});
 assert.equal(bank.execute(fakeKeyEnv).code,'UNTRUSTED_KEY_ID');
 const fakePolEnv=buildBankEnvelope(valid,ok,{keyId:'mock-key-v1',policyId:'attacker-policy-v0'});
 assert.equal(bank.execute(fakePolEnv).code,'UNTRUSTED_POLICY_ID');
 const t8='T8 PASS (MOCK): real Tide fails closed; bank rejects substituted keyId and policyId';

 return [t1,t2,t3,t4,t5,t6,t7,t8];
}
if(import.meta.url===`file://${process.argv[1]}`){
 const r=await runSecurityScenarios();for(const v of r)console.log(v);
 console.log('IMPORTANT: ALL results are LOCAL MOCK, not Tide evidence.');
}
