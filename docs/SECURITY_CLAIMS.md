# Claim ledger — permitted only with evidence

| Security claim | Allowed status in delivered kit | Evidence required before promotion |
|---|---|---|
| Malicious proposal is denied by MOCK policy | DEMO-ONLY | `npm run security` |
| Direct bank call without signature rejected by MOCK bank | DEMO-ONLY | T2 result |
| Local Ed25519 signature binds payload | DEMO-ONLY | T4 unit test, correct key |
| Replay nonce rejection within one mock bank instance | DEMO-ONLY | T5 unit test |
| Tide Forseti independently policy-gates signing | NOT IMPLEMENTED | G4 real policy logs and actual signature |
| Bank independently validates real Tide signature | NOT IMPLEMENTED | External verification with official Tide key |
| Independent human approvers cryptographically verified | NOT IMPLEMENTED | Valid real doken and `ValidateApprovers` proof |
| Admin cannot solo change policy | NOT VERIFIED | QEA real app realm tests, master exception documented |
| Leash prevents all prompt injection/fraud | NOT TRUE | Never state |
| Leash is first to implement policy-protected agent payment | NOT SUPPORTED | Never state |
| Leash safe for live financial transactions | NOT TRUE | Never state; synthetic PoC only |

**Required copy:** "Leash limits authority after a bad AI proposal; it does not reliably classify fraudulent invoices." Use conditional language for planned Tide integration.
