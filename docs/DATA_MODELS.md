# Data models

**InvoiceText:** UTF-8 synthetic lines, `Invoice ID`, `Payee ID`, `Account`, `Amount Cents`, `Currency`, `Expires At` + arbitrary untrusted text.

**PaymentProposal:** `{invoiceId,amountMinor,currency,payeeId,payeeAccount}` — untrusted, no approval/signature/policy fields.

**PaymentInstruction (signed):** `{version,domain,invoiceId,amountMinor,currency,payeeId,payeeAccount,nonce,expiresAt}` — exact 9-field canonical object, bank verifies bytes.

Machine-readable local contract: `model/schema/payment-instruction-v1.schema.json`.
Its `required` order is the byte serialization order used by `src/canonical.mjs`;
JSON object order is not treated as validation semantics outside that encoder.

**Mock approval:** `{approverId, org}` is NOT a cryptographic artifact and never accepted as Tide proof. For `TIDE_MODE=real` define an approval proof schema from actual Tide SDK, including transaction binding and doken validation.

**Bank result:** `{accepted:boolean,code:'EXECUTED'|'MISSING_SIGNATURE'|'BAD_SIGNATURE'|'REPLAY_NONCE'|'INVALID_PAYLOAD'|'EXPIRED'|'UNTRUSTED_KEY'|'UNSUPPORTED_MODE'}`.

**Bank execution envelope:** exact `payment` plus an `authorization` object with
explicit `mode`, `signatureBase64`, `keyId` and `policyId`; see
`model/schema/bank-execution-v1.schema.json`. Tide algorithm, key ID and policy
ID values are provisional until G4 proves their real formats and provenance.
