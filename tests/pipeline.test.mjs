import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {processInvoicePayment} from '../src/pipeline.mjs';
import {MockSigner} from '../src/signing/mockSigner.mjs';
import {MockBank} from '../src/bank.mjs';

const fixture = name => readFileSync(new URL(`../fixtures/invoices/${name}.txt`, import.meta.url), 'utf8');

test('pipeline: valid low-value invoice settles through all 5 stages', async () => {
  const signer = new MockSigner();
  const bank = new MockBank({
    pinnedPublicKey: signer.publicKey,
    pinnedKeyId: 'mock-key-v1',
    pinnedPolicyId: 'leash.payment.v1'
  });

  const res = await processInvoicePayment({
    invoiceText: fixture('valid-low'),
    approvals: [{approverId: 'finance-a'}],
    signer,
    bank,
    options: {nonce: 'pipeline-test-valid-001'}
  });

  assert.equal(res.accepted, true);
  assert.equal(res.code, 'EXECUTED');
  assert.equal(res.stage, 'SETTLED');
  assert.equal(res.telemetry.stages.proposal.status, 'PASS');
  assert.equal(res.telemetry.stages.canonicalization.status, 'PASS');
  assert.equal(res.telemetry.stages.authorization.status, 'PASS');
  assert.equal(res.telemetry.stages.envelope.status, 'PASS');
  assert.equal(res.telemetry.stages.bankExecution.status, 'EXECUTED');
});

test('pipeline: high-value invoice requires 2 approvers and settles', async () => {
  const signer = new MockSigner();
  const bank = new MockBank({
    pinnedPublicKey: signer.publicKey,
    pinnedKeyId: 'mock-key-v1',
    pinnedPolicyId: 'leash.payment.v1'
  });

  // 1 approver fails at Stage 3
  const failRes = await processInvoicePayment({
    invoiceText: fixture('valid-high'),
    approvals: [{approverId: 'finance-a'}],
    signer,
    bank,
    options: {nonce: 'pipeline-high-001'}
  });
  assert.equal(failRes.accepted, false);
  assert.equal(failRes.failedStage, 'STAGE_3_POLICY_GATE');
  assert.equal(failRes.detail, 'APPROVALS_REQUIRED');

  // 2 distinct approvers succeeds
  const passRes = await processInvoicePayment({
    invoiceText: fixture('valid-high'),
    approvals: [{approverId: 'finance-a'}, {approverId: 'finance-b'}],
    signer,
    bank,
    options: {nonce: 'pipeline-high-002'}
  });
  assert.equal(passRes.accepted, true);
  assert.equal(passRes.code, 'EXECUTED');
});

test('pipeline: prompt injection denied at Stage 3 policy gate', async () => {
  const signer = new MockSigner();
  const bank = new MockBank({
    pinnedPublicKey: signer.publicKey,
    pinnedKeyId: 'mock-key-v1',
    pinnedPolicyId: 'leash.payment.v1'
  });

  const res = await processInvoicePayment({
    invoiceText: fixture('malicious-prompt-injection'),
    simulateCompromise: true,
    approvals: [{approverId: 'finance-a'}],
    signer,
    bank,
    options: {nonce: 'pipeline-injection-003'}
  });

  assert.equal(res.accepted, false);
  assert.equal(res.failedStage, 'STAGE_3_POLICY_GATE');
  assert.equal(res.detail, 'UNTRUSTED_PAYEE');
});

test('pipeline: malformed invoice denied at Stage 1 proposal validation', async () => {
  const res = await processInvoicePayment({
    invoiceText: 'Not an invoice at all',
    approvals: [{approverId: 'finance-a'}]
  });

  assert.equal(res.accepted, false);
  assert.equal(res.failedStage, 'STAGE_1_PROPOSAL_VALIDATION');
});

test('pipeline: replay nonce denied at Stage 5 bank verification', async () => {
  const signer = new MockSigner();
  const bank = new MockBank({
    pinnedPublicKey: signer.publicKey,
    pinnedKeyId: 'mock-key-v1',
    pinnedPolicyId: 'leash.payment.v1'
  });

  const nonce = 'pipeline-replay-fixed-004';
  const first = await processInvoicePayment({
    invoiceText: fixture('valid-low'),
    approvals: [{approverId: 'finance-a'}],
    signer,
    bank,
    options: {nonce}
  });
  assert.equal(first.accepted, true);

  const second = await processInvoicePayment({
    invoiceText: fixture('valid-low'),
    approvals: [{approverId: 'finance-a'}],
    signer,
    bank,
    options: {nonce}
  });
  assert.equal(second.accepted, false);
  assert.equal(second.failedStage, 'STAGE_5_BANK_VERIFICATION');
  assert.equal(second.code, 'REPLAY_NONCE');
});
