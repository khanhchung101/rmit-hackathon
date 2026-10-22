---
name: leash-unlocked
summary: Agent execution skill for Tide UNLOCKED Leash cryptographic payment authorization PoC
triggers:
  - Leash
  - Tide UNLOCKED
  - TideCloak
  - Forseti
  - agentic payments
---

# Leash UNLOCKED — execution skill

**Before doing anything:** read `/AGENTS.md`, `/PLAN.md`, `/STATUS.json`, `/step0/DECISIONS.md`, `/step0/FEASIBILITY_SPIKE.md`. Your sole goal is evidence-backed execution, not generating a convincing mock demo.

1. Inspect `STATUS.json`. If G1 or G4 is UNVERIFIED/BLOCKED, act on Step 0 first; no UI or model work until feasibility experiment is attempted.
2. Use `tasks/backlog.csv` as executable task queue. Choose P0 unblocked task, preserve dependency IDs, write acceptance evidence.
3. Verify competition with official page and live organiser source, save exact texts and timestamps. If submissions closed, report NO-GO, do not silently change status.
4. Use Raziel MCP per official docs to locate *real executable* Tide signing example. Verify SDK version/API/contract/deployment and source hash. The C# intent stub is not a compiled or deployed policy.
5. Enforce domain-separated byte-level signature and independent approvers; do not have the agent/backend own bank signing private key. Bank validates pinned Tide public key and replay independently.
6. Run `npm run preflight`, `npm test`, `npm run security`, `npm run tide:probe` (probe is expected to fail closed); log results with evidence hashes. Tests labeled MOCK are not challenge compliance proof.
7. On any blocked test, generate a small experiment and log what evidence would unblock it. No fabricated proof, magic approvals, UI-only guards, or secrets in repo.
8. Maintain `PROJECT_STATUS.md`, `STATUS.json`, `docs/DECISION_LOG.md`; accept project only when G4/G5 are documented.

## Skill's reference bundle

- `PLAN.md` — step-by-step gates, ownership and DoD
- `step0/*` — all design/model/data/viability decisions
- `docs/ARCHITECTURE.md`, `docs/SIGNATURE_PROTOCOL.md`, `docs/POLICY_SPEC.md`, `docs/SECURITY_CLAIMS.md`
- `research/*` — challenge, API, prior-art evidence
- `tests/SECURITY_TEST_MATRIX.md` — adversarial controls

## Critical stop conditions

A) Official submission route unavailable ⇒ NO-GO for challenge submission, ask organizer about extension. B) No feasible Tide real policy-gated signature and exact receiver verification ⇒ NO-GO for Leash cryptographic claim, possible pivot to a better Tide-supported scenario. C) Only local Ed25519 signatures available ⇒ demo must say MOCK, not Tide.
