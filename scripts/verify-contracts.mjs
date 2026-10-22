import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {SIGNED_KEYS, DOMAIN, VERSION, canonicalize} from '../src/canonical.mjs';

const root = new URL('../', import.meta.url);
const readJson = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));

const paymentSchema = await readJson('model/schema/payment-instruction-v1.schema.json');
const bankSchema = await readJson('model/schema/bank-execution-v1.schema.json');
const vector = await readJson('evidence/mock-signature-protocol-vector.json');
const contract = await readFile(new URL('forseti/LeashPaymentPolicy.cs', root), 'utf8');

assert.deepEqual(paymentSchema.required, SIGNED_KEYS, 'schema fields must equal canonical signed fields in order');
assert.equal(paymentSchema.additionalProperties, false);
assert.equal(paymentSchema.properties.domain.const, DOMAIN);
assert.equal(paymentSchema.properties.version.const, VERSION);
assert.equal(bankSchema.properties.payment.$ref, 'payment-instruction-v1.schema.json');
assert.deepEqual(bankSchema.required, ['payment', 'authorization']);

const payment = JSON.parse(vector.utf8);
const bytes = canonicalize(payment, {at: new Date('2026-10-22T00:00:00.000Z')});
assert.equal(bytes.toString('utf8'), vector.utf8);
assert.equal(createHash('sha256').update(bytes).digest('hex'), vector.sha256);

for (const literal of [DOMAIN, VERSION, 'USD', ...SIGNED_KEYS]) {
  assert.ok(contract.includes(literal), `Forseti candidate is missing protocol literal: ${literal}`);
}

console.log(`PASS payment schema: ${SIGNED_KEYS.length} exact signed fields`);
console.log(`PASS canonical vector sha256: ${vector.sha256}`);
console.log('PASS bank envelope: exact payment plus explicit authorization metadata');
console.log('PASS Forseti candidate: structural protocol literals present (NOT compile/deploy evidence)');

