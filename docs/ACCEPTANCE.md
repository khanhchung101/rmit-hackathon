# Acceptance contract

**Required:** G1 viable competition submission route, G2 local tests, G3 actual Tide environment, G4 actual Tide policy-gated signature and external verifier, G5 real negative attacks, G6 repo/video/status confirmed. 

Unit tests passing are necessary but not sufficient. Reviewers must witness Tide deny a forbidden **signing** operation (not UI refusal). No backend-held signing secret is allowed in real path. The receiver must independently pin Tide signing key/context. Identities/approvals must be cryptographically validated, not caller-provided strings.

**Escalation:** Blocked G4 ⇒ stop feature expansion, perform smaller source/SDK spike or pivot. Challenge closed ⇒ no fake submission claim; produce portfolio/handoff instead. Contract controls can be effective without real-world fraud detection; document residual risks.
