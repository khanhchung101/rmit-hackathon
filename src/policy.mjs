/**
 * MOCK POLICY ENGINE: enforces payload validation, dual-custody, and cryptographic approval proof.
 *
 * Resolves Issue B (approver spoofing) and Issue C (expiry consistency with Forseti).
 */
import { validatePayment, MAX_EXPIRY_SECONDS, CLOCK_SKEW_TOLERANCE_SECONDS } from './canonical.mjs';
import { validateApprovalProof, KNOWN_APPROVERS } from './approvals.mjs';
import { readFileSync } from 'node:fs';

const registry = JSON.parse(readFileSync(new URL('../fixtures/vendors.json', import.meta.url), 'utf8'));
export const HIGH_VALUE_THRESHOLD_MINOR = 100000;

export function evaluateMockPolicy(payment, approvals = [], executor = 'agent', options = {}) {
  try {
    validatePayment(payment);
  } catch (err) {
    return { ok: false, code: err.message.split(':')[0] };
  }

  if (payment.currency !== 'USD') return { ok: false, code: 'UNSUPPORTED_CURRENCY' };
  if (registry[payment.payeeId] !== payment.payeeAccount) return { ok: false, code: 'UNTRUSTED_PAYEE' };

  // Issue C: Enforce expiry window consistent with Forseti LeashPaymentPolicy.cs
  const expiryEpoch = Math.floor(Date.parse(payment.expiresAt) / 1000);
  const nowEpoch = Math.floor(Date.now() / 1000);
  if (expiryEpoch <= nowEpoch - CLOCK_SKEW_TOLERANCE_SECONDS) {
    return { ok: false, code: 'EXPIRED' };
  }
  if (!options.allowLegacyFutureExpiry && (expiryEpoch - nowEpoch > MAX_EXPIRY_SECONDS + CLOCK_SKEW_TOLERANCE_SECONDS)) {
    return { ok: false, code: 'EXPIRY_WINDOW_TOO_LONG' };
  }

  if (!Array.isArray(approvals)) return { ok: false, code: 'APPROVALS_REQUIRED' };

  // Issue B: Require authentic approval proofs
  // In HTTP pipeline / server, requireProof is enabled to block spoofed approverId strings.
  const requireProof = Boolean(options.requireProof || process.env.LEASH_REQUIRE_APPROVAL_PROOFS === '1');
  const validatedApproverIds = [];

  for (const a of approvals) {
    if (a && typeof a === 'object' && a.proof) {
      const val = validateApprovalProof(a, payment);
      if (!val.valid) {
        return { ok: false, code: val.code };
      }
      validatedApproverIds.push(val.approverId);
    } else if (a && typeof a === 'object' && a.approverId) {
      if (requireProof) {
        return { ok: false, code: 'APPROVAL_PROOF_REQUIRED' };
      }
      if (!KNOWN_APPROVERS.includes(a.approverId)) {
        return { ok: false, code: 'INVALID_APPROVER' };
      }
      validatedApproverIds.push(a.approverId);
    } else {
      return { ok: false, code: 'INVALID_APPROVER' };
    }
  }

  if (validatedApproverIds.includes(executor)) {
    return { ok: false, code: 'SELF_APPROVAL' };
  }
  if (new Set(validatedApproverIds).size !== validatedApproverIds.length) {
    return { ok: false, code: 'DUPLICATE_APPROVER' };
  }

  const required = payment.amountMinor >= HIGH_VALUE_THRESHOLD_MINOR ? 2 : 1;
  if (validatedApproverIds.length < required) {
    return { ok: false, code: 'APPROVALS_REQUIRED', required };
  }

  return { ok: true, code: 'POLICY_ALLOWED', required };
}
