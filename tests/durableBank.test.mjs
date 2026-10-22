import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, rmSync, existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {makePayment} from '../src/canonical.mjs';
import {MockSigner} from '../src/signing/mockSigner.mjs';
import {MockBank, buildBankEnvelope} from '../src/bank.mjs';

test('durable bank: persists consumed nonces across restarts', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'leash-bank-test-'));
  const durablePath = join(tmp, 'nonces.jsonl');

  try {
    const signer = new MockSigner();
    // Bank 1 starts up with durable path
    const bank1 = new MockBank({pinnedPublicKey: signer.publicKey, durablePath});
    const p1 = makePayment({
      invoiceId: 'I-RESTART-1',
      amountMinor: 50000,
      currency: 'USD',
      payeeId: 'acme-labs',
      payeeAccount: 'ACME-DEMO-001'
    }, {nonce: 'nonce-restart-001'});

    const signed1 = signer.signIfAllowed(p1, {approvals: [{approverId: 'finance-a'}]});
    assert.equal(signed1.ok, true);

    const res1 = bank1.execute(p1, signed1.signature);
    assert.equal(res1.code, 'EXECUTED');
    assert.equal(existsSync(durablePath), true);

    // Bank 1 restarts / is disposed. Bank 2 starts up pointing to same durable storage
    const bank2 = new MockBank({pinnedPublicKey: signer.publicKey, durablePath});
    // Attempt replay of p1 on restarted bank2
    const replayRes = bank2.execute(p1, signed1.signature);
    assert.equal(replayRes.accepted, false);
    assert.equal(replayRes.code, 'REPLAY_NONCE');

    // Fresh payment p2 on bank2 succeeds
    const p2 = makePayment({
      invoiceId: 'I-RESTART-2',
      amountMinor: 60000,
      currency: 'USD',
      payeeId: 'acme-labs',
      payeeAccount: 'ACME-DEMO-001'
    }, {nonce: 'nonce-restart-002'});
    const signed2 = signer.signIfAllowed(p2, {approvals: [{approverId: 'finance-a'}]});
    assert.equal(bank2.execute(p2, signed2.signature).code, 'EXECUTED');

    // Bank 3 starts up, both nonces are remembered
    const bank3 = new MockBank({pinnedPublicKey: signer.publicKey, durablePath});
    assert.equal(bank3.execute(p1, signed1.signature).code, 'REPLAY_NONCE');
    assert.equal(bank3.execute(p2, signed2.signature).code, 'REPLAY_NONCE');
  } finally {
    rmSync(tmp, {recursive: true, force: true});
  }
});

test('bank execution envelope: accepts valid envelope and rejects modified fields or untrusted keys/policies (T8)', () => {
  const signer = new MockSigner();
  const bank = new MockBank({
    pinnedPublicKey: signer.publicKey,
    pinnedKeyId: 'pinned-test-key-01',
    pinnedPolicyId: 'leash.payment.v1'
  });

  const p = makePayment({
    invoiceId: 'I-ENV-1',
    amountMinor: 50000,
    currency: 'USD',
    payeeId: 'acme-labs',
    payeeAccount: 'ACME-DEMO-001'
  }, {nonce: 'nonce-env-001'});

  const signed = signer.signIfAllowed(p, {approvals: [{approverId: 'finance-a'}]});
  const validEnvelope = buildBankEnvelope(p, signed, {
    keyId: 'pinned-test-key-01',
    policyId: 'leash.payment.v1',
    mode: 'MOCK_ONLY'
  });

  // Valid envelope execution
  const res = bank.execute(validEnvelope);
  assert.equal(res.accepted, true);
  assert.equal(res.code, 'EXECUTED');

  // Replay of envelope rejected
  assert.equal(bank.execute(validEnvelope).code, 'REPLAY_NONCE');

  // T8: Attacker substitutes untrusted keyId
  const pUntrustedKey = makePayment({
    invoiceId: 'I-ENV-2',
    amountMinor: 50000,
    currency: 'USD',
    payeeId: 'acme-labs',
    payeeAccount: 'ACME-DEMO-001'
  }, {nonce: 'nonce-env-002'});
  const signed2 = signer.signIfAllowed(pUntrustedKey, {approvals: [{approverId: 'finance-a'}]});
  const untrustedKeyEnvelope = buildBankEnvelope(pUntrustedKey, signed2, {
    keyId: 'attacker-substituted-key',
    policyId: 'leash.payment.v1'
  });
  assert.equal(bank.execute(untrustedKeyEnvelope).code, 'UNTRUSTED_KEY_ID');

  // T8: Attacker substitutes weakened policyId
  const pUntrustedPolicy = makePayment({
    invoiceId: 'I-ENV-3',
    amountMinor: 50000,
    currency: 'USD',
    payeeId: 'acme-labs',
    payeeAccount: 'ACME-DEMO-001'
  }, {nonce: 'nonce-env-003'});
  const signed3 = signer.signIfAllowed(pUntrustedPolicy, {approvals: [{approverId: 'finance-a'}]});
  const untrustedPolicyEnvelope = buildBankEnvelope(pUntrustedPolicy, signed3, {
    keyId: 'pinned-test-key-01',
    policyId: 'weakened.bypass.policy.v0'
  });
  assert.equal(bank.execute(untrustedPolicyEnvelope).code, 'UNTRUSTED_POLICY_ID');

  // Tampered payload in envelope
  const tamperedEnvelope = buildBankEnvelope(
    {...pUntrustedPolicy, amountMinor: 999999},
    signed3,
    {keyId: 'pinned-test-key-01', policyId: 'leash.payment.v1'}
  );
  assert.equal(bank.execute(tamperedEnvelope).code, 'BAD_SIGNATURE');
});
