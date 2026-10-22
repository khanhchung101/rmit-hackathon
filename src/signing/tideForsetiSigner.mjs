/**
 * REAL TIDE ADAPTER: G4 production boundary.
 *
 * Implements policy-governed threshold signing via TideCloak / Forseti engine.
 * Never imports MockSigner or local test keys.
 * Fails closed with REAL_TIDE_NOT_WIRED unless live Tide realm configuration
 * and authorization artifacts are provided.
 */
import { canonicalize } from '../canonical.mjs';

export class TideForsetiSigner {
  constructor(options = {}) {
    this.mode = 'real';
    this.realmUrl = options.realmUrl || process.env.TIDE_REALM_URL || null;
    this.policyId = options.policyId || process.env.TIDE_POLICY_ID || null;
    this.authToken = options.authToken || process.env.TIDE_AUTH_TOKEN || null;
    this.clientId = options.clientId || process.env.TIDE_CLIENT_ID || null;
    this.publicKey = options.publicKey || process.env.TIDE_VVK || null;
  }

  isConfigured() {
    return Boolean(this.realmUrl && this.policyId && this.authToken);
  }

  async signIfAllowed(payment, { approvals = [], executor = 'agent' } = {}) {
    if (!this.isConfigured()) {
      throw Object.assign(
        new Error('REAL_TIDE_NOT_WIRED: Complete Step 0 G4. Missing live Tide configuration (TIDE_REALM_URL, TIDE_POLICY_ID, TIDE_AUTH_TOKEN). Never substitute the mock signer.'),
        { code: 'REAL_TIDE_NOT_WIRED' }
      );
    }

    const canonicalBytes = canonicalize(payment);

    // Format matches audited DynamicApprovedCustom request family
    const requestPayload = {
      jsonrpc: '2.0',
      method: 'executeSignRequest',
      params: {
        policyId: this.policyId,
        model: 'DynamicApprovedCustom',
        canonicalBytesBase64: canonicalBytes.toString('base64'),
        approvals: approvals.map(a => a.doken || a.proof || a.approverId),
        executor
      },
      id: Date.now()
    };

    const endpoint = `${this.realmUrl.replace(/\/+$/, '')}/api/v1/forseti/sign`;
    let response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify(requestPayload)
      });
    } catch (netErr) {
      throw Object.assign(new Error(`TIDE_NETWORK_ERROR: ${netErr.message}`), { code: 'TIDE_NETWORK_ERROR' });
    }

    if (!response.ok) {
      return {
        ok: false,
        code: 'POLICY_DENIED',
        detail: `HTTP_${response.status}`,
        signer: 'TIDE_REAL_ORK'
      };
    }

    const data = await response.json();
    if (data.error || !data.result?.signature) {
      return {
        ok: false,
        code: data.error?.code || 'POLICY_DENIED',
        detail: data.error?.message || 'ORK_REFUSED_SIGNATURE',
        signer: 'TIDE_REAL_ORK'
      };
    }

    return {
      ok: true,
      code: 'TIDE_SIGNED',
      signature: data.result.signature,
      signer: 'TIDE_REAL_ORK',
      keyId: data.result.keyId || this.policyId
    };
  }
}
