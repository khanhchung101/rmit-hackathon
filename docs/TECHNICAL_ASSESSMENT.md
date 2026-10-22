# Technical Assessment & Audit Verification

**Date:** 2026-10-22  
**Role:** Lead Security Engineer, Software Architect, TideCloak Integration Engineer, QA Engineer  
**Scope:** Verification of confirmed audit findings (Issues A–G) and technical baseline analysis.

---

## 1. Verified Baseline Results

The baseline commands were executed against the repository:

- `npm run preflight`: **PASS** Node 20.19.6, Git 2.43.0, Docker 29.6.2; **BLOCKED** G1 (eligibility), G4 (real Tide).
- `npm test`: **PASS** 25/25 unit tests across 11 test suites.
- `npm run security`: **PASS** 8/8 mock security scenarios (T1–T8).
- `npm run validate:fixtures`: **PASS** 7/7 synthetic invoice fixtures.
- `npm run validate:contracts`: **PASS** structural consistency of canonical protocol and C# literals.
- `npm run tide:probe`: **EXIT 3 (BLOCKED G4)**: Fails closed as designed (`REAL_TIDE_NOT_WIRED`).

---

## 2. Reverification of Audit Findings (Issues A–G)

### Issue A: HTTP Replay Protection — CONFIRMED VULNERABLE
- **Code inspection:** In `src/server.mjs` line 64, `POST /api/pipeline` calls `processInvoicePayment()` without supplying a persistent `bank`. In `src/pipeline.mjs` line 118, `new MockBank()` is instantiated on every call with a fresh in-memory `Set`.
- **Empirical reproduction:** Two consecutive calls to `processInvoicePayment()` with identical `nonce: 'same-http-nonce'` both returned `accepted: true, code: 'EXECUTED'`.
- **Status:** **DEFECT CONFIRMED**. Must be remediated immediately.

### Issue B: Approver Identity Spoofing — CONFIRMED VULNERABLE
- **Code inspection:** In `src/policy.mjs`, approvals are validated by extracting `a?.approverId` strings from plain JSON and checking `knownApprovers.has(a)`. In `src/server.mjs`, callers pass arbitrary `approvals: [{"approverId": "finance-a"}]`.
- **Status:** **DEFECT CONFIRMED**. Approvers are untrusted strings without cryptographic proof or payload binding.

### Issue C: Payment Expiration Mismatch — CONFIRMED INCONSISTENCY
- **Code inspection:** `src/canonical.mjs` line 37 defaults `expiresAt` to `'2030-01-01T00:00:00.000Z'`. In contrast, `forseti/LeashPaymentPolicy.cs` line 35 & 113 enforces `MaxExpirySeconds = 900` (15 minutes) and explicitly denies: `if (expiryEpoch - now > MaxExpirySeconds) return PolicyDecision.Deny("expiry window too long");`.
- **Status:** **DEFECT CONFIRMED**. Application defaults would be instantly rejected by the C# Forseti policy.

### Issue D: Signing Key Trust Anchor — CONFIRMED DEFECT
- **Code inspection:** In `src/pipeline.mjs` line 119: `pinnedPublicKey: activeSigner.publicKey`. The bank dynamically trusts whatever key is provided by the signer passed into the pipeline, violating verifier independence.
- **Status:** **DEFECT CONFIRMED**. The bank must load its trusted public key from an explicit, immutable trust anchor out-of-band.

### Issue E: Incomplete Tide Signing Adapter — CONFIRMED UNVERIFIED
- **Code inspection:** `src/signing/tideForsetiSigner.mjs` contains unverified scaffolding and exits with `REAL_TIDE_NOT_WIRED`. No real Tide ORK signature has been produced or verified.
- **Status:** **CONFIRMED BLOCKED**.

### Issue F: Forseti Contract Validation — CONFIRMED UNCOMPILED
- **Code inspection:** `scripts/verify-contracts.mjs` only executes regex/string containment checks (`contract.includes(literal)`). `dotnet` is not installed on the host. The C# contract has never been compiled into an assembly or loaded on an actual node.
- **Status:** **CONFIRMED UNCOMPILED**.

### Issue G: Project Status Inconsistencies — CONFIRMED
- **Inspection:** `tasks/backlog.csv` previously marked tasks as DONE whose dependencies (L-013 real Tide) were BLOCKED, blurring mock implementation with real integration evidence.
- **Status:** **CONFIRMED**. Tracking files must cleanly distinguish `TESTED_MOCK` from `VERIFIED_REAL`.

---

## 3. Technical Assessment Matrix

| Dimension | Findings |
|---|---|
| **1. What is implemented?** | Canonical byte encoding, proposal schema validator, mock policy dual-custody logic, durable bank file-locking ledger, 5-stage pipeline orchestrator, HTTP API & Web UI, C# Forseti candidate. |
| **2. What works end-to-end?** | Full payment lifecycle in MOCK mode: invoice $\rightarrow$ proposal $\rightarrow$ canonical bytes $\rightarrow$ mock approval $\rightarrow$ mock signature $\rightarrow$ bank verification $\rightarrow$ durable ledger settlement. |
| **3. What is only simulated?** | Distributed ORK signing (Node `crypto.sign`), approver authentication (unvalidated JSON strings), verifier trust anchor (dynamically injected signer key), synthetic fixtures. |
| **4. What is broken?** | HTTP replay across requests (Issue A), untrusted caller-supplied approver strings (Issue B), 2030 vs 900s expiration mismatch (Issue C), verifier key trust dependency (Issue D). |
| **5. What is unverified?** | Compilation and execution of C# Forseti contract, exact byte format of Tide `DynamicApprovedCustom` RPC. |
| **6. What requires external credentials?** | Tide licensed realm, user terms acceptance, human browser enrollment for dokens, Tide Foundation custom policy deployment. |
| **7. Recommended sequence** | **P0:** Remediate Issues A, C, D, B $\rightarrow$ **P0:** Execute Tide technical spike & Blocker Protocol $\rightarrow$ **P1:** Implement T9–T18 tests $\rightarrow$ **P2:** Reconcile status and documentation. |
