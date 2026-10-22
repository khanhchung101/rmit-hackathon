# Bảng ánh xạ: Hiện trạng thực tế vs. Kết quả cần đạt (Tide UNLOCKED Challenge)

**Thời điểm cập nhật:** 2026-10-22  
**Dự án:** Leash — Phân định thẩm quyền ký duyệt mật mã cho hóa đơn do AI xử lý  
**Trạng thái tổng thể:** MOCK BASELINE & VERTICAL SLICE HOÀN TẤT (20/20 test pass, 8/8 security pass); REAL TIDE TẮC TẠI EXTERNAL (G3/G4).

---

## 1. Bảng đối chiếu tổng quan theo Acceptance Gates (G1 → G6)

| Cổng (Gate) | Mục tiêu / Tiêu chí cần đạt (Target) | Hiện trạng thực tế đã làm (Current Status) | Khoảng cách & Rào cản (Gap / Blocker) | Đánh giá |
|---|---|---|---|:---:|
| **G1: Điều kiện dự thi & Quy chế** | - Xác minh cổng nộp mở.<br>- Nắm rõ 5 prompt README, giới hạn từ ($\le 300$ từ), video MP4 $\le 2$ phút ($< 100$MB).<br>- Team đủ điều kiện (RMIT / Challenge 2). | - Đã quét trực tiếp cấu hình trang chính thức và form nộp (vẫn mở tại audit).<br>- Đã soạn sẵn 5 prompt chuẩn trong `docs/README_5_PROMPTS.md`.<br>- Deadline 18:00 ICT 22/10/2026 đã ghi nhận. | Chưa có email/thông tin định danh RMIT từ người dùng để xác nhận tính hợp lệ của đội thi. | **PARTIAL** |
| **G2: Local Baseline & Mock Security** | - Môi trường Node >=20, Docker, Git.<br>- Chạy đầy đủ kịch bản kiểm thử cục bộ.<br>- Phân định rõ ràng MOCK vs REAL, không dùng phím tắt mật mã giả mạo. | - Node 20.19.6, Docker 29.6.2.<br>- **20/20 unit test PASS**, 7/7 invoice fixtures PASS.<br>- Toàn bộ 8 kịch bản bảo mật **T1–T8 PASS** ở chế độ MOCK. | Không có. Đã hoàn thành vượt chỉ tiêu ban đầu (12 test $\rightarrow$ 20 test). | **PASS** |
| **G3: Môi trường TideCloak** | - Thiết lập TideCloak realm độc lập (non-master).<br>- Cấu hình Client, Roles (agent/executor, finance-a, finance-b).<br>- Đăng nhập người dùng qua trình duyệt, cấp phát doken thực tế. | - Docker và Docker Compose đã sẵn sàng trên máy.<br>- Đã audit tài liệu SDK và cơ chế Raziel MCP. | Cần thông tin giấy phép Tide (email người dùng), chấp nhận điều khoản và thao tác đăng nhập trình duyệt thật từ phía người dùng. | **BLOCKED (External)** |
| **G4: Hợp đồng Forseti & Ký phân tán Tide** | - Biên dịch và triển khai C# contract `LeashPaymentPolicy.cs` lên testnet Tide.<br>- Chính sách kiểm tra trực tiếp byte chuẩn hóa và danh sách người duyệt độc lập.<br>- Nhận chữ ký phân tán thực từ Tide ORKs.<br>- Ngân hàng độc lập xác minh thành công bằng public key (VVK) của Realm. | - Đã có contract candidate `forseti/LeashPaymentPolicy.cs`; Raziel sandbox/structural scan pass nhưng **chưa compile hoặc deploy trên Tide**.<br>- Adapter `TideForsetiSigner.mjs` tuân thủ nguyên tắc bảo mật: **cố ý fail-closed** (`REAL_TIDE_NOT_WIRED`), tuyệt đối không dùng private key cục bộ để giả danh Tide. | Việc deploy contract tùy chỉnh lên mạng thử nghiệm bắt buộc phải có sự can thiệp/phê duyệt từ Tide team; chưa có VVK thực tế từ realm. | **BLOCKED (External)** |
| **G5: Kịch bản đối kháng trên Tide thật (T1–T8)** | - Thực thi các cuộc tấn công T1–T8 trực tiếp trên luồng ký Tide thật.<br>- Ghi nhận trace log, mã băm, phản hồi từ chối ký từ Tide ORKs. | - Đã triển khai và tự động hóa toàn bộ logic T1–T8 ở tầng mô phỏng MOCK (ngăn chặn prompt injection, bypass ngân hàng, thiếu người duyệt, sửa đổi byte, replay nonce, can thiệp policy, sai domain/key, tráo keyId). | Không thể chạy trên luồng Tide thật chừng nào G4 chưa được mở khóa. | **BLOCKED (Depends on G4)** |
| **G6: Đóng gói nộp bài & Video** | - Kho mã nguồn public trên GitHub.<br>- README đúng 5 prompt.<br>- Video MP4 2 phút.<br>- Nộp qua Google Form trước deadline. | - Đã hoàn thiện kịch bản chi tiết video 120s trong `docs/DEMO_STORYBOARD.md`.<br>- Đã tạo bản trình bày toàn diện `docs/CHALLENGE_WRITEUP.md`.<br>- Đã có kịch bản đóng gói `scripts/pack-evidence.py`. | Chưa quay video thực tế. Nếu G4/G5 không pass thì phải báo NO-GO hoặc trình bày rõ mock architectural demo; không được gọi là TideCloak-integrated working prototype. | **PENDING** |

---

## 2. Bảng ánh xạ theo các thành phần chức năng kỹ thuật

| Thành phần kỹ thuật | Yêu cầu nghiệp vụ / Bảo mật đề bài | Hiện trạng trong Codebase | Tệp mã nguồn liên quan | Đánh giá |
|---|---|---|---|:---:|
| **AI Invoice Extraction** | Đọc dữ liệu hóa đơn nhưng không cấp quyền ký hoặc tự tạo thanh toán. | Đã triển khai `propose()` với schema validator nghiêm ngặt `validateProposal`; injected authority fields bị từ chối trong local tests. Hosted/local LLM thật không bắt buộc và chưa được đánh giá. | `src/parser.mjs`, `src/agent.mjs`, `model/schema/payment-proposal.schema.json` | **LOCAL BASELINE PASS** |
| **Canonical Byte Protocol** | Giao thức mã hóa byte chuẩn hóa bất biến thứ tự thuộc tính, gắn liền `version`, `domain`, `expiry`. | Mã hóa 9 trường cố định, loại bỏ float, kiểm tra hạn dùng, kiểm tra băm SHA-256 cố định vector test. Chưa chứng minh đây là exact Tide signing scope. | `src/canonical.mjs`, `evidence/mock-signature-protocol-vector.json` | **LOCAL MOCK PASS** |
| **Bank Envelope & Key Pinning** | Ngân hàng xác minh độc lập chữ ký đối với byte canonical; chống tráo đổi khóa và chính sách (T8). | `MockBank.execute` hỗ trợ envelope và pin `keyId`/`policyId`, nhưng hiện mới xác minh chữ ký mock; chưa có Tide VVK. | `src/bank.mjs`, `model/schema/bank-execution-v1.schema.json` | **LOCAL MOCK PASS** |
| **Durable Replay Prevention** | Ngăn chặn thực thi lại giao dịch (Replay Nonce) xuyên suốt các lần restart và môi trường đa tiến trình. | Tích hợp file-backed ledger với khóa atomic lockfile POSIX; đã test persistence cục bộ. Đây là PoC store, chưa phải production database. | `src/bank.mjs`, `tests/durableBank.test.mjs` | **LOCAL MOCK PASS** |
| **Policy Immutability & Dual Control** | Thanh toán giá trị thấp cần 1 người duyệt; giá trị cao cần $\ge 2$ người duyệt khác nhau; không cho phép tự duyệt; chính sách không thể bị caller ghi đè. | `evaluateMockPolicy` mô phỏng vendor registry/hạn mức cố định và chặn caller override. Real doken, approver role và QEA vẫn chưa được chứng minh. | `src/policy.mjs`, `tests/t3.test.mjs`, `tests/t6.test.mjs` | **LOCAL MOCK PASS** |
| **Tide Distributed Signing** | Chữ ký Ed25519 được phân tán và bảo vệ bởi Tide ORKs, độc lập với backend. | Thiết kế adapter `TideForsetiSigner` cố ý ném lỗi `REAL_TIDE_NOT_WIRED`. Tuyệt đối không gian lận bằng khóa bí mật cục bộ. | `src/signing/tideForsetiSigner.mjs`, `scripts/tide-probe.mjs` | **BLOCKED (Fail-Closed an toàn)** |
| **Web Demo & Test Runner** | Giao diện trực quan cho phép giám khảo kiểm tra kịch bản tấn công và xem phản hồi. | Web server chạy tại cổng 8787 với 2 nút cho mock lifecycle và T1–T8; giao diện phải tiếp tục mang nhãn mock cho tới khi real mode có bằng chứng. | `src/server.mjs`, `public/index.html`, `src/demo.mjs` | **LOCAL MOCK PASS** |

---

## 3. Tổng kết: Bức tranh hiện tại đang ở đâu?

1. **Phần lõi kiến trúc, quy tắc bảo mật và kịch bản đối kháng (Software & Security Architecture):**
   - **Local mock regression đã hoàn chỉnh theo phạm vi PoC.** Vertical slice mô phỏng từ invoice độc hại, canonical bytes, policy 1–2 approvers, replay ledger đến independent mock signature verification. Kết quả này không thay thế G4/G5 Tide evidence.
   - Không có bất kỳ "lời nói dối kỹ thuật" nào trong mã nguồn: MOCK được dán nhãn rõ ràng là MOCK; REAL được giữ ở cơ chế fail-closed an toàn.

2. **Phần phụ thuộc bên ngoài (External Tide & Contest Logistics):**
   - Các điểm nghẽn còn lại gồm: Tide licence/realm và browser enrollment; Tide Foundation deploy C# Forseti policy; real G4/G5 evidence; team eligibility, video và submission logistics.
   - Về mặt dự thi: Cần xác minh tư cách RMIT. Nếu chưa có real Tide integration thì không được mô tả mock mode là một TideCloak-integrated working prototype.
