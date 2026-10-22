# Security test matrix (T1–T8)

| Test | Attacker/action | MOCK expected | REAL Tide acceptance evidence |
|---|---|---|---|
| T1 | Malicious invoice controls agent's payee proposal | `POLICY_DENIED`, `UNTRUSTED_PAYEE` | Actual hostile proposal reaches Tide; ORKs refuse signature |
| T2 | Compromised backend directly calls bank without signature | `MISSING_SIGNATURE` | Independent bank rejects bypass |
| T3 | High payment has one, duplicated or self approval | DENY; two distinct mock approvers ALLOW | Tide validates approver dokens, not names in JSON |
| T4 | After valid signing change amount/payee | `BAD_SIGNATURE` | External Tide-key verifier fails on modified bytes |
| T5 | Repeat signed payment same nonce | `REPLAY_NONCE` | Durable receiver DB unique nonce and restart/concurrency test |
| T6 | Rogue application-realm admin weakens policy | N/A | QEA rejects without quorum; document master realm |
| T7 | Expired, wrong currency, wrong domain, wrong key | DENY/expired/wrong key | Tide + bank negative traces |
| T8 | Backend substitutes contract ID or trusted public key | N/A | Independent trust-anchor/config review rejects |

**Green mock tests ≠ green Tide tests.** Capture each real request's exact bytes hash, policy source+hash, Tide response, public key provenance, external bank verifier result, actor approvals and process ID. T1 MUST show proposal compromised; if an actual hosted model isn't connected, label T1 as simulated attack-following proposer. Bank replay set is in-memory here: real T5 must use transactional DB dedupe. Add complete failure logs to `evidence/runtime` only after redaction.
