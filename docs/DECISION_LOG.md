# Decision log (append-only)

| Date | ID | Decision | Evidence and rationale | Owner | Revisit |
|---|---|---|---|---|---|
| 2026-10-22 | D-001 | Select Leash cybersecurity authority boundary; payments are synthetic only | Prior-art overlaps; Tide Forseti architecture | Team | After G4 |
| 2026-10-22 | D-002 | Require at least one independent approver even for low-value | Without it agent could unilaterally trigger allowed low-value payment | Security | Real approval API |
| 2026-10-22 | D-003 | No default LLM/OCR | Faster deterministic security regression; optional later | Agent/Data | After G4 |
| 2026-10-22 | D-004 | Real Tide mode explicitly fails closed | Avoid misleading hackathon proof | Tide/Security | When G4 proof exists |
| 2026-10-22 | D-005 | G1 reports possible closed submissions | Prior Deep Research reading official page | PM | Recheck organizer |
