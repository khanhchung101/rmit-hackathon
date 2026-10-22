# PROJECT STATUS — Step 0 execution, 2026-10-22

**Overall:** STEP 0 is **externally blocked**. The repository remains an executable Node 20+ **MOCK-ONLY** baseline. Real Tide integration is NOT IMPLEMENTED and the adapter fails closed.

**Competition:** The official page and public config were audited at 2026-10-22 06:27 UTC. The published form was reachable and the Vietnam deadline is 18:00 ICT (11:00 UTC) on 22 October 2026. Exact prompts, weights and source hashes are in `evidence/challenge-verification.json`. Participant/RMIT eligibility is not evidenced, so G1 is PARTIAL and no submission was attempted.

**Tide feasibility:** Current packages and APIs were audited through official docs, Raziel MCP 1.9.33 and Tide Foundation sources. Custom transaction signing requires a custom Forseti contract whose test-network deployment is performed by the Tide team. Realm setup additionally requires a user-supplied licence email, explicit Terms acceptance and human browser enrollment. No realm, doken, signed policy, Tide VVK or real signature exists; G3/G4/G5 remain BLOCKED. Raziel also records an unresolved network-validation gap for EXPLICIT custom-model approvals (GAP-072).

**Local evidence:** Node 20.19.6, Git 2.43.0, Docker 29.6.2 and Compose 5.3.1. `npm test` passes 20/20; seven invoice fixtures pass; T1–T8 pass in MOCK mode; `npm run tide:probe` exits 3 with `REAL_TIDE_NOT_WIRED`. Output hashes and details are in `evidence/runtime/step5-slice-2026-10-22.json`.

**Contract candidate:** `forseti/LeashPaymentPolicy.cs` now reflects the current Forseti context split and fails closed on request model, policy mode, exact fixed-order payment bytes, allowlist, expiry, real doken roles, distinct VUIDs and self-approval. Raziel's sandbox scanner passes. It is **not compile-verified or deployed**: no local .NET SDK exists and the .NET container download failed/stalled. This candidate is not G4 evidence.

**Vertical slice & contract implementation:** Tasks L-011, L-015, L-016, L-017, and L-019 are complete. The bank receiver envelope validates schema, keyId, and policyId pinning; the receiver implements durable file-backed replay prevention with atomic locking; proposal validation strictly prevents AI prompt injection from smuggling authority fields; and T1–T8 mock regression is fully implemented and automated.

**Next externally owned actions:** establish participant eligibility; provide Tide licence email and explicit Terms decision; select local versus hosted realm; complete human account linking; ask Tide to review/deploy the custom signing contract; then capture real allowed/denied signing traces and independently verify the exact bytes with the realm VVK.

**Important:** Mock green cannot be used as evidence that Tide enforced policy. This kit includes no real-world financial data or live payment functionality.

**Final QA automation — 22/10/2026:** offline runner executed 20 checks: 13 PASS / 7 FAIL, mapped to six failing QA cases. Missing/null approval and HTTP replay accepted locally; strict envelope/mode/corruption gaps reproduced. See `docs/FINAL_QA_FINDINGS.md`. This supersedes any broad interpretation of local regression completeness above. Baseline unit tests still pass; G3/G4/G5 are not promoted. No live Tide request or submission performed.
