# Payment policy spec — intent, not deployed contract

**Domain:** `leash.payment.v1`; **Version:** `leash.pay.v1`; **currency:** USD; **amountMinor:** strict positive safe integer; **high-value:** >=100,000 cents. Synthetic trusted registry: `fixtures/vendors.json` keyed payeeId. Account must match registry, and only `ACME-DEMO-001` or `BETA-DEMO-002` may be used for valid payments.

**Base rules:** exact version, exact domain, positive amount, allowed currency, trusted payee+account, fresh nonce format, not expired. Every transaction has at least 1 independent human approver, high-value >=2 DISTINCT humans, no executor self-approval. `finance-a`, `finance-b`, `finance-c` are mock-only identity strings; real policy must bind to independently verifiable dokens.

**Fidelity requirement:** real contract validates exactly the bytes signed; don't check a loosely associated metadata copy. Any contract configuration changes protected and bank pinning updated only through trusted governance. `ValidateData` must deny wrong payee *even if backend says OK*. `ValidateApprovers` is mode-dependent (EXPLICIT); verify SDK processing sequence. `ValidateExecutor` separately enforces executor constraints in PRIVATE mode if applicable.

**Policy failure labels (mock):** `INVALID_PAYLOAD`, `UNSUPPORTED_CURRENCY`, `UNTRUSTED_PAYEE`, `EXPIRED`, `APPROVALS_REQUIRED`, `SELF_APPROVAL`, `DUPLICATE_APPROVER`, `INVALID_APPROVER`.
