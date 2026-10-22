# PLAN.md — Agent execution plan, Step 0 → Step 8

## Scope, rules of engagement and exit criteria

**Project:** Leash — Verifiable Payment Authorization for AI-Prepared Invoices. **Category:** cybersecurity / AI agent least authority. **Never:** live banking, real money, production claims. **Pass condition:** malicious AI/backend cannot unilaterally cause an independently verified, policy-forbidden payment. **Local mock tests are only a simulation.**

Cross-cutting artifacts: `STATUS.json` (machine status), `tasks/backlog.csv` (small tasks), `evidence/` (commands, outputs, sources), `docs/DECISION_LOG.md` (why decisions were made). Stop work when challenge's submission has definitively closed with no extension OR real policy-gated signing cannot be demonstrated within scope.

### STEP 0 — Decide/verify before design, coding or model training (P0)

**0.1 Official challenge:** Open https://tide.org/unlocked/ in a real browser. Capture current rules, submissions open/closed, exact dates/timezone, organizer contact, eligibility, mandatory TideCloak components, required GitHub repo/video, exact FIVE README prompts, judging rubric. Deep Research snapshot 2026-10-22: submissions appear CLOSED — unresolved until organizer verifies. Write `evidence/challenge-verification.json`, screenshot/time, `research/official-rules.md`; set G1 PASS only with source proof and a valid way to submit. If no submission channel/extension: `NO-GO` for competition submission.

**0.2 Environment/integration:** Node >=20, npm, Docker+Compose, Git, browser, Tide account/license/realm, authorizer device, valid TideCloak client redirect, network access, Raziel MCP availability. Record versions. No secrets in evidence. Use `npm run preflight`. Do not confuse “MCP docs available” with “signing API works”.

**0.3 Data decisions:** choose synthetic text fixtures only vs OCR. Default synthetic USD minor-unit invoices, fake payees and accounts; freeze `payeeAllowlist`, `currency`, `amountThresholdMinor=100000`, `approverThresholdLow=1`, `approverThresholdHigh=2`, accepted business rules, expiry window, nonce, version and timestamp. See `step0/DATA_MODEL_DECISIONS.md`; generate/update fixture manifest and tests. No real invoice required.

**0.4 Model decisions:** choose deterministic `SIMULATED_AGENT` as reproducible baseline. Decide if hosted/local model improves demo enough to justify cost/latency/credentials, model name/version, structured output schema, privacy policy, evaluation thresholds and deterministic fallback. DO NOT label the simulated prompt-injection fixture as evidence of a real model compromise. See `step0/LLM_MODEL_DECISIONS.md`.

**0.5 Threat model:** identify agent prompt injection, forged/replayed signatures, tampering, backend admin bypass, malicious approvals, admin policy change and authorized collusion; distinguish attacker capabilities and non-goals. Fill attack matrix.

**0.6 Real Tide technical SPIKE = mandatory hard gate:** `step0/FEASIBILITY_SPIKE.md`: verified `@tidecloak/js`/`heimdall-tide` versions and actual `Policy:1` request/contract APIs; a REAL C# Forseti contract deployed to actual realm whose `ValidateData` evaluates canonical fields and `ValidateApprovers` enforces independently verified approvals; get real Tide signature and its **correct** verification public key and exact signing bytes; external bank verifies success and rejects changed/forbidden payload. Verify QEA governance separately. Save contract source/hash, command outputs (redacted), SDK references and video/log proof. **Do not pass G4 until independent public-key verifier confirms exact payload.** If unreachable, stop or explicitly downgrade outcome to mock architectural demo without Tide-enforced claim.

**Outputs:** decisions + readiness, trace matrix and spike report. **Gate:** G1 (eligibility/submission verified), G2 local baseline, G3 Tide environment, G4 proof or explicit blocker/NO-GO.

### STEP 1 — Problem and novelty validation

Owner Product/Security. Identify invoice-processing actors, trust boundaries and source of potential payment authority. Check Microsoft Payables Agent, Visa/BILL/Billtrust, Fireblocks, Circle; do not claim “first to prevent AI payments” or new cryptography. Write concrete claim and differentiation *in this challenge implementation*, 3+ comparable offerings, link per claim, unknown primary user pain. Deliver `research/prior-art-gap.md` + pitch + honest limits. Gate: signed-off problem statement, no unsupported novelty.

### STEP 2 — Trust analysis and security spec

Owner Security/Tide. STRIDE/abuse cases, minimal authority and approver roles, immutable policy and governance, precise security invariants. Attack plan T1–T8 and limitations (colluding approvers, master realm, compromised signer frontend, verifier bypass). Deliver `docs/THREAT_MODEL.md`, `docs/POLICY_SPEC.md`, `docs/SIGNATURE_PROTOCOL.md`. Gate: no path where agent can satisfy all requirements alone; reviewers understand QEA vs payment approvals.

### STEP 3 — Solution architecture and data contract

Owner Backend. Freeze versioned canonical bytes, exact fields, amounts integer minor units, signed expiry/domain; receiver key pinning and replay mechanism (durable DB unique constraint for deploy). Freeze API contracts and data schema; architecture makes mock and real mode **explicitly separate**. Deliver docs and schema. Gate: review architecture against T1–T8 before building.

### STEP 4 — Tide working integration (critical path)

Owner Tide Engineer. Follow real Raziel/official examples, implement/deploy C# Forseti policy, configure Tide realm/doken/roles/approvers, bind exact payload, return real signature artifact, load correct Tide public key in independent mock-bank process. `src/signing/tideForsetiSigner.mjs` must stop throwing ONLY after real evidence exists. Add `npm run test:tide`. Never patch `src/policy.mjs` and call that real enforcement. Deliver G4 cryptographic trace and source, contract hash, session verification. Gate: real pass/deny with Tide issuer + separate verifier.

### STEP 5 — Prototype vertical slice

Owner Backend + Agent. Wire invoice fixture → proposal → canonical payment → human approval evidence → Tide signer → receiver verification. Add optional read-only dashboard, controlled attack toggle, ciphertext E2EE only if verified. Start with mock tests, switch to real path for any submission demo. Gate: authorized valid payment passes, invalid cases fail in real mode.

### STEP 6 — Security and adversarial tests

Owner Security QA. Run `npm run security` for mock regression (never real evidence); implement `test:tide` scenarios T1 (injected payee), T2 (direct bank bypass), T3 (approval), T4 (tamper), T5 (replay), T6 (admin/QEA), T7 (expiry/cross-domain), T8 (improper key/policy change). Record logs/recordings, traces and source hashes; bank receiver must be independent of signing path. Gate G5: all critical attacks denied in **real Tide mode**.

### STEP 7 — Demo, README, handoff

Owner Storytelling/QA. 120-second storyboard: business constraint → attack → policy gate → real Tide proof → independent verifier → caveats. Clearly label mocks. Capture architecture/trust boundary image, add one-command clean setup, exact required README prompts; don't claim submission video length/format until official verification. Security/privacy review. Gate: reviewer can reproduce on clean machine with documented credentials/realm prerequisites; demo says no more than evidence supports.

### STEP 8 — Final validation and submission

Owner PM. Check current official portal state, public repo, README format, video criteria, submission link, eligibility/team IDs. Security secret scan, test run, `npm run pack:evidence`; freeze commit SHA, evidence manifest, limitations and decision log. Gate G6: all mandatory requirements confirmed, repo is reproducible, on-time submission documented. If submissions closed, mark in status and prepare portfolio deliverable instead; do not fabricate receipt.

## Milestones and dependencies

M0 Rules + viability [Step 0] → M1 Tested mock baseline [Steps 2–3] → M2 Tide policy + external verification [Step 4] → M3 Real T1–T8 evidence [Steps 5–6] → M4 Polished demo [Step 7] → M5 Submission/handoff [Step 8]. The only reversible optional branch is LLM/OCR, begun after M2.

## Agent working protocol

At each task: read dependency gate → run documented command → update code/tests → run `npm test && npm run security` → write redacted evidence → update `STATUS.json` + `PROJECT_STATUS.md` + CSV status → commit. On blocker: write what failed and next minimal experiment, not a success claim. Avoid broad refactors before the Tide spike.

## Acceptance gates

- **G1** challenge eligibility/open route confirmed; exact mandatory artifacts captured.
- **G2** local mock positive and negative tests PASS; clearly labeled mock.
- **G3** TideCloak realm/roles/login/session/QEA environment demonstrably available.
- **G4** Tide ORKs evaluate actual exact payload; policy-denied requests yield no valid signature; allowed request yields **real signature independently verified with Tide public key**.
- **G5** real-path T1–T8 documented; mandatory T1–T5 all PASS.
- **G6** final public repo/video/README/submission and license/secret scan PASS.
