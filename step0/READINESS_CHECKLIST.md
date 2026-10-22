# STEP 0 — Readiness checklist, ordered

- [ ] G1. Open official Tide challenge in a JS-capable browser; check **currently open/closed**, eligible teams and any extension by organizers.
- [ ] G1. Capture exact README 5 prompts, word limit, video `.mp4` duration and max bytes, public repo, submission URL, deadline and timezone; save source timestamps.
- [ ] G1. Compare every required deliverable to `docs/SUBMISSION_CHECKLIST.md`; do not assume Deep Research snapshot is live.
- [ ] Host runs `node>=20`, git, docker, `npm run preflight`; record versions and reachability.
- [ ] Tide realm actually provisioned; TideCloak quickstart, licensing, appropriate redirect URI, roles/dokens.
- [ ] Tide MCP/Raziel connects; find runnable `policy-governed-signing` and SDK reference; identify SDK version and actual C# contracts API.
- [ ] A real Tide policy runs `ValidateData` on the exact canonical payment **bytes**, not metadata copied unsafely by backend.
- [ ] Policy enforces per-payment independent approvers (never agent-only) and correctly validates identities.
- [ ] Tide real signing and independent bank public-key verification demonstrated (G4).
- [ ] Incorrect payee, insufficient approval and modified bytes cannot produce a bank-valid authorized payment.
- [ ] No signer private key in app/backend; no signature bypass; master-realm/QEA limitations documented.
- [ ] Freeze all data & model choices, no sensitive fixtures/secrets, and decide fallback if no real model.
- [ ] Set final GO/NO-GO, update `STATUS.json` / `PROJECT_STATUS.md` with evidence IDs.

**Safety gate:** Local/mock green does not satisfy Tide G4. **Competition gate:** confirmed closed with no extension means no real submission path.
