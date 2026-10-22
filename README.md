# Leash — Cryptographic Authorization Boundary for AI Payment Agents

> **Security PoC, synthetic data only.** AI proposes; Tide/Forseti must independently authorize; mock bank verifies a cryptographic proof on the exact payment. The real Tide path is **NOT YET IMPLEMENTED** and **fails closed** until Step 0 technical proof. Local green tests prove only the mock protocol semantics.

For the complete problem → argument → solution → demo narrative, start with
[`docs/CHALLENGE_WRITEUP.md`](docs/CHALLENGE_WRITEUP.md).

## Start here

```bash
node --version                # Node >=20
npm run preflight            # dependencies / gates
npm test                     # local mock unit tests
npm run security             # attack matrix, MOCK ONLY
npm run demo                 # synthetic demo, MOCK ONLY
npm run tide:probe           # expected BLOCKED until real adapter is implemented
npm run server               # local demo API at http://localhost:8787
```

No `npm install` required for the local baseline (built-in Node libraries only). Real Tide integration may require SDK/toolchain dependencies after official SDK verification.

## How to give this kit to a coding agent

1. Give the agent the **directory**, not just a summary; ask it to read `AGENTS.md`, `.agents/skills/leash-unlocked/SKILL.md` and `PLAN.md` in that order.
2. Run **STEP 0** before UI/LLM work. Record every decision in `step0/DECISIONS.md` and evidence in `evidence/`.
3. Track tasks in `tasks/backlog.csv`; update `STATUS.json` as soon as each gate changes.
4. Implement a **real Tide/Forseti policy-gated signing integration**; demonstrate signature verification using the correct public key in a separate receiver.
5. Only then finish submission README, video and public repo; see `docs/SUBMISSION_CHECKLIST.md`.

## MVP contract

- Source is a **synthetic** invoice; invoice text is untrusted and can attempt prompt injection.
- Agent may produce a `PaymentProposal` but **never** a valid signature by itself.
- All payments require **independent** authorization outside the agent/backend (low-value: >=1 independent approver; high-value: >=2).
- The *exact* signed payload binds version/domain/invoice/amount/currency/payee/account/nonce/expiry. Receiver checks these bytes, key, time and unique nonce.
- Test-only signer is isolated in `src/signing/mockSigner.mjs`; real mode is `UNIMPLEMENTED` and throws.
- No real banks, credentials, personal invoices, fraud-detection promise, or production readiness claim.

## Project status

- Step 0: **BLOCKED ON EXTERNAL PREREQUISITES**; real Tide/Forseti G3–G5 are not complete.
- Local evidence: 12 unit tests, 7 fixture cases and T1–T5 mock scenarios pass.
- At the 2026-10-22 06:27 UTC check, the official form was reachable until the published Vietnam deadline of 18:00 ICT; team eligibility remains unverified.
- Real mode fails closed with `REAL_TIDE_NOT_WIRED`. Do **not** present green mock tests as real Tide evidence.

## Useful references

- Challenge: https://tide.org/unlocked/
- Forseti: https://docs.tide.org/Core-Concepts/forseti-engine
- TideCloak Quickstart: https://docs.tide.org/get-started/Tidecloak%20Quickstart
- Governance: https://docs.tide.org/Core-Concepts/iga-workflow
- Tide MCP: consult the `Raziel MCP` link in official Tide docs
- Threat: https://genai.owasp.org/llmrisk/llm062025-excessive-agency/

See `docs/CHALLENGE_CHECKLIST.md` for still-unverified current wording and actual submission status.
