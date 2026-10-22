# Atomic task queue for coding agents

**Machine-readable canonical queue:** `tasks/backlog.csv`. Every entry has ID, priority, owner, project step, dependencies, task, DoD, estimate, status, evidence URL/hash. Assign a task only when its dependency IDs have passed their gates. Update `status` as TODO/IN_PROGRESS/BLOCKED/DONE/FAILED; do not mark DONE with only prose.

**Immediate critical path:** L-001 submissions → L-003 environment → L-004 SDK → L-007 policy → L-008 public-key verifier → L-013 real adapter → L-015 external bank → L-018 real adversarial tests. Concurrent: L-005 data, L-006 model decision and L-012 mock regression. Optional model L-017 only after core signing works.

**Owner roles:** PM=challenge research/submission, Tide=real Tide policy/SDK, Security=threats/governance, Backend=receiver/API, AI/Data=proposer/fixtures, QA=independent tests/demo. Estimates are planning ranges, not commitments.

**Agent execution checklist per task:** read source/ref → confirm dependency status → implement minimum change → add test → run `npm test && npm run security` → attach screenshot/hash or command output → update CSV/STATUS/DECISION_LOG → independent review.
