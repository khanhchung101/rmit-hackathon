# STEP 0 — Tide/Forseti technical feasibility SPIKE (must execute before UI)

## Hypothesis

One exact domain-separated Leash payment payload can be inspected by a *deployed* Tide Forseti contract; the Fabric returns no valid signature for forbidden payload/approvals, and returns a cryptographic signature for authorized payload/approvals; an **independent** receiver verifies exact bytes with the correct public key.

## Experiments (ordered)

1. **Access:** Clone/get official sample, run TideCloak quickstart, provision app realm (not master), register participants: `agent`, `financeA`, `financeB`, `operator`. Record realm/client IDs only if non-secret. Confirm SDK package exports/versions. MCP is documentation/discovery aid, not proof of working signing.
2. **Serialization:** Freeze `docs/SIGNATURE_PROTOCOL.md` and an explicit byte-level test vector. Investigate `BaseTideRequest`, `TideMemory`, `Policy:1` request, `createTideRequest`, `executeSignRequest`. Determine if signature signs raw challenge bytes or an envelope; log inspected references and library versions.
3. **Policy compilation/deployment:** Adapt `forseti/LeashPaymentPolicy.intent.cs` to a valid `IAccessPolicy` based on current real SDK. Contract must unpack and validate `amountMinor`, `currency`, `payeeId`, `payeeAccount`, `nonce`, `expiresAt`, `domain`, `version`; use enforced executor and approver semantics. Record source SHA-512, contract id, approval/configuration history; validate the published policy version cannot be swapped freely by backend.
4. **Authorized request:** Create valid payment, independent approver proof; submit to real Tide, return cryptographic signature and associated key identifier / public key. Implement off-app external verifier (`src/bank.mjs` pattern) to validate **same exact signed bytes**; verify exact scheme/encoding (e.g. Ed25519 if current docs match).
5. **Negative request:** Change payee to attacker and/or remove required approver, ensure Tide cannot produce valid signature (not merely backend rejects). Capture request, failure response, source contract, verifier result.
6. **Bank integrity:** After a valid signature, mutate amount/payee, change domain, expire and replay; receiver must reject. Prove bank cannot accept unsigned direct call. Receiver public key must be anchored to Tide signing key, not realm JWT key by assumption.
7. **Governance (separate):** Configure QEA on app realm; one rogue admin cannot self-grant approver rights / replace policy without required quorum. Check master realm limitation.

## Evidence object required for each test

`{id, dateUtc, repoCommit, realmIdRedacted, sdkVersion, contractSha512, sourceUrl, command, observedResult, signatureBytesHash, publicKeyFingerprint, exactPayloadHash, independentVerifierCommand, status, limitations}`. Store in `evidence/runtime/*.json`; redact dokens and secrets; optionally attach screenshots/video.

## Technical GO/NO-GO

- **GO**: real Tide positive and negative tests + independent receiver verify against Tide public key + actual independent approval enforcement.
- **CONDITIONAL**: key delivery/approvers unresolved; continue ONLY isolated spike, no presentation claiming finished security.
- **NO-GO**: cannot deploy a valid contract, does not gate signing of exact payload, or cannot independently verify Tide signature; pivot to validated Tide capability or label mock demo unequivocally.

## Known assumptions to verify

`ValidateApprovers` may apply only to **EXPLICIT** policies and `ValidateExecutor` to **PRIVATE** policies (official Forseti documentation). Do not assume both methods fire in one request by default. Check doken/session binding, signature scope, approved approver list, request metadata authenticity, non-malleable payload, contract parameters, realm governance and SDK/current product availability.

## Execution result — 2026-10-22

- Official docs, Tide npm packages, KeyleSSH and Raziel MCP 1.9.33 were inspected; package/API versions are in `evidence/runtime/tide-sdk-audit-2026-10-22.json`.
- `forseti/LeashPaymentPolicy.cs` is a fail-closed contract candidate using current documented context shapes. Raziel's sandbox and structural scans pass, but compilation is blocked because no .NET SDK is installed and the SDK container pull did not complete.
- Realm/bootstrap and deployment were not attempted: they require a participant-provided licence email, explicit Tide Terms acceptance, human account linking, and Tide-team deployment of the custom signing contract.
- No signature, Tide VVK, approval doken, deployed contract ID or external verifier trace exists. **G4 remains BLOCKED.**
- The intended `DynamicApprovedCustom` design still needs two live proofs: `ctx.DynamicData` must be the exact bytes signed, and the approval card must display data cryptographically consistent with those bytes. Raziel's EXPLICIT custom-model GAP-072 is also not network-verified.
