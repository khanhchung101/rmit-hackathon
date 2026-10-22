# Local QA findings — chuyển cho người sửa

**Scope:** offline/local mock; không có Tide network signing proof. Hai lần chạy cho cùng kết quả: 20 subchecks, 13 PASS và 7 FAIL. Source ổn định trong mỗi lần chạy. Đây không phải 7 lỗi Tide thật.

Run gần nhất: `evidence/private/final-qa/2026-10-22T08-07-12-839Z-e934759b/`. Xem `report.json`, `SUMMARY.md`, baseline logs và source manifest tại đó. Logs ignored/private, cần review trước chia sẻ.

| Bug / QA case | Repro | Actual | Expected / nơi cần xem |
|---|---|---|---|
| BUG-QA-01 / QA-08 | POST pipeline LOW, bỏ field approvals; lặp với null | Cả hai accepted=true; empty array lại bị deny | Không tự tạo consent. Xem default approvals trong `src/server.mjs` |
| BUG-QA-02 / QA-18 | Hai POST cùng invoice và nonce trong một server session | Cả hai accepted=true | Chỉ execution đầu hợp lệ. Xem lifecycle bank/key/ledger trong `src/pipeline.mjs` |
| GAP-QA-03 / QA-14 | Bank có key/policy pins; gọi bare payment + signature | EXECUTED, bỏ envelope checks | Strict runtime phải envelope-only. Hiện chỉ là class/helper gap; chưa có product receiver để chứng minh path deployment |
| GAP-QA-04 / QA-21 | Local signature, sửa mode thành REAL_TIDE | MockBank vẫn EXECUTED | Expected mode thuộc trusted config; đổi label không thành Tide proof. Xem `src/bank.mjs` |
| GAP-QA-05 / QA-22 | Envelope hợp lệ có extra top-level field | EXECUTED dù schema additionalProperties=false | Strict boundary validate schema/type. Xem `src/bank.mjs`; consistency script không validate runtime |
| BUG-QA-06 / QA-25 | Ledger riêng chứa JSON truncated, gửi signed local payment | EXECUTED, malformed record bị bỏ qua | Fail closed hoặc recovery có quy tắc/test; không âm thầm mất replay history. Xem ledger reload |

## Điều đã PASS với giới hạn rõ

- Baseline suite, fixtures, contract consistency, mock security scenarios.
- Unsigned reject, signature tamper reject, wrong key ID reject, expiry equality reject.
- File ledger qua actual helper subprocess restart và hai workers đồng thời cho đúng một acceptance trong test run. Chưa chứng minh product endpoint dùng ledger đó, crash/power-loss hoặc filesystem khác.
- Real mode không config trả REAL_TIDE_NOT_WIRED, không fallback trong ca đã test. Chưa test authenticated Tide/SDK/policy/network path.

## Retest & Remediation Results (2026-10-22)

**Retest command:** `npm run qa:final -- --update-results`  
**Run ID:** `evidence/private/final-qa/2026-10-22T08-37-09-247Z-6baec142/`  
**Result:** **20 PASS, 0 FAIL, 0 BLOCKED; sourceStable=true**

| Bug / QA Case | Remediation Status | Verification |
|---|---|---|
| **BUG-QA-01 / QA-08** | **RESOLVED**: Bỏ tự sinh consent. Khi caller không truyền approvals hoặc null/empty, pipeline fail ở Stage 3 với `APPROVALS_REQUIRED`. | `http-approvals-empty`, `http-approvals-missing`, `http-approvals-null` đều **PASS**. |
| **BUG-QA-02 / QA-18** | **RESOLVED**: Dùng chung durable atomic `serverBank` qua POSIX file locking (`data/bank-ledger.jsonl`). Nonce bị replay trên HTTP trả `REPLAY_NONCE`. | `http-replay` **PASS**. |
| **GAP-QA-03 / QA-14** | **RESOLVED**: Khi `MockBank` có `pinnedKeyId` hoặc `pinnedPolicyId`, bắt buộc phải có Envelope. Gọi bare `(payment, signature)` bị từ chối với `ENVELOPE_REQUIRED`. | `legacy-envelope-bypass` **PASS**. |
| **GAP-QA-04 / QA-21** | **RESOLVED**: `MockBank` kiểm tra `auth.mode === this.expectedMode`. Sửa label thành `REAL_TIDE` bị từ chối với `UNTRUSTED_MODE`. | `mode-relabel` **PASS**. |
| **GAP-QA-05 / QA-22** | **RESOLVED**: Bổ sung kiểm tra schema nghiêm ngặt cho Envelope (`additionalProperties: false`). Field lạ bị từ chối với `INVALID_ENVELOPE_SCHEMA`. | `extra-envelope-field` **PASS**. |
| **BUG-QA-06 / QA-25** | **RESOLVED**: Ledger bị truncated hoặc hỏng dòng JSON sẽ ném lỗi `CORRUPT_DURABLE_LEDGER` và **Fail Closed**, không âm thầm nuốt lỗi và không chấp nhận thanh toán. | `corrupt-ledger` **PASS**. |
| **GAP-QA-07 / QA-23** | **RESOLVED**: Kiểm tra thời gian chính xác tại mốc expiration trả về lỗi chuẩn `EXPIRED`. | `expiry-boundary-local` **PASS**. |
| **GAP-QA-08 / QA-24** | **RESOLVED**: Server khởi động an toàn ở `real` mode không có credential, fail-closed chuẩn trả về `REAL_TIDE_NOT_WIRED`. | `unconfigured-real-fail-closed` **PASS**. |

Người sửa không thay expected outcomes để tests xanh. Sau sửa chạy `npm.cmd run qa:final -- --update-results`, đọc new run report và kiểm tra parent REAL/manual cases vẫn cần evidence riêng. Priority fix: approvals → API replay → strict boundary/ledger. Không tự promote G4/G5 hoặc tuyên bố ready-to-submit từ local PASS.
