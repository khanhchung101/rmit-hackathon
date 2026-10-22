# Tide capability audit (research-backed vs implementation-unverified)

Sources: official Forseti documentation plus Raziel MCP 1.9.33 and Tide Foundation KeyleSSH source, audited 2026-10-22. Exact package versions: `@tidecloak/js@0.14.41`, `heimdall-tide@0.14.41`, `asgard-tide@0.14.20`.

| Capability | Docs indicate | Must prove inside Leash |
|---|---|---|
| TideCloak user/realm/OIDC+doken | Supported | Real realm/client login + valid device/session-bound doken |
| `Policy:1` / `BaseTideRequest` | Docs reference in code example | Working SDK request for **our exact bytes** |
| `IAccessPolicy.ValidateData(DataContext)` | Supported | Contract inspect accurate amount/payee/expiry/nonce and deny forbidden request |
| `ValidateApprovers(ApproversContext)` for EXPLICIT mode | Supported | Distinct human identity proofs; never raw caller-supplied names |
| `ValidateExecutor(ExecutorContext)` for PRIVATE mode | Supported | Correct request mode and executor/doken, do not assume all stages simultaneously |
| Ed25519-style distributed threshold sign | Documented architecture | Actual returned signature, public key provenance, signed message scope and external verification |
| Contract identity based on SHA-512 of source | Documented | Record contract ID, policy version governance and bank trust binding |
| QEA realm admin governance | Documented | Confirm protected scope, quorum, app realm, master realm escape hatch |
| Field-level E2EE | Documented separately | Optional bonus only after sign path works; no claims based on plain DB ciphertext |
| Raziel MCP | Docs describe agent-oriented official guidance | Test @tideorg/mcp package reachability and reference example |

**UNVERIFIED:** production SDK versions/build pipeline, protocol's exact signed bytes, canonicalized challenge/executor/approver interactions, correct `publicKey` getter and scheme, policy-key scoping, QEA enforcement on contract updates, developer access to a test realm. G4 requires executable proof, not documentation quotes.

## Live audit findings

- Raziel MCP selected **policy-governed-signing**. The built-in `RelationshipAttestation:1` contract does not authorize signing, so Leash requires a custom contract.
- Custom contract deployment is not self-service; Raziel directs teams to Tide for experimental test-network review/deployment. Local compilation is necessary but cannot satisfy G4.
- `createTideRequest` and `executeSignRequest` live on the browser-initialized TideCloak instance (`IAMService._tc`); no supported headless/service-account signing path exists.
- `ValidateApprovers` runs only for `ApprovalType.EXPLICIT`; `ValidateExecutor` runs only for `ExecutionType.PRIVATE`. A Leash policy must deliberately choose a request model that invokes both required controls.
- Raziel GAP-072 reports that the double-wrapped EXPLICIT custom-model identity needed for an approval card is source-derived but not yet network-verified. This is a real feasibility risk, not an API to assume.
- The independently pinned verification key is the realm Ed25519 VVK from exported adapter `jwk.keys` (or the restricted Tide JWK admin endpoint), not the OIDC RSA JWKS.
- QEA is separate from payment approval. With one admin the threshold is one; with two admins the documented formula still requires one. The `master` realm is never governed by QEA.

Official architecture excerpt pattern: `new BaseTideRequest("BasicCustom", "BasicCustom<1>", "Policy:1", draft, new TideMemory())` and `tc.createTideRequest` / `tc.executeSignRequest`; do not paste into production until SDK runtime verified.
