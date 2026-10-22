# Bảng Checklist Thực Thi Nhiệm Vụ (Execution Checklist)

**Cập nhật lần cuối:** 2026-10-22  
**Mục tiêu:** Hoàn thiện 100% hệ thống đáp ứng đề bài Tide UNLOCKED Challenge 2 trước khi đóng gói nộp bài.

---

## 1. Các đầu việc nội bộ đã thực hiện hoàn tất (Completed Actionable Tasks)

- [x] **Task 1 (Pipeline Orchestrator — `src/pipeline.mjs`)**:
  - Xây dựng luồng điều phối 5 giai đoạn: Invoice $\rightarrow$ Proposal (Schema check) $\rightarrow$ Canonical bytes $\rightarrow$ Policy Gate / Tide Signer $\rightarrow$ Bank Envelope \& Durable Nonce DB.
  - Trả về telemetry/trace chi tiết cho từng giai đoạn kiểm toán.
  - Viết bài kiểm thử `tests/pipeline.test.mjs` (5/5 PASS).

- [x] **Task 2 (Real Tide Signer Scaffolding — `src/signing/tideForsetiSigner.mjs`)**:
  - Cấu trúc hóa adapter thật: Đọc biến môi trường (`TIDE_REALM_URL`, `TIDE_POLICY_ID`, `TIDE_AUTH_TOKEN`, `TIDE_VVK`).
  - Đóng gói request dạng `DynamicApprovedCustom` theo chuẩn giao thức Tide Forseti.
  - Đảm bảo fail-closed an toàn với mã `REAL_TIDE_NOT_WIRED` khi thiếu cấu hình (không fallback sang mock).

- [x] **Task 3 (Interactive Test Harness Web Dashboard — `public/index.html` & `src/server.mjs`)**:
  - Giao diện web trực quan tại cổng 8787: Cho phép chọn 7 invoice mẫu hoặc nhập tùy ý.
  - Nút gạt (toggle) mô phỏng Prompt Injection.
  - Lựa chọn người duyệt (1 approver, 2 distinct approvers, self-approval).
  - Hiển thị trực quan 5 ranh giới kiểm soát bảo mật, phục vụ quay video 120 giây.

- [x] **Task 4 (Official README với 5 Prompts — `README.md`)**:
  - Đưa 1 câu mô tả cốt lõi (*one-sentence description*) lên đầu.
  - Trả lời đúng 5 prompt chính thức của ban tổ chức trong 235 từ ($\le 300$ từ) theo đúng barem chấm điểm.
  - Cập nhật số liệu kiểm thử mới nhất: **25 unit tests PASS**, **8 kịch bản T1–T8 PASS**.
  - Tách riêng mục Setup & Run instructions và Architecture.

- [x] **Task 5 (Bảo mật & Đóng gói Bằng chứng — `L-022`)**:
  - Quét bí mật không để lọt khóa bí mật / token trong repository.
  - Chạy `python3 scripts/pack-evidence.py` sinh gói `build/leash-evidence.zip` (40 files).
  - Kiểm tra đối chiếu `docs/SUBMISSION_CHECKLIST.md`.

---

## 2. Các đầu việc phụ thuộc bên ngoài (External Blockers — Chờ thông tin từ người dùng / Tide Team)

- [ ] **G3: Khởi tạo non-master Tide Realm & User Doken** (Cần email giấy phép Tide và đăng nhập trình duyệt thật).
- [ ] **G4: Deploy C# Contract `LeashPaymentPolicy.cs` lên Testnet của Tide** (Cần Tide Foundation hỗ trợ deploy).
- [ ] **G4: Xuất khóa công khai Realm VVK thật và chữ ký phân tán từ Tide ORKs**.
- [ ] **G5: Thực thi kịch bản đối kháng T1–T8 trên mạng Tide thật**.
- [ ] **Video: Quay video demo 120s theo storyboard** (Người dùng ghi hình màn hình).

---

## 3. Các đầu việc ĐÃ HOÀN THÀNH (Completed Tasks)

- [x] L-001: Quét và xác minh điều kiện cổng nộp bài chính thức.
- [x] L-002: Khóa 5 prompt chính thức và tiêu chuẩn bài nộp.
- [x] L-004: Khảo sát SDK Tide và giao thức Raziel MCP.
- [x] L-005: Khóa dữ liệu 7 mẫu hóa đơn tổng hợp USD cents và registry vendor.
- [x] L-006: Khóa quyết định mô hình xác định và bộ kiểm thử injection.
- [x] L-009: Nghiên cứu đối thủ cạnh tranh và khẳng định tính khác biệt (Novelty).
- [x] L-010: Xây dựng Threat Model STRIDE và ma trận T1–T8.
- [x] L-011: Khóa giao thức 9 trường canonical và schema envelope ngân hàng.
- [x] L-012: Hoàn thành local mock baseline ban đầu.
- [x] L-015: Triển khai kiểm tra ghim khóa (`pinnedKeyId`) và ghim chính sách (`pinnedPolicyId`) tại Ngân hàng.
- [x] L-016: Triển khai bộ lưu trữ nonce bền vững (`MockBank` durablePath) với khóa atomic lockfile POSIX chống replay.
- [x] L-017: Bổ sung bộ lọc schema AI proposal chống chèn trường quyền lực.
- [x] L-019: Tự động hóa toàn diện 8 kịch bản bảo mật T1–T8.
- [x] L-023: Xây dựng kế hoạch thực thi `docs/EXECUTION_PLAN.md`.
- [x] L-024: Viết bản thuyết minh toàn diện `docs/CHALLENGE_WRITEUP.md`.
- [x] L-025: Xây dựng lộ trình 10 bước Cutover fail-closed MOCK sang REAL_TIDE.
