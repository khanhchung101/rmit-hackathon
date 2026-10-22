# BÁO CÁO TỔNG HỢP VÀ XÁC MINH TOÀN DIỆN DỰ ÁN LEASH
*(Leash — Verifiable Payment Authorization for AI-Prepared Invoices)*

**Thời điểm lập:** 2026-10-22  
**Mục tiêu tài liệu:** Cung cấp một tệp tài liệu duy nhất tổng hợp toàn bộ kết quả triển khai, cấu trúc mã nguồn, bằng chứng kiểm thử và hiện trạng kỹ thuật để người dùng / giám khảo đối soát và xác minh.

---

## 1. THÔNG TIN CHUNG VÀ TUYÊN BỐ CỐT LÕI

- **Đề bài:** Tide UNLOCKED Challenge 2 — Cybersecurity / Least Authority for AI Agents.
- **Repository GitHub:** [`https://github.com/khanhchung101/rmit-hackathon.git`](https://github.com/khanhchung101/rmit-hackathon.git)
- **One-Sentence Description:**  
  > *"Leash allows an AI agent to prepare payments without giving the AI—or its application backend—the cryptographic authority to execute them."*
- **Nguyên lý hoạt động 3 bên:**
  1. **AI Proposes:** AI đọc văn bản hóa đơn nhưng chỉ tạo đề xuất dữ liệu thô (không có chữ ký, không có quyền lực).
  2. **Tide Authorizes:** TideCloak xác thực người duyệt, Forseti Engine kiểm tra chính sách duyệt độc lập ngoài backend trước khi các node ORKs ký phân tán.
  3. **Bank Independently Verifies:** Ngân hàng xác minh độc lập chữ ký trên đúng 9 trường byte canonical và chống Replay Nonce bằng cơ chế lưu trữ bền vững.

---

## 2. BẢNG TỔNG HỢP TIẾN ĐỘ THEO 6 CỔNG NGHIỆM THU (GATES G1 $\rightarrow$ G6)

| Cổng (Gate) | Mục tiêu theo Plan | Kết quả thực tế đã đạt | Trạng thái |
|:---:|---|---|:---:|
| **G1** | Thể lệ & Đề bài chính thức | Quét trực tiếp trang web và Google Form (vẫn mở). Khóa 5 prompt chính thức ($\le 300$ từ), deadline 18:00 ICT 22/10/2026. | **PARTIAL**<br>*(Chờ thông tin team RMIT)* |
| **G2** | Local Baseline & Unit Test | Đạt **25/25 unit tests**, 7/7 hóa đơn mẫu, **8/8 kịch bản bảo mật T1–T8** chạy tự động. Không dùng phím tắt mật mã giả danh. | **PASS (100%)** |
| **G3** | Môi trường TideCloak | Docker sẵn sàng; audit đầy đủ SDK `@tidecloak/js` và Raziel MCP 1.9.33. Cần email bản quyền Tide từ người dùng để sinh Realm thật. | **BLOCKED (External)** |
| **G4** | Hợp đồng C# & Ký phân tán | Hợp đồng C# `forseti/LeashPaymentPolicy.cs` đã viết xong (pass Raziel scanner); adapter `TideForsetiSigner` giữ fail-closed an toàn (`REAL_TIDE_NOT_WIRED`), chờ Tide deploy testnet. | **BLOCKED (External)** |
| **G5** | Kịch bản đối kháng T1–T8 | Đã hoàn thành 100% kịch bản T1–T8 ở tầng mô phỏng MOCK (ngăn chặn prompt injection, bypass ngân hàng, thiếu người duyệt, sửa byte, replay nonce, tráo keyId). | **BLOCKED trên Tide thật**<br>*(PASS trên Mock)* |
| **G6** | Đóng gói nộp bài & Video | README đã nhúng 5 prompt chuẩn; kịch bản video 120s sẵn sàng; gói bằng chứng `build/leash-evidence.zip` (40 files) đã tạo sạch. | **READY** |

---

## 3. TOÀN BỘ CẤU TRÚC MÃ NGUỒN VÀ VAI TRÒ TỪNG TỆP

```
/home/chung/Desktop/leash-kit/
├── README.md                      # Tệp giới thiệu chính thức: 1 câu tóm tắt + 5 Prompts đề bài (<300 từ)
├── package.json                   # Cấu hình dự án Node 20+, scripts kiểm thử và demo
├── STATUS.json                    # Báo cáo trạng thái máy đọc (Machine-readable audit ledger)
├── PROJECT_STATUS.md              # Báo cáo tóm tắt trạng thái kỹ thuật dành cho reviewer
├── PLAN.md                        # Kế hoạch thực thi 8 bước từ Step 0 đến Step 8
│
├── src/                           # MÃ NGUỒN LÕI HỆ THỐNG
│   ├── pipeline.mjs               # [MỚI] Bộ điều phối thanh toán 5 giai đoạn khép kín (Orchestrator)
│   ├── parser.mjs                 # AI parser đọc hóa đơn + bộ schema validator loại bỏ trường chèn quyền hạn
│   ├── agent.mjs                  # Lớp agent đề xuất thanh toán (hỗ trợ mô phỏng Prompt Injection)
│   ├── canonical.mjs              # Giao thức mã hóa byte chuẩn hóa bất biến 9 trường (Deterministic JSON)
│   ├── policy.mjs                 # Chính sách xét duyệt độc lập (ngưỡng 1 người duyệt, 2 người duyệt, cấm tự duyệt)
│   ├── bank.mjs                   # Ngân hàng độc lập: Xác thực envelope, ghim keyId/policyId, chống replay bằng lockfile
│   ├── demo.mjs                   # Mã kịch bản chạy demo vòng đời thanh toán qua CLI
│   ├── server.mjs                 # Máy chủ HTTP cổng 8787 cung cấp API và giao diện Web UI
│   └── signing/
│       ├── mockSigner.mjs         # Bộ ký Ed25519 cục bộ (CHỈ dùng cho kiểm thử mô phỏng MOCK)
│       └── tideForsetiSigner.mjs  # Adapter kết nối Tide thật (đóng gói RPC chuẩn, fail-closed an toàn)
│
├── forseti/                       # HỢP ĐỒNG C# CHO TIDE FORSETI ENGINE
│   ├── LeashPaymentPolicy.cs      # Mã nguồn hợp đồng C# 262 dòng, xác thực byte canonical và người duyệt
│   └── LeashPaymentPolicy.intent.cs # Đặc tả ý định của chính sách
│
├── tests/                         # BỘ KIỂM THỬ TỰ ĐỘNG (25 TESTS PASS)
│   ├── pipeline.test.mjs          # Kiểm thử luồng tích hợp 5 giai đoạn (5 tests)
│   ├── durableBank.test.mjs       # Kiểm thử chống replay nonce qua restart và ghim envelope T8 (2 tests)
│   ├── proposal.test.mjs          # Kiểm thử schema AI proposal và chặn prompt injection (4 tests)
│   ├── t1.test.mjs                # T1: AI bị prompt injection đổi người nhận tiền -> Chính sách từ chối
│   ├── t2.test.mjs                # T2: Backend gọi trực tiếp ngân hàng không chữ ký -> Ngân hàng từ chối
│   ├── t3.test.mjs                # T3: Hóa đơn giá trị cao thiếu người duyệt / tự duyệt -> Từ chối
│   ├── t4.test.mjs                # T4: Sửa đổi số tiền / người nhận sau khi ký -> Ngân hàng từ chối chữ ký sai
│   ├── t5.test.mjs                # T5: Phát lại giao dịch đã thực hiện -> Ngân hàng từ chối trùng nonce
│   ├── t6.test.mjs                # T6: Người gọi cố tình sửa hạn mức chính sách -> Bị từ chối
│   ├── negative.test.mjs          # T7 & T8: Sai khóa, sai domain, adapter Tide thật fail-closed an toàn
│   ├── policy.test.mjs            # Kiểm thử chi tiết các quy tắc của chính sách duyệt
│   └── protocol.test.mjs          # Kiểm thử tính cố định của vector băm byte canonical
│
├── public/                        # GIAO DIỆN WEB DEMO
│   └── index.html                 # Buồng lái kiểm thử trực quan (Interactive Test Harness) tại cổng 8787
│
├── fixtures/                      # DỮ LIỆU MẪU TỔNG HỢP (SYNTHETIC ONLY)
│   ├── vendors.json               # Danh bạ nhà cung cấp được tin cậy (Allowlist)
│   ├── cases.json                 # Danh sách ca kiểm thử hóa đơn
│   └── invoices/                  # 7 mẫu hóa đơn: hợp lệ nhỏ/lớn, prompt injection, sai tiền tệ, lỗi định dạng
│
├── model/schema/                  # CÁC SCHEMA JSON KHÓA CHẶT HỢP ĐỒNG DỮ LIỆU
│   ├── payment-proposal.schema.json   # Schema đề xuất từ AI (ngăn chặn chèn trường quyền hạn)
│   ├── payment-instruction-v1.schema.json # Schema 9 trường byte canonical
│   └── bank-execution-v1.schema.json  # Schema bao bọc ủy quyền giao dịch ngân hàng
│
├── tasks/                         # QUẢN LÝ TIẾN ĐỘ VÀ CHECKLIST
│   ├── EXECUTION_CHECKLIST.md     # Bảng checklist chi tiết từng đầu việc
│   └── backlog.csv                # Bảng theo dõi 27 task ID nguyên tử
│
└── docs/                          # TÀI LIỆU HỆ THỐNG
    ├── CHALLENGE_WRITEUP.md       # Bản thuyết minh đầy đủ toàn diện của dự án
    ├── EXECUTION_PLAN.md          # Kế hoạch vận hành và quy trình Cutover 10 bước sang Real Tide
    ├── DEMO_STORYBOARD.md         # Kịch bản chi tiết quay video demo 120 giây
    ├── THREAT_MODEL.md            # Mô hình đe dọa STRIDE
    └── DECISION_LOG.md            # Nhật ký các quyết định kỹ thuật
```

---

## 4. CHI TIẾT 8 KỊCH BẢN BẢO MẬT ĐỐI KHÁNG (T1–T8)

| Kịch bản | Cuộc tấn công / Tình huống | Hành vi mong đợi & Kết quả kiểm thử thực tế |
|:---:|---|---|
| **T1** | Hóa đơn độc hại chứa Prompt Injection chỉ thị AI đổi người nhận thành `evil-vendor`. | **PASS (MOCK):** Đề xuất bị lừa nhưng lớp chính sách từ chối cấp chữ ký với mã `POLICY_DENIED: UNTRUSTED_PAYEE`. |
| **T2** | Backend bị chiếm quyền điều khiển, cố tình gọi thẳng API ngân hàng mà không qua ký duyệt. | **PASS (MOCK):** Ngân hàng độc lập kiểm tra thiếu chữ ký và từ chối xử lý với mã `MISSING_SIGNATURE`. |
| **T3** | Hóa đơn giá trị cao ($\ge \$1,000$) chỉ có 1 người duyệt, trùng người duyệt, hoặc người thực thi tự duyệt. | **PASS (MOCK):** Chính sách từ chối cấp chữ ký (`APPROVALS_REQUIRED`, `DUPLICATE_APPROVER`, `SELF_APPROVAL`). Chỉ cho phép khi có 2 người duyệt khác nhau. |
| **T4** | Kẻ tấn công sửa đổi số tiền (vd: nâng lên $999,999) hoặc sửa số tài khoản sau khi đã ký. | **PASS (MOCK):** Ngân hàng băm lại đúng 9 trường byte canonical, phát hiện chữ ký sai lệch và từ chối với mã `BAD_SIGNATURE`. |
| **T5** | Kẻ tấn công gửi lại (replay) một giao dịch hợp lệ đã từng thực hiện trước đó. | **PASS (MOCK):** Bộ lưu trữ nonce bền vững của ngân hàng phát hiện nonce đã tồn tại và từ chối với mã `REPLAY_NONCE` (kể cả sau khi restart ngân hàng). |
| **T6** | Người gọi giao dịch cố tình truyền tham số can thiệp để hạ thấp hạn mức duyệt tiền. | **PASS (MOCK):** Chính sách hoạt động trên cấu hình bất biến, bỏ qua/từ chối mọi nỗ lực can thiệp hạn mức. |
| **T7** | Chữ ký bị ký sai domain ứng dụng, sai khóa ngân hàng hoặc giao dịch đã hết hạn. | **PASS (MOCK):** Ngân hàng từ chối giao dịch với mã `INVALID_PAYLOAD` hoặc `BAD_SIGNATURE`. |
| **T8** | Backend cố tình hoán đổi `keyId` hoặc `policyId` trong envelope; kiểm tra adapter Tide thật. | **PASS (MOCK):** Ngân hàng từ chối với `UNTRUSTED_KEY_ID` / `UNTRUSTED_POLICY_ID`; adapter Tide thật fail-closed an toàn với `REAL_TIDE_NOT_WIRED`. |

---

## 5. HƯỚNG DẪN XÁC MINH CỤC BỘ TRÊN MÁY (VERIFICATION COMMANDS)

Bạn có thể chạy các lệnh sau trong terminal để kiểm chứng tính toàn vẹn của dự án:

```bash
# 1. Kiểm tra môi trường tiên quyết (Node >=20, Docker, Git)
npm run preflight

# 2. Chạy toàn bộ 25 bài kiểm thử unit tests (Kết quả: 25 pass, 0 fail)
npm test

# 3. Chạy toàn bộ 8 kịch bản tấn công đối kháng bảo mật T1–T8
npm run security

# 4. Kiểm tra tính hợp lệ của 7 mẫu hóa đơn tổng hợp
npm run validate:fixtures

# 5. Kiểm tra tính bất biến của hợp đồng byte canonical 9 trường
npm run validate:contracts

# 6. Kiểm tra cơ chế fail-closed an toàn của Tide thật (Thoát mã 3 - Đúng thiết kế)
npm run tide:probe

# 7. Khởi động Web Dashboard tương tác trực quan
npm run server
# Sau đó mở trình duyệt tại: http://localhost:8787
```

---

## 6. GIẢI TRÌNH VỀ VIỆC TÍCH HỢP TIDECLOAK & RÀO CẢN DEPLOY THỰC TẾ

- **Đã làm xong:** Hợp đồng C# [`forseti/LeashPaymentPolicy.cs`](file:///home/chung/Desktop/leash-kit/forseti/LeashPaymentPolicy.cs) và adapter kết nối RPC [`src/signing/tideForsetiSigner.mjs`](file:///home/chung/Desktop/leash-kit/src/signing/tideForsetiSigner.mjs) đã được viết sẵn sàng.
- **Rào cản triển khai thực tế (External Deployment Barrier):**
  1. Tide yêu cầu email giấy phép để cấp phát Realm độc lập và cần thao tác trên trình duyệt thật để sinh Doken.
  2. Cơ chế bảo mật của mạng lưới ORK nodes của Tide quy định: Các hợp đồng ủy quyền C# tùy chỉnh bắt buộc phải do chính đội ngũ kỹ sư Tide Foundation xem xét và triển khai lên mạng thử nghiệm của họ.
- **Tính trung thực kỹ thuật:** Dự án được công bố minh bạch là **Bản mẫu kiến trúc PoC hoàn chỉnh (Architectural Simulation)**, tuyệt đối không dùng private key cục bộ để giả danh chữ ký phân tán của Tide, đảm bảo sự chính trực cao nhất trong bài thi hackathon.
