# Bảng ánh xạ: Hiện trạng thực tế vs. Kết quả cần đạt (Tide UNLOCKED Challenge)

**Thời điểm cập nhật:** 2026-10-22  
**Dự án:** Leash — Phân định thẩm quyền ký duyệt mật mã cho hóa đơn do AI xử lý  
**Trạng thái tổng thể:** MOCK BASELINE & VERTICAL SLICE HOÀN TẤT (35/35 unit tests, T1–T18 security scenarios pass); REAL TIDE TẮC TẠI EXTERNAL (G3/G4).

---

## 1. Bảng chuẩn yêu cầu cần có

Không phải mọi yêu cầu bảo mật chi tiết bên dưới đều là câu chữ bắt buộc từ ban
tổ chức. Bảng này phân biệt **OFFICIAL** (đã lấy từ challenge/form) với
**LEASH ACCEPTANCE** (điều kiện kỹ thuật dự án tự đặt để chứng minh claim một
cách trung thực).

| ID | Nguồn | Yêu cầu/tiêu chuẩn | Bắt buộc để submit/claim? | Bằng chứng hoàn thành | Hiện trạng |
|---|---|---|---|---|---|
| O1 | OFFICIAL | Working prototype có tích hợp TideCloak; phải giải thích TideCloak giúp mở khóa ý tưởng như thế nào | **Có** | Luồng TideCloak thực chạy trong demo, source và reproducible setup | **BLOCKED:** mới có config placeholder và mock runtime |
| O2 | OFFICIAL | Public GitHub repository chứa source, README và video | **Có** | Public URL truy cập được ở chế độ ẩn danh; default branch/commit đã freeze | Remote GitHub đã cấu hình; public visibility và final contents chưa review |
| O3 | OFFICIAL | README có one-sentence description và trả lời đúng 5 prompt trong phần overview không quá 300 từ; setup để riêng | **Có** | Word count, exact prompts và human review | Có draft/source material; final submission README chưa chốt |
| O4 | OFFICIAL | Video `.mp4` hai phút, dưới 100 MB, đặt trong public repository | **Có** | File, duration/size/hash và playback check | **MISSING:** mới có storyboard |
| O5 | OFFICIAL | Team/form đúng RMIT Challenge 2; team name/campus và RMIT emails hợp lệ; submit qua form trước deadline | **Có** | Eligibility check và submission acknowledgement | **PARTIAL:** form/deadline đã audit, eligibility/receipt chưa có |
| O6 | OFFICIAL | Trình bày Vision 25%, Trust constraint 20%, Value 20%, Why TideCloak 20%, Prototype/storytelling 15% | Có ảnh hưởng điểm | README/video map rõ từng tiêu chí | Write-up đã map; real Tide evidence còn thiếu |
| S1 | LEASH ACCEPTANCE | AI/backend không có unilateral signing authority | **Có để bảo vệ core claim** | Không có private key/fallback trong real adapter; direct bypass bị bank từ chối | MOCK PASS; REAL BLOCKED |
| S2 | LEASH ACCEPTANCE | Forseti kiểm tra policy trên đúng payload được Tide ký | **Có để nói Tide policy-gates payment** | Deployed contract, exact payload hash, allowed/denied ORK traces | **BLOCKED G4** |
| S3 | LEASH ACCEPTANCE | Per-payment approvers có identity/role thật, distinct và không self-approve | **Có để nói independent approval** | Tide doken/approval trace đã redact và `ValidateApprovers` result | **BLOCKED G3/G4** |
| S4 | LEASH ACCEPTANCE | Independent receiver pin đúng Tide VVK và verify exact bytes, expiry, domain, policy/key identity, replay | **Có để nói bank independently verifies** | Real signature + external verifier + tamper/replay traces | MOCK PASS; REAL BLOCKED |
| S5 | LEASH ACCEPTANCE | T1–T5 pass trên real Tide path; T6–T8 được thực thi và ghi limitations | **Có cho G5** | Per-test real-mode evidence JSON và reviewer | MOCK T1–T18 PASS; REAL BLOCKED |
| S6 | SAFETY/SCOPE | Không dùng tiền, invoice, bank account, customer data hoặc credential thật | **Có** | Synthetic fixtures và clean secret/PII scan | PASS; phải duy trì tới submission |

Kết luận từ đề bài: cái bắt buộc trở thành “real” là **TideCloak integration và
bằng chứng prototype hoạt động**. Đề bài không yêu cầu real invoice, real LLM,
real bank hoặc real money.

---

## 2. Bảng đối chiếu tổng quan theo Acceptance Gates (G1 → G6)

| Cổng (Gate) | Mục tiêu / Tiêu chí cần đạt (Target) | Hiện trạng thực tế đã làm (Current Status) | Khoảng cách & Rào cản (Gap / Blocker) | Đánh giá |
|---|---|---|---|:---:|
| **G1: Điều kiện dự thi & Quy chế** | - Xác minh cổng nộp mở.<br>- Nắm rõ 5 prompt README, giới hạn từ ($\le 300$ từ), video MP4 $\le 2$ phút ($< 100$MB).<br>- Team đủ điều kiện (RMIT / Challenge 2). | - Đã quét trực tiếp cấu hình trang chính thức và form nộp (vẫn mở tại audit).<br>- Đã soạn sẵn 5 prompt chuẩn trong `docs/README_5_PROMPTS.md`.<br>- Deadline 18:00 ICT 22/10/2026 đã ghi nhận. | Chưa có email/thông tin định danh RMIT từ người dùng để xác nhận tính hợp lệ của đội thi. | **PARTIAL** |
| **G2: Local Baseline & Mock Security** | - Môi trường Node >=20, Docker, Git.<br>- Chạy đầy đủ kịch bản kiểm thử cục bộ.<br>- Phân định rõ ràng MOCK vs REAL, không dùng phím tắt mật mã giả mạo. | - Node 20.19.6, Docker 29.6.2.<br>- **35/35 unit tests PASS**, 7/7 invoice fixtures PASS.<br>- Các kịch bản **T1–T18 PASS** ở chế độ MOCK. | Không có gap cho local regression; kết quả này vẫn không phải Tide evidence. | **PASS** |
| **G3: Môi trường TideCloak** | - Thiết lập TideCloak realm độc lập (non-master).<br>- Cấu hình Client, Roles (agent/executor, finance-a, finance-b).<br>- Đăng nhập người dùng qua trình duyệt, cấp phát doken thực tế. | - Docker và Docker Compose đã sẵn sàng trên máy.<br>- Đã audit tài liệu SDK và cơ chế Raziel MCP. | Cần thông tin giấy phép Tide (email người dùng), chấp nhận điều khoản và thao tác đăng nhập trình duyệt thật từ phía người dùng. | **BLOCKED (External)** |
| **G4: Hợp đồng Forseti & Ký phân tán Tide** | - Biên dịch và triển khai C# contract `LeashPaymentPolicy.cs` lên testnet Tide.<br>- Chính sách kiểm tra trực tiếp byte chuẩn hóa và danh sách người duyệt độc lập.<br>- Nhận chữ ký phân tán thực từ Tide ORKs.<br>- Ngân hàng độc lập xác minh thành công bằng public key (VVK) của Realm. | - Đã có contract candidate `forseti/LeashPaymentPolicy.cs`; Raziel sandbox/structural scan pass nhưng **chưa compile hoặc deploy trên Tide**.<br>- Adapter `TideForsetiSigner.mjs` tuân thủ nguyên tắc bảo mật: **cố ý fail-closed** (`REAL_TIDE_NOT_WIRED`), tuyệt đối không dùng private key cục bộ để giả danh Tide. | Việc deploy contract tùy chỉnh lên mạng thử nghiệm bắt buộc phải có sự can thiệp/phê duyệt từ Tide team; chưa có VVK thực tế từ realm. | **BLOCKED (External)** |
| **G5: Kịch bản đối kháng trên Tide thật** | - T1–T5 bắt buộc pass trên real Tide path; thực thi T6–T8 và các hardening scenarios liên quan.<br>- Ghi nhận trace log, mã băm, phản hồi từ chối ký từ Tide ORKs. | - Đã tự động hóa T1–T18 ở tầng MOCK, gồm prompt injection, bypass, approval proof, tamper, replay/concurrency, expiry, policy/key substitution và duplicate invoice. | Không thể chạy Tide-specific cases trên luồng thật chừng nào G4 chưa được mở khóa. | **BLOCKED (Depends on G4)** |
| **G6: Đóng gói nộp bài & Video** | - Kho mã nguồn public trên GitHub.<br>- README đúng 5 prompt.<br>- Video MP4 2 phút.<br>- Nộp qua Google Form trước deadline. | - Đã hoàn thiện kịch bản chi tiết video 120s trong `docs/DEMO_STORYBOARD.md`.<br>- Đã tạo bản trình bày toàn diện `docs/CHALLENGE_WRITEUP.md`.<br>- Đã có kịch bản đóng gói `scripts/pack-evidence.py`. | Chưa quay video thực tế. Nếu G4/G5 không pass thì phải báo NO-GO hoặc trình bày rõ mock architectural demo; không được gọi là TideCloak-integrated working prototype. | **PENDING** |

---

## 3. Bảng mock → real: có cần đổi không và tại sao?

Ở đây “đổi thành real” nghĩa là thay **security control/evidence** bằng artifact
Tide thật. Nó không có nghĩa đưa dữ liệu tài chính hoặc PII thật vào hệ thống.

| Thành phần/bước | Đang mock/synthetic như thế nào? | Có cần đổi thành real? | Target khi submit | Tại sao? |
|---|---|:---:|---|---|
| Invoice input | Fixture `.txt`, invoice ID và nội dung giả | **KHÔNG** | Tiếp tục dùng synthetic invoices | Official prototype không yêu cầu dữ liệu khách hàng; dùng thật chỉ tăng PII/risk, không chứng minh Tide tốt hơn |
| Payee/account/amount | Fake vendor và account; simulated USD minor units | **KHÔNG** | Giữ fake identifiers và không chuyển tiền | Challenge cần prototype, không cần banking integration hoặc real money |
| AI proposer | Deterministic parser; compromised behavior được bật trong test | **KHÔNG**, trừ khi claim LLM thật | Giữ deterministic proposer và ghi T1 là simulated attack-following proposal | Core claim là least authority sau proposal sai, không phải khả năng phát hiện prompt injection của model |
| Prompt-injection fixture | Nội dung attack viết sẵn | **KHÔNG** | Giữ fixture để demo proposal độc hại | Cần input tái lập; không được gọi là real-LLM compromise nếu không chạy LLM thật |
| Vendor registry | `fixtures/vendors.json` do backend/local code đọc | **MỘT PHẦN** | Fake vendor data vẫn giữ; allowlist/parameters phải được deployed policy hoặc governance bảo vệ | Giá trị không cần thật, nhưng authority bảo vệ registry phải thật nếu claim backend không thể đổi policy |
| Canonical payment bytes | Local fixed-order JSON và test vector | **MỘT PHẦN** | Giữ format nếu live Tide proof cho thấy ORKs ký đúng bytes; nếu SDK ký envelope khác thì adapter/verifier phải cập nhật | Local hash không chứng minh Tide signing scope |
| Executor identity | Backend/mock string | **CÓ** | TideCloak-enrolled executor và runtime-verifiable identity/role | Backend-supplied ID không phải authentication proof |
| Approver identities | Mock identities `finance-a`/`finance-b` với local test credentials | **CÓ** | Real enrolled approvers với distinct Tide identities/roles | Local identities/secrets đều do cùng codebase kiểm soát nên chưa độc lập khỏi backend |
| Approval evidence | Local HMAC proof gắn approver, role, payment hash và expiry; raw name bị reject trong strict mock flow | **CÓ** | Transaction-bound Tide approval/doken flow | HMAC cải thiện mock semantics nhưng key vẫn thuộc local app; chưa chứng minh người thật/Tide identity đã approve |
| Payment policy | `src/policy.mjs` chạy cùng backend | **CÓ cho real path** | Deployed Forseti policy đánh giá actual signed request | Backend có thể bỏ qua local function; challenge cần TideCloak-enabled trust control |
| Forseti contract | C# candidate, structural scan only | **CÓ** | Compile + Tide deployment + immutable ID/source hash/parameters | Source file không phải running policy và không phải G4 evidence |
| Signing authority | Local `MockSigner` Ed25519 | **CÓ** | Policy-governed Tide ORK signature; real mode không mock fallback | Local private key trong app không chứng minh distributed/independent authority |
| Signing public key | Local mock public key | **CÓ** | Realm Tide VVK/key ID lấy từ documented source và pin out-of-band | Bank cần xác minh Tide signature, không phải chữ ký do backend tự tạo |
| Signature envelope values | `MOCK_ONLY`, mock key/policy IDs | **CÓ** | `REAL_TIDE` với format/key ID/deployed contract ID đã quan sát thật | Metadata giả không thể làm bằng chứng integration |
| Mock Bank service | Local Node receiver, không phải ngân hàng | **KHÔNG** | Tiếp tục là simulated independent receiver | Đề bài không yêu cầu ngân hàng thật; independence và verification mới là điều cần chứng minh |
| Verification bên trong bank | Verify local Ed25519 signature | **CÓ** | Verify real Tide signature trên exact scope bằng pinned VVK | Đây là bằng chứng AI/backend không thể tự tạo bank-valid instruction |
| Replay ledger | File-backed local store | **KHÔNG cho PoC**, nhưng phải retest | Có thể giữ PoC store; chạy tamper/replay với real signed instruction | Production DB không phải yêu cầu challenge; real signature/replay behavior mới cần evidence |
| Payment execution | Trả `EXECUTED` nhưng không chuyển tiền | **KHÔNG** | Tiếp tục simulated execution | Không real money là scope/safety requirement của dự án |
| API/UI main flow | `/api/mock-demo`, mock buttons/results | **CÓ cho video chính** | Tide login/approval/signing path hoặc trace real có thể tái lập; mock UI watermark rõ | Judges cần thấy working TideCloak integration, không chỉ backend simulation |
| T1–T18 tests | Chạy bằng mock policy/signer/key/local approval credentials | **CÓ cho Tide claims** | Giữ mock regression và bổ sung real suite; T1–T5 bắt buộc pass real | Mock green không chứng minh Forseti/ORKs enforce policy |
| QEA/admin governance | Chỉ có design/local caller override test | **CÓ nếu claim admin protection** | Real app-realm QEA trace, master-realm limitation ghi rõ | Không được nói rogue admin bị chặn nếu chưa có live governance evidence |
| Evidence | Local hashes/test output | **CÓ** | Real signature hash, payload hash, contract/key IDs, redacted approvals và allowed/denied traces | Official/judging claim phải dựa trên working prototype, không dựa trên kế hoạch |
| Video | Chưa có; storyboard/mock UI | **CÓ** | MP4 2 phút dưới 100 MB quay real path; mock chỉ xuất hiện với nhãn rõ | Đây là official submission artifact |

### Dữ liệu Tide thật nào được dùng nhưng không commit?

Các giá trị sau chỉ được inject/runtime hoặc redact trong evidence:

- Licence email và human identity.
- Password, session cookie, access token và doken.
- Admin credential và browser session.
- Bất kỳ private signing/key material nào.

Repo chỉ nên chứa non-secret realm/client identifiers nếu được phép công bố,
deployed contract ID, public VVK/fingerprint, package versions, hashes, redacted
traces và reproduction instructions.

---

## 4. Tổng kết: Bức tranh hiện tại đang ở đâu?

1. **Phần lõi kiến trúc, quy tắc bảo mật và kịch bản đối kháng (Software & Security Architecture):**
   - **Local mock regression đã hoàn chỉnh theo phạm vi PoC.** Vertical slice mô phỏng từ invoice độc hại, canonical bytes, policy 1–2 approvers, replay ledger đến independent mock signature verification. Kết quả này không thay thế G4/G5 Tide evidence.
   - Không có bất kỳ "lời nói dối kỹ thuật" nào trong mã nguồn: MOCK được dán nhãn rõ ràng là MOCK; REAL được giữ ở cơ chế fail-closed an toàn.

2. **Phần phụ thuộc bên ngoài (External Tide & Contest Logistics):**
   - Các điểm nghẽn còn lại gồm: Tide licence/realm và browser enrollment; Tide Foundation deploy C# Forseti policy; real G4/G5 evidence; team eligibility, video và submission logistics.
   - Về mặt dự thi: Cần xác minh tư cách RMIT. Nếu chưa có real Tide integration thì không được mô tả mock mode là một TideCloak-integrated working prototype.
