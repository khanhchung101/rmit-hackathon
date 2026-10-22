import {readFileSync} from 'node:fs';
import {parseInvoice,simulateCompromisedAgent} from '../src/parser.mjs';
import {makePayment} from '../src/canonical.mjs';
import {evaluateMockPolicy} from '../src/policy.mjs';
const cases=JSON.parse(readFileSync(new URL('../fixtures/cases.json',import.meta.url)));
let count=0;
for(const c of cases){
 if(!c.invoice)continue;
 const text=readFileSync(new URL(`../fixtures/invoices/${c.invoice}.txt`,import.meta.url),'utf8');
 let result;
 try{
  const prop=c.mode==='simulated-compromised-agent'?simulateCompromisedAgent(text):parseInvoice(text);
  const p=makePayment(prop,{nonce:`verify-${c.id}`});
  result=evaluateMockPolicy(p,c.approvedBy.map(approverId=>({approverId}))).ok?'ALLOW':'DENY';
 }catch{result='PARSE_ERROR'}
 if(result!==c.expected)throw Error(`Fixture ${c.id}: expected ${c.expected}, got ${result}`);
 console.log(`PASS ${c.id}: ${result}`);count++;
}
console.log(`Verified ${count} invoice fixtures — MOCK policy semantics only.`);
