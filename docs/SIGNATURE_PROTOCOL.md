# Leash local canonical message v1 (mock protocol; real binding needs G4)

Strict receiver input, trusted configuration, mode handling and error contract are specified in [RECEIVER_CONTRACT.md](RECEIVER_CONTRACT.md). This is a target contract for LAN-02/03, not a claim that the current MockBank enforces it. Payment fields and the fixed vector below remain unchanged.

## Exactly signed fields

`amountMinor` (positive integer cents), `currency`, `domain`, `expiresAt`, `invoiceId`, `nonce`, `payeeAccount`, `payeeId`, `version`. No optional/extraneous properties. `domain='leash.payment.v1'`, `version='leash.pay.v1'`.

**Encoding:** fixed ordered keys sorted alphabetically; JSON stringification of strict parsed field values, UTF-8 bytes. Strings are ASCII-only in MVP and validated; timestamps strict UTC ISO-8601. No NaN, float, bigint, JS-unsafe int, duplicate keys (avoid using raw JSON as signature inputs without a duplicate-key rejecting parser), null or arrays.

**Important:** Local byte protocol is **not automatically Tide's signed challenge format**. Real adapter must determine Tide's exact signing scope (possibly request envelope / hash), document with bytes/test vectors, and update independent verifier accordingly. Never claim compliance with RFC 8785 unless implementing and testing its full semantics.

## Example message (conceptual)

```json
{"amountMinor":55000,"currency":"USD","domain":"leash.payment.v1","expiresAt":"2030-01-01T00:00:00.000Z","invoiceId":"INV-LOW-001","nonce":"nonce-low-001","payeeAccount":"ACME-DEMO-001","payeeId":"acme-labs","version":"leash.pay.v1"}
```

The exact UTF-8 bytes for this vector hash to SHA-256 `648693c9f2a3e4f0684ead1e7af690763f8dfb80224636e2f68e46f917b5656f`. The executable assertion is `tests/protocol.test.mjs`; the redacted artifact is `evidence/mock-signature-protocol-vector.json`.

Identifiers (`invoiceId`, `nonce`, `payeeAccount`, `payeeId`) are restricted to ASCII letters, digits, `.`, `_` and `-`. This deliberately excludes JSON escaping so a future Forseti parser cannot accept a different textual representation than the bank verifies.

**Verification:** Pin the correct signing public key / context, verify scheme/signature with exact bytes, reject wrong domain/version/policy identity, expiry, already-seen nonce, and mismatched payee. **Receiver cannot accept backend-supplied `publicKey`**. Replay protection needs durable unique index for deployment.

**Required Step 0 evidence:** hex/sha256 signed bytes, Tide SDK request bytes, Tide returned signature, actual key getter/format, verifier command/exit, contract hash and approval trace.
