# Engineering handoff — real Tide path (intentionally not wired)

**Source:** https://docs.tide.org/Core-Concepts/forseti-engine . Architecture uses `Policy:1`, `BaseTideRequest`, `TideMemory`, TideCloak doken and `executeSignRequest`. Current docs may change. A sample describes C# `IAccessPolicy` stages and KeyleSSH's policy-gated signing. First verify actual sample APIs against your installed SDK and realm.

**Files to implement/replace after Step 0:**
- `forseti/LeashPaymentPolicy.intent.cs`: replace with compilable C# policy using real namespaces and policy helpers; prove `ValidateData` sees the challenge bytes Tide actually signs.
- `src/signing/tideForsetiSigner.mjs`: implement real signature request with browser/user authorization, real doken and independent approver proofs. Never embed doken in server repo.
- `src/bank.mjs`: keep independent key pinning and exact signed message verification. Determine key/sig algorithm, encoding and Tide request byte scope before using.
- `scripts/tide-probe.mjs`: replace fail-closed gate with real reproducible experiments that do not expose secrets. Implement real-path T1–T8.

**Required artifacts:** SDK lockfile/version, contract source+SHA-512, deployed contract identifier, Tide signing key provenance/fingerprint, exact bytes and real returned signature, external verifier results, denied transaction trace, QEA evidence, independent review. Mock test output cannot replace these.

**QEA vs payment approvals:** QEA protects governed realm admin changes; `ValidateApprovers` must enforce per-request independent approval proofs. Verify `EXPLICIT` vs `PRIVATE` semantics. `master` realm restrictions are distinct.

## Current audited implementation path (2026-10-22)

- Candidate contract: `forseti/LeashPaymentPolicy.cs`; source SHA-512/contract candidate ID is recorded in `evidence/runtime/tide-sdk-audit-2026-10-22.json`.
- Candidate request family: `DynamicApprovedCustom`, because canonical payment bytes need to be dynamic signed data while humans approve each transaction. This is a hypothesis until live ORK traces prove the signed-byte scope and approval-card binding.
- Required browser packages observed: `@tidecloak/js@0.14.41`, `heimdall-tide@0.14.41`, `asgard-tide@0.14.20`. Do not add them to production dependencies until the realm/deployment experiment is ready.
- Custom signing contract deployment is currently Tide-team-operated according to Raziel MCP 1.9.33. A local contract file or successful stub compile is not a deployed policy.
- Correct verifier trust anchor is the realm Ed25519 VVK in the exported adapter's `jwk.keys`, pinned out of band. The public OIDC RSA JWKS is not interchangeable.
