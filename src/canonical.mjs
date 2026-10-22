/** MOCK PROTOCOL v1 ONLY. Real Tide signing-byte semantics require G4 validation. */
export const SIGNED_KEYS = Object.freeze([
  'amountMinor','currency','domain','expiresAt','invoiceId','nonce','payeeAccount','payeeId','version'
]);
export const DOMAIN = 'leash.payment.v1';
export const VERSION = 'leash.pay.v1';
const ASCII = /^[\x20-\x7E]+$/;

export function validatePayment(p, {at=new Date()} = {}) {
  if (!p || typeof p !== 'object' || Array.isArray(p)) throw Error('INVALID_PAYLOAD:object');
  const keys = Object.keys(p).sort();
  if (keys.length !== SIGNED_KEYS.length || keys.some((v,i)=>v!==SIGNED_KEYS[i]))
    throw Error('INVALID_PAYLOAD:exact-fields');
  if (p.version !== VERSION || p.domain !== DOMAIN) throw Error('INVALID_PAYLOAD:domain-or-version');
  if (!Number.isSafeInteger(p.amountMinor) || p.amountMinor <= 0) throw Error('INVALID_PAYLOAD:amount');
  for (const key of SIGNED_KEYS.filter(x=>x!=='amountMinor')) {
    if (typeof p[key] !== 'string' || !ASCII.test(p[key]) || p[key].length > 128)
      throw Error('INVALID_PAYLOAD:' + key);
  }
  if (!/^[A-Z]{3}$/.test(p.currency)) throw Error('INVALID_PAYLOAD:currency');
  if (!/^[A-Za-z0-9._-]{5,128}$/.test(p.nonce)) throw Error('INVALID_PAYLOAD:nonce');
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(p.expiresAt) ||
      !Number.isFinite(Date.parse(p.expiresAt)) || new Date(p.expiresAt).toISOString() !== p.expiresAt)
    throw Error('INVALID_PAYLOAD:expiry-format');
  if (Date.parse(p.expiresAt) <= at.getTime()) throw Error('EXPIRED');
  return true;
}
export function canonicalize(p, options={}) {
  validatePayment(p,options);
  const sorted = Object.fromEntries(SIGNED_KEYS.map(k=>[k,p[k]]));
  return Buffer.from(JSON.stringify(sorted), 'utf8');
}
export function makePayment(proposal, {nonce, expiresAt='2030-01-01T00:00:00.000Z'}={}) {
  const p = {
    amountMinor: proposal.amountMinor,
    currency: proposal.currency,
    domain: DOMAIN,
    expiresAt,
    invoiceId: proposal.invoiceId,
    nonce: nonce || `nonce-${cryptoRandom()}`,
    payeeAccount: proposal.payeeAccount,
    payeeId: proposal.payeeId,
    version: VERSION
  };
  validatePayment(p);
  return p;
}
function cryptoRandom(){return globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now();}
