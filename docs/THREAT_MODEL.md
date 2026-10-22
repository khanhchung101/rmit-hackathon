# Threat model — STRIDE and attacker capabilities

| Category | Threat | Protected property | Test |
|---|---|---|---|
| Spoofing | Fake approval ID from backend | Genuine approver's Tide doken, role, nonce/context | T3 (real required) |
| Tampering | Change amount or payee after signing | Exact-byte signature verification | T4 |
| Repudiation | Claim payment approved when none was | Signed identity and trace | T3 / evidence |
| Information disclosure | Extract bank account data from DB | Optional Tide E2EE, no PII | optional |
| Denial of service | Flood signer or bank | Rate limiting/resource checks (not MVP guarantee) | optional |
| Elevation of privilege | Rogue backend/admin bypasses policy | Tide authority separated, QEA | T2/T6 |
| Prompt Injection | Untrusted invoice instructs AI to change payee | Independent policy and allowlist | T1 |
| Replay | Reuse valid signed payment | Receiver nonce store and expiry | T5 |
| Cross-domain | Reuse signature in other context | Signed domain, pinned key/contract | T7 |

Defended assets are authorization, key provenance, policy integrity, human grants and nonce registry. Trusted assumptions: Tide network/API behavior as verified, public key provisioning, bank verifying code, independent human identities. Out of scope: collusion >=quorum, compromised real bank, policy-approved fraud, live transactions, theft by legitimately authorized recipient.
