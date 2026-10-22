# Final QA — Leash trước khi nộp

## 1. Mục tiêu và trách nhiệm

**Lân là final QA; đồng đội phụ trách implementation/fix.** Không tiếp tục các task implementation LAN-01–08 như việc mặc định của Lân. Bộ test này kiểm tra bản release candidate (RC) cuối, không tự sửa code hoặc nộp bài.

**Trạng thái toàn bộ test:** NOT_RUN khi tạo tài liệu. Đọc code và thiết kế test không phải test PASS. Trạng thái mock-only/G3–G5 BLOCKED trong STATUS.json là thông tin bàn giao hiện có, phải kiểm tra lại trên RC mới.

Áp dụng [leash-unlocked skill](../.agents/skills/leash-unlocked/SKILL.md) và [hackathon-challenge-analyst skill](../../hackathon-analysis-skill/hackathon-analysis-skill/SKILL.md). Không có thư mục `hackathon-analyze/` trong workspace lúc thiết kế; skill analyst tìm thấy tại đường dẫn trên. Tham chiếu policy, schemas, security matrix và submission docs trong repo; không coi các docs là bằng chứng runtime.

## 2. Chuẩn bị trước khi bắt đầu

Yêu cầu người phát triển bàn giao:

- RC commit SHA/tag, dirty diff nếu có; khi không có Git metadata thì lưu source manifest/hash. Không test một thư mục rồi nộp commit khác.
- Lệnh startup/real test/receiver verifier đúng với RC; endpoint/port, realm test, SDK version, deployed policy/source hash, public key provenance. Không đoán lệnh Tide từ tài liệu này.
- Test accounts riêng: executor; finance A/B/C; unauthorized user/operator. Credentials trao qua kênh riêng, không commit hoặc ghi vào evidence.
- Synthetic fixture files, expected policy/threshold và finite TTL. Tài khoản ngân hàng chỉ là fake demo accounts.
- Một signed envelope hợp lệ và cách gọi receiver riêng để mutate/replay. Cách trực tiếp gọi Tide test request để vượt local prevalidation khi test enforcement.
- Ledger test và cách khởi động lại receiver. Chỉ reset test environment trước một nhóm test; không xóa ledger giữa hai bước replay.
- Rules BTC mới nhất và README/video/repo/form cuối. Nguồn snapshot không tự chứng minh trạng thái hiện tại.

Không có receiver harness/real accounts thì đánh BLOCKED cho test tương ứng; UI không cung cấp nút tấn công không phải lý do SKIP security test. Developer cần cung cấp test entry point chạy trên cùng RC/path triển khai, không phải một mock thay thế.

## 3. Cách ghi và quyết định

Dùng [FINAL_QA_RESULTS.csv](FINAL_QA_RESULTS.csv); mỗi test parameterized chỉ PASS khi **mọi biến thể** bắt buộc đều PASS. Ghi riêng subcase khi fail.

| Result | Ý nghĩa |
|---|---|
| NOT_RUN | Chưa thực hiện |
| PASS | Expected đúng, có evidence, đúng RC và execution layer |
| FAIL | Expected không đúng hoặc unauthorized action thành công |
| BLOCKED | Thiếu access, harness, dependency hoặc không chạy tới tầng cần kiểm tra |
| N/A | Ngoài feature/claim cuối, ghi rationale và người review; không dùng để né Tide integration |

**Priority:** P0 chặn release khi FAIL/BLOCKED/NOT_RUN. P1 là full regression; có thể defer với rationale/known limitation nếu không phải rule BTC hoặc claim cốt lõi. Feature được quảng bá thì test tương ứng trở thành P0. Không waive yêu cầu bắt buộc từ BTC hoặc unauthorized execution.

**Layer:** LOCAL = baseline/dev; REAL = Tide runtime hoặc receiver với signature Tide thực; RELEASE = bản public/artifacts. Chạy local PASS không thay REAL PASS. `MOCK_ONLY`/`REAL_TIDE` strings và HTTP 200 không tự chứng minh authorization hoặc real signing.

**Evidence:** test ID/subcase, RC SHA/source hash, timestamp/timezone, command hoặc steps, actual output, payload/contract hash, key fingerprint, receiver/realm context đã redact. Không JWT/doken/password/private key/PII. Đừng lưu full browser network dump chưa redact.

## 4. Thứ tự chạy thực dụng

1. **Handoff/rules:** QA-01, QA-02. Nếu không có đường nộp/eligibility thì chưa thể kết luận submission-ready.
2. **Smoke cốt lõi:** QA-04, QA-05, QA-07, QA-08, QA-09, QA-14, QA-15, QA-18, QA-23, QA-24, QA-29, QA-39. Đây là minimum smoke, không thay toàn bộ P0.
3. **Toàn bộ P0 còn lại**, rồi P1 và N/A review.
4. **Release review:** QA-35–42 khi artifacts cuối đã sẵn. Chỉ người được giao quyền thực hiện nộp thật.
5. Có fix: đổi RC, rerun ca fail và affected regression. Sửa auth/crypto/storage phải rerun toàn core P0. Sửa sau khi test mà chưa rerun → không giữ PASS cho phần bị ảnh hưởng.

Nếu chỉ còn ít phút: ưu tiên smoke để phát hiện blocker sớm; ca P0 chưa chạy vẫn NOT_RUN, không tự coi đủ điều kiện nộp.

## 5. Test data và state

| Alias | Dữ liệu |
|---|---|
| LOW | `fixtures/invoices/valid-low.txt`, payee/account theo `fixtures/vendors.json` |
| HIGH | `fixtures/invoices/valid-high.txt`; threshold hiện tại 100000 cents |
| HOSTILE | `malicious-prompt-injection.txt`, simulated compromise bật để tạo proposal sai |
| WRONG | `wrong-currency.txt` |
| BAD | `malformed.txt` hoặc thiếu required fields |
| A/B | Hai human identities thật, độc lập; chuỗi `finance-a/b` chỉ dùng LOCAL |
| E | Envelope thật của một payment hợp lệ, chưa consume nonce ở đầu test |

Mỗi ca độc lập dùng nonce mới; replay cases cố ý giữ nguyên envelope/nonce/key/ledger. T4/tamper có thể dùng envelope đã ký nhưng chưa execute; tránh dùng nonce đã consume làm nhiễu lỗi signature. Boundary policy tests thay amount trước approve/sign, không mutate sau ký trừ test integrity.

## 6. Test cases

Các bước ghi “Tide” cần trace cho thấy request tới policy thật. Nếu frontend/backend chặn sớm thì đó chỉ là local validation, chưa PASS real policy test. Expected error code có thể normalize khác theo RC nhưng security outcome không được đổi; ghi actual code và tầng từ chối. UI message không thay receiver ledger/crypto evidence.

| ID | Priority | Layer | Test / precondition | Steps / input cụ thể | Expected result | Evidence cần giữ |
|---|---|---|---|---|---|---|
| QA-01 | P0 | RELEASE | Đúng RC và clean setup | Lấy SHA/manifest; người QA chạy theo README từ checkout/session sạch; ghi versions/prerequisites | Chạy được theo hướng dẫn; không phụ thuộc file/session bí mật chỉ tác giả có; artifact cuối đúng RC | SHA, setup command/output, missing prerequisites |
| QA-02 | P0 | RELEASE | Rules và eligibility | Đối chiếu nguồn BTC hiện hành: Challenge 2, deadline/timezone, eligibility, form và required artifacts | Có đường nộp hợp lệ tại thời điểm nộp, team đủ điều kiện; mâu thuẫn unresolved là BLOCKED | Rule URL/capture/time, organizer clarification nếu có |
| QA-03 | P1 | LOCAL | Baseline regression | Chạy các lệnh trong mục 7; đọc số tests/output, không chỉ exit code | Tests/fixtures/contracts local chạy thực và PASS; label mock rõ; hardcoded status counts không là evidence | Logs, exit codes, test count của RC |
| QA-04 | P0 | REAL | Chứng minh Tide thật | Đăng nhập test realm, chạy sign flow; đối chiếu deployed contract/source hash, SDK, returned artifact và key provenance | Có actual Tide policy/signing trace; không local private-key signer hoặc fallback; login-only chưa đủ | Contract/hash, trace, key fingerprint, SDK version |
| QA-05 | P0 | REAL | Positive LOW | Invoice LOW, A approve đúng request; execute qua receiver | Đúng amount/currency/payee; signature thật verify; đúng một demo execution | Proposal, signed payload hash, approval/request IDs đã redact, receiver result |
| QA-06 | P0 | REAL | Positive HIGH | HIGH; A rồi B approve độc lập; execute | Hai approvals đúng request; receiver accept một lần | Approval trace, exact payment, ledger record |
| QA-07 | P0 | REAL | HIGH thiếu approval | HIGH; chỉ A approve; gửi request tới Tide | Không có bank-valid authorization; không execution; pending/denied phân biệt rõ | Tide response, nonce chưa consume |
| QA-08 | P0 | REAL + API | Không tự sinh approval | LOW, lần lượt approvals=[], bỏ hẳn field approvals, approvals=null; gửi qua HTTP/path thật | Không được tự thêm finance-a hoặc cấp consent; không execution | Ba request bodies, responses, ledger check |
| QA-09 | P0 | REAL | Hostile payee / T1 | HOSTILE tạo proposal attacker; xác nhận proposal đã sai; đưa payload đó tới Tide, không chỉ local gate | Tide deny payee/account trái policy dù backend yêu cầu ký; không có bank-valid signature | Hostile proposal, Tide rejection trace, receiver state |
| QA-10 | P0 | REAL | Duplicate/self/unknown approvals / T3 | HIGH: A+A; executor tự approve; tên A/B giả bằng JSON không proof; user không có role approve | Không fake identity/count thành quorum; không execute | Subcase responses và verified identity contexts |
| QA-11 | P0 | REAL | Consent gắn đúng payment | A approve payment P; đổi amount/account/nonce hoặc dùng approval P cho P2; gửi ký | Proof cũ không authorize P2; cần consent hợp lệ mới | P/P2 hashes, approval binding, denied trace |
| QA-12 | P0 | REAL | Policy threshold boundary | 99999 cents +1 approver; 100000 +1; 100000 +2; 100001 +1/+2 | Lần lượt accept, deny, accept, deny/accept theo spec hiện có; mỗi request mới | Amount/proof/result từng subcase |
| QA-13 | P1 | LOCAL + REAL | Invalid amount/currency | 0, -1, 1.5 cents, string, >MAX_SAFE_INTEGER; WRONG currency; gửi crafted request tới Tide nếu parser chặn | Invalid data không ký/execute; lỗi rõ; policy enforcement test chưa tới Tide là BLOCKED | Input/actual stage; Tide trace nếu chạy |
| QA-14 | P0 | REAL receiver | Unsigned bypass / T2 | Gọi trực tiếp receiver E bỏ signature, empty signature; thử bare payment+signature legacy path trên strict runtime | Không bypass envelope/authorization; không execution hoặc nonce write | Direct receiver request/output, ledger before/after |
| QA-15 | P0 | REAL receiver | Tamper / T4 | Ký E rồi thay riêng amount, account, payeeId, invoiceId, nonce, expiry; giữ chữ ký | Tất cả reject, không side effect; không chỉ đổi UI | Signed hash, mutations, verification results |
| QA-16 | P0 | REAL receiver | Wrong key / T8 | Signature từ key test khác; gửi publicKey/keyId/policyId thay thế trong request; receiver giữ config gốc | Không tin key do request cung cấp; wrong key/context reject | Trusted fingerprint, mutated request, reject |
| QA-17 | P0 | REAL | Policy substitution / T8 | Dùng policy yếu hơn với cùng payment/key nếu harness cho phép; đổi policyId label sang trusted | Không lấy được signature từ policy khác rồi relabel để bank accept; thiếu harness/proof là BLOCKED | Contract/key scope, signed request, receiver verification |
| QA-18 | P0 | REAL receiver | Replay qua endpoint cuối / T5 | Gửi cùng E hai lần qua đường user/API thật, không chỉ gọi cùng bank object trong test | Lần đầu accept, lần sau reject; đúng một record; không tạo bank/key/ledger mới để quên nonce | Hai HTTP/receiver results, ledger |
| QA-19 | P0 | REAL receiver | Replay qua process restart | Execute E; dừng/khởi động lại receiver thật giữ key/config/ledger; gửi lại E | Replay vẫn reject; không reset hoặc xóa ledger | PID/start logs, same fingerprint/path, result |
| QA-20 | P0 | REAL receiver | Concurrent replay | Hai subprocess/clients gửi đồng thời cùng E vào cùng receiver storage | Đúng một accept; còn lại reject, không hai execution; ledger không corrupt | Parallel request IDs/results, ledger count |
| QA-21 | P0 | REAL receiver | Mode relabel | Gắn MOCK_ONLY thành REAL_TIDE trên local signature; thử real envelope vào mock config và ngược lại | Runtime expected mode/trust anchor quyết định; label không tạo real authorization | Config mode/fingerprint và reject results |
| QA-22 | P1 | Receiver/API | Malformed/schema/type | Invalid JSON, duplicate keys, missing/extra top/auth fields, array/null, object signature, bad base64 | Reject có kiểm soát; không crash/execute/consume nonce; field limits theo schema | Parametric inputs, code, process vẫn hoạt động |
| QA-23 | P0 | REAL receiver | Expiry và domain/version | E expire; tại expiresAt; sai domain/version; sửa expiry sau ký; clock test có kiểm soát | Không accept khi now ≥ expiresAt; wrong scope reject; expiry không thể sửa để kéo dài | Clock/timestamps, signed payload, reject |
| QA-24 | P0 | REAL | Tide/dependency fail closed | Mất kết nối Tide hoặc signer lỗi ở test environment; retry request | Không fallback local signing/auto-approval/execute; báo dependency error | Dependency simulation, response, ledger unchanged |
| QA-25 | P0 | Receiver | Storage/ledger lỗi | Test-only storage unwritable, corrupt/truncated ledger, lock timeout; gửi E | Fail closed, không bỏ qua corrupt nonce hoặc fallback memory rồi accept; timeout rõ | Test storage setup, errors, record count |
| QA-26 | P0 | REAL | Governance / T6 | Operator đơn lẻ đổi threshold, allowlist, approver role, policy mapping; thử lại forbidden payment | Không một operator nào tự hạ bảo vệ trong scope claim; actual quorum và master limitations được ghi, không chỉ JSON override bị ignore | Config change trace, quorum, post-change attempt |
| QA-27 | P1 | API | Sai kiểu/giới hạn body | invoiceText array/object/null, approvals sai type, body vượt giới hạn đã document; sau đó valid request | Reject không crash, không stack/secret leak, valid request tiếp theo còn chạy | HTTP codes/bodies, service health |
| QA-28 | P1 | Input/UI | Unicode/multilingual | Description tiếng Việt có dấu, emoji/code mixing; identifiers Unicode/zero-width; giữ tài khoản fake | Description bảo toàn hoặc lỗi rõ; identifiers theo ASCII contract thì reject, không normalize thành account khác | Before/after proposal, outcome |
| QA-29 | P0 | REAL + UI | Backend status không được giả success | So sánh actual Tide readiness với /api/status và UI; gây denied/blocked response | Không hiển thị settled/Tide ready chỉ vì env/string/HTTP200; body, receiver state và UI thống nhất | UI, response, actual trace |
| QA-30 | P1 | REAL receiver | Retry sau deny không consume nonce | Payment chưa đủ approvals bị deny; bổ sung đúng approvals rồi retry cùng payment còn hạn | Denial không ghi executed nonce; request hợp lệ sau đó accept đúng một lần | Before/after ledger và outcomes |
| QA-31 | P1 | Business claim | Cùng invoice, nonce mới | Execute invoice P rồi xin signed P2 cùng invoiceId nhưng nonce mới | Nếu claim chống duplicate invoice thì reject; nếu chỉ anti-replay thì ghi limitation, không gọi là double-payment protection | Policy claim, two hashes/results |
| QA-32 | P1 | Pipeline | Metadata/display khác bytes ký | Approval card hiển thị vendor/amount P, cố gửi signing bytes P2; so hash khi qua stages | Không approve P nhưng ký/execute P2; cùng payment xuyên suốt, nếu claim có human consent thì đây là P0 | Card capture, hashes qua stages, result |
| QA-33 | P1 | Optional AI | Model error/injection | Nếu có LLM: timeout, invalid schema, extra approved/publicKey field, hostile invoice; nếu không có ghi N/A | Output chỉ proposal; không tăng quyền/cấp consent; simulation không được quảng bá là exploit LLM thật | Model/version, cases, authorization outcomes |
| QA-34 | P1 | REAL | Session/role lifecycle | Token expired/logout/approver role bị thu hồi; thử request mới, phân biệt operation đã approved | Hành vi khớp documented TTL/revocation; không tự hứa revoke tức thì; unauthorized new approval không được tạo | Times, role/session state, outcomes |
| QA-35 | P0 | RELEASE | README đúng BTC | Đối chiếu năm prompts tại docs/README_5_PROMPTS.md với nguồn chính thức; overview một câu + năm câu trả lời ≤300 words nếu rule còn hiệu lực; setup riêng | Không placeholder; đúng template/limit; setup đủ prerequisites; không có fabricated rule | Final README, word count method, source |
| QA-36 | P0 | RELEASE | Public repo đúng artifact | Mở repo/default branch trong private/incognito session, kiểm tra source, dependencies/lockfile nếu cần, setup/evidence links | Judges truy cập được; RC đã test là bản nộp; không phụ thuộc file untracked | Public URL, commit/hash, link checks |
| QA-37 | P0 | RELEASE | Video artifacts | Kiểm tra rules hiện hành; mở MP4 từ repo, duration/format/size và audio; xem video đúng RC/path thật | Theo brief: 2 phút, MP4 dưới 100 MB trong repo; rules mới ưu tiên; demo claims khớp evidence | File size, metadata, playback và source rule |
| QA-38 | P0 | RELEASE | Secrets/privacy | Review files, Git history nếu có, logs, video/screens; chỉ ghi location/type khi thấy secret, không copy value | Không credentials/dokens/private keys/PII/real invoices; phát hiện secret phải xử lý/rotate rồi review lại | Scan method/coverage và redacted findings |
| QA-39 | P0 | RELEASE | Claims/evidence consistency | So README/UI/video/STATUS/security claims với kết quả REAL trên RC | Không gọi mock là real, local deny là Tide deny, class là independent process, policyId equality là proof | Claim-to-test mapping, unresolved list |
| QA-40 | P1 | RELEASE | Cold rerun cuối | Developer khác chạy lại happy/denied path theo setup, session mới, test ledger kiểm soát | Kết quả reproducible, không thay key/quyền ngầm; không dùng video thay runtime proof | Reviewer, commands, observed results |
| QA-41 | P0 | RELEASE | Pre-submit freeze | Kiểm tra mọi P0, sửa cuối đã rerun, RC repo/video/evidence khớp; recheck deadline/form | Không critical FAIL/BLOCKED/NOT_RUN; không deploy/commit mới chưa review; decision có owner | Signed QA decision, final hash/time |
| QA-42 | P0 | RELEASE POST-SUBMIT | Xác nhận nộp thật | Chỉ sau người được giao quyền submit form: kiểm tra repo URL, team và acknowledgement | Có receipt/confirmation thật; trước submit ghi NOT_RUN, không chặn readiness nhưng chưa được gọi SUBMITTED | Receipt time và submitted URL, không public PII |

## 7. Các lệnh hiện có — chỉ smoke LOCAL

Chạy ở thư mục `rmit-hackathon`. Không cài dependency hoặc gọi paid provider chỉ để test nếu chưa được giao quyền.

```powershell
node --version
npm.cmd run preflight
npm.cmd test
npm.cmd run validate:fixtures
npm.cmd run validate:contracts
npm.cmd run security
npm.cmd run tide:probe
```

Đọc logs từng lệnh và `$LASTEXITCODE` ngay sau lệnh. Preflight có thông báo rules hardcode cũ; không dùng làm nguồn trạng thái BTC. `tide:probe`/`test:tide` hiện cùng script; khi adapter chưa triển khai, lỗi REAL_TIDE_NOT_WIRED là **BLOCKED real integration**, không phải PASS challenge.

Nếu security CLI im lặng trên Windows, gọi exported function (tương thích async hiện tại):

```powershell
node --input-type=module -e "import {runSecurityScenarios} from './src/securityScenarios.mjs'; console.log((await runSecurityScenarios()).join('\n'));"
```

### HTTP smoke cụ thể trên server hiện có

Terminal A: `npm.cmd run server`. Terminal B dùng đoạn sau cho **mock smoke**, không gọi đây là real test. Port lấy từ config thực, default hiện 8787.

```powershell
$qaBase = 'http://127.0.0.1:8787'
$qaInvoice = Get-Content -Raw -Encoding UTF8 'fixtures/invoices/valid-low.txt'
$qaNonce = 'qa-' + [guid]::NewGuid().ToString('N')
$qaBody = @{invoiceText=$qaInvoice; approvals=@(@{approverId='finance-a'}); nonce=$qaNonce} | ConvertTo-Json -Depth 6
Invoke-RestMethod -Method Post -Uri ($qaBase + '/api/pipeline') -ContentType 'application/json' -Body $qaBody
Invoke-RestMethod -Method Post -Uri ($qaBase + '/api/pipeline') -ContentType 'application/json' -Body $qaBody
```

QA-18: hai request cùng nonce phải có đúng một execution nếu endpoint quảng bá replay protection. Nếu hai lần accepted, ghi FAIL ở endpoint dù unit test bank PASS. Không reset server/ledger giữa hai request.

QA-08: gửi LOW ba biến thể bằng nonce riêng: `approvals=@()`; bỏ key approvals; `approvals=$null`. Quan sát actual authorization và ledger. Server hiện có default mock approval khi thiếu field; đây là rủi ro cần retest RC, không là behavior mong muốn.

Không có HTTP receiver endpoint riêng trong code được đọc lúc thiết kế. QA-14–25 cần developer giao receiver CLI/harness; không tự bịa `/api/bank` hoặc signing route.

## 8. Bug report và release decision

Bug report tối thiểu:

```text
ID / Title:
RC SHA / Environment / Mode:
Test ID + subcase:
Preconditions và test state:
Steps to reproduce:
Expected:
Actual (code + ledger/side effect):
Evidence đã redact:
Severity / Owner fix:
Retest RC + result:
```

**Severity:** Critical = unauthorized execution/forged approval/key-policy bypass/secret leak; High = valid core flow không chạy, replay fail, Tide unavailable hoặc artifacts bắt buộc thiếu; Medium = lỗi phụ không chạm core/rules. Priority test và severity bug là hai thứ khác nhau.

**READY_TO_SUBMIT:** QA-01–41 có mọi P0 PASS, không security/rules blocker; P1 deferred được ghi rõ và không mâu thuẫn claim. QA-42 chưa chạy ở thời điểm này là bình thường.

**NO_GO:** bất kỳ unauthorized execution; real Tide requirement chưa đáp ứng; thiếu evidence cốt lõi; mandatory artifact/eligibility/route không hợp lệ. Muốn nộp partial phải có policy/BTC cho phép và label trung thực, không đổi NO_GO thành bài đủ requirement.

**SUBMITTED:** chỉ sau QA-42 PASS. QA không tự nộp hoặc gửi tin nhắn cho người khác.

| Trường ký QA | Giá trị để điền |
|---|---|
| RC/source hash | Chưa điền |
| Tester / reviewer | Lân / người review fix |
| Run start/end + timezone | Chưa điền |
| REAL P0 pass/fail/blocked/not-run | Chưa chạy |
| Deferred P1 + rationale | Chưa điền |
| Decision | NOT_EVALUATED |
| Submission receipt | Chưa nộp / chưa kiểm tra |

## 9. Nguồn traceability

- [Policy](POLICY_SPEC.md), [signature protocol](SIGNATURE_PROTOCOL.md), [security claims](SECURITY_CLAIMS.md), [trust boundaries](TRUST_BOUNDARY.md).
- [T1–T8](../tests/SECURITY_TEST_MATRIX.md), [envelope schema](../model/schema/bank-execution-v1.schema.json), [fixtures](../fixtures/cases.json).
- [Rules audit](../research/official-rules.md), [official prompts](README_5_PROMPTS.md), [submission checklist](SUBMISSION_CHECKLIST.md).
- Source paths đọc khi thiết kế: `src/server.mjs`, `src/pipeline.mjs`, `src/bank.mjs`, `src/signing/tideForsetiSigner.mjs`. Khi checkout thay đổi, cập nhật command và test prerequisites theo RC.

## Automation bổ sung

Xem [FINAL_QA_AUTOMATION.md](FINAL_QA_AUTOMATION.md). Chạy `npm.cmd run qa:final -- --update-results` để tạo logs/cập nhật local results. REAL/manual checks cần thực hiện riêng. Lỗi đã tái hiện: [FINAL_QA_FINDINGS.md](FINAL_QA_FINDINGS.md). NOT_RUN trong phần giới thiệu là trạng thái khởi tạo; xem CSV để biết kết quả hiện tại.
