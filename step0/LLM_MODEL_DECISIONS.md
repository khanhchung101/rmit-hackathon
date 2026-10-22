# STEP 0 — Model / data / OCR feasibility

## Default: deterministic security test first

`LLM_PROVIDER=none`; use fixture-based proposer only. Its malicious override **simulates** an AI obeying prompt injection. This tests the resilience of authorization boundary, not actual LLM vulnerability. Make the video label clear. NO fine-tuning, dataset download, OCR, GPU required.

## If adding AI after G4

| Choice | Requirements | Decision |
|---|---|---|
| Hosted LLM (OpenAI/Gemini/etc.) | Key access, model ID/version, constrained JSON outputs, rate limits, pricing, privacy and retention review | OPTIONAL; do not pin imaginary model. |
| Local LLM | OS/GPU/RAM, license, model download, temperature=0 plus schema validation | OPTIONAL; larger setup cost. |
| OCR (Tesseract, PaddleOCR, Document AI) | Invoice PDF/image data, OCR quality tests, license/hosting | NOT required for security PoC. |
| Deterministic proposer | Node stdlib, synthetic text fixtures, injected proposal scenario | **REQUIRED baseline** |

Decide: provider, model/version, max tokens, evaluation dataset, expected cost, request timeout, caching permitted?, JSON schema, provider data terms, latency budget, local baseline fallback, reviewer who signs off. Never embed a hosted API key in repository or browser.

## Evaluation, if a real model is wired

- 10+ synthetic invoices: valid, missing fields, ambiguous payee, large amount, prompt injection, poisoned bank-account update, duplicate invoice, foreign currency, OCR artifact, policy text spoof.
- Record extraction field error rate, attack-following frequency (do not try to optimize attack success), latency and spend.
- Always demonstrate Tide denial on a **knowingly hostile proposal**, independent of actual model behavior. Never equate refusal to execute with model prompt-injection resistance.
- Validate all model fields against schema; output never includes authority proof, signature, policy override or trusted payee registry update.

**Security property to protect:** An AI's output is neither authorization nor signature.
