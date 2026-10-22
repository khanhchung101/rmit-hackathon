# Submission checklist — G6 only after current official verification

- [ ] G1 verified submission route still OPEN or explicit organizer extension is documented (Deep Research reported CLOSED 2026-10-22).
- [ ] Team eligibility, date, time zone and organizer-specific upload form documented.
- [ ] Mandatory TideCloak integration and real Tide policy evidence in repo.
- [ ] Public GitHub URL, default branch, readable licence and clean reproduction instructions.
- [ ] README overview starts repo with one sentence and exact five prompts per current page; word count checked.
- [ ] Video duration, encoding, file size and hosting location checked against official page; prior research reported 2 min mp4 <100 MB, in repo.
- [ ] Clean install smoke runs; `npm test` and `npm run security` pass, Tide external verification passes.
- [ ] `docs/SECURITY_CLAIMS.md` only states supported claims; mock images explicitly marked.
- [ ] No live invoices, identifiers, `.env`, dokens, credentials or signing keys in commit/video.
- [ ] `npm run pack:evidence` generates integrity manifest; record git commit and 2 independent reviewer approvals.
- [ ] Submitted form acknowledgement/receipt recorded if and only if actually received.

## Final MOCK → REAL_TIDE cutover

- [ ] Synthetic invoice, fake accounts and simulated payment execution remain synthetic; no live financial data introduced.
- [ ] Real TideCloak executor and approvers are enrolled; repo contains no doken/session/PII.
- [ ] Forseti contract is compiled/deployed; contract ID, SDK version and source SHA-512 recorded.
- [ ] `TIDE_MODE=real` uses no `MockSigner` import or fallback path.
- [ ] Bank pins the documented Tide VVK/key and deployed policy identity out of band.
- [ ] Real positive, forbidden payee, missing approval, tamper and replay traces are captured and redacted.
- [ ] Demo/video uses real mode; every remaining mock screen is visibly labeled `MOCK_ONLY_NOT_TIDE`.
- [ ] `STATUS.json`, README and `SECURITY_CLAIMS.md` are promoted only after G4/G5 evidence review.

**Status on kit delivery: NOT READY; Step 0 and G4 unresolved.**
