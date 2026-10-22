/** MOCK PROTOCOL v1 ONLY. Real Tide signing-byte semantics require G4 validation. */
export const SIGNED_KEYS = Object.freeze([
  'amountMinor','currency','domain','expiresAt','invoiceId','nonce','payeeAccount','payeeId','version'
]);
export const DOMAIN = 'leash.payment.v1';
export const VERSION = 'leash.pay.v1';
export const DEFAULT_EXPIRY_SECONDS = 900; // 15 minutes, matching Forseti MaxExpirySeconds
export const MAX_EXPIRY_SECONDS = 900;
export const CLOCK_SKEW_TOLERANCE_SECONDS = 30;
const ASCII = /^[\x20-\x7E]+$/;
const SAFE_TOKEN = /^[A-Za-z0-9._-]+$/;

export function validatePayment(p, options = {}) {
  let at = new Date();
  let maxExpirySeconds = null;
  if (options instanceof Date) {
    at = options;
  } else if (options && typeof options === 'object') {
    if (options.at) at = options.at instanceof Date ? options.at : new Date(options.at);
    if ('maxExpirySeconds' in options) maxExpirySeconds = options.maxExpirySeconds;
  }

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
  for (const key of ['invoiceId','nonce','payeeAccount','payeeId']) {
    if (!SAFE_TOKEN.test(p[key])) throw Error('INVALID_PAYLOAD:' + key);
  }
  if (!/^[A-Z]{3}$/.test(p.currency)) throw Error('INVALID_PAYLOAD:currency');
  if (!/^[A-Za-z0-9._-]{5,128}$/.test(p.nonce)) throw Error('INVALID_PAYLOAD:nonce');
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(p.expiresAt) ||
      !Number.isFinite(Date.parse(p.expiresAt)) || new Date(p.expiresAt).toISOString() !== p.expiresAt)
    throw Error('INVALID_PAYLOAD:expiry-format');
  const expiryTime = Date.parse(p.expiresAt);
  const atTime = at.getTime();
  if (expiryTime <= atTime) throw Error('EXPIRED');
  if (maxExpirySeconds !== null) {
    const deltaSeconds = (expiryTime - atTime) / 1000;
    if (deltaSeconds > (maxExpirySeconds + CLOCK_SKEW_TOLERANCE_SECONDS)) {
      throw Error('INVALID_PAYLOAD:expiry-window-too-long');
    }
  }
  return true;
}
export function canonicalize(p, options={}) {
  validatePayment(p,options);
  const sorted = Object.fromEntries(SIGNED_KEYS.map(k=>[k,p[k]]));
  return Buffer.from(JSON.stringify(sorted), 'utf8');
}
export function makePayment(proposal, {
  nonce,
  expiresAt,
  validitySeconds = DEFAULT_EXPIRY_SECONDS,
  issuedAt = new Date(),
  maxExpirySeconds = MAX_EXPIRY_SECONDS
} = {}) {
  const issuedDate = issuedAt instanceof Date ? issuedAt : new Date(issuedAt);
  if (expiresAt) {
    const expTime = Date.parse(expiresAt);
    if (expTime <= issuedDate.getTime()) {
      throw Error('INVALID_PAYLOAD:expiry-before-issued');
    }
  }
  const calculatedExpiry = expiresAt || new Date(issuedDate.getTime() + (validitySeconds * 1000)).toISOString();
  const p = {
    amountMinor: proposal.amountMinor,
    currency: proposal.currency,
    domain: DOMAIN,
    expiresAt: calculatedExpiry,
    invoiceId: proposal.invoiceId,
    nonce: nonce || `nonce-${cryptoRandom()}`,
    payeeAccount: proposal.payeeAccount,
    payeeId: proposal.payeeId,
    version: VERSION
  };
  validatePayment(p, {at: issuedDate, maxExpirySeconds});
  return p;
}
function cryptoRandom(){return globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now();}
