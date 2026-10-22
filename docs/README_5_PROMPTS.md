# Hackathon README instructions — live official wording verified 2026-10-22

The official page requires a one-sentence description and a project overview answering these five prompts in **300 words or fewer**, with setup instructions in a separate section. Source and content hashes are recorded in `evidence/challenge-verification.json`.

1. **Vision & originality (25%)** — What new product, service, experience or way of working are you proposing? What makes your idea distinctive?
2. **Trust constraint insight (20%)** — What is difficult, risky or impossible today because trust, privacy or security gets in the way? Explain what becomes possible when that constraint is removed.
3. **Value & impact (20%)** — Who would benefit, and how would their lives or work improve? Give a concrete example of why this matters.
4. **Why TideCloak matters (20%)** — How does your application use TideCloak, and how does that integration help enable your idea? Connect the technology to the possibility you are demonstrating.
5. **Prototype & storytelling (15%)** — What does your prototype demonstrate today? Describe the key interaction judges should look for.

Do not publish final answers that imply real Tide enforcement while G4 is blocked.

**Draft (NOT official answers):**

- Vision: Allow AI-assisted payable operations without granting AI payment authority.
- Trust constraint: Prompt-injected invoice or compromised backend must not produce a valid independent authorization signature.
- Why Tide: Forseti validates the actual request before threshold signing; QEA aims to protect policy from unilateral change.
- Prototype: One synthetic valid transaction, one hostile transaction, mock bank verifier, five adversarial tests.
- Limitation: No real payment, cannot stop approved human collusion, no Tide claim before G4 evidence.
