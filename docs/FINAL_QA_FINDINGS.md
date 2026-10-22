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

## Retest

Người sửa không thay expected outcomes để tests xanh. Sau sửa chạy `npm.cmd run qa:final -- --update-results`, đọc new run report và kiểm tra parent REAL/manual cases vẫn cần evidence riêng. Priority fix: approvals → API replay → strict boundary/ledger. Không tự promote G4/G5 hoặc tuyên bố ready-to-submit từ local PASS.
