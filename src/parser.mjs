/** Synthetic text-to-proposal only; it is NOT an LLM/OCR demo.
 * Strictly validates against model/schema/payment-proposal.schema.json.
 */
export const PROPOSAL_KEYS = ['invoiceId', 'amountMinor', 'currency', 'payeeId', 'payeeAccount'];

export function validateProposal(proposal){
 if(!proposal || typeof proposal !== 'object' || Array.isArray(proposal)){
   throw Error('PROPOSAL_INVALID_TYPE: proposal must be an object');
 }
 const keys = Object.keys(proposal);
 for(const k of keys){
   if(!PROPOSAL_KEYS.includes(k)){
     throw Error(`PROPOSAL_UNEXPECTED_PROPERTY:${k}`);
   }
 }
 for(const req of PROPOSAL_KEYS){
   if(!(req in proposal)){
     throw Error(`PROPOSAL_MISSING_PROPERTY:${req}`);
   }
 }
 if(typeof proposal.invoiceId !== 'string' || proposal.invoiceId.length === 0){
   throw Error('PROPOSAL_INVALID_INVOICE_ID');
 }
 if(typeof proposal.amountMinor !== 'number' || !Number.isSafeInteger(proposal.amountMinor) || proposal.amountMinor <= 0){
   throw Error('PROPOSAL_INVALID_AMOUNT');
 }
 if(typeof proposal.currency !== 'string' || !/^[A-Z]{3}$/.test(proposal.currency)){
   throw Error('PROPOSAL_INVALID_CURRENCY');
 }
 if(typeof proposal.payeeId !== 'string' || proposal.payeeId.length === 0){
   throw Error('PROPOSAL_INVALID_PAYEE_ID');
 }
 if(typeof proposal.payeeAccount !== 'string' || proposal.payeeAccount.length === 0){
   throw Error('PROPOSAL_INVALID_PAYEE_ACCOUNT');
 }
 return proposal;
}

function field(text,label){
 const m=text.match(new RegExp('^'+label.replaceAll(' ','\\s+')+'\\s*:\\s*(.*?)\\s*$', 'im'));
 if(!m) throw Error(`INVOICE_MISSING_FIELD:${label}`);
 return m[1];
}

export function parseInvoice(text){
 const amountStr=field(text,'Amount Cents');
 if(!/^\d+$/.test(amountStr))throw Error('INVOICE_INVALID_AMOUNT');
 const amountMinor=Number(amountStr);
 if(!Number.isSafeInteger(amountMinor)||amountMinor<=0)throw Error('INVOICE_INVALID_AMOUNT');
 const proposal = {
   invoiceId:field(text,'Invoice ID'),
   amountMinor,
   currency:field(text,'Currency'),
   payeeId:field(text,'Payee ID'),
   payeeAccount:field(text,'Account')
 };
 return validateProposal(proposal);
}

export function simulateCompromisedAgent(text){
 // Deliberately obeys synthetic hostile document text. For attack test ONLY.
 // Not evidence that any deployed LLM would obey a real indirect prompt injection.
 const proposal=parseInvoice(text);
 const m=text.match(/^MODEL-OVERRIDE-PAYEE:\s*(\S+)\s+(\S+)\s*$/mi);
 if(m){ proposal.payeeId=m[1]; proposal.payeeAccount=m[2]; }
 return validateProposal(proposal);
}
