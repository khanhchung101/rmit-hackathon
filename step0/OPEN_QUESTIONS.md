# OPEN QUESTIONS — Step 0 blockers

1. Is official Tide UNLOCKED intake open on **2026-10-22**, or has it closed? If closed, will organizers accept an extension/private link? **Blocking G1**.
2. What is the exact judging/README template with five prompts, video constraints, team eligibility? Check current organizer sources.
3. Can current Forseti SDK deploy a custom C# policy for payment bytes using a runnable example and dev/test realm? Which `IAccessPolicy` SDK assembly/version?
4. Does request binding ensure `ValidateData` validates precisely the bytes the bank later verifies? How are challenge, envelope, contract ID and realm key scoped?
5. How to obtain the **actual signing public key** and matching signature encoding, without conflating JWT signing key?
6. Which approval mode and authorizer doken proofs support 1-of-2 / 2-of-3 independently controlled human approvers per payment? Can low-value use a mandatory 1 independent approver?
7. Is contract source/policy-version governance under QEA? How does the master realm exception alter the claim?
8. Can a malicious backend switch to another accepted key/contract? How will the bank pin allowed key+domain+policy identifiers?
9. Model: hosted structured-output vs local model, total time/cost, API access, model demo reproducibility? Are synthetic fixtures sufficient to meet official AI expectations (if any)?
10. Is a reusable scanner or existing Fireblocks capability substantially identical in this target niche? What evidence is unique to Leash's small PoC?
11. What persistence architecture ensures nonce replay prevention across concurrent workers and process restarts?
12. Which team members have actual access to TideCloak and approver accounts to capture independent approvals?
