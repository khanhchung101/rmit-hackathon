# Engineering handoff — real Tide path (intentionally not wired)

**Source:** https://docs.tide.org/Core-Concepts/forseti-engine . Architecture uses `Policy:1`, `BaseTideRequest`, `TideMemory`, TideCloak doken and `executeSignRequest`. Current docs may change. A sample describes C# `IAccessPolicy` stages and KeyleSSH's policy-gated signing. First verify actual sample APIs against your installed SDK and realm.

**Files to implement/replace after Step 0:**
- `forseti/LeashPaymentPolicy.intent.cs`: replace with compilable C# policy using real namespaces and policy helpers; prove `ValidateData` sees the challenge bytes Tide actually signs.
- `src/signing/tideForsetiSigner.mjs`: implement real signature request with browser/user authorization, real doken and independent approver proofs. Never embed doken in server repo.
- `src/bank.mjs`: keep independent key pinning and exact signed message verification. Determine key/sig algorithm, encoding and Tide request byte scope before using.
- `scripts/tide-probe.mjs`: replace fail-closed gate with real reproducible experiments that do not expose secrets. Implement real-path T1–T8.

**Required artifacts:** SDK lockfile/version, contract source+SHA-512, deployed contract identifier, Tide signing key provenance/fingerprint, exact bytes and real returned signature, external verifier results, denied transaction trace, QEA evidence, independent review. Mock test output cannot replace these.

**QEA vs payment approvals:** QEA protects governed realm admin changes; `ValidateApprovers` must enforce per-request independent approval proofs. Verify `EXPLICIT` vs `PRIVATE` semantics. `master` realm restrictions are distinct.
