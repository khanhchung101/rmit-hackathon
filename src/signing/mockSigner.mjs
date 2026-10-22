/** TEST ONLY. A local Ed25519 keypair exists in this process. NOT threshold signing. */
import { sign } from 'node:crypto';
import { canonicalize } from '../canonical.mjs';
import { evaluateMockPolicy } from '../policy.mjs';
import { getMockSigningKey, getMockTrustAnchor } from '../trustAnchor.mjs';

export class MockSigner {
  constructor(options = {}) {
    this._privateKey = options.privateKey || getMockSigningKey();
    this.publicKey = options.publicKey || getMockTrustAnchor();
    this.mode = 'mock';
  }

  signIfAllowed(payment, { approvals = [], executor = 'agent', options = {} } = {}) {
    const decision = evaluateMockPolicy(payment, approvals, executor, options);
    if (!decision.ok) {
      return {
        ok: false,
        code: 'POLICY_DENIED',
        detail: decision.code,
        signer: 'MOCK_LOCAL_ONLY'
      };
    }
    const bytes = canonicalize(payment);
    return {
      ok: true,
      code: 'MOCK_SIGNED',
      signature: sign(null, bytes, this._privateKey).toString('base64'),
      signer: 'MOCK_LOCAL_ONLY'
    };
  }
}
