# Decision log (append-only)

| Date | ID | Decision | Evidence and rationale | Owner | Revisit |
|---|---|---|---|---|---|
| 2026-10-22 | D-001 | Select Leash cybersecurity authority boundary; payments are synthetic only | Prior-art overlaps; Tide Forseti architecture | Team | After G4 |
| 2026-10-22 | D-002 | Require at least one independent approver even for low-value | Without it agent could unilaterally trigger allowed low-value payment | Security | Real approval API |
| 2026-10-22 | D-003 | No default LLM/OCR | Faster deterministic security regression; optional later | Agent/Data | After G4 |
| 2026-10-22 | D-004 | Real Tide mode explicitly fails closed | Avoid misleading hackathon proof | Tide/Security | When G4 proof exists |
| 2026-10-22 | D-005 | G1 reports possible closed submissions | Prior Deep Research reading official page | PM | Recheck organizer |
| 2026-10-22 | D-006 | Replace stale closed-submission assumption with live open-route evidence | Official page/config/form fetched at 06:27 UTC; Vietnam deadline 11:00 UTC; participant eligibility still unknown | PM | At deadline or organizer change |
| 2026-10-22 | D-007 | Freeze deterministic proposer and synthetic USD fixtures for MVP | Seven fixture cases pass; avoids credentials, PII and unverifiable real-model claims | Security + AI/Data | Only after G4 |
| 2026-10-22 | D-008 | Treat real signing as externally blocked, not locally implementable by assumption | Raziel MCP 1.9.33 requires Tide-team custom-contract deployment plus human realm enrollment; EXPLICIT custom-model GAP-072 remains | Tide/Security | After Tide team/realm access |

# 2026-10-22 — Deadline-aware completion plan and provisional transport schema

- Added `docs/EXECUTION_PLAN.md` as the operational mapping of `PLAN.md`; it
  does not weaken or replace G1–G6.
- Froze machine-readable local payment and bank-envelope schemas and added a
  reproducible consistency check against the canonical vector and Forseti
  candidate.
- Kept L-011 IN_PROGRESS because the real Tide signed-byte envelope, key ID and
  policy ID cannot be finalized before L-008/G4 live evidence.
- Release decision remains fail-closed: no challenge-complete claim if G4/G5
  miss the submission window.

# 2026-10-22 — Single presentation source

- Added `docs/CHALLENGE_WRITEUP.md` to consolidate the challenge requirements,
  backend-versus-independent-authorization argument, Tide role, end-to-end flow,
  outputs, test story and current limitations.
- The write-up is a narrative layer, not a replacement for machine status,
  security claims or runtime evidence.

# 2026-10-22 — Step 5 vertical slice, durable bank replay protection, and full T1–T8 suite

- Added durable file-backed replay prevention to `MockBank` with atomic lockfile mutual exclusion (`src/bank.mjs`), resolving L-016 across restarts and multi-process workers.
- Implemented execution envelope verification in `MockBank` enforcing schema, keyId pinning, and policyId pinning (`model/schema/bank-execution-v1.schema.json`), completing L-011 and L-015.
- Implemented strict proposal schema validation in `src/parser.mjs` against `model/schema/payment-proposal.schema.json`, ensuring untrusted AI text outputs cannot smuggle authorization fields, completing L-017.
- Extended security regression suite to cover all eight scenarios T1–T8 in `src/securityScenarios.mjs` and dedicated unit tests (`tests/durableBank.test.mjs`, `tests/proposal.test.mjs`, `tests/t6.test.mjs`), completing L-019.
- Updated local test baseline to 20/20 passing tests and 8/8 passing security scenarios; maintained fail-closed boundary for real Tide integration (G3/G4).
