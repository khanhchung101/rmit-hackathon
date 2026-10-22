/** MOCK POLICY ONLY: approval IDs are unsigned JSON; NOT real Tide enforcement. */
import {validatePayment} from './canonical.mjs';
import {readFileSync} from 'node:fs';
const registry=JSON.parse(readFileSync(new URL('../fixtures/vendors.json',import.meta.url),'utf8'));
export const HIGH_VALUE_THRESHOLD_MINOR=100000;
const knownApprovers=new Set(['finance-a','finance-b','finance-c']);
export function evaluateMockPolicy(payment, approvals=[], executor='agent'){
  try { validatePayment(payment); } catch(err){return {ok:false,code:err.message.split(':')[0]};}
  if(payment.currency!=='USD') return {ok:false,code:'UNSUPPORTED_CURRENCY'};
  if(registry[payment.payeeId]!==payment.payeeAccount) return {ok:false,code:'UNTRUSTED_PAYEE'};
  if(!Array.isArray(approvals))return {ok:false,code:'APPROVALS_REQUIRED'};
  const approverIds=approvals.map(a=>a?.approverId);
  if(approverIds.some(a=>typeof a!=='string'||!knownApprovers.has(a)))return {ok:false,code:'INVALID_APPROVER'};
  if(approverIds.includes(executor))return {ok:false,code:'SELF_APPROVAL'};
  if(new Set(approverIds).size!==approverIds.length) return {ok:false,code:'DUPLICATE_APPROVER'};
  const required=payment.amountMinor>=HIGH_VALUE_THRESHOLD_MINOR?2:1;
  if(approverIds.length<required)return {ok:false,code:'APPROVALS_REQUIRED',required};
  return {ok:true,code:'POLICY_ALLOWED',required};
}
