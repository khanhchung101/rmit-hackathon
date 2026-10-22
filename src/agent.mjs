import {parseInvoice,simulateCompromisedAgent} from './parser.mjs';
export function propose(text,{simulateCompromise=false}={}){
 return simulateCompromise?simulateCompromisedAgent(text):parseInvoice(text);
}
