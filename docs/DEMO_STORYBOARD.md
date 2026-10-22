# 120-second narrative — use REAL Tide demo only if G4/G5 PASS

| Time | Visual | Voice/claim | Evidence |
|---|---|---|---|
| 00–15s | invoice PDF/text enters agent | Untrusted documents; AI proposal must not be financial authority | OWASP/source |
| 15–35s | Valid synthetic invoice → Tide policy → signature → bank | Real distributed authorization, if verified | G4 positive trace |
| 35–65s | Malicious invoice → agent suggests attacker payee → Tide denies | Model needn't be flawless to be authorityless | T1 real trace |
| 65–85s | Backend direct call to mock bank without signature | Bypassing UI/backend doesn't bypass bank verification | T2 real receiver |
| 85–105s | Expensive payment, invalid self/duplicate approvals then distinct humans | Independent approval before signing | T3 real trace |
| 105–115s | Tamper/replay denial | Integrity and single-use | T4–T5 |
| 115–120s | Architecture, limitations | No real transfers, not all fraud, no first-in-market claim | Claim ledger |

**If G4 is unverified:** Title every screen "MOCK/ARCHITECTURAL SIMULATION". Never place Tide logo or "Tide rejected" on code paths that use `mockSigner.mjs`.
