# Hackathon README instructions — verified template must be inserted in Step 0

**Do not fabricate five official prompts.** Prior research says official page expects a one-sentence description and an overview answering five prompts in <=300 words, with setup instructions in separate section. JavaScript-rendered exact prompt wording was not extracted. Current page: https://tide.org/unlocked/.

1. Open official page in browser.
2. Copy exact five prompts, judged headings and word limit into `evidence/challenge-verification-template.json`.
3. For each, write a short evidence-backed response: value, trust bottleneck, why Tide, prototype behavior, limitations.
4. Include README first in public repo, concise overview and separate quickstart.
5. Compare final answer word count to verified official rule.

**Draft (NOT official answers):**

- Vision: Allow AI-assisted payable operations without granting AI payment authority.
- Trust constraint: Prompt-injected invoice or compromised backend must not produce a valid independent authorization signature.
- Why Tide: Forseti validates the actual request before threshold signing; QEA aims to protect policy from unilateral change.
- Prototype: One synthetic valid transaction, one hostile transaction, mock bank verifier, five adversarial tests.
- Limitation: No real payment, cannot stop approved human collusion, no Tide claim before G4 evidence.
