# Data models

**InvoiceText:** UTF-8 synthetic lines, `Invoice ID`, `Payee ID`, `Account`, `Amount Cents`, `Currency`, `Expires At` + arbitrary untrusted text.

**PaymentProposal:** `{invoiceId,amountMinor,currency,payeeId,payeeAccount}` — untrusted, no approval/signature/policy fields.

**PaymentInstruction (signed):** `{version,domain,invoiceId,amountMinor,currency,payeeId,payeeAccount,nonce,expiresAt}` — exact 9-field canonical object, bank verifies bytes.

**Mock approval:** `{approverId, org}` is NOT a cryptographic artifact and never accepted as Tide proof. For `TIDE_MODE=real` define an approval proof schema from actual Tide SDK, including transaction binding and doken validation.

**Bank result:** `{accepted:boolean,code:'EXECUTED'|'MISSING_SIGNATURE'|'BAD_SIGNATURE'|'REPLAY_NONCE'|'INVALID_PAYLOAD'|'EXPIRED'|'UNTRUSTED_KEY'|'UNSUPPORTED_MODE'}`.
