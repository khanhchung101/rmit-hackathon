# STEP 0 — Decision register (must be signed off by agent/team)

| Decision | Working default | Verify / lock with evidence | Owner | Status |
|---|---|---|---|---|
| Challenge is open & team eligible | UNKNOWN; Oct 22 research said CLOSED | Official screenshot and organizer confirmation | PM | BLOCKED |
| TideCloud/realm/licence/IdP | None configured in kit | Current Tide quickstart + actual realm | Tide | PENDING |
| Forseti contract deploy + policy-gated sign | Doc describes capability | Real proof G4 | Tide | BLOCKED |
| Correct Tide payment verification key | UNKNOWN | Retrieve key, document scheme/key id, verify signature | Tide + Backend | BLOCKED |
| M-of-N transaction approvals | Every payment needs independent approval; 1 low / 2 high | Doken identity, distinct orgs, anti-self, replay | Security | PENDING |
| QEA admin protections | Desired protected app realm | Real admin self-escalation rejection | Tide | PENDING |
| Invoice dataset | Synthetic text | Fixture manifest + privacy review | Data | PROVISIONAL |
| Money currency/threshold | USD, cents, 100,000 cents high | Policy spec tests; not market-valid | Security | PROVISIONAL |
| Vendor trusted registry | Synthetic immutable fixture config | Governance source and version review | Product + Security | PROVISIONAL |
| Model | None required for security baseline | Real hosted/local decision + evaluation | AI | PROVISIONAL |
| OCR | Not required | Optional after G4 | AI | DEFERRED |
| Mock bank | Local verifier only, no bank integration | Durable nonce store for real demo | Backend | PROVISIONAL |
| Public disclosure/claims | No real Tide claims yet | G4/G5 evidence review | QA | PENDING |

**Lock rule:** Each decision must have a source, approver, date, and `status=ACCEPTED`. Changes create a decision-log entry. Do not call defaults competition requirements.
