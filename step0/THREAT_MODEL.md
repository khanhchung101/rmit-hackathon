# STEP 0 — Threat inventory

**Assets:** ability to authorize a payment, public-key provenance, protected policy, payee allowlist, vendor details, human approval grants, nonce registry. **Trust boundaries:** invoice → agent → app; agent/app → Tide; Tide → bank; realm admin → policy.

**Attackers:** malicious invoice submitter (controls invoice text); compromised LLM process (controls proposal); backend intruder (controls app server/API and DB); rogue single app-realm admin (attempts rights/policy change); network adversary (replay/tamper); colluding authorized approver set (out of target).

**Core invariants:** (A) agent/backend alone cannot produce a bank-valid payment; (B) a signature proves exact domain-bound bytes; (C) bank rejects replay and untrusted key; (D) independent approver identities are validated outside backend; (E) admin configuration changes are governed where supported.

**Residual risks:** ≥quorum human collusion; malicious vendor already approved; Tide network or SDK vulnerability; compromised browser holding authorized doken; master realm emergency override; external bank verification disabled; policy/receiver mismatch; denial of service; users copying transaction data; false invoices that satisfy correct approvals. Leash is NOT fraud detection.

See `docs/THREAT_MODEL.md` and `tests/SECURITY_TEST_MATRIX.md`.
