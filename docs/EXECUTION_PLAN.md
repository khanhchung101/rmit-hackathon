# Leash completion execution plan

**Plan frozen:** 2026-10-22 06:45 UTC / 13:45 ICT. **Vietnam deadline:**
2026-10-22 11:00 UTC / 18:00 ICT. This plan does not change the acceptance
gates in `PLAN.md`; it turns them into an executable critical path.

## Outcome and release rule

The challenge build is releasable only when G1–G6 pass. In particular, a local
Ed25519 signature, a Forseti source file, or a green mock test is not a real
Tide integration. If G4 or the core real-mode tests in G5 cannot be evidenced,
the release outcome is **NO-GO for the challenge security claim**, with a
reproducible mock architecture handoff.

## Critical path and ownership

| Order | Step / gate | Work | Owner | Required input | Evidence / exit |
|---:|---|---|---|---|---|
| 1 | Step 0 / G1 | Confirm participant eligibility, RMIT emails/team name, portal still open | Human participant + PM | Eligible identities | Redacted eligibility review and live form check |
| 2 | Step 0 / G3 | Create non-master Tide realm, link admin and approver users, configure app/client/roles | Human participant + Tide engineer | Licence email, explicit Terms acceptance, browser enrollment | Realm/client identifiers, redacted session and role traces |
| 3 | Step 0 / G4a | Compile and have Tide review/deploy `LeashPaymentPolicy.cs` | Tide team + Tide engineer | Realm and contract source/hash | Compiler output, deployed contract ID and source SHA-512 |
| 4 | Step 0 / G4b | Prove exact `DynamicData`/signed-byte binding and approval-card binding | Tide engineer + Security | Deployed policy, executor and approver dokens | Exact payload hash, request trace, UI/approval trace |
| 5 | Step 4 / G4 | Produce allowed and forbidden real requests; independently verify the allowed signature using pinned realm VVK | Tide + Backend | Contract ID, VVK/key ID, live users | Positive signature, negative no-signature trace, external verifier result |
| 6 | Steps 3–5 | Finalize real transport envelope, adapter and independent bank receiver | Backend | Proven signing scope/algorithm | `test:tide` positive flow and tamper denial |
| 7 | Steps 5–6 / G5 | Run T1–T8; T1–T5 are mandatory real-mode passes | Security + QA | Working G4 integration | Per-test redacted JSON evidence and hashes |
| 8 | Step 7 | Finish README, clean setup and 120-second real-evidence video | PM + QA | G4/G5 artifacts | Reproduction review and compliant MP4 |
| 9 | Step 8 / G6 | Secret/claims audit, evidence pack, public repo, final portal check and submission | Human participant + PM | Eligible submitter and public repo | Frozen commit, bundle hash and submission receipt |

## Step-by-step work packages

### Step 0 — feasibility and go/no-go

1. Human participant confirms eligibility without storing personal data in the
   repo. PM rechecks the official page/form immediately before submission.
2. Human participant supplies a Tide licence email out of band, accepts Tide
   Terms explicitly, chooses local or hosted TideCloak, and completes browser
   enrollment. Secrets, dokens, JWTs and sessions never enter Git or evidence.
3. Create `agent`/executor, `finance-a`, `finance-b` and operator identities in a
   non-master realm. Configure executor and approver roles. Treat QEA admin
   quorum separately from per-payment approval.
4. Compile the candidate against the current Forseti SDK. Resolve every compile
   difference from official APIs; rerun the sandbox scan and record source hash.
5. Ask Tide to review and deploy the custom policy. Record the deployed contract
   ID and policy parameters, not merely the candidate hash.
6. Run one allowed and at least two forbidden live signing experiments. The
   forbidden cases must reach Tide and receive no bank-valid signature.
7. Export the realm Ed25519 VVK/key identifier through the documented adapter,
   pin it out of band in the independent verifier, and verify the exact bytes.
8. Set G3/G4 PASS only after the evidence object required by
   `step0/FEASIBILITY_SPIKE.md` is complete. Otherwise record BLOCKED/NO-GO.

### Step 1 — problem and novelty

Keep `research/prior-art-gap.md` current, retain conservative wording, and map
the concrete user pain to the five official prompts. Exit when no “first” or
universal fraud-prevention claim remains. This step is locally complete but must
be re-reviewed against the final README.

### Step 2 — security specification

Review trust boundaries, invariants and T1–T8 after the real Tide request model
is known. Update the threat model for any SDK/UI trust introduced by approval
cards, doken transport, VVK distribution and policy replacement. Exit only when
the proposer/backend cannot independently satisfy every bank acceptance check.

### Step 3 — data and API contract

The local nine-field payment schema and byte vector are frozen. Before marking
L-011 DONE, replace the provisional Tide envelope with the observed SDK request
and prove the live ORKs sign the bytes the bank verifies. Preserve strict
version/domain/expiry, integer minor units and exact-field rejection.

### Step 4 — real Tide integration

Implement `tideForsetiSigner.mjs` only from the verified request trace. It must
require the deployed policy identity and real authorization artifacts, expose no
mock fallback, and return signature metadata needed by the verifier. Keep the
browser/session boundary explicit. Add a real-only test command that exits
BLOCKED when configuration is missing and never silently signs locally.

### Step 5 — vertical slice

Wire synthetic invoice → deterministic proposal → canonical instruction → real
human approvals → Forseti validation → Tide signature → independent mock-bank
verification. Add a transactional durable nonce store with a unique constraint
and test restart/concurrency behavior. A real LLM/OCR remains optional and may
only produce the untrusted proposal.

### Step 6 — adversarial validation

For T1–T8 record attacker capability, request/payload hash, expected result,
actual result, mode, contract/key identity, command, timestamp and reviewer.
T1–T5 must pass in real mode. T6 must distinguish app-realm QEA from transaction
approval; T8 must test both policy-ID and verifier-key substitution.

### Step 7 — demo and handoff

Run the clean setup on a second environment. Produce the two-minute MP4 under
100 MB with only evidence-backed statements. The story shows a compromised
proposal, a real Tide denial, an allowed real signature, independent bank
verification, tamper/replay denial and explicit limitations. Complete the exact
five README prompts in no more than 300 words, with setup kept separate.

### Step 8 — release and submission

Run all tests, claim/secret scans and `npm run pack:evidence`; record the commit
and archive SHA-256. Make the repo public, verify links/video, then have the
eligible human submit the Google Form. Only an observed acknowledgement counts
as a receipt. If the portal closes or G4/G5 fail, publish a NO-GO report instead
of declaring challenge completion.

#### Final cutover — từ MOCK sang REAL_TIDE

Trong PoC này, “real data” chỉ có nghĩa là **real Tide authorization artifacts**.
Không thay synthetic invoice, fake payee/account hoặc simulated bank execution
bằng dữ liệu tài chính thật. Không có tiền thật, credential thật trong Git hay
PII trong evidence.

| MOCK hiện tại | Thay bằng khi cutover | Có lưu trong repo? |
|---|---|---|
| `finance-a`/`finance-b` strings | TideCloak-enrolled executor và approvers, role/doken được runtime xác minh | Chỉ pseudonym, role mapping và redacted trace; không lưu doken/session |
| `src/policy.mjs` quyết định allow/deny | Deployed `LeashPaymentPolicy.cs` chạy trong Forseti | Source, SDK version, SHA-512, deployed contract ID và redacted deployment proof |
| Caller-supplied approval array | Tide approval flow gắn với exact transaction | Payload/approval hashes và redacted result; không lưu token |
| `MockSigner` local Ed25519 key | `TideForsetiSigner` gọi policy-governed ORK signing | Adapter source, signature hash/encoding và request trace; không private key |
| Mock public key | Realm Tide VVK được pin out-of-band | Public key/fingerprint và provenance nếu Tide cho phép công bố |
| `MOCK_ONLY` bank envelope | `REAL_TIDE` envelope với real key ID và deployed policy ID | Schema, public IDs và verified example đã redact |
| Mock T1–T8 | Real Tide T1–T8, bắt buộc T1–T5 pass | Per-test evidence JSON, timestamps, commands và reviewer |
| Mock demo/UI | Real-mode demo hoặc fail-closed | Video chỉ quay real path; mock command vẫn giữ cho local regression |

Business fixtures được giữ nguyên:

- Synthetic invoice text và prompt-injection fixture.
- Fake vendor/payee/account identifiers.
- USD integer minor units nhưng không đại diện tiền thật.
- Deterministic proposer; LLM thật vẫn optional.
- Mock Bank như một independent simulated receiver, nhưng nó phải verify chữ ký
  Tide thật bằng pinned Tide VVK.

Cutover thực hiện theo thứ tự fail-closed:

1. Chạy và lưu baseline mock regression; không xóa `MockSigner` hoặc mock tests.
2. Provision non-master Tide realm, client, roles và human enrollment ngoài Git.
3. Compile/deploy Forseti contract; freeze contract ID, source hash và parameters.
4. Điền public/non-secret runtime configuration từ realm thật. Secret, session,
   doken và credential chỉ được inject lúc chạy, không được log hoặc commit.
5. Implement real adapter; `TIDE_MODE=real` không được import, gọi hoặc fallback
   sang `MockSigner` dưới bất kỳ failure path nào.
6. Lấy VVK từ documented Tide source và pin độc lập tại bank. Không nhận key từ
   payment request và không dùng OIDC JWT key nếu chưa chứng minh tương đương.
7. Chạy real positive request, forbidden payee, missing approval, tamper và replay;
   ghi exact payload hash, signature hash, contract/key identity và verifier result.
8. Đổi demo/video path sang real mode. Mock UI/CLI phải có watermark
   `MOCK_ONLY_NOT_TIDE` và không được xuất hiện như evidence của Tide.
9. Cập nhật `STATUS.json`, claim ledger, README và video chỉ sau khi G4/G5 pass.
10. Chạy secret scan, clean-machine reproduction và evidence pack; human reviewer
    xác nhận không có private material trước khi public repository/submission.

Cutover hoàn thành khi `npm run test:tide` chạy real path thành công, forbidden
requests không nhận bank-valid signature, independent bank xác minh allowed exact
bytes, và source scan chứng minh real adapter không có mock fallback. Nếu bất kỳ
điều kiện nào thiếu, giữ `mode=MOCK_ONLY` và kết luận NO-GO thay vì đổi nhãn.

## Immediate execution queue

1. **Now, agent-owned:** freeze machine-readable local schemas and consistency
   checks for L-011; run all mock regressions and update status/evidence.
2. **Now, human-owned:** confirm RMIT eligibility and begin Tide realm browser
   enrollment. This is the first external unblocker.
3. **Then, Tide-owned:** review/deploy the candidate contract and provide the
   documented real signing path/VVK provenance.
4. **After G4:** implement the adapter and durable receiver, then execute T1–T8.
5. **After G5:** record the video, finalize README, freeze and submit.

## Commands at every milestone

```bash
npm run preflight
npm run validate:fixtures
npm run validate:contracts
npm test
npm run security
npm run tide:probe
npm run pack:evidence
```

`tide:probe` is expected to exit 3 until G4 is genuinely wired. A zero exit code
must be backed by a real trace, never by changing the probe to use `MockSigner`.

