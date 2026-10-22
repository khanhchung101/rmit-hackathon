# Local mock verification — 2026-10-22

Environment: Node v22.16.0, Python3; Docker executable not available in this build container.

- `npm run preflight`: Node/files/Git PASS, Docker WARN; G1/G4 BLOCKED.
- `npm test`: 11/11 tests PASS, 0 fails.
- `npm run validate:fixtures`: F01–F07 PASS.
- `npm run security`: T1–T5 PASS **mock-only**.
- `npm run demo`: legitimate local mock accepted; malicious payee denied; bypass rejected.
- `npm run tide:probe`: expected exit 3 / `REAL_TIDE_NOT_WIRED`; not implemented; G4 BLOCKED.

These results prove ONLY local mock behavior, not TideCloak/Forseti deployment or competition eligibility.
