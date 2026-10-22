# AGENTS.md — Rules for all coding agents

**Mission:** complete the Tide UNLOCKED Leash cybersecurity PoC, with reproducible evidence and zero invented integration claims.

1. Read `PLAN.md`, `STATUS.json`, `step0/READINESS_CHECKLIST.md`, `research/official-rules.md` before coding. Run `npm run preflight && npm test`.
2. STEP 0 includes requirements verification, provider/model/data decisions and a **real Tide signing technical spike**. Never skip G1/G3/G4. The website's submission status is a potential hard blocker.
3. **No cryptographic shortcuts:** Never replace real Tide signing with Node `crypto.sign` and describe it as distributed signing. Mock-only keypair is confined to `src/signing/mockSigner.mjs`. Never put local test private key in server or production code. Do not claim `TIDE_MODE=real` works until documented traces prove it.
4. Treat invoice text, model output, request bodies, user approvals and backend state as **untrusted**. Caller-supplied approver IDs are for mock semantics only; real mode must use Tide-verifiable authorization proofs.
5. No real money, invoices, bank details, users or API secrets. Use fixture IDs and fake accounts. Never commit `.env`, dokens, JWT, session tokens, key material, video credentials or customer records.
6. Signing must be over an unambiguous **versioned byte protocol**; sign/verify same exact bytes. Domain and expiry binding mandatory. Bank must verify against a pinned Tide signing public key, not the TideCloak JWT public key unless proved identical (do not assume).
7. Implement negative tests BEFORE UI. Security-critical policy configured solely in backend is NOT a pass. Admin QEA change-quorum ≠ per-payment approver quorum.
8. Real integration must follow CURRENT official docs and tested SDK. `forseti/LeashPaymentPolicy.intent.cs` is illustrative and MUST NOT be claimed to compile without adaptation.
9. On failed gate, mark `FAIL`/`BLOCKED` in STATUS.json; produce `evidence/*` with command, date, environment, redacted output, hash/screenshot and reviewer. Do not disguise missing functionality.
10. Maintain `tasks/backlog.csv`, `docs/DECISION_LOG.md` and `PROJECT_STATUS.md` after each milestone. Cross-check claims against `docs/SECURITY_CLAIMS.md`.

**Order of priorities:** Rules G1 > real policy/signing G4 > real adversarial tests G5 > UX/LLM > polish. Do not spend time on OCR while real signing is blocked.
