# chode Handoff — 2026-10-21 — OpenCode takeover at 10% Codex remaining

## Status

**Stop new Codex development; user requested OpenCode handoff when the five-hour allowance reaches 10% remaining. That threshold was observed.** Weekly remaining was 30%. Continue economically from these facts rather than rereading the full project.

**1.9.6 is pushed and deployed.** Runtime/release commit 124355db32c9789d7b1b02f248f89798ae980c96 is on master and remote chode-1.1-agentic. Candidate branch codex/observation-recovery-1.9.6 is also pushed. Worker chode-hq deployment **106148c2-10ee-4c8a-a888-3dab3a46846d** serves chode.borken.app. Documentation commits after this runtime do not require another deployment.

Full frozen Windows npm test passed: C:/Users/fogen/income/New folder/chode-parity/qa-release-final-1.9.6.log. Exact final-runtime Linux Node 18/22 CI **39643007223 passed**. Live PowerShell installer downloaded 1.9.6 at 124355d into chode-release-1.9.6/live-installed. Actual installed Windows ConPTY opened the composer and exited cleanly with Ctrl+D, exit 0. Live installer rejected old source and modified latest-version runtime before changing the destination. Latest public Linux install CI **39643367716 passed on Node 18/22**, including actual published installation and native PTY startup.

Latest COMPLETE original checked public pilot: **2/5 (40%)**, unchanged versus 1.9.4. Grade-school 20/20 and list-ops 24/24 passed; zebra grading timed out; affine failed; POV made zero calls because all providers were cooling down. All original tests unchanged. This measured the earlier frozen 1.9.6 candidate 1b733bb (runtime SHA256 b722d99b3d33963766d0e09403cfe6715243cfbf38c6ff36a63cc72d55d729e8), before the later platform/cooldown/stderr/shared-tool-budget fixes. It is not a score for final runtime 124355d. Reports: benchmarks/results/polyglot-python-checked-1.9.6-2026-10-21*. Five adapted public Python development tasks are not the official 225-task Aider leaderboard or held-out evidence.

**COMPLETE: capacity-continuation pilot on frozen FINAL 1.9.6 scored 2/5 (40%): zebra-puzzle and list-ops passed; grade-school, affine-cipher and pov failed. Archived to benchmarks/results/polyglot-python-capacity-1.9.6-2026-10-21.{json,md,manifest.json} with adapter/continuation hashes. Not comparable to the original checked protocol (same shared 12-call/24-tool/420s budgets, waits included). Do not rerun or overwrite the frozen run.** Run: C:/Users/fogen/income/New folder/chode-public-bench/capacity-1.9.6/2026-10-21T17-19-26-468Z. Supervisor log: chode-parity/qa-capacity-pilot-1.9.6.log. Codex process session 18674 may continue after handoff; OpenCode should inspect files/process completion rather than depend on that tool session ID. At handoff zebra PASSED its 2 original tests; grade-school was running. This is partial progress, not a final aggregate score. Its protocol is explicitly different: checkpoint capacity waits/resumes within the SAME total 12 model calls, 24 actual tool executions and 420-second wall budget. Waits count; cooldowns are retained; original tests and independent grading remain unchanged. Comparator rejects comparison as the original checked protocol.

Earlier targeted POV probe failed all 15 checks; it exposed batch/job recovery issues later fixed. Separate supervised repair of the old hanging zebra solver still timed out with unchanged tests. The new capacity pilot's fresh zebra success does not erase either failure. Earlier CSV ledger achieved 20/20 and VERIFIED only after explicitly supervised continuations/contract clarification, not an autonomous fresh-build score. Published artifact: benchmarks/dogfood/csv-ledger-1.9.4.

## Exact next actions for next agent

1. Capacity pilot finished and archived (see Status). OpenCode plugin set installed globally 2026-10-21: ponytail, opencode-dcp, context7, opencode-pty, supermemory, opencode-notifier, superpowers (plus pre-existing oh-my-opencode-slim). Uncommitted WIP: observation-progress [JOB RECOVERY] for repeated unknown-job-id polls (tests/observation-progress.test.js covers it); qualify with full npm test before any release commit. Live Linux install CI 39643367716 is confirmed successful. Read results.json completed/total and every task result; preserve failures, interruptions, hashes and protocol. Copy final results plus engine/helper/adapter hashes into benchmarks/results and update this handoff. Do not label the partial zebra success as a five-task score.
2. Analyze real failure traces before changing more code. Focus on empty provider responses, repeated observations, actual acceptance failures and whether capacity continuation helps within unchanged total budgets. Measure request prompt overhead; evaluate typed native tool-result continuation as an A/B hypothesis, not a proven cause. Never manually repair measured solutions or weaken tests. A new runtime gets a new frozen snapshot and separate recorded run.
3. Continue BUILD-REQUIREMENTS.md and real complete website/bird-data/RE dogfood after reliability work. Qualify changes with relevant regressions, full tests, Linux/Windows packaging/startup, actual live install and integrity rejection; push/deploy authorized releases. Update this handoff after each major item. Do not claim supremacy, flawless builds or held-out performance without evidence.
4. Execute the benchmark-superiority plan (section below) after the user approves it: TDD task-by-task, native in-session, until cleared. Keep this handoff's checklist in sync after every task.

## Active project: public benchmark superiority (2026-10-21)

Goal: beat OpenCode and Claude Code on the same public tests they publish scores for. Spec: docs/superpowers/specs/2026-10-21-public-benchmark-superiority-design.md. Plan: docs/superpowers/plans/2026-10-21-public-benchmark-superiority.md (7 tasks; ALL COMPLETE 2026-10-21, reviewer fix pass applied, full npm test green, merged to master).

Settled: SWE-bench Verified (500) + SWE-bench Multilingual (300 tasks, 9 langs, zero Python) + Terminal-bench 2.1 (89 tasks, fixed rev; 2.0's 28 broken tasks excluded). Baselines are published scores on the same tests, never head-to-head reruns: Codex CLI + GPT-5.4 TB 2.0 76.0%, Claude Code + Opus 4.6 TB 2.0 58.0% (tbench.ai/news/terminal-bench-2-1), mini-SWE-agent + Gemini 3 Flash Multilingual 72.7% (BenchmarkList, third-party). Known gaps, not zeros: no published OpenCode score anywhere; no Claude Code CLI score on Verified/Multilingual canonical splits. Free-only: the claim is score-at-$0, no paid fallback. Order: Lite smoke → Verified full → Multilingual → TB 2.1; each stage gated on the harness working, never on its score. Docker: local Docker Desktop smoke first; full-run venue decided at stage gate. Deterministic mode: single provider via forceProvider (chode.js:3400), no race, fresh cooldown per task. New protocol name 'Chode SWE-bench pilot v1' with comparator entry; never compare SWE-bench scores to the 5-task pilot.

Checklist (all complete 2026-10-21, merged to master):
- [x] Task 1 runner scaffold: benchmarks/swebench-runner.cjs
- [x] Task 2 patch extraction: benchmarks/swebench-patch.cjs
- [x] Task 3 agent adapter + predictions.jsonl: benchmarks/swebench-agent.cjs
- [x] Task 4 Lite smoke list + comparator entry + PUBLIC-PILOT.md section
- [x] Task 5 Multilingual 300-task list (zero Python)
- [x] Task 6 Harbor TB 2.1 agent shim: benchmarks/harbor-chode-agent/
- [x] Task 7 pinned published-baseline scorecard: benchmarks/results/baseline-scores.json

Resume: loop now continues once after a FAILED finalize with spare budget (single-shot VERIFICATION FAILED push, caps still bound spend) — fixes tasks ending early with budget spare; full suite green. Next: live dogfood proof on repair1-style stall + commit.

## Key files changed

1.9.6 commits: 1b733bb added observation/batch/job recovery; cfd4544 saved interim evidence; 124355d finalized further recovery and benchmark continuation.

- observation-progress.js + chode.js: repeated identical successful read/grep/glob observations trigger bounded implementation guidance. No tool skipping, extra calls, permission expansion or secret payload retention; only hashes are tracked. Genuine mutations reset the tracker.
- edit-transactions.js + toolMultiEdit: preserve safe individual edit recovery through atomic preflight failure; report the failed file/read guidance. A failed batch changes no files. Existing explicit overwrite permission still governs replacement suggestions.
- toolJobs: unknown IDs guide jobs list and exact returned IDs. A foreground command has no background job ID; unknown jobs never mean success.
- Provider error classification: stream_aborted enters the existing short transient cooldown. Real local HTTP reproduction went from 3 wasted interrupted requests to 1; saved work/retryAt and zero calls while cooling are tested. Partial native tool arguments never execute. Canceled race losers remain excluded from failure accounting.
- Universal agent prompt states actual platform/default shell, portable Node/Python commands and jobs log usage. This addresses real Windows tail failures on non-native routes too.
- Failed exec preserves BOTH stdout and stderr, bounded diagnostic tail and actual exitCode; stdout previously hid stderr.
- Optional _toolBudget shares actual execution limits across nested repairs/resumes; existing callers without it retain behavior. benchmarks/capacity-continuation.cjs, public-pilot-agent.cjs and public-pilot.cjs add --checked --capacity-resume. Shared model/tool/feedback budgets, stable acceptance digest and no stale starting-source replay across resumes. No runtime quotas are reset.
- New tests: observation-progress, batch-recovery, native-interruption-capacity, platform-context, exec-diagnostics, capacity-continuation, shared-tool-budget. Package scripts/Linux workflow include them. Package/lock/Worker/install assets/release metadata are 1.9.6 and synchronized.
- Existing 1.9.4/1.9.5 fixes retained: first nonempty provider race/cancellation, bounded native streaming, paged complete file reads, shared model call accounting, immutable Python/JS acceptance, early capped acceptance feedback, explicit resumable PARTIAL and Python hang stack evidence.

## Design decisions

Extend existing Node patterns and permission checks. Typed native calls/documented fences only; arbitrary JSON is not executable. Keep workspace/secret/fixture protections, independent verification, REA and HELIOS/HEMO. Execution is not proof of effect or test success. Saved work, real check output and precise failure status are mandatory.

Respect Retry-After and persisted cooldowns. No quota bypass/key cycling/paid fallback; Pollinations and aliases remain forbidden. Preserve strict-free keyed-provider exclusion and prior OpenCode GitHub Models removal/Groq fixture. User approved <=18 KB of already-returned build observations excluding credentials; this is NOT training/export consent.

Ajax/Odysseus lessons: valid tool arguments, concise outputs, recovery, measured prompt slimming and verified effects. Research checked 2026-10-21: https://data.pewdiepie.com/ announced a planned Qwen 3.5 9B fine-tune; no downloadable model or validated coding superiority established. Primary records: https://github.com/odysseus-dev/odysseus/discussions/2724 ; https://github.com/odysseus-dev/odysseus/issues/2750 ; https://github.com/odysseus-dev/odysseus/discussions/6466 . Do not copy AGPL code without license review. Prompt slimming remains future work; measured agentToolPrompt before the platform addition was 4554 characters/~1139 estimated tokens, NOT total request usage.

## Risks / debt

Original checked score remains 40%; no general superiority established. Final capacity-mode score pending. Provider routing varies, so differences are not causal proof. Broad feature parity, local generation quality, measured cost accounting, prompt slimming, complete autonomous bird-data websites, broad RE dogfood and held-out evaluation remain incomplete. Native observations still use legacy text replay; typed role continuation is an untested hypothesis.

Unrelated tracked benchmarks/dogfood/expense-tracker/expense.cjs and all untracked user artifacts are preserved. Never stage them or touch OpenCode session databases. User already authorized routine fixes, tests, push and deploy. Do not spend remaining Codex quota on a new feature during this takeover.

## How to test what was just built

From C:/Users/fogen/chode: npm test. Final exact frozen local qualification log: C:/Users/fogen/income/New folder/chode-parity/qa-release-final-1.9.6.log. Final candidate CI: https://github.com/fogennnnn/chode/actions/runs/39643007223 . Public live-install follow-up: https://github.com/fogennnnn/chode/actions/runs/39643367716 . Earlier restricted suite attempt hit Windows temp cleanup EPERM; ordinary-permission final suite passed. No tests were weakened.

Live metadata: https://chode.borken.app/api/release . Latest actual Windows installation: C:/Users/fogen/income/New folder/chode-release-1.9.6/live-installed/node_modules/chode/chode.js. Stale/tamper verifier: C:/Users/fogen/income/New folder/chode-release-verification/verify-live-install.cjs (requires local package/live versions to match). It overwrites its own latest verification evidence, not user work.

Dataset C:/Users/fogen/income/New folder/public-polyglot at 7e0611e77b54e2dea774cdc0aa00cf9f7ed6144f. Fixed tasks zebra-puzzle, grade-school, list-ops, affine-cipher, pov. Original checked run: chode-public-bench/checked-1.9.6/2026-10-21T17-08-54-354Z. Final engine snapshot: chode-public-bench/candidates/release-final-1.9.6 (engine-manifest.json). Current capacity run records adapterHash/continuationHash in protocol.json. Read benchmarks/PUBLIC-PILOT.md before rerunning. Never overwrite measured snapshots.

## Context the next agent needs

Git ROOT is C:/Users/fogen; app C:/Users/fogen/chode. Use git -c safe.directory=C:/Users/fogen -C C:/Users/fogen with EXPLICIT app/workflow paths; never broad-stage home. Current branch master. No local chode-1.1-agentic branch exists; authorized atomic promotion uses master:master and HEAD:chode-1.1-agentic. Check LASTEXITCODE before each dependent PowerShell command; failed native commands do not stop scripts automatically.

Writable stage: C:/Users/fogen/income/New folder/chode-parity. Main promotions were guarded by HEAD, target status, before/after SHA256 and backups (pre-1.9.6-backup/pre-final-1.9.6-backup). Do not rerun old promotion scripts against newer source. chode.js contains NUL: use rg -a and Node UTF8; avoid whole-file PowerShell normalization. Master requirements: BUILD-REQUIREMENTS.md and C:/Users/fogen/agents2.txt.

Deploy: node C:/Users/fogen/node_modules/wrangler/bin/wrangler.js deploy --config C:/Users/fogen/chode/wrangler-chode-hq.toml. Regenerate install assets after packaged source changes. Only claim the version/checks actually verified. Read this handoff and the active action after compaction; avoid repeated objective summaries/provider research.
