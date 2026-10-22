# Strict receiver contract v1 — LAN-01

**Ngày:** 22/10/2026. **Owner:** Lân. **Trạng thái:** contract nội bộ sẵn sàng cho LAN-02/03; chờ Khánh review phần Tide binding. Chưa phải chức năng strict runtime đã triển khai, chưa phải G4 evidence. Không thay đổi payment fields hoặc fixed vector hiện có.

## 1. Boundary và input

Executable receiver chỉ nhận một JSON envelope theo [bank-execution-v1 schema](../model/schema/bank-execution-v1.schema.json):

```text
{ payment, authorization: { mode, signatureBase64, keyId, policyId } }
```

- Exact required fields ở cả hai cấp; không extra fields, arrays hoặc null thay object. Validate type trước decode/crypto.
- Payment giữ nguyên chín fields và canonical encoding trong [SIGNATURE_PROTOCOL.md](SIGNATURE_PROTOCOL.md). Không nhận amount float hoặc fields authorization bên trong payment.
- Không nhận bare payment + signature riêng trong strict path. Legacy helper chỉ được giữ dưới explicit dev/test opt-in, không được executable receiver bật hoặc fallback sang.
- Caller chỉ gửi dữ liệu/gợi ý định danh, không gửi trusted config. Duplicate JSON keys phải bị từ chối tại raw JSON boundary; object đã parse không thể chứng minh việc này.
- Input encoding UTF-8; invalid JSON/shape/type trả lỗi có kiểm soát, không consume nonce.

## 2. Trusted config ngoài request

Local operator provision config khi khởi động, không cập nhật qua envelope. Các field dưới là interface **dự kiến của Leash**, không phải Tide SDK API:

| Field | Bắt buộc | Quy tắc |
|---|---|---|
| `expectedMode` | Có | `MOCK_ONLY` hoặc `REAL_TIDE`; không suy từ request |
| `pinnedPublicKeyPath` | Có | File public key PEM/SPKI được operator cung cấp; không private key hoặc URL từ caller |
| `pinnedKeyId` | Có | Exact match với envelope; tên không tự chứng minh key provenance |
| `pinnedPolicyId` | Có | Exact match với envelope; chưa phải cryptographic policy binding |
| `durablePath` | Có | Ledger local; không fallback in-memory khi storage lỗi |

Paths tương đối resolve từ thư mục chứa config, không từ payment request hoặc CWD. Thiếu field, config field lạ, key sai format/scheme hoặc ledger không truy cập được: startup fail closed. Receiver không tự tạo key, tải key hoặc enroll user.

Xem [receiver.mock.example.json](../config/receiver.mock.example.json). Example chỉ có fake IDs và paths, không có key. Chưa có config loader/CLI; không copy example rồi coi đã chạy được. Operator phải provision mock public key và ledger location riêng khi LAN-03 được triển khai.

## 3. Mode, key và policy

`authorization.mode` là **untrusted metadata**, chỉ so sánh với `expectedMode`. Đổi nhãn mock thành real không biến local signature thành Tide proof.

- Mock configuration dùng test public key, chỉ chứng minh protocol local.
- Real configuration chỉ được enable sau khi có Tide signing key provenance, exact signed-byte scope và policy/key binding được review. Không mặc định dùng JWT public key.
- Signature hiện tại chỉ cover canonical payment; `mode`, `keyId`, `policyId` nằm ngoài signed fields. String equality không chứng minh signature do đúng policy tạo ra.
- Nếu Tide ký envelope/hash khác canonical payment, Khánh và Lân phải document binding và test vectors trước khi hỗ trợ real verifier. Không sửa signed fields hoặc verify một message không ràng buộc payment.
- Chưa có verified real scheme/binding thì real startup trả `REAL_TIDE_NOT_READY`; không fallback mock. Khánh review những điều này vẫn pending.

Trust assumption: receiver code/config/storage không do attacker của payment request kiểm soát. Tách process không tự bảo vệ khỏi operator có toàn quyền sửa receiver/trust anchor; không claim vượt assumption này.

## 4. Thứ tự xử lý strict path

1. Load/validate trusted config trước nhận request.
2. Parse JSON không duplicate keys; validate envelope và payment shape.
3. Kiểm tra mode, key ID và policy ID theo config.
4. Validate domain/version/expiry và tạo exact signing bytes theo protocol đã hỗ trợ.
5. Decode signature đúng scheme/encoding; verify bằng pinned public key.
6. Dưới ledger lock/transaction: reload state, kiểm tra nonce, ghi nhận acceptance.
7. Chỉ trả `EXECUTED` sau ghi ledger thành công. Invalid request không ghi ledger.

`EXECUTED` chỉ là chấp nhận mock payment, không phải bank transfer. Không có business-side effect ngoài record demo. Append/lock đơn thuần chưa chứng minh crash/power-loss durability; LAN-04 kiểm chứng restart/concurrency và ghi giới hạn.

## 5. Output và lỗi ổn định

Strict executable dùng một JSON result trên stdout cho mỗi invocation; diagnostic đã redact ở stderr, không stack trace/secrets trong result. CLI/file/stdin cụ thể được triển khai ở LAN-03.

```json
{"accepted":true,"code":"EXECUTED","mode":"MOCK_ONLY","invoiceId":"INV-EXAMPLE"}
```

```json
{"accepted":false,"code":"MODE_MISMATCH","mode":"MOCK_ONLY"}
```

`mode` luôn lấy từ trusted config, không echo nhãn request. Startup/config lỗi chưa có trusted mode thì bỏ field `mode`. `invoiceId` chỉ bắt buộc khi accept. Không trả signature/key/token trong result.

| Nhóm | Codes dự kiến | Exit code CLI |
|---|---|---|
| Accept | `EXECUTED` | 0 |
| Input/authorization deny | `INVALID_JSON`, `INVALID_ENVELOPE`, `MODE_MISMATCH`, `UNTRUSTED_KEY_ID`, `UNTRUSTED_POLICY_ID`, `INVALID_PAYLOAD`, `EXPIRED`, `MISSING_SIGNATURE`, `BAD_SIGNATURE`, `REPLAY_NONCE` | 1 |
| Configuration/dependency/storage | `INVALID_CONFIG`, `REAL_TIDE_NOT_READY`, `LEDGER_CORRUPT`, `LOCK_TIMEOUT`, `STORAGE_UNAVAILABLE`, `INTERNAL_ERROR` | 2 |

Đây là normalized boundary codes; class/helpers có thể giữ internal codes để tương thích tests cũ. Empty signature có thể trả `MISSING_SIGNATURE`; absent required auth field là `INVALID_ENVELOPE`. Storage/dependency lỗi không được chuyển thành accept hoặc bỏ qua ledger.

## 6. Acceptance và ownership tiếp theo

| LAN task | Acceptance theo contract này |
|---|---|
| LAN-02 — Lân | Test strict envelope/mode/pinning/type/extra-field/legacy bypass trước sửa; không nonce mutation khi deny |
| LAN-03 — Lân | Executable riêng, trusted config loader, duplicate-key JSON rejection, normalized output/exit; không import signer |
| LAN-04 — Lân | Durable ledger thực sự được test qua process restart/concurrency; corruption/storage fail closed |
| Khánh review | Scheme, bytes, key provenance, approval/policy binding; không coi review đã xảy ra |
| Phát fixtures | Dùng envelope schema hiện có; mock labels rõ; valid/invalid vectors chạy với strict boundary khi sẵn |

LAN-01 chốt local interface để bắt đầu implementation. Team agreement với Khánh vẫn chờ review; không promote G3/G4/G5 hoặc đánh real integration DONE từ tài liệu này.
