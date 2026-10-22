# File manifest — find implementation, command and failure mode

| File | Purpose / smallest implementation | Command / expected | Failure mode |
|---|---|---|---|
| AGENTS.md, PLAN.md | Agent execution/gates | Read, follow Step 0 | Agent skips viability |
| `.agents/skills/leash-unlocked/SKILL.md` | Reusable agent workflow | Read | Agent claims mock is real |
| `src/parser.mjs` | Deterministic proposal from invoice fixture | demo, tests | Mistaken for actual LLM |
| `src/canonical.mjs` | Fixed exact bytes | npm test | Signed and verified bytes diverge |
| `src/policy.mjs` | Mock policy semantics only | npm test | Backend-only simulated enforcement |
| `src/signing/mockSigner.mjs` | Local Ed25519 mock signature with isolated test key | npm run security | Confused with Tide threshold crypto |
| `src/signing/tideForsetiSigner.mjs` | Real Tide adapter, fail-closed | npm run tide:probe → BLOCKED | False G4 |
| `src/bank.mjs` | Independent verifier and nonce store | tests T2,T4,T5 | Trusting supplied key / replay |
| `docs/CHALLENGE_WRITEUP.md` | Single presentation source: challenge, problem, argument, solution, I/O, demo and status | Documentation review | Claims drifting beyond evidence |
| `src/demo.mjs` | User scenario terminal demo | npm run demo | Claims real Tide |
| `src/securityScenarios.mjs` | T1–T5 mock regression | npm run security | Test-only green shown as proof |
| `src/server.mjs`, `public/index.html` | Minimal local demo API/UI | npm run server | UI-only controls |
| `scripts/preflight.mjs` | Check runtime and blockers | npm run preflight | Env configured ≠ signing proven |
| `scripts/verify-fixtures.mjs` | Data schema and safety | npm run validate:fixtures | Real PII or invalid test cases |
| `scripts/tide-probe.mjs` | Real integration hard gate | npm run tide:probe | Silent mock fallback |
| `scripts/pack-evidence.py` | Evidence checksum bundle | npm run pack:evidence | Secrets included |
| `forseti/*.cs` | Intent sketch for agent | Adapt after SDK verification | Not compilable by design |
| `tests/*.test.mjs` | Unit and adversarial mock | npm test | Not Tide enforcement |
| `docs/*`, `research/*`, `step0/*`, `tasks/*` | Specifications, sources, decisions, work queue | Agent reads before code | Missing proof/rules |
