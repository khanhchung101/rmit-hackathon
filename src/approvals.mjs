/**
 * APPROVAL AUTHENTICATION & PROOF VERIFICATION
 *
 * Prevents approver identity spoofing (Issue B).
 * Approvals cannot be forged by simply passing an approverId string.
 * Each approval must be bound to:
 * 1. The exact canonical payment SHA-256 hash.
 * 2. An enrolled/known approver identity with approver role.
 * 3. A validity expiration timestamp.
 * 4. A cryptographic HMAC/signature proof using the approver's credential.
 */
import { createHash, createHmac } from 'node:crypto';
import { canonicalize } from './canonical.mjs';

// Dedicated mock credentials for authorized test approvers (never used in production)
const MOCK_APPROVER_SECRETS = {
  'finance-a': 'mock-credential-finance-a-key-99128',
  'finance-b': 'mock-credential-finance-b-key-77214',
  'finance-c': 'mock-credential-finance-c-key-33819'
};

export const KNOWN_APPROVERS = Object.freeze(Object.keys(MOCK_APPROVER_SECRETS));

export function calculatePaymentHash(payment) {
  const bytes = canonicalize(payment);
  return createHash('sha256').update(bytes).digest('hex');
}

/**
 * Creates a mock cryptographic approval proof bound to a specific payment.
 */
export function createMockApproval({
  approverId,
  payment,
  expiresAt = null,
  role = 'approver'
}) {
  if (!approverId || typeof approverId !== 'string') {
    throw new Error('INVALID_APPROVER_ID');
  }
  const secret = MOCK_APPROVER_SECRETS[approverId];
  if (!secret) {
    throw new Error(`UNKNOWN_APPROVER:${approverId}`);
  }

  const paymentHash = calculatePaymentHash(payment);
  const approvalExpiry = expiresAt || payment.expiresAt || new Date(Date.now() + 900 * 1000).toISOString();

  // Bind approver, exact payment hash, role, and expiry
  const message = `${approverId}:${role}:${paymentHash}:${approvalExpiry}`;
  const proof = createHmac('sha256', secret).update(message).digest('hex');

  return {
    approverId,
    role,
    paymentHash,
    expiresAt: approvalExpiry,
    proof
  };
}

/**
 * Validates that an approval is authentic, unexpired, and bound to the exact payment.
 */
export function validateApprovalProof(approval, payment, { at = new Date() } = {}) {
  if (!approval || typeof approval !== 'object') {
    return { valid: false, code: 'INVALID_APPROVAL_OBJECT' };
  }

  const approverId = approval.approverId;
  if (!approverId || !MOCK_APPROVER_SECRETS[approverId]) {
    return { valid: false, code: 'UNAUTHORIZED_APPROVER' };
  }

  if (approval.role !== 'approver') {
    return { valid: false, code: 'APPROVER_ROLE_MISSING' };
  }

  // Check expiration
  const expiryEpoch = Math.floor(Date.parse(approval.expiresAt) / 1000);
  const atEpoch = Math.floor(at.getTime() / 1000);
  if (!Number.isFinite(expiryEpoch) || expiryEpoch <= atEpoch) {
    return { valid: false, code: 'APPROVAL_EXPIRED' };
  }

  // Check exact payment hash binding (prevents approval substitution attack)
  const expectedPaymentHash = calculatePaymentHash(payment);
  if (approval.paymentHash !== expectedPaymentHash) {
    return { valid: false, code: 'APPROVAL_PAYLOAD_MISMATCH' };
  }

  // Check cryptographic proof (prevents spoofing approverId string)
  const secret = MOCK_APPROVER_SECRETS[approverId];
  const message = `${approverId}:${approval.role}:${approval.paymentHash}:${approval.expiresAt}`;
  const expectedProof = createHmac('sha256', secret).update(message).digest('hex');

  if (approval.proof !== expectedProof) {
    return { valid: false, code: 'INVALID_APPROVAL_PROOF' };
  }

  return { valid: true, approverId };
}
