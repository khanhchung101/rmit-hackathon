import {readFileSync} from 'node:fs';
import {propose} from './agent.mjs';
import {makePayment} from './canonical.mjs';
import {MockSigner} from './signing/mockSigner.mjs';
import {MockBank, buildBankEnvelope} from './bank.mjs';
import {createMockApproval} from './approvals.mjs';

function invoice(name){return readFileSync(new URL(`../fixtures/invoices/${name}.txt`,import.meta.url),'utf8');}

export function runMockDemo(){
 const signer=new MockSigner();
 const bank=new MockBank({
   pinnedPublicKey:signer.publicKey,
   pinnedKeyId:'demo-pinned-key-01',
   pinnedPolicyId:'leash.payment.v1'
 });

 // 1. Valid low-value payment (1 approver required)
 const valid=makePayment(propose(invoice('valid-low')),{nonce:'demo-valid-001'});
 const good=signer.signIfAllowed(valid,{
   approvals:[createMockApproval({approverId:'finance-a',payment:valid})]
 });
 const executed=bank.execute(buildBankEnvelope(valid,good,{keyId:'demo-pinned-key-01',policyId:'leash.payment.v1'}));

 // 2. Valid high-value payment (2 distinct approvers required)
 const high=makePayment(propose(invoice('valid-high')),{nonce:'demo-high-002'});
 const highGood=signer.signIfAllowed(high,{
   approvals:[
     createMockApproval({approverId:'finance-a',payment:high}),
     createMockApproval({approverId:'finance-b',payment:high})
   ]
 });
 const highExecuted=bank.execute(buildBankEnvelope(high,highGood,{keyId:'demo-pinned-key-01',policyId:'leash.payment.v1'}));

 // 3. Prompt injection attack: hostile invoice alters payee proposal
 const injectedProposal=propose(invoice('malicious-prompt-injection'),{simulateCompromise:true});
 const hostile=makePayment(injectedProposal,{nonce:'demo-hostile-003'});
 const hostileResult=signer.signIfAllowed(hostile,{
   approvals:[createMockApproval({approverId:'finance-a',payment:hostile})]
 });

 // 4. Direct bank bypass without signature
 const bypass=bank.execute(hostile,null);

 // 5. Tampered payment: attacker modifies amount after signing
 const tampered=bank.execute({...valid,amountMinor:999999},good.signature);

 // 6. Replay attack: replaying previously executed valid payment
 const replay=bank.execute(valid,good.signature);

 // 7. Trust anchor substitution (T8): caller provides untrusted keyId
 const untrustedKey=bank.execute(buildBankEnvelope(valid,good,{keyId:'evil-attacker-key',policyId:'leash.payment.v1'}));

 return {
   mode:'MOCK_ONLY_NOT_TIDE',
   legitLowValue:{
     invoiceId:valid.invoiceId,
     amountMinor:valid.amountMinor,
     approverCount:1,
     execution:executed
   },
   legitHighValue:{
     invoiceId:high.invoiceId,
     amountMinor:high.amountMinor,
     approverCount:2,
     execution:highExecuted
   },
   maliciousProposal:injectedProposal,
   maliciousSigning:hostileResult,
   directBypass:bypass,
   tamperedPayment:tampered,
   replayAttack:replay,
   untrustedKeySubstitution:untrustedKey
 };
}

if(import.meta.url===`file://${process.argv[1]}`){console.log(JSON.stringify(runMockDemo(),null,2));}
