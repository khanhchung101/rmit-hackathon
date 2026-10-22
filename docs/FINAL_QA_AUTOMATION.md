# Chạy final QA tự động

## Lệnh chạy

Ở thư mục `rmit-hackathon`, Node ≥20, không cần thêm dependency:

```powershell
npm.cmd run qa:final
```

Lệnh này chạy tests và tạo evidence + results đề xuất, không sửa results sheet chính. Để cập nhật các dòng tự động trong `docs/FINAL_QA_RESULTS.csv`:

```powershell
npm.cmd run qa:final -- --update-results
```

Hoặc dùng `node scripts/final-qa.mjs --update-results`. Không đặt npm commands nối tiếp rồi chỉ đọc exit code lệnh cuối.

## Runner thực hiện gì?

- Unit suite hiện có, fixtures, protocol consistency, T1–T8 mock qua exported function.
- Kiểm tra unsigned/legacy envelope path, mode relabel, extra field, tamper, key ID, expiry.
- QA helper subprocess kiểm tra bank class qua process restart và hai workers đồng thời. **Đây không phải independent product receiver đã hoàn thành.**
- Khởi động server của repo ở loopback port tạm; kiểm tra positive mock, empty/missing/null approvals, replay HTTP.
- Server real-mode **không có credentials** để kiểm tra fail-closed khi chưa cấu hình; không gọi Tide network.
- Chụp SHA-256 manifest của source, tests, scripts, schemas, fixtures, contract và package.json; nếu thay đổi trong lúc chạy, không dùng run đó để chốt RC.

Runner không sửa implementation hoặc test expected cho xanh. Không enroll user, gọi paid model, gửi tin nhắn hoặc submit. Child server bỏ các biến TIDE_* credential kế thừa và luôn bị dừng sau run. Chỉ tạo test ledger trong evidence run riêng, không xóa ledger runtime.

## Output và cách đọc

Mỗi run tạo folder `evidence/private/final-qa/<run-id>/`:

| File | Nội dung |
|---|---|
| `SUMMARY.md` | PASS/FAIL từng local subcheck |
| `report.json` | Actual outcomes và scope, source stability |
| `source-manifest.json` | Hash từng file thuộc snapshot |
| `FINAL_QA_RESULTS.suggested.csv` | Kết quả đề xuất gắn 42 test cases |
| `FINAL_QA_RESULTS.before.csv` | Backup sheet trước khi dùng --update-results |
| `baseline-*.txt`, `server-*.txt` | Local logs; vẫn cần review trước chia sẻ |

Folder này bị `.gitignore` loại trừ. Evidence chỉ có trên máy cho tới khi bạn review/redact rồi chọn artifact để chia sẻ. Không public cả folder mặc định.

**Exit codes:** 1 = có local FAIL; 2 = local checks bị blocked/source thay đổi, hoặc lỗi runner; 0 = toàn local checks PASS. Exit 0 **không có nghĩa ready to submit**: Tide thật, release artifacts, rules và manual checks vẫn cần thực hiện.

Mock subcheck PASS không promote parent REAL test thành PASS. Chỉ QA-03 có thể tự PASS khi đủ local baseline checks. Local repro FAIL được ghi rõ phạm vi; trường hợp real test chỉ có local subset thì BLOCKED. Release/manual cases giữ NOT_RUN hoặc trạng thái người QA đã điền.

`--update-results` backup sheet trước ghi, preserve các quyết định PASS/FAIL/N/A do người test ghi; các dòng có tester `Automated local QA` được refresh khi retest. Tự động không xóa bug_id/rationale người QA đã thêm; cần review khi RC thay đổi. Kết quả thủ công gắn RC cũ không tự chuyển sang RC mới.

## Sau khi đồng đội sửa code

1. Nhận RC/source mới, chạy lại cùng lệnh.
2. Đọc FAIL thực tế trong report, không chỉ baseline unit PASS.
3. So sánh source hash; mỗi lỗi đã sửa phải có retest trên RC mới.
4. Tiếp tục REAL/manual checks trong [FINAL_QA_TESTCASES.md](FINAL_QA_TESTCASES.md); thiếu harness/access là BLOCKED.
5. Không nộp dưới claim hoàn thành khi các P0 còn FAIL/BLOCKED/NOT_RUN.

Runner đang test adapter boundaries hiện có; nó không xác minh rằng endpoint/API trong real signer đúng Tide docs. Chữ ký từ một HTTP stub hoặc mock key không là bằng chứng Tide thật.
