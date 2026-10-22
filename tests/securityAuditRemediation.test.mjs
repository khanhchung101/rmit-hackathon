import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generateKeyPairSync } from 'node:crypto';
import { makePayment, canonicalize } from '../src/canonical.mjs';
import { evaluateMockPolicy } from '../src/policy.mjs';
import { MockSigner } from '../src/signing/mockSigner.mjs';
import { MockBank, buildBankEnvelope } from '../src/bank.mjs';
import { createMockApproval, validateApprovalProof } from '../src/approvals.mjs';
import { getMockSigningKey, getBankPinnedPublicKey } from '../src/trustAnchor.mjs';

function getTempStorage() {
  const dir = mkdtempSync(join(tmpdir(), 'leash-audit-test-'));
  const durablePath = join(dir, 'bank-state.jsonl');
  const cleanup = () => {
    try { rmSync(dir, { recursive: true, force: true }); } catch (_) {}
  };
  return { dir, durablePath, cleanup };
}

test('T9 / Issue A: concurrent identical payment requests atomically reject replay', async () => {
  const { durablePath, cleanup } = getTempStorage();
  try {
    const signer = new MockSigner();
    const bank1 = new MockBank({ pinnedPublicKey: signer.publicKey, durablePath });
    const bank2 = new MockBank({ pinnedPublicKey: signer.publicKey, durablePath });

    const payment = makePayment({
      invoiceId: 'INV-CONCURRENCY-001',
      amountMinor: 45000,
      currency: 'USD',
      payeeId: 'acme-labs',
      payeeAccount: 'ACME-DEMO-001'
    }, { nonce: 'nonce-concurrent-fixed-001' });

    const approval = createMockApproval({ approverId: 'finance-a', payment });
    const signResult = signer.signIfAllowed(payment, { approvals: [approval] });
    assert.equal(signResult.ok, true);

    const env = buildBankEnvelope(payment, signResult);

    // Fire 5 concurrent execution attempts simultaneously across separate bank instances
    const results = await Promise.all([
      Promise.resolve().then(() => bank1.execute(env)),
      Promise.resolve().then(() => bank2.execute(env)),
      Promise.resolve().then(() => bank1.execute(env)),
      Promise.resolve().then(() => bank2.execute(env)),
      Promise.resolve().then(() => bank1.execute(env))
    ]);

    const executed = results.filter(r => r.code === 'EXECUTED');
    const replayed = results.filter(r => r.code === 'REPLAY_NONCE');

    assert.equal(executed.length, 1, 'Exactly one concurrent request must succeed');
    assert.equal(replayed.length, 4, 'All subsequent concurrent requests must be rejected as REPLAY_NONCE');
  } finally {
    cleanup();
  }
});

test('T10 / Issue B: approver spoofing rejected when cryptographic proof is required or invalid', () => {
  const payment = makePayment({
    invoiceId: 'INV-SPOOF-001',
    amountMinor: 50000,
    currency: 'USD',
    payeeId: 'acme-labs',
    payeeAccount: 'ACME-DEMO-001'
  }, { nonce: 'nonce-spoof-001' });

  // 1. Raw approver ID string rejected in strict proof mode
  const unverified = evaluateMockPolicy(payment, [{ approverId: 'finance-a' }], 'agent', { requireProof: true });
  assert.equal(unverified.ok, false);
  assert.equal(unverified.code, 'APPROVAL_PROOF_REQUIRED');

  // 2. Forged HMAC proof rejected
  const forged = evaluateMockPolicy(payment, [{
    approverId: 'finance-a',
    role: 'approver',
    paymentHash: 'attacker-arbitrary-hash',
    expiresAt: new Date(Date.now() + 600000).toISOString(),
    proof: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
  }], 'agent', { requireProof: true });
  assert.equal(forged.ok, false);
  assert.equal(forged.code, 'APPROVAL_PAYLOAD_MISMATCH');

  // 3. Unknown approver identity rejected
  assert.throws(() => {
    createMockApproval({ approverId: 'unauthorized-hacker', payment });
  }, /UNKNOWN_APPROVER/);

  // 4. Valid cryptographic proof succeeds
  const validApproval = createMockApproval({ approverId: 'finance-a', payment });
  const verified = evaluateMockPolicy(payment, [validApproval], 'agent', { requireProof: true });
  assert.equal(verified.ok, true);
});

test('T11 / Issue B: approval substitution attack (transplanting proof to another payment) fails', () => {
  const paymentA = makePayment({
    invoiceId: 'INV-A',
    amountMinor: 25000,
    currency: 'USD',
    payeeId: 'acme-labs',
    payeeAccount: 'ACME-DEMO-001'
  }, { nonce: 'nonce-a-001' });

  const paymentB = makePayment({
    invoiceId: 'INV-B',
    amountMinor: 99000,
    currency: 'USD',
    payeeId: 'acme-labs',
    payeeAccount: 'ACME-DEMO-001'
  }, { nonce: 'nonce-b-001' });

  // Generate legitimate proof for payment A
  const approvalForA = createMockApproval({ approverId: 'finance-a', payment: paymentA });

  // Attacker tries to attach approvalForA to payment B
  const validation = validateApprovalProof(approvalForA, paymentB);
  assert.equal(validation.valid, false);
  assert.equal(validation.code, 'APPROVAL_PAYLOAD_MISMATCH');

  const policyResult = evaluateMockPolicy(paymentB, [approvalForA], 'agent', { requireProof: true });
  assert.equal(policyResult.ok, false);
  assert.equal(policyResult.code, 'APPROVAL_PAYLOAD_MISMATCH');
});

test('T17 / Issue B: expired approval proof is rejected', () => {
  const payment = makePayment({
    invoiceId: 'INV-EXPIRED-APP',
    amountMinor: 10000,
    currency: 'USD',
    payeeId: 'acme-labs',
    payeeAccount: 'ACME-DEMO-001'
  }, { nonce: 'nonce-exp-app' });

  // Approval generated with timestamp in the past
  const pastTimestamp = new Date(Date.now() - 3600 * 1000).toISOString();
  const expiredApproval = createMockApproval({
    approverId: 'finance-a',
    payment,
    expiresAt: pastTimestamp
  });

  const check = validateApprovalProof(expiredApproval, payment);
  assert.equal(check.valid, false);
  assert.equal(check.code, 'APPROVAL_EXPIRED');

  const policyCheck = evaluateMockPolicy(payment, [expiredApproval], 'agent', { requireProof: true });
  assert.equal(policyCheck.ok, false);
  assert.equal(policyCheck.code, 'APPROVAL_EXPIRED');
});

test('T12 / Issue C: payment validity interval strictly capped at 900 seconds', () => {
  const base = {
    invoiceId: 'INV-WINDOW-001',
    amountMinor: 15000,
    currency: 'USD',
    payeeId: 'acme-labs',
    payeeAccount: 'ACME-DEMO-001'
  };

  const now = new Date();
  const issuedAt = now.toISOString();

  // Valid 900s window succeeds
  const validPayment = makePayment(base, {
    issuedAt,
    expiresAt: new Date(now.getTime() + 900 * 1000).toISOString()
  });
  assert.ok(validPayment.expiresAt);

  // Window exceeding 900 seconds (e.g. 931s with tolerance) is rejected
  assert.throws(() => {
    makePayment(base, {
      issuedAt,
      expiresAt: new Date(now.getTime() + 940 * 1000).toISOString()
    });
  }, /expiry-window-too-long/);

  // Window with expiresAt <= issuedAt is rejected
  assert.throws(() => {
    makePayment(base, {
      issuedAt,
      expiresAt: issuedAt
    });
  }, /expiry-before-issued/);
});

test('T13 / Issue C: bank rejects signed payment if current time has passed expiresAt', () => {
  const signer = new MockSigner();
  const bank = new MockBank({ pinnedPublicKey: signer.publicKey });

  const payment = makePayment({
    invoiceId: 'INV-EXPIRED-EXEC',
    amountMinor: 20000,
    currency: 'USD',
    payeeId: 'acme-labs',
    payeeAccount: 'ACME-DEMO-001'
  }, { nonce: 'nonce-exp-exec-001' });

  const signResult = signer.signIfAllowed(payment, {
    approvals: [createMockApproval({ approverId: 'finance-a', payment })]
  });
  assert.equal(signResult.ok, true);

  // Payload with expired timestamp submitted to bank
  const expiredPayload = { ...payment, expiresAt: '2020-01-01T00:00:00.000Z' };
  const env = buildBankEnvelope(expiredPayload, signResult);
  const bankResult = bank.execute(env);

  assert.equal(bankResult.accepted, false);
  assert.equal(bankResult.code, 'EXPIRED');
});

test('T14 / Issue D: bank rejects envelope with untrusted or substituted signing key', () => {
  const trustedBank = new MockBank({
    pinnedPublicKey: getBankPinnedPublicKey(),
    pinnedKeyId: 'mock-key-v1'
  });

  // Generate an rogue keypair
  const attackerKeys = generateKeyPairSync('ed25519');
  const rogueSigner = new MockSigner({
    privateKey: attackerKeys.privateKey,
    publicKey: attackerKeys.publicKey
  });

  const payment = makePayment({
    invoiceId: 'INV-ROGUE-KEY',
    amountMinor: 10000,
    currency: 'USD',
    payeeId: 'acme-labs',
    payeeAccount: 'ACME-DEMO-001'
  }, { nonce: 'nonce-rogue-001' });

  const rogueSig = rogueSigner.signIfAllowed(payment, {
    approvals: [createMockApproval({ approverId: 'finance-a', payment })]
  });

  // 1. Rogue signature presented with trusted keyId fails signature verification
  const env1 = buildBankEnvelope(payment, rogueSig, { keyId: 'mock-key-v1' });
  const res1 = trustedBank.execute(env1);
  assert.equal(res1.accepted, false);
  assert.equal(res1.code, 'BAD_SIGNATURE');

  // 2. Envelope declaring untrusted keyId is rejected by bank configuration
  const env2 = buildBankEnvelope(payment, rogueSig, { keyId: 'attacker-key-v2' });
  const res2 = trustedBank.execute(env2);
  assert.equal(res2.accepted, false);
  assert.equal(res2.code, 'UNTRUSTED_KEY_ID');
});

test('T15: malformed payload types and float amounts rejected', () => {
  const base = {
    invoiceId: 'INV-FLOAT-001',
    amountMinor: 100.50, // Floating point amount
    currency: 'USD',
    payeeId: 'acme-labs',
    payeeAccount: 'ACME-DEMO-001'
  };

  assert.throws(() => {
    makePayment(base);
  }, /INVALID_PAYLOAD:amount/);
});

test('T16: quorum boundary enforcement (99,999 vs 100,000 minor units)', () => {
  const signer = new MockSigner();

  // Low value: 99,999 minor units ($999.99) requires exactly 1 approver
  const lowPayment = makePayment({
    invoiceId: 'INV-BOUNDARY-LOW',
    amountMinor: 99999,
    currency: 'USD',
    payeeId: 'acme-labs',
    payeeAccount: 'ACME-DEMO-001'
  }, { nonce: 'nonce-boundary-low' });

  const lowSig = signer.signIfAllowed(lowPayment, {
    approvals: [createMockApproval({ approverId: 'finance-a', payment: lowPayment })]
  });
  assert.equal(lowSig.ok, true, '99,999 minor units must succeed with 1 approver');

  // High value: 100,000 minor units ($1000.00) strictly requires 2 approvers
  const highPayment = makePayment({
    invoiceId: 'INV-BOUNDARY-HIGH',
    amountMinor: 100000,
    currency: 'USD',
    payeeId: 'acme-labs',
    payeeAccount: 'ACME-DEMO-001'
  }, { nonce: 'nonce-boundary-high' });

  const highSig1 = signer.signIfAllowed(highPayment, {
    approvals: [createMockApproval({ approverId: 'finance-a', payment: highPayment })]
  });
  assert.equal(highSig1.ok, false);
  assert.equal(highSig1.detail, 'APPROVALS_REQUIRED');

  const highSig2 = signer.signIfAllowed(highPayment, {
    approvals: [
      createMockApproval({ approverId: 'finance-a', payment: highPayment }),
      createMockApproval({ approverId: 'finance-b', payment: highPayment })
    ]
  });
  assert.equal(highSig2.ok, true, '100,000 minor units must succeed with 2 distinct approvers');
});

test('T18: duplicate invoice detection prevents double-settling identical invoiceId', () => {
  const signer = new MockSigner();
  const bank = new MockBank({
    pinnedPublicKey: signer.publicKey,
    preventDuplicateInvoices: true
  });

  const p1 = makePayment({
    invoiceId: 'INV-DOUBLE-PAY-001',
    amountMinor: 20000,
    currency: 'USD',
    payeeId: 'acme-labs',
    payeeAccount: 'ACME-DEMO-001'
  }, { nonce: 'nonce-double-001' });

  const s1 = signer.signIfAllowed(p1, {
    approvals: [createMockApproval({ approverId: 'finance-a', payment: p1 })]
  });
  const res1 = bank.execute(buildBankEnvelope(p1, s1));
  assert.equal(res1.code, 'EXECUTED');

  // Attacker crafts fresh payment with new nonce but references the same settled invoiceId
  const p2 = makePayment({
    invoiceId: 'INV-DOUBLE-PAY-001',
    amountMinor: 20000,
    currency: 'USD',
    payeeId: 'acme-labs',
    payeeAccount: 'ACME-DEMO-001'
  }, { nonce: 'nonce-double-002' });

  const s2 = signer.signIfAllowed(p2, {
    approvals: [createMockApproval({ approverId: 'finance-a', payment: p2 })]
  });
  const res2 = bank.execute(buildBankEnvelope(p2, s2));
  assert.equal(res2.accepted, false);
  assert.equal(res2.code, 'DUPLICATE_INVOICE');
});
