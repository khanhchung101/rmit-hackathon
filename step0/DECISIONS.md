# STEP 0 — Decision register (must be signed off by agent/team)

| Decision | Working default | Verify / lock with evidence | Owner | Status |
|---|---|---|---|---|
| Challenge is open & team eligible | Route open at 06:27 UTC until 11:00 UTC; team eligibility unknown | Official page/config/form hashes; RMIT identities still needed | PM | PARTIAL |
| TideCloud/realm/licence/IdP | None configured in kit | Current Tide quickstart + actual realm | Tide | PENDING |
| Forseti contract deploy + policy-gated sign | Doc describes capability | Real proof G4 | Tide | BLOCKED |
| Correct Tide payment verification key | UNKNOWN | Retrieve key, document scheme/key id, verify signature | Tide + Backend | BLOCKED |
| M-of-N transaction approvals | Every payment needs independent approval; 1 low / 2 high | Doken identity, distinct orgs, anti-self, replay | Security | PENDING |
| QEA admin protections | Desired protected app realm | Real admin self-escalation rejection | Tide | PENDING |
| Invoice dataset | Synthetic text | 7 fixture cases pass; no PII/live accounts | Data | ACCEPTED 2026-10-22 |
| Money currency/threshold | USD, cents, 100,000 cents high | Policy spec + mock tests; explicitly not a compliance rule | Security | ACCEPTED 2026-10-22 |
| Vendor trusted registry | Synthetic immutable fixture config | Fixture hash/evidence; real governance still requires Tide policy | Product + Security | ACCEPTED FOR MOCK 2026-10-22 |
| Model | Deterministic proposer; no hosted/local LLM for MVP | Reproducible baseline; simulated injection label required | AI | ACCEPTED 2026-10-22 |
| OCR | Not required | Optional only after G4 | AI | DEFERRED |
| Mock bank | Local verifier only, no bank integration | Durable nonce store for real demo | Backend | PROVISIONAL |
| Public disclosure/claims | No real Tide claims yet | G4/G5 evidence review | QA | PENDING |

**Lock rule:** Each decision must have a source, approver, date, and `status=ACCEPTED`. Changes create a decision-log entry. Do not call defaults competition requirements.
