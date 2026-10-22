import {readFileSync} from 'node:fs';
import {propose} from './agent.mjs';
import {makePayment} from './canonical.mjs';
import {MockSigner} from './signing/mockSigner.mjs';
import {MockBank} from './bank.mjs';
function invoice(name){return readFileSync(new URL(`../fixtures/invoices/${name}.txt`,import.meta.url),'utf8');}
export function runMockDemo(){
 const signer=new MockSigner();const bank=new MockBank({pinnedPublicKey:signer.publicKey});
 const valid=makePayment(propose(invoice('valid-low')),{nonce:'demo-valid-001'});
 const good=signer.signIfAllowed(valid,{approvals:[{approverId:'finance-a'}]});
 const executed=bank.execute(valid,good.signature);
 const injectedProposal=propose(invoice('malicious-prompt-injection'),{simulateCompromise:true});
 const hostile=makePayment(injectedProposal,{nonce:'demo-hostile-002'});
 const hostileResult=signer.signIfAllowed(hostile,{approvals:[{approverId:'finance-a'}]});
 const bypass=bank.execute(hostile,null);
 return {mode:'MOCK_ONLY_NOT_TIDE',legit:executed,maliciousProposal:injectedProposal,maliciousSigning:hostileResult,directBypass:bypass};
}
if(import.meta.url===`file://${process.argv[1]}`){console.log(JSON.stringify(runMockDemo(),null,2));}
