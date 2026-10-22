import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseInvoice, simulateCompromisedAgent, validateProposal} from '../src/parser.mjs';
import {propose} from '../src/agent.mjs';

const readFixture = name => readFileSync(new URL(`../fixtures/invoices/${name}.txt`, import.meta.url), 'utf8');

test('proposal schema: valid fixtures parse into compliant proposal objects', () => {
  const p1 = parseInvoice(readFixture('valid-low'));
  assert.equal(p1.invoiceId, 'INV-LOW-001');
  assert.equal(p1.amountMinor, 55000);
  assert.equal(p1.currency, 'USD');
  assert.equal(p1.payeeId, 'acme-labs');
  assert.equal(p1.payeeAccount, 'ACME-DEMO-001');

  const p2 = propose(readFixture('valid-high'));
  assert.equal(p2.invoiceId, 'INV-HIGH-002');
  assert.equal(p2.amountMinor, 150000);
});

test('proposal schema: rejects unexpected injected properties', () => {
  const base = parseInvoice(readFixture('valid-low'));
  
  // Attacker attempts to smuggle authority / bypass fields in proposal
  assert.throws(
    () => validateProposal({...base, signature: 'attacker-fake-sig'}),
    /PROPOSAL_UNEXPECTED_PROPERTY:signature/
  );
  assert.throws(
    () => validateProposal({...base, policyOverride: true}),
    /PROPOSAL_UNEXPECTED_PROPERTY:policyOverride/
  );
  assert.throws(
    () => validateProposal({...base, bypassBank: true}),
    /PROPOSAL_UNEXPECTED_PROPERTY:bypassBank/
  );
  assert.throws(
    () => validateProposal({...base, approvers: ['finance-a', 'finance-b']}),
    /PROPOSAL_UNEXPECTED_PROPERTY:approvers/
  );
});

test('proposal schema: rejects invalid amounts and malformed currencies', () => {
  const base = parseInvoice(readFixture('valid-low'));

  // Float amounts rejected
  assert.throws(
    () => validateProposal({...base, amountMinor: 42.50}),
    /PROPOSAL_INVALID_AMOUNT/
  );
  // Zero / negative amounts rejected
  assert.throws(
    () => validateProposal({...base, amountMinor: 0}),
    /PROPOSAL_INVALID_AMOUNT/
  );
  assert.throws(
    () => validateProposal({...base, amountMinor: -500}),
    /PROPOSAL_INVALID_AMOUNT/
  );
  // Invalid currency rejected
  assert.throws(
    () => validateProposal({...base, currency: 'usd'}), // lowercase
    /PROPOSAL_INVALID_CURRENCY/
  );
  assert.throws(
    () => validateProposal({...base, currency: 'USDT'}), // 4 chars
    /PROPOSAL_INVALID_CURRENCY/
  );
});

test('proposal agent: compromised agent produces untrusted proposal, not authorization', () => {
  const text = readFixture('malicious-prompt-injection');
  const proposal = propose(text, {simulateCompromise: true});
  
  // Confirms the proposal was swayed to hostile payee
  assert.equal(proposal.payeeId, 'evil-vendor');
  assert.equal(proposal.payeeAccount, 'ATTACKER-DEMO-999');
  
  // Confirms the proposal contains NO authority fields
  assert.equal('signature' in proposal, false);
  assert.equal('authorization' in proposal, false);
  assert.equal('bypassed' in proposal, false);
});
