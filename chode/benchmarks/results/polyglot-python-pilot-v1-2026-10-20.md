# Chode 1.9.3 public-task pilot — 2026-10-20

**Strict result: 0/5 tasks fully solved (0%).** This is a fixed, low-budget Python subset of Aider Polyglot, **not an official Aider leaderboard score** or a measurement of all Chode workflows.

| Public task | Passing tests | Fully solved | Source changed |
|---|---:|---|---|
| zebra-puzzle | 0/2 | No | No |
| grade-school | 0/20 | No | No |
| list-ops | 22/24 | No | Yes |
| affine-cipher | 0/16 | No | No |
| pov | 0/15 | No | No |

The 22/77 passing individual checks are diagnostic only; task-level all-tests-pass is the primary score. All original stubs failed their initial checks. All official test hashes remained unchanged. No task was removed or hand-repaired.

## Fixed protocol

- Public source: https://github.com/Aider-AI/polyglot-benchmark at `7e0611e77b54e2dea774cdc0aa00cf9f7ed6144f`.
- Five Python tasks selected before execution by sorting SHA256(`chode-pilot-v1:` + exercise name).
- Installed Chode 1.9.3; production exported v2 agent loop, fresh state, strict free mode, no memory/web/reference examples. Providers returning answers: OVH and Kilo; resolved upstream model identities were not captured.
- One attempt, at most six logical model calls/16 tool calls per task, 30-second request timeout, 210-second generation limit and separate 30-second grading limit.
- Tests stayed outside the agent workspace and were run only after generation. No external test-feedback retry was supplied. This differs from the full Aider protocol.
- Node 24.19.0 and Python 3.12.10 on Windows. Total task wall time approximately 7 minutes 24 seconds. There were 16 completed logical model calls, 11 returning an answer. Provider routing may make additional HTTP attempts.

The 30-second request timeout is shorter than Chode's normal 90-second agent default. The TUI worker's automatic capacity-window continuation was not exercised. Consequently this score measures this explicitly budgeted adapter, not unrestricted out-of-box Chode. Larger budgets or additional feedback require a separately labelled protocol/baseline; do not silently compare those results as harness improvements.

## Failure evidence and next iteration

1. Every task ended after a call returned no answer, before reaching the six-call ceiling. Investigate provider completion/latency and recovery within the existing fixed budget; do not bypass quotas or erase failures.
2. Zebra puzzle and tree reorientation produced invalid edit requests. List operations recovered from an invalid edit and wrote code. Improve general tool-schema adherence without special-casing benchmark answers.
3. List operations failed two right-fold checks because of argument ordering. Improve contract verification and implementation review. Running an unchanged Python stub with exit code zero did not establish correctness; the official tests exposed that gap.

Repeat this exact pilot after a general fix, retain both runs and report task-level regressions. Free-model availability varies, so repeated measurements and model-controlled runs are needed before attributing a delta to the harness. Five public tasks are too small and potentially training-contaminated to support broad superiority claims.

Reproduction and comparison commands: [PUBLIC-PILOT.md](../PUBLIC-PILOT.md). Machine-readable measurements and test hashes: [JSON result](polyglot-python-pilot-v1-2026-10-20.json). Original local logs/artifacts: `chode-public-bench/runs/2026-10-20T12-14-32-089Z` in the writable workspace; no reference solutions were copied into the run.
