# Security test matrix (T1–T18)

| Test | Attacker / Action Scenario | MOCK Expected / Status | REAL Tide Acceptance Evidence |
|---|---|---|---|
| T1 | Malicious invoice controls agent's payee proposal | `POLICY_DENIED`, `UNTRUSTED_PAYEE` (PASS) | Actual hostile proposal reaches Tide; ORKs refuse signature |
| T2 | Compromised backend directly calls bank without signature | `MISSING_SIGNATURE` (PASS) | Independent bank verifier rejects unsigned bypass |
| T3 | High payment has one, duplicated or self approval | DENY; two distinct mock approvers ALLOW (PASS) | Tide validates approver dokens, not names in JSON |
| T4 | After valid signing change amount/payee | `BAD_SIGNATURE` (PASS) | External Tide-key verifier fails on modified bytes |
| T5 | Repeat signed payment same nonce in-memory | `REPLAY_NONCE` (PASS) | Receiver ledger prevents replaying consumed nonce |
| T6 | Rogue application-realm admin weakens policy | `APPROVALS_REQUIRED`, immutable policy (PASS) | QEA rejects without quorum; master realm protection |
| T7 | Expired, wrong currency, wrong domain, wrong key | DENY / `INVALID_PAYLOAD` / `BAD_SIGNATURE` (PASS) | Tide + bank negative traces |
| T8 | Backend substitutes contract ID or trusted public key | `REAL_TIDE_NOT_WIRED`, `UNTRUSTED_KEY_ID`, `UNTRUSTED_POLICY_ID` (PASS) | Independent trust-anchor/config review rejects |
| T9 | Concurrent identical payment requests across durable instances | `REPLAY_NONCE` on 2nd+ concurrent caller (PASS) | Atomic transaction ledger & file locks prevent race conditions |
| T10 | Client-supplied approver names without cryptographic proof | `APPROVAL_PROOF_REQUIRED` / `INVALID_APPROVAL_PROOF` (PASS) | Tide Doken token-bound proof required; raw names rejected |
| T11 | Approval substitution attack (transplanting proof from payment A to B) | `APPROVAL_PAYLOAD_MISMATCH` (PASS) | Approvals cryptographically bound to exact payment SHA-256 |
| T12 | Payment validity interval exceeding policy maximum (>900s) | `INVALID_PAYLOAD:expiry-window-too-long` (PASS) | Policy enforces `MaxExpirySeconds = 900` |
| T13 | Bank execution after expiration timestamp has passed | `EXPIRED` (PASS) | Bank verifier validates timestamp prior to execution |
| T14 | Bank envelope signed with rogue key against pinned trust anchor | `BAD_SIGNATURE`, `UNTRUSTED_KEY_ID` (PASS) | Bank independently pins Tide signing public key |
| T15 | Non-integer floats or malformed types in payment fields | `INVALID_PAYLOAD:amount` (PASS) | Canonical versioned byte protocol rejects malformed types |
| T16 | Exact quorum boundary enforcement ($999.99 vs $1000.00) | 99,999 minor: 1 approver; 100,000 minor: 2 approvers (PASS) | Exact threshold match between JS policy and C# Forseti contract |
| T17 | Expired approver proof timestamp presented | `APPROVAL_EXPIRED` (PASS) | Approver credential proof timestamp must be active |
| T18 | Duplicate invoice reference re-submitted under different nonce | `DUPLICATE_INVOICE` (PASS) | Durable bank invoice registry prevents duplicate payment |

**Green mock tests ≠ green Tide tests.** Capture each real request's exact bytes hash, policy source+hash, Tide response, public key provenance, external bank verifier result, actor approvals and process ID. T1 MUST show proposal compromised; if an actual hosted model isn't connected, label T1 as simulated attack-following proposer. Bank replay deduplication is implemented with both in-memory and durable atomic file-locked storage (`MockBank` durable mode tested across restarts in `tests/durableBank.test.mjs` and concurrency in `tests/securityAuditRemediation.test.mjs`). Add complete failure logs to `evidence/runtime` only after redaction.
