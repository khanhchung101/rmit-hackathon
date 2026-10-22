/**
 * LEASH PAYMENT PIPELINE ORCHESTRATOR
 * Executes the complete 5-stage cryptographic authorization boundary:
 * Stage 1: Proposal extraction & schema validation
 * Stage 2: Canonical payment byte serialization & hashing
 * Stage 3: Tide / Policy-gated threshold signing
 * Stage 4: Bank execution envelope assembly & trust-anchor binding
 * Stage 5: Independent bank verification & durable replay check
 */
import { propose } from './agent.mjs';
import { makePayment, canonicalize } from './canonical.mjs';
import { MockSigner } from './signing/mockSigner.mjs';
import { TideForsetiSigner } from './signing/tideForsetiSigner.mjs';
import { MockBank, buildBankEnvelope } from './bank.mjs';
import { createHash } from 'node:crypto';

export async function processInvoicePayment({
  invoiceText,
  simulateCompromise = false,
  approvals = [],
  executor = 'agent',
  signer = null,
  bank = null,
  options = {}
} = {}) {
  const telemetry = {
    timestamp: new Date().toISOString(),
    stages: {}
  };

  // Stage 1: Invoice Proposal & Schema Validation
  let proposal;
  try {
    proposal = propose(invoiceText, { simulateCompromise });
    telemetry.stages.proposal = {
      status: 'PASS',
      invoiceId: proposal.invoiceId,
      amountMinor: proposal.amountMinor,
      currency: proposal.currency,
      payeeId: proposal.payeeId,
      payeeAccount: proposal.payeeAccount
    };
  } catch (err) {
    telemetry.stages.proposal = { status: 'DENIED', error: err.message };
    return {
      accepted: false,
      failedStage: 'STAGE_1_PROPOSAL_VALIDATION',
      code: err.message.split(':')[0],
      detail: err.message,
      telemetry
    };
  }

  // Stage 2: Canonical Payment Byte Serialization & Hashing
  let payment;
  let canonicalBytes;
  let canonicalSha256;
  try {
    payment = makePayment(proposal, options);
    canonicalBytes = canonicalize(payment);
    canonicalSha256 = createHash('sha256').update(canonicalBytes).digest('hex');
    telemetry.stages.canonicalization = {
      status: 'PASS',
      nonce: payment.nonce,
      domain: payment.domain,
      version: payment.version,
      canonicalSha256
    };
  } catch (err) {
    telemetry.stages.canonicalization = { status: 'DENIED', error: err.message };
    return {
      accepted: false,
      failedStage: 'STAGE_2_CANONICALIZATION',
      code: err.message.split(':')[0],
      detail: err.message,
      telemetry
    };
  }

  // Stage 3: Tide / Policy-gated Signing
  const activeSigner = signer || (process.env.TIDE_MODE === 'real' ? new TideForsetiSigner() : new MockSigner());
  let signResult;
  try {
    signResult = await activeSigner.signIfAllowed(payment, { approvals, executor });
    if (!signResult.ok) {
      telemetry.stages.authorization = {
        status: 'DENIED',
        code: signResult.code,
        detail: signResult.detail,
        signer: signResult.signer || activeSigner.mode || 'MOCK_LOCAL_ONLY'
      };
      return {
        accepted: false,
        failedStage: 'STAGE_3_POLICY_GATE',
        code: signResult.code,
        detail: signResult.detail,
        telemetry
      };
    }
    telemetry.stages.authorization = {
      status: 'PASS',
      code: signResult.code,
      signer: signResult.signer || 'MOCK_LOCAL_ONLY',
      signaturePresent: !!signResult.signature
    };
  } catch (err) {
    telemetry.stages.authorization = { status: 'ERROR', error: err.message, code: err.code || 'SIGNING_ERROR' };
    return {
      accepted: false,
      failedStage: 'STAGE_3_POLICY_GATE',
      code: err.code || 'SIGNING_ERROR',
      detail: err.message,
      telemetry
    };
  }

  // Stage 4: Bank Execution Envelope Assembly
  const keyId = activeSigner.mode === 'real' ? (process.env.TIDE_KEY_ID || 'tide-vvk-real') : 'mock-key-v1';
  const policyId = activeSigner.mode === 'real' ? (process.env.TIDE_POLICY_ID || 'forseti-leash-v1') : 'leash.payment.v1';
  const envelope = buildBankEnvelope(payment, signResult, {
    keyId,
    policyId,
    mode: activeSigner.mode === 'real' ? 'REAL_TIDE' : 'MOCK_ONLY'
  });
  telemetry.stages.envelope = {
    status: 'PASS',
    mode: envelope.authorization.mode,
    keyId: envelope.authorization.keyId,
    policyId: envelope.authorization.policyId
  };

  // Stage 5: Independent Bank Verification & Durable Nonce Check
  const activeBank = bank || new MockBank({
    pinnedPublicKey: activeSigner.publicKey,
    pinnedKeyId: keyId,
    pinnedPolicyId: policyId
  });

  const executionResult = activeBank.execute(envelope);
  telemetry.stages.bankExecution = {
    status: executionResult.accepted ? 'EXECUTED' : 'DENIED',
    code: executionResult.code
  };

  if (!executionResult.accepted) {
    return {
      accepted: false,
      failedStage: 'STAGE_5_BANK_VERIFICATION',
      code: executionResult.code,
      telemetry
    };
  }

  return {
    accepted: true,
    stage: 'SETTLED',
    code: 'EXECUTED',
    invoiceId: payment.invoiceId,
    amountMinor: payment.amountMinor,
    currency: payment.currency,
    payeeId: payment.payeeId,
    payeeAccount: payment.payeeAccount,
    nonce: payment.nonce,
    telemetry
  };
}
