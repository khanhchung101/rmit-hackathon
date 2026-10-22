// HISTORICAL INTENT ONLY. NOT a compilable/deployed Tide C# contract.
// The current compile-check candidate is LeashPaymentPolicy.cs; it is also NOT deployed.
// Adapt using the CURRENT Tide Forseti IAccessPolicy SDK and verify with real API docs.
// No claim of Tide enforcement until Step 0 G4 is proven.
//
// Conceptual outline:
// ValidateData(ctx):
//    parse THE SAME bytes requested for signing (not backend metadata copy)
//    validate domain/version, amount (integer cents), vendor allowlist, currency,
//      expiry, nonce, policy/contract binding
//    return deny if anything invalid
// ValidateApprovers(ctx):
//    for EXPLICIT policy, require approved doken-based independent signers:
//      amount < $1000 => 1 independent approver
//      amount >= $1000 => 2 distinct independent approvers
//      no executor self-approval; only trusted roles/orgs
// ValidateExecutor(ctx):
//    for PRIVATE policy, enforce executor/session role as supported by current SDK
//    Note: EXPLICIT/PRIVATE are mode-specific; verify how both controls compose.
//
// Required experiment: deploy contract, prove denial occurs INSIDE Tide Fabric
// before signing, and independently verify a real Tide-created signature.
