# Trust boundaries

**TB1** Invoice -> proposer: text is data, not instructions. Model may follow an injected instruction. Impact must end at `PaymentProposal`.
**TB2** Proposer/backend -> authority: backend owns neither Tide signing key nor independent approval identities. Signature must not be possible solely with backend privilege.
**TB3** Independent humans -> authority: verified real identity/doken, roles and distinctness; do not trust IDs carried in backend JSON.
**TB4** Tide Fabric -> bank: independent bank verifies correct Tide key, signature over exact canonical message and allowed domain/contract scope. Don't use authentication JWT key by default.
**TB5** Realm admin -> sensitive policy configuration: protect with verified QEA/contract governance, document master realm escape hatch.
**TB6** Replay/time: receiver enforces expiration and transaction nonce uniqueness; signature alone doesn't stop valid replay.

**Residual:** malicious quorum, compliant but fraudulent invoices, compromised receiver, model misclassification, Tide SDK/browser vulnerabilities; never promise absolute prevention.
