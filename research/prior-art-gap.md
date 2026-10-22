# Prior-art and narrowing Leash's niche

**Use case:** invoice-preparing AI agent in a finance team's semi-automated B2B accounts payable workflow; only the cryptographic authorization boundary is in scope.

- Microsoft Business Central Payables Agent: prepares invoice drafts with human supervision, already limits consequential autonomous actions. https://learn.microsoft.com/en-us/dynamics365/business-central/payables-agent-overview
- Visa + BILL + Billtrust: pilot of AI agent completing **previously approved** B2B supplier payments (October 2026 announcement). Not unique to Leash. https://www.bill.com/press-release/visa-bill-and-billtrust-launch-first-live-pilot
- Fireblocks Agentic Payments: policy-controlled signing and credential isolation for agents; direct overlap. https://www.fireblocks.com/products/agentic-payments
- Circle: programmable wallet rules and transaction permissions; examine current policy engine and multi-party admin controls. https://developers.circle.com/

**What can be different:** Leash provides a small, independently reproducible PoC where policy validates the *actual invoice-derived byte payload* before decentralized signing, independent from application/backend controls; receiver verifies Tide signature and rejects replay, showing negative attacks. This is a **competition prototype differentiation**, not proven unique market white space.

**Gap still to validate:** which target customers cannot use existing solutions and why (cost, lock-in, compliance, B2B workflow, cryptographic verifiability, integration)? Gather first-party interviews/price, feature, developer access evidence. Do not assert a commercial moat from missing vendor documentation alone.

**Go/No-go novelty:** If use case is identical to Fireblocks demo except brand and UI, narrow to source-of-authority / receiver-verifiability experiment or prioritize a more underserved niche.
