import test from 'node:test';import assert from 'node:assert/strict';
import {makePayment,canonicalize,validatePayment} from '../src/canonical.mjs';
import {evaluateMockPolicy} from '../src/policy.mjs';
const p=()=>makePayment({invoiceId:'I-1',amountMinor:50000,currency:'USD',payeeId:'acme-labs',payeeAccount:'ACME-DEMO-001'},{nonce:'test-policy-001'});
test('canonical byte encoding fixed independently of object insertion order',()=>{
 const x=p();const reversed=Object.fromEntries(Object.entries(x).reverse());
 assert.deepEqual(canonicalize(x),canonicalize(reversed));
});
test('canonical rejects unexpected props, floats, wrong domain, expired',()=>{
 assert.throws(()=>canonicalize({...p(),untrusted:'x'}),/INVALID_PAYLOAD/);
 assert.throws(()=>canonicalize({...p(),amountMinor:5.2}),/INVALID_PAYLOAD/);
 assert.throws(()=>canonicalize({...p(),domain:'other-app'}),/INVALID_PAYLOAD/);
 assert.throws(()=>canonicalize({...p(),expiresAt:'2020-01-01T00:00:00.000Z'}),/EXPIRED/);
 assert.throws(()=>canonicalize({...p(),invoiceId:'I-\"escaped'}),/INVALID_PAYLOAD/);
 assert.throws(()=>canonicalize({...p(),payeeAccount:'ACME\\DEMO'}),/INVALID_PAYLOAD/);
});
test('every payment needs independent approval even when small',()=>{
 assert.equal(evaluateMockPolicy(p(),[]).ok,false);
 assert.equal(evaluateMockPolicy(p(),[{approverId:'finance-a'}]).ok,true);
});
