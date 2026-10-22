# Claims and evidence — never inflate

| Claim | Evidence | Status | Safe wording |
|---|---|---|---|
| Invoice automation by AI is real | Microsoft Business Central Payables Agent public docs | Supported | Finance teams increasingly use AI to draft/review supplier invoices |
| Malicious documents can contain indirect prompt injection | OWASP LLM01/Excessive Agency | Supported | Untrusted invoice text can manipulate an agent under certain architectures |
| AI payment agents can cause unauthorized payments | Attack class credible; direct widespread losses not established | Plausible scenario, not incidence claim | A potential consequence of over-privileged agent integrations |
| Payment execution with approval already exists | Visa/BILL/Billtrust and Fireblocks materials | Supported prior art | Do not claim invention of approval-gated payments |
| Leash adds independent cryptographically enforced Tide policy | Tide Forseti docs + architecture | Feasible concept, not implemented | Prototype **aims** to demonstrate it |
| Leash's bank independently verifies real Tide signature | Needs Step 0 real spike | UNVERIFIED | Do not claim until G4 evidence |
| Leash stops colluding authorized humans or all fraud | No | FALSE | Explicitly out of scope |
| Leash has no unilateral AI authority | True only with mandatory independent authorization on **every** payment | CONDITIONAL | No agent/backend self-authorization in defended path |
| Leash market gap unique | Competitors overlap heavily | UNVERIFIED | Differentiation in scoped Tide trust architecture, not exclusive first-in-market |

Sources: https://learn.microsoft.com/en-us/dynamics365/business-central/payables-agent-overview ; https://genai.owasp.org/llmrisk/llm062025-excessive-agency/ ; https://www.fireblocks.com/products/agentic-payments ; https://www.bill.com/press-release/visa-bill-and-billtrust-launch-first-live-pilot ; https://docs.tide.org/Core-Concepts/forseti-engine
