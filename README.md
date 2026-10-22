# Leash — Cryptographic Authorization Boundary for AI Payment Agents

> Leash allows an AI agent to prepare payments without giving the AI—or its application backend—the cryptographic authority to execute them.

---

## Project Overview

### 1. Vision & originality (25%)
Autonomous finance agents dramatically accelerate accounts payable, but giving an LLM direct payment credentials risks catastrophe. Leash introduces a verifiable least-privilege boundary: AI extracts invoice data and proposes payments, Tide independently authorizes through human dual-custody policy, and a receiver bank cryptographically verifies exact versioned bytes.

### 2. Trust constraint insight (20%)
Accounts payable automation cannot safely scale today because untrusted invoice documents risk indirect prompt injection, and application backends can be compromised. Removing this constraint ensures that even if an AI is hijacked or an application server breached, neither can unilaterally emit a bank-valid payment signature.

### 3. Value & impact (20%)
Finance teams eliminate manual data entry while retaining non-negotiable human control. Immutable policy rules enforce dual independent approvals on high-value transfers (>= $1,000), preventing fraudulent vendor redirections, unauthorized payouts, and internal account takeovers without slowing daily operations.

### 4. Why TideCloak matters (20%)
Traditional systems validate business policy in backend code that holds the signing key. Leash decouples authorization entirely: TideCloak authenticates human approvers outside the backend, Forseti evaluates payment constraints against immutable policy, and Tide ORKs hold distributed signing threshold keys unreachable by compromised application code.

### 5. Prototype & storytelling (15%)
Our working prototype demonstrates the full lifecycle: valid low and high-value payments receive required approvals and execute; prompt-injected invoices attempting vendor substitution are denied at the policy gate; and direct bank bypasses, tampered amounts, replayed nonces, and substituted keys are rejected by an independent bank receiver with durable replay storage.

*(Overview word count: 235 words — within the 300-word limit)*

---

## Quick Start & Reproduction

```bash
# Verify environment and dependencies (Node >=20, Docker, Git)
npm run preflight

# Run full unit test suite (25/25 passing)
npm test

# Run adversarial security scenarios (T1–T8 MOCK suite)
npm run security

# Run synthetic end-to-end demo
npm run demo

# Verify real Tide fail-closed boundary (exits 3 with REAL_TIDE_NOT_WIRED)
npm run tide:probe

# Launch local interactive verification dashboard
npm run server
# Open http://localhost:8787 in your browser
```

No external npm packages are required for the local baseline (built entirely on Node.js built-ins).

---

## Architecture & Trust Boundaries

```
[ Untrusted Invoice ] 
        │
        ▼
[ AI Parser Agent ] ──(Untrusted Proposal)──> [ Schema Validator ]
                                                      │
                                                      ▼
[ Independent Bank ] <──[ Signed Envelope ]── [ Canonical Protocol (9 fields) ]
  • Pins Tide VVK                                     │
  • Verifies exact bytes                              ▼
  • Durable replay DB                        [ Tide / Forseti Policy Gate ]
                                               • Vendor Allowlist
                                               • Dual-Custody Approvers
                                               • Distributed ORK Signing
```

- **Stage 1 (Proposal):** Agent parses invoice; schema strictly rejects smuggled authorization fields (`signature`, `policyOverride`).
- **Stage 2 (Canonicalization):** Binds version, domain, invoice, amount (integer cents), currency, payee, account, nonce, and expiry.
- **Stage 3 (Authorization):** Policy gate requires 1 approver for low-value, >=2 distinct approvers for high-value; rejects self-approval.
- **Stage 4 (Envelope):** Ties signed canonical bytes to key ID and policy ID.
- **Stage 5 (Verification):** Independent bank receiver validates signature with pinned public key, enforcing durable replay protection with atomic lockfiles.

---

## Current Status & Verification Gates

| Gate | Status | Evidence & Verification Notes |
|---|:---:|---|
| **G1: Official Rules** | **PARTIAL** | Official route and 5 prompts verified; RMIT participant eligibility unverified in repo. |
| **G2: Local Baseline** | **PASS** | **25/25 unit tests**, 7 fixture invoices, and all 8 security scenarios (T1–T8) pass locally. |
| **G3: Tide Environment** | **BLOCKED** | Docker ready; awaiting user-supplied Tide licence email, terms acceptance, and browser enrollment. |
| **G4: Real Signing** | **BLOCKED** | C# contract [`forseti/LeashPaymentPolicy.cs`](forseti/LeashPaymentPolicy.cs) ready; awaits Tide team testnet deployment. Adapter fails closed safely. |
| **G5: Real Adversarial** | **BLOCKED** | Real-path T1–T8 blocked pending G4; mock suite automated and passing. |
| **G6: Deliverables** | **READY** | README prompts complete; 120s storyboard ready; evidence packer verified. |

> **Security & Transparency Note:** All passing tests reflect **local mock architectural simulation**. The real Tide adapter deliberately **fails closed** (`REAL_TIDE_NOT_WIRED`) and will never substitute a local key for distributed cryptography.

---

## Key References & Documentation

- [Detailed Challenge Write-up](docs/CHALLENGE_WRITEUP.md)
- [Execution Plan & Cutover Strategy](docs/EXECUTION_PLAN.md)
- [Threat Model & Security Spec](docs/THREAT_MODEL.md)
- [120-Second Demo Storyboard](docs/DEMO_STORYBOARD.md)
- [Official Rules & Verification](research/official-rules.md)
