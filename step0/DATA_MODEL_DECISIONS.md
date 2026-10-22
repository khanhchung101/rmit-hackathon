# STEP 0 — Data contract decisions (freeze before real contract)

| Topic | MVP decision | Verification and risks |
|---|---|---|
| Source | **Synthetic English invoice text only** | Do not store real business/customer data. All accounts are placeholders. |
| Currency | USD only, `amountMinor` integer cents | No floats; USD 2 decimal places; if expanding currencies use vetted currency exponent table. |
| Vendor identity | `vendors.json` immutable test allowlist | In real app trusted registry must have governed provenance; do not trust invoice text as vendor registry. |
| High-value boundary | >=100,000 cents ($1,000) | Arbitrary demo threshold, not compliance rule. |
| Approvals low/high | >=1 independent / >=2 distinct independent people | Must NOT be submitted as untrusted JSON strings in real mode; bind to Tide identities. |
| Exact signed object | version, domain, invoiceId, amountMinor, currency, payeeId, payeeAccount, nonce, expiresAt | Exactly these 9 fields. Timestamp UTC Z. No extras. |
| Canonical encoding | strict fixed schema, alphabetical JSON keys, no whitespace, UTF-8 | Real SDK must prove bytes exactly match; see protocol. |
| Replay | fresh nonce; receiver consumes atomically | Local mock single-process only; deployed receiver requires transactional unique DB index. |
| Expiration | synthetic fixed/demo future dates, time checked at bank | Clock skew policy to agree in Step 0; do not accept expired. |
| Document provenance | synthetic file names + hashes | Input is untrusted; invoice author can be attacker. |
| Privacy | no PII, account numbers, live banking integrations | `evidence` artifacts redacted. |
| LLM | proposal output schema only | Must never supply independent approval proofs or signing authority. |

## Fixture matrix

`fixtures/invoices/` contains benign low/high, injected text, malformed. `fixtures/cases.json` includes allow/deny table. `fixtures/vendors.json` is a **security-critical registry**; changing it requires policy/approval version update in a production implementation. No claim that a plain JSON file is secure against compromised backend in real Leash.

## Contract invariants

- `payeeId` maps to `payeeAccount` in **trusted** registry (source distinct from invoice / model output).
- Whole signed message must commit to `policyVersion`/contract/key context if required by Tide, or receiver must pin allowed contract/key; avoid cross-protocol misuse.
- If `amountMinor <= 0`, unknown payee, unknown currency, expired `expiresAt`, unsupported domain: DENY.
- If non-canonical JSON, duplicate keys, extra fields or JS-unsafe integers: reject early. Real bank should never silently normalize signed contents differently.
