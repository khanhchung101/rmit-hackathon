/** Synthetic text-to-proposal only; it is NOT an LLM/OCR demo. */
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
 return {
   invoiceId:field(text,'Invoice ID'),
   amountMinor,
   currency:field(text,'Currency'),
   payeeId:field(text,'Payee ID'),
   payeeAccount:field(text,'Account')
 };
}
export function simulateCompromisedAgent(text){
 // Deliberately obeys synthetic hostile document text. For attack test ONLY.
 // Not evidence that any deployed LLM would obey a real indirect prompt injection.
 const proposal=parseInvoice(text);
 const m=text.match(/^MODEL-OVERRIDE-PAYEE:\s*(\S+)\s+(\S+)\s*$/mi);
 if(m){ proposal.payeeId=m[1]; proposal.payeeAccount=m[2]; }
 return proposal;
}
