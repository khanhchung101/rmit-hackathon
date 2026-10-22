import test from 'node:test';
import assert from 'node:assert/strict';
import {makePayment} from '../src/canonical.mjs';
import {MockSigner} from '../src/signing/mockSigner.mjs';
import {MockBank} from '../src/bank.mjs';
import {evaluateMockPolicy} from '../src/policy.mjs';

test('T6 MOCK ONLY: transaction callers cannot weaken or override policy parameters', () => {
  const signer = new MockSigner();
  const bank = new MockBank({pinnedPublicKey: signer.publicKey});

  // High value payment requiring 2 approvers
  const highPayment = makePayment({
    invoiceId: 'I-T6-001',
    amountMinor: 250000,
    currency: 'USD',
    payeeId: 'acme-labs',
    payeeAccount: 'ACME-DEMO-001'
  }, {nonce: 'nonce-t6-001'});

  // 1. Transaction caller tries to supply inline weakened policy threshold (e.g. threshold = 5000000)
  const bypassAttempt1 = signer.signIfAllowed(highPayment, {
    approvals: [{approverId: 'finance-a'}],
    policyOverride: {amountThresholdMinor: 5000000} // Attacker attempts to override threshold
  });
  // Signer ignores / rejects policy override; high value still requires 2 distinct approvers
  assert.equal(bypassAttempt1.ok, false);
  assert.equal(bypassAttempt1.detail, 'APPROVALS_REQUIRED');

  // 2. Caller tries to add untrusted payee via execution options
  const hostilePayment = makePayment({
    invoiceId: 'I-T6-002',
    amountMinor: 50000,
    currency: 'USD',
    payeeId: 'evil-vendor',
    payeeAccount: 'EVIL-666'
  }, {nonce: 'nonce-t6-002'});

  const bypassAttempt2 = signer.signIfAllowed(hostilePayment, {
    approvals: [{approverId: 'finance-a'}],
    allowlistOverride: ['evil-vendor']
  });
  assert.equal(bypassAttempt2.ok, false);
  assert.equal(bypassAttempt2.detail, 'UNTRUSTED_PAYEE');

  // 3. Executor cannot elevate to admin or approver
  const bypassAttempt3 = signer.signIfAllowed(highPayment, {
    executor: 'finance-a',
    approvals: [{approverId: 'finance-a'}, {approverId: 'finance-b'}]
  });
  assert.equal(bypassAttempt3.ok, false);
  assert.equal(bypassAttempt3.detail, 'SELF_APPROVAL');
});

test('T6 POLICY IMMUTABILITY: evaluateMockPolicy operates on immutable vendor registry and fixed rules', () => {
  const payment = makePayment({
    invoiceId: 'I-T6-003',
    amountMinor: 50000,
    currency: 'USD',
    payeeId: 'unauthorized-entity',
    payeeAccount: 'UNAUTH-001'
  }, {nonce: 'nonce-t6-003'});

  const res = evaluateMockPolicy(payment, [{approverId: 'finance-a'}], 'agent');
  assert.equal(res.ok, false);
  assert.equal(res.code, 'UNTRUSTED_PAYEE');
});
