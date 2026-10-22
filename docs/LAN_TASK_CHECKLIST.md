# Checklist kỹ thuật của Lân — kiểm tra code mới và làm từng bước

**Audit:** 22/10/2026, checkout `83da61a`. Đối chiếu với L1–L5 trong PLAN, source và tests chạy local bằng Node 22.18.0. Tài liệu này là danh sách việc cần làm, không có nghĩa implementation dưới đây đã hoàn thành. Không triển khai code hoặc cập nhật các gate PASS trong lần audit này.

**Cách dùng:** làm lần lượt bước 1 → 6, không cần chờ Tide. Bước 7 cần bàn giao từ Khánh. Bước 8 phối hợp Phát. Không liên quan video/submission.

IDs `LAN-xx` dưới đây khác các IDs `L-xxx` trong backlog cũ để tránh nhầm với nhiệm vụ PM/Tide.

## A. Đã có gì, không cần viết lại?

| Task PLAN | Đã có trong checkout | Kết luận audit |
|---|---|---|
| L1 — Payload/TTL | `canonical.mjs`, schemas, fixed vector SHA-256, `validate:contracts` | PARTIAL: canonical mock có test; default runtime expiry vẫn 2030; Tide byte binding chưa có |
| L2 — Receiver riêng/pinning | `MockBank`, verify Ed25519, optional key/policy ID checks | PARTIAL: chưa có receiver executable riêng; legacy route bỏ qua envelope checks; chưa strict schema/mode enforcement |
| L3 — Replay persistence | JSONL ledger + exclusive lockfile; test nhiều bank instances | PARTIAL: không viết lại ledger từ đầu; chưa có actual subprocess restart/concurrent worker test, crash recovery hoặc corruption handling |
| L4 — Orchestrator | `runMockDemo()` có low/high/hostile/tamper/replay | PARTIAL: hardcode mock signer cùng process với bank, CLI Windows còn entry-point issue, runtime demo chưa dùng durablePath |
| L5 — Real integration | Adapter Tide luôn throw `REAL_TIDE_NOT_WIRED` | BLOCKED: chưa có actual Tide key/signature/policy/approval proof |

### Kết quả đã chạy lại

- PASS: 20/20 unit tests; 7/7 fixtures; `verify-contracts`; 8 mock security scenarios bằng exported function.
- BLOCKED đúng dự kiến: real Tide probe. Chưa có real network/signing test thành công.
- Preflight thấy Docker CLI nhưng cảnh báo không đọc được Docker config; không chứng minh daemon/realm khả dụng. Preflight còn thông báo rules cũ hardcode, không dùng nó làm nguồn live submission state.
- `verify-contracts` kiểm tra cấu trúc/literals, không chứng minh C# compile/deploy hoặc runtime bank validate toàn bộ JSON Schema.

### Các claim chưa đủ evidence

`tasks/backlog.csv` đánh DONE L-015/L-016/L-019; `evidence/runtime/step5-slice-2026-10-22.json` nói đã kiểm chứng concurrency/schema. Source/tests hiện chưa đủ cho các claim rộng đó. Giữ phần mock đã PASS, chỉ thu hẹp claim hoặc thêm tests tương ứng; không dùng DONE làm lý do bỏ qua review.

## B. Các bước thực hiện

### Bước 1 — LAN-01 / P0: Chốt receiver contract và trust config

**Làm ngay, không chờ Khánh.** Dùng schemas/vector đã có, không thiết kế lại payment fields.

- [x] Đọc `src/bank.mjs`, `src/canonical.mjs`, `model/schema/bank-execution-v1.schema.json`, `docs/SIGNATURE_PROTOCOL.md`.
- [x] Chốt receiver runtime chỉ nhận envelope `{payment, authorization}`; legacy `(payment, signature)` chỉ được giữ cho test/dev với opt-in rõ, không là bypass của executable receiver.
- [x] Chốt cấu hình riêng của receiver: expected mode, public key, key ID, policy context và ledger path. Không lấy trust config từ payment request.
- [x] Ghi mode là runtime configuration; `authorization.mode` là untrusted metadata, không phải bằng chứng Tide.
- [x] Chốt output: accept/deny với error code rõ; malformed input và dependency/storage lỗi fail closed.

**Deliverable:** một contract ngắn trong `docs/SIGNATURE_PROTOCOL.md` hoặc doc receiver riêng; config example không secrets.

**Done:** Lân/Khánh thống nhất boundary. Phát có thể viết fixtures mà không đợi implementation. Mapping policy ID chỉ là transport metadata cho tới khi chứng minh key/policy binding thực.

**Kết quả LAN-01:** đã soạn [receiver contract](RECEIVER_CONTRACT.md) và [mock config example](../config/receiver.mock.example.json). Local boundary chốt cho LAN-02/03; Khánh review Tide binding vẫn PENDING. Không thay implementation hoặc real gate status.

### Bước 2 — LAN-02 / P0: Viết regression tests rồi khép envelope bypass

**Dependency:** bước 1. **Files:** `src/bank.mjs`, tests receiver riêng, schema liên quan nếu cần.

Ba tình huống đã tái hiện với local signature hợp lệ và bank được cấu hình key/policy IDs:

| Input | Kết quả hiện tại | Hành vi mục tiêu |
|---|---|---|
| `execute(payment, signature)` | EXECUTED, không kiểm tra envelope key/policy IDs | Strict receiver không cho đi vòng envelope |
| Đổi mock envelope mode thành `REAL_TIDE` | EXECUTED khi dùng cùng mock pinned key | Receiver cấu hình mock không nhận real label và ngược lại; cấu hình real dùng verified Tide trust anchor |
| Envelope có field lạ | EXECUTED | Reject nếu contract `additionalProperties: false` |

- [ ] Thêm tests cho các ca trên trước khi sửa; test raw path với strict receiver, không vô tình cấm helper dev mà chưa migrate callers.
- [ ] Validate exact required fields/types của envelope và authorization; extra fields, array/null/object signature bị từ chối có kiểm soát.
- [ ] Bắt buộc pins cần thiết trong strict runtime; mode check theo receiver config.
- [ ] Test wrong key/policy ID, missing auth, invalid base64, payload tamper; invalid request không consume nonce.
- [ ] Kiểm tra mock payload bị gắn nhãn real vẫn không tạo ra claim real signing.

**Done:** tests trước sửa fail vì đúng gap, sau sửa pass; 20 tests cũ vẫn pass hoặc được migrate rõ lý do. Không tuyên bố check policy ID string là cryptographic policy binding.

### Bước 3 — LAN-03 / P0: Tách receiver process thực sự

**Dependency:** bước 2; mock vectors đủ dùng, không đợi Tide.

- [ ] Tạo entry point nhỏ, ví dụ `src/bankReceiver.mjs`: đọc envelope từ file/stdin và trusted config riêng. CLI đủ cho MVP, chưa cần HTTP service.
- [ ] Receiver chỉ import verifier/canonical/storage, không import `MockSigner`, không tạo private key.
- [ ] Provision local mock public key cho test từ test-only signer; không đưa private key vào receiver/config/repo.
- [ ] JSON result ổn định, exit code rõ; input JSON malformed không crash uncontrolled hoặc accept.
- [ ] Tạo integration test dùng actual child process với public config: valid accept, unsigned/wrong-key/tampered reject.

**Done:** command riêng chạy receiver không cần signer process sống; trust config không bị envelope ghi đè. Ghi nhãn mock cho test này, chưa là G4 real proof.

### Bước 4 — LAN-04 / P0: Hoàn thiện phần ledger đã có và kiểm chứng nhiều process

**Dependency:** bước 3. Tận dụng `durablePath` hiện có; không mặc định phải đổi DB.

- [ ] Test process A accept rồi exit, process B cùng key/ledger reject replay. Test hiện tại chỉ tạo bank2/bank3 cùng process chưa đủ cho claim process restart.
- [ ] Test hai subprocess đồng thời gửi cùng signed payment: đúng một EXECUTED, process còn lại REPLAY_NONCE; ledger không bị hỏng.
- [ ] Test lock timeout/storage unavailable phải fail closed; không fallback sang memory rồi accept.
- [ ] Xử lý ledger malformed/truncated: hiện `_reloadDurableLedger()` bỏ qua parse errors; không được im lặng quên nonce rồi chấp nhận replay. Chọn fail closed cho file corrupt hoặc recovery có quy tắc/test rõ.
- [ ] Ghi crash limitation: process chết có thể để lockfile, chưa `fsync` không chứng minh power-loss durability. Không xóa lock chỉ vì file tồn tại khi process khác có thể còn chạy.
- [ ] Ghi riêng duplicate invoice với nonce mới: ngoài replay protection hiện tại, không tự gọi là đã ngăn double payment nghiệp vụ.

**Done:** actual restart/concurrency tests pass trong phạm vi local filesystem đã thử; claim đúng phạm vi. Nếu chưa có crash recovery thì ghi limitation thay vì tuyên bố production-ready.

### Bước 5 — LAN-05 / P0: Chốt TTL runtime, giữ nguyên fixed vectors

**Làm độc lập với bước 2–4 nếu cần. Files:** `src/canonical.mjs`, caller runtime, tests expiry.

- [ ] Chọn TTL ngắn phù hợp demo, ví dụ 5 phút là đề xuất của đội, không phải rule BTC; Khánh review policy clock semantics.
- [ ] Runtime payment tạo `expiresAt` từ thời gian hiện tại + TTL; tránh default 2030 cho giao dịch mới.
- [ ] Inject clock cho tests để chạy deterministic; test trước expiry, bằng expiry và sau expiry.
- [ ] Giữ fixed protocol vector năm 2030 cùng test clock cố định: không thay vector/hash chỉ để đổi runtime default.
- [ ] Nếu policy có max TTL, thống nhất policy/receiver checks; không tự thêm quy tắc một bên rồi làm lệch flow.

**Done:** payload runtime mới hữu hạn; byte-level vector vẫn pass; không thay payment field names mà thiếu review.

### Bước 6 — LAN-06 / P0: Runner dùng interface, không hardcode toàn bộ mock

**Dependency:** steps 1–5; phối hợp Phát để không cùng sửa scenario runner.

- [ ] Tách runner nhận proposer/signer/receiver dependencies; `await signIfAllowed` để hỗ trợ adapter async.
- [ ] Nối fixture → proposal → payment → signer → envelope → receiver process.
- [ ] Denial thì không cố build success envelope; phân biệt policy denied và dependency unavailable.
- [ ] Dùng persistent ledger config cho runtime; nonce mới mỗi run, explicit same-envelope replay case.
- [ ] Sửa Windows entry-point check của `src/demo.mjs`; nhờ Phát xử lý `securityScenarios.mjs` theo ownership PLAN.
- [ ] Real mode chỉ chọn real adapter; `REAL_TIDE_NOT_WIRED` phải báo blocked, không chạy mock ngầm.
- [ ] Giữ `runMockDemo()` tương thích caller/server hoặc migrate rõ ràng; nếu chuyển async phải sửa caller chờ Promise và xử lý lỗi.

**Done:** CLI mock chạy và hiển thị mode; real command fail closed rõ khi Tide chưa sẵn. Phát cắm reusable scenarios vào cùng boundary được.

### Bước 7 — LAN-07 / BLOCKED: Nhận vector Tide và verify độc lập

**Chờ Khánh K2/K4.** Có thể gửi checklist handoff ngay; không cần chờ deploy hoàn tất mới nói yêu cầu.

- [ ] Nhận synthetic payment/request, exact signed bytes hoặc envelope/hash mapping.
- [ ] Nhận scheme/encoding, public key/fingerprint/provenance, SDK version và key/policy context; không nhận tokens/private keys để nhúng vào receiver.
- [ ] Biết contract nào kiểm tra bytes nào và approvals gắn với request ra sao; signature sample không policy chỉ chứng minh compatibility.
- [ ] Verify sample bằng process riêng; sửa amount/account/domain phải reject.
- [ ] Nếu Tide ký envelope/hash, chứng minh binding tới payment; không sửa verifier để verify một message không ràng buộc payment được thực hiện.
- [ ] Test giả policy ID/đổi mode không tạo authorization; policy/key relationship cần evidence thực, không chỉ string equality.

**Done:** actual Tide signature verify + mutated payload reject. Nếu chưa có Tide artifact, để BLOCKED, không tự tạo local signature thay thế.

### Bước 8 — LAN-08: Ghép real path và handoff cho Phát regression

**Dependency:** bước 7 + Khánh real policy/approval flow + Phát scenarios.

- [ ] Valid-high đủ approvals thật accept.
- [ ] Forbidden payee và thiếu approvals được gửi tới Tide rồi deny, không chỉ local precheck.
- [ ] Receiver real tests T2/T4/T5/T7/T8 có output; phân biệt mock và real evidence.
- [ ] Clean rerun có prerequisites/config không secrets; reset test state an toàn, không tự xóa ledger runtime để làm replay pass.
- [ ] Cập nhật status/claims/backlog/evidence đúng phạm vi. Không chuyển G4/G5 PASS khi governance/policy-binding hoặc approvals còn chưa chứng minh tương ứng.

**Done:** Phát chạy lại theo command và nhận cùng observed results. Không gồm video hoặc nộp bài.

## C. Làm bước nào trước?

**Bắt đầu LAN-01 → LAN-02 → LAN-03.** Đây là phần receiver Lân làm độc lập và có gap đã tái hiện. Sau đó LAN-04, LAN-05, LAN-06. LAN-07/08 chờ artifact từ Khánh, không chặn sáu bước đầu.

Không viết lại canonical vector, parser, envelope builder hoặc ledger chỉ vì PLAN cũ ghi phải xây. Chỉnh phần thiếu và bổ sung evidence tương xứng.

## D. Checklist gửi đồng đội — Lân tự gửi khi cần

**Khánh:** “Tôi làm strict receiver/process/persistence. Gửi sớm public key provenance + signature sample + exact signed bytes, SDK version và policy/approval context. Chưa có thì báo blocker; không cần chờ toàn bộ adapter xong.”

**Phát:** “Bạn giữ proposer/fixtures/scenario runner và CLI security entry point. Tôi giữ bank/canonical/demo/orchestration. Chốt interface success/deny/async để tests cắm vào được. Cùng sửa package.json thì nhờ tôi gộp.”

Không có tin nhắn nào được tự gửi cho đồng đội trong lần audit này.

