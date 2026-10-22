# Tide capability audit (research-backed vs implementation-unverified)

Source of architecture: https://docs.tide.org/Core-Concepts/forseti-engine (reviewed 2026-10-22).

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

Official architecture excerpt pattern: `new BaseTideRequest("BasicCustom", "BasicCustom<1>", "Policy:1", draft, new TideMemory())` and `tc.createTideRequest` / `tc.executeSignRequest`; do not paste into production until SDK runtime verified.
