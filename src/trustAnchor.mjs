/**
 * TRUST ANCHOR MANAGEMENT
 *
 * Provides independently configured trust anchors for mock and real mode.
 * The bank verifier loads its public key from this module, ensuring that
 * callers/signers cannot inject their own keys into the bank.
 */
import { generateKeyPairSync, createPublicKey } from 'node:crypto';

// Fixed mock authority keypair isolated to mock test mode
const mockAuthority = generateKeyPairSync('ed25519');

export function getMockSigningKey() {
  return mockAuthority.privateKey;
}

export function getMockTrustAnchor() {
  return mockAuthority.publicKey;
}

export function getBankPinnedPublicKey(options = {}) {
  if (options.pinnedPublicKey) {
    return options.pinnedPublicKey?.type === 'public'
      ? options.pinnedPublicKey
      : createPublicKey(options.pinnedPublicKey);
  }

  if (process.env.TIDE_MODE === 'real') {
    if (!process.env.TIDE_VVK) {
      throw new Error('BANK_MISSING_REAL_VVK: Real Tide mode requires pinned TIDE_VVK trust anchor.');
    }
    return createPublicKey(process.env.TIDE_VVK);
  }

  return mockAuthority.publicKey;
}
