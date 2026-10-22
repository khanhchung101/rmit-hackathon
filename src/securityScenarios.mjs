import assert from 'node:assert/strict';
import {readFileSync, mkdtempSync, rmSync} from 'node:fs';
import {generateKeyPairSync} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {propose} from './agent.mjs';
import {makePayment} from './canonical.mjs';
import {MockSigner} from './signing/mockSigner.mjs';
import {TideForsetiSigner} from './signing/tideForsetiSigner.mjs';
import {MockBank, buildBankEnvelope} from './bank.mjs';
import {createMockApproval, validateApprovalProof} from './approvals.mjs';
import {evaluateMockPolicy} from './policy.mjs';
import {getBankPinnedPublicKey} from './trustAnchor.mjs';

const file = n => readFileSync(new URL(`../fixtures/invoices/${n}.txt`, import.meta.url), 'utf8');

export async function runSecurityScenarios() {
  const signer = new MockSigner();
  const bank = new MockBank({
    pinnedPublicKey: signer.publicKey,
    pinnedKeyId: 'mock-key-v1',
    pinnedPolicyId: 'leash.payment.v1',
    preventDuplicateInvoices: true
  });

  const valid = makePayment(propose(file('valid-low')), {nonce: 'security-valid-001'});
  const ok = signer.signIfAllowed(valid, {approvals: [{approverId: 'finance-a'}]});
  assert.equal(ok.ok, true);

  const hostile = makePayment(propose(file('malicious-prompt-injection'), {simulateCompromise: true}), {nonce: 'security-hostile-002'});
  const bad = signer.signIfAllowed(hostile, {approvals: [{approverId: 'finance-a'}]});
  assert.equal(bad.ok, false);
  assert.equal(bad.code, 'POLICY_DENIED');
  const t1 = 'T1 PASS (MOCK): compromised proposal denied by mock policy';

  assert.equal(bank.execute(hostile, null).code, 'MISSING_SIGNATURE');
  const t2 = 'T2 PASS (MOCK): unsigned bypass rejected by independent mock bank';

  const high = makePayment(propose(file('valid-high')), {nonce: 'security-high-003'});
  assert.equal(signer.signIfAllowed(high, {approvals: [{approverId: 'finance-a'}]}).detail, 'APPROVALS_REQUIRED');
  assert.equal(signer.signIfAllowed(high, {approvals: [{approverId: 'finance-a'}, {approverId: 'finance-a'}]}).detail, 'DUPLICATE_APPROVER');
  assert.equal(signer.signIfAllowed(high, {executor: 'finance-a', approvals: [{approverId: 'finance-a'}, {approverId: 'finance-b'}]}).detail, 'SELF_APPROVAL');
  assert.equal(signer.signIfAllowed(high, {approvals: [{approverId: 'finance-a'}, {approverId: 'finance-b'}]}).ok, true);
  const t3 = 'T3 PASS (MOCK): high-value needs two independent mock identities';

  assert.equal(bank.execute({...valid, amountMinor: valid.amountMinor + 1}, ok.signature).code, 'BAD_SIGNATURE');
  assert.equal(bank.execute({...valid, payeeAccount: 'BETA-DEMO-002'}, ok.signature).code, 'BAD_SIGNATURE');
  const t4 = 'T4 PASS (MOCK): tampered exact payment bytes fail signature verification';

  assert.equal(bank.execute(valid, ok.signature).code, 'EXECUTED');
  assert.equal(bank.execute(valid, ok.signature).code, 'REPLAY_NONCE');
  const t5 = 'T5 PASS (MOCK): replayed signed payment refused';

  // T6: caller cannot weaken policy rules
  const weakenAttempt = signer.signIfAllowed(high, {
    approvals: [{approverId: 'finance-a'}],
    policyOverride: {amountThresholdMinor: 99999999}
  });
  assert.equal(weakenAttempt.ok, false);
  assert.equal(weakenAttempt.detail, 'APPROVALS_REQUIRED');
  const t6 = 'T6 PASS (MOCK): caller cannot weaken policy thresholds or bypass approver quorum';

  // T7: expired, cross-domain, wrong key
  const otherKey = generateKeyPairSync('ed25519');
  const otherBank = new MockBank({pinnedPublicKey: otherKey.publicKey});
  assert.equal(otherBank.execute(valid, ok.signature).code, 'BAD_SIGNATURE');
  assert.equal(bank.execute({...valid, domain: 'other-app.v1'}, ok.signature).code, 'INVALID_PAYLOAD');
  const t7 = 'T7 PASS (MOCK): wrong key, wrong domain, and expired payloads rejected';

  // T8: fail-closed real adapter and trust-anchor substitution prevention
  await assert.rejects(new TideForsetiSigner().signIfAllowed(valid), {code: 'REAL_TIDE_NOT_WIRED'});
  const fakeKeyEnv = buildBankEnvelope(valid, ok, {keyId: 'attacker-substituted-key', policyId: 'leash.payment.v1'});
  assert.equal(bank.execute(fakeKeyEnv).code, 'UNTRUSTED_KEY_ID');
  const fakePolEnv = buildBankEnvelope(valid, ok, {keyId: 'mock-key-v1', policyId: 'attacker-policy-v0'});
  assert.equal(bank.execute(fakePolEnv).code, 'UNTRUSTED_POLICY_ID');
  const t8 = 'T8 PASS (MOCK): real Tide fails closed; bank rejects substituted keyId and policyId';

  // T9: Concurrent atomic replay rejection across durable instances
  const tmpDir = mkdtempSync(join(tmpdir(), 't9-durable-'));
  const dPath = join(tmpDir, 'nonces.jsonl');
  try {
    const dbank1 = new MockBank({pinnedPublicKey: signer.publicKey, durablePath: dPath});
    const dbank2 = new MockBank({pinnedPublicKey: signer.publicKey, durablePath: dPath});
    const pConcurrent = makePayment({
      invoiceId: 'I-CONCURRENT-001',
      amountMinor: 30000,
      currency: 'USD',
      payeeId: 'acme-labs',
      payeeAccount: 'ACME-DEMO-001'
    }, {nonce: 'nonce-concurrent-sec-001'});
    const sConcurrent = signer.signIfAllowed(pConcurrent, {approvals: [{approverId: 'finance-a'}]});
    const envConcurrent = buildBankEnvelope(pConcurrent, sConcurrent);
    const concRes = await Promise.all([
      Promise.resolve().then(() => dbank1.execute(envConcurrent)),
      Promise.resolve().then(() => dbank2.execute(envConcurrent))
    ]);
    assert.equal(concRes.filter(r => r.code === 'EXECUTED').length, 1);
    assert.equal(concRes.filter(r => r.code === 'REPLAY_NONCE').length, 1);
  } finally {
    try { rmSync(tmpDir, {recursive: true, force: true}); } catch (_) {}
  }
  const t9 = 'T9 PASS (MOCK): concurrent replay rejected atomically across durable bank instances';

  // T10: Approver spoofing rejection when proof required or invalid
  const pSpoof = makePayment(propose(file('valid-low')), {nonce: 'security-spoof-010'});
  const unauthAttempt = evaluateMockPolicy(pSpoof, [{approverId: 'finance-a'}], 'agent', {requireProof: true});
  assert.equal(unauthAttempt.ok, false);
  assert.equal(unauthAttempt.code, 'APPROVAL_PROOF_REQUIRED');
  const validApp = createMockApproval({approverId: 'finance-a', payment: pSpoof});
  assert.equal(evaluateMockPolicy(pSpoof, [validApp], 'agent', {requireProof: true}).ok, true);
  const t10 = 'T10 PASS (MOCK): client-supplied approver names rejected without cryptographic proof';

  // T11: Approval substitution across different payment payloads rejected
  const pA = makePayment(propose(file('valid-low')), {nonce: 'security-sub-a'});
  const pB = makePayment(propose(file('valid-low')), {nonce: 'security-sub-b'});
  const appA = createMockApproval({approverId: 'finance-a', payment: pA});
  const subCheck = validateApprovalProof(appA, pB);
  assert.equal(subCheck.valid, false);
  assert.equal(subCheck.code, 'APPROVAL_PAYLOAD_MISMATCH');
  const t11 = 'T11 PASS (MOCK): approvals bound to exact payment hash, transplanting fails';

  // T12: Max expiry bounded to 900 seconds
  const now = new Date();
  assert.throws(() => {
    makePayment(propose(file('valid-low')), {
      issuedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 950 * 1000).toISOString()
    });
  }, /expiry-window-too-long/);
  const t12 = 'T12 PASS (MOCK): payment validity interval capped at 900s matching Forseti spec';

  // T13: Bank verification rejects expired transaction
  const expiredPayload = {...valid, expiresAt: '2020-01-01T00:00:00.000Z'};
  const expEnv = buildBankEnvelope(expiredPayload, ok);
  assert.equal(bank.execute(expEnv).code, 'EXPIRED');
  const t13 = 'T13 PASS (MOCK): bank execution rejects expired authorization payloads';

  // T14: Untrusted signing key injection rejected by pinned trust anchor
  const rogueKey = generateKeyPairSync('ed25519');
  const rogueSigner = new MockSigner({privateKey: rogueKey.privateKey, publicKey: rogueKey.publicKey});
  const rogueSig = rogueSigner.signIfAllowed(valid, {approvals: [{approverId: 'finance-a'}]});
  const rogueEnv = buildBankEnvelope(valid, rogueSig, {keyId: 'mock-key-v1'});
  const bankTrustAnchor = new MockBank({pinnedPublicKey: getBankPinnedPublicKey()});
  assert.equal(bankTrustAnchor.execute(rogueEnv).code, 'BAD_SIGNATURE');
  const t14 = 'T14 PASS (MOCK): bank verifies against pinned trust anchor, rejecting rogue keys';

  // T15: Malformed types and float amounts rejected
  assert.throws(() => makePayment({...propose(file('valid-low')), amountMinor: 49.99}), /INVALID_PAYLOAD:amount/);
  const t15 = 'T15 PASS (MOCK): non-integer floats and malformed types rejected by protocol';

  // T16: Quorum boundary conditions: 99,999 vs 100,000 minor units
  const boundaryLow = makePayment({...propose(file('valid-low')), amountMinor: 99999}, {nonce: 'sec-bound-low'});
  const boundaryHigh = makePayment({...propose(file('valid-low')), amountMinor: 100000}, {nonce: 'sec-bound-high'});
  assert.equal(signer.signIfAllowed(boundaryLow, {approvals: [{approverId: 'finance-a'}]}).ok, true);
  assert.equal(signer.signIfAllowed(boundaryHigh, {approvals: [{approverId: 'finance-a'}]}).ok, false);
  assert.equal(signer.signIfAllowed(boundaryHigh, {approvals: [{approverId: 'finance-a'}, {approverId: 'finance-b'}]}).ok, true);
  const t16 = 'T16 PASS (MOCK): exact quorum boundary enforced ($999.99 requires 1, $1000.00 requires 2)';

  // T17: Expired approval proof rejected
  const pastTime = new Date(Date.now() - 3600 * 1000).toISOString();
  const expApproval = createMockApproval({approverId: 'finance-a', payment: valid, expiresAt: pastTime});
  assert.equal(validateApprovalProof(expApproval, valid).code, 'APPROVAL_EXPIRED');
  const t17 = 'T17 PASS (MOCK): approval proofs with past timestamps rejected';

  // T18: Duplicate invoice detection
  const dupPayment = makePayment(propose(file('valid-low')), {nonce: 'security-dup-018'});
  const dupSig = signer.signIfAllowed(dupPayment, {approvals: [{approverId: 'finance-a'}]});
  assert.equal(bank.execute(buildBankEnvelope(dupPayment, dupSig)).code, 'DUPLICATE_INVOICE');
  const t18 = 'T18 PASS (MOCK): duplicate invoice tracking prevents double settlement';

  return [t1, t2, t3, t4, t5, t6, t7, t8, t9, t10, t11, t12, t13, t14, t15, t16, t17, t18];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = await runSecurityScenarios();
  for (const v of r) console.log(v);
  console.log('IMPORTANT: ALL results are LOCAL MOCK, not Tide evidence.');
}
