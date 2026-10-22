import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {canonicalize} from '../src/canonical.mjs';

const vector={
 amountMinor:55000,
 currency:'USD',
 domain:'leash.payment.v1',
 expiresAt:'2030-01-01T00:00:00.000Z',
 invoiceId:'INV-LOW-001',
 nonce:'nonce-low-001',
 payeeAccount:'ACME-DEMO-001',
 payeeId:'acme-labs',
 version:'leash.pay.v1'
};

test('mock protocol v1 has a fixed byte-level test vector',()=>{
 const bytes=canonicalize(vector,{at:new Date('2026-10-22T00:00:00.000Z')});
 assert.equal(bytes.toString('utf8'),'{' +
  '"amountMinor":55000,"currency":"USD","domain":"leash.payment.v1",' +
  '"expiresAt":"2030-01-01T00:00:00.000Z","invoiceId":"INV-LOW-001",' +
  '"nonce":"nonce-low-001","payeeAccount":"ACME-DEMO-001",' +
  '"payeeId":"acme-labs","version":"leash.pay.v1"}');
 assert.equal(createHash('sha256').update(bytes).digest('hex'),
  '648693c9f2a3e4f0684ead1e7af690763f8dfb80224636e2f68e46f917b5656f');
});
