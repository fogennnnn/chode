# OpenCode handoff — 2026-10-26 — Chode 1.9.18

## Release state

PUSHED: release commit b449a60 is on master. DEPLOYED: Chode 1.9.18, Cloudflare Worker chode-hq version 2e28784a-97d2-4774-a819-70abd536bbe3 at https://chode.borken.app. Live `/api/status` reports 1.9.18; `/api/release` matches master. A prefix install reports 1.9.18 (`b449a60f54c1`). Note: the first deploy attempt for 1.9.18 silently kept serving 1.9.17 (wrangler reported a stale version ID); redeploying fixed it. Windows remains untested.

## 1.9.18 — free runs get the full parallel workforce (2026-10-26)

Removed the last free-tier carve-outs so free runs are exactly as capable as paid ones: `cmdAI` no longer disables orchestration for `--free`, the run-agent gate no longer skips delegation for `freeOnly`, and the orchestrator uses the same worker concurrency (3) regardless of tier. Edit-only follow-ups still stay sequential (only units that create new files fan out), and subagents narrate start/finish instead of running silent. Regression: new `tests/free-orchestration.test.js` proves a keyless free build fans out to 3 parallel scoped workers with real in-flight overlap and still verifies — so free mode can never silently regress to single-agent runs again.

## 1.9.17 — end-of-run recap: what got done (2026-10-26)

Every run now ends with a short done-list on stderr (stdout stays pure for pipes): status line (`Done: Verified` / `Partial` / `Failed` / `Queued`), files written vs edited, checks (acceptance, browser), model + tokens, and a next step (`/retry <id>` or `chode ai --resume`). Implemented as a pure, tested `sessionSummary(res, actions, opts)` builder wired into both the one-shot CLI path and the interactive REPL turn display. Regression: new `tests/session-recap.test.js` covers the builder for verified/partial/failed runs plus a one-shot CLI run asserting the recap lands on stderr while stdout keeps only the answer.

## 1.9.16 — a correct no-op continue verifies instead of failing (2026-10-24)

Typing "continue" (or any follow-up needing no edits) on a finished workspace could never certify: the cheap gate demanded recorded writes/edits for every mutating-classified task, so a model that correctly changed nothing got `FAILED: mutating task recorded file changes — no writes/edits observed`. The acceptance check now runs first in the gate, and a passing acceptance test certifies a change-free run ("no changes needed") instead of failing it. The later acceptance assertion reuses the same result instead of running the test twice. Regression: new `tests/noop-continue.test.js` covers both the gate and a full read-only `runAgentLoop`, and the previously hanging bare-`continue` resume now returns VERIFIED.

## 1.9.15 — resume no longer fans out to silent parallel workers (2026-10-24)

Resuming with follow-up wording (`--resume` + a new prompt, i.e. "continue") created a fresh plan and fanned out to quiet parallel subagents that burned the model budget on what was usually edit-only work — and concurrent edits to one file corrupted it (observed: overlapping `calc.cpp` rewrites). The orchestrator now only fires when at least two units actually create new files; edit-only follow-ups stay in one sequential loop, and subagents narrate start/finish so resume no longer looks dead. Regression: `tests/orchestrator.test.js` asserts an edit-only three-file plan never delegates yet still verifies.

## 1.9.14 — smarter interaction targeting (2026-10-24)

The browser interaction check no longer demands a visible change from an already-active control when an inactive alternative exists: `chooseActions` records per-button active state (`aria-pressed="true"` / `.active`) and prefers inactive primary controls, so filter groups exercise real state changes (e.g. North instead of the already-selected All) instead of failing on correct no-ops. Coverage is preserved — if every candidate is already active, the active ones are still tested. Regression: `tests/browser-check.test.js` gains a two-button filter fixture proving the inactive control is chosen and the page passes. This unblocked the Meridian Ops dashboard matrix case alongside its `min-width: 0` + `overflow-x: auto` table-panel fix for mobile overflow.

## Release state

PUSHED: release commit 7ef9a23 is on master. DEPLOYED: Chode 1.9.13, Cloudflare Worker chode-hq version 25501e2e-f5dd-4913-9363-570cccc8f639 at https://chode.borken.app. Live `/api/status` reports 1.9.13; `/api/release` advertises the 1.9.13 manifest matching master. A prefix install verifies cleanly (`Installed Chode 1.9.13 · 7ef9a235c903`). The first deploy attempt had served a stale manifest, so the public installer correctly refused a mismatched download; redeploying after the push fixed it. Windows remains untested.

## 1.9.13 — optional metrics login and usage graphs (2026-10-23)

Login stays optional: `chode login [handle]` stores a local handle plus a random bearer token in config (0600, masked everywhere); `chode logout` removes it and `chode whoami` shows the handle with a masked token. `chode metrics --export [--days N] [--out file]` aggregates the local append-only `usage.jsonl` into per-day/per-provider request, token, error and cost totals (default 30d, max 90d). `chode metrics --sync --yes [--endpoint URL]` uploads only that aggregate — no prompts, keys or file contents — and requires login plus explicit `--yes`.

`https://chode.borken.app/metrics` renders tokens-per-day and tokens-by-provider SVG graphs from synced data, with localStorage login, load/delete controls and CLI instructions. The worker stores one record per SHA-256(token) in `METRICS_KV`, validates shape and size limits, and returns 401/404/503 for missing login, missing data or missing storage. `wrangler-chode-hq.toml` now binds `METRICS_KV`.

Validation: full `npm test` passes on Linux Node 26.8.1, including new `tests/metrics-login-sync.test.js` (local aggregates, explicit sync, KV-backed worker routes) wired into `test:cli`. `release.json` and `install-assets.js` were regenerated with `node build-installer-assets.cjs` after the changes.

## Release state

PUSHED: release commit 672daea is on master. DEPLOYED: Chode 1.9.12, Cloudflare Worker chode-hq version fcf9d768-840a-4a62-8fda-e46783d057a5 at https://chode.borken.app. Live `/api/status` reports 1.9.12; `/api/release` advertises the 1.9.12 manifest. A clean public install reports `Chode 1.9.12 · 672daeabd21f`, `chode --version` returns 1.9.12 and `chode doctor` exits 0. Windows remains untested.

## 1.9.12 — mandatory visual gate and prompt logs (2026-10-23)

Commit `672daea` makes Chromium verification mandatory for every prompt, not only HTML-looking tasks (`CHODE_BROWSER_CHECK=0` remains the explicit skip). The check now samples canvas pixels directly and decodes the screenshot as a fallback, so a transparent or uniform canvas fails even when the page, controls and console look healthy. Primary interactions run at both desktop 1440x900 and mobile 390x844. The Documents regression site was fixed at the source: its navigation script referenced a missing `#nav-toggle`, and converter/password inputs lacked working labels. A live check of Documents now exits 0 with no failures.

The workspace TUI now saves each prompt's full output under `.chode/workspace/logs/<session>/`. Clicking a completed `You` prompt opens that saved log; Esc/Ctrl+C closes it; the wheel, PgUp/PgDn and Shift+Up/Down scroll both the conversation and the log view. SGR mouse input is parsed and suppressed before readline sees it. Log metadata (`turn`, `log`, `logComplete`) persists with the session, and log reads reject symlinks and bound memory use. `workspace-log.js` and `tests/workspace-logs.test.js` are included in the package and release manifest.

Helios was enabled for `/home/rrr/Documents`; the prior zero count was expected because no verified build had run while reliability was enabled. To prove the anchor path, a record for the actual Chromium-verified Documents state (`index.html`, `script.js`) was captured through the same reliability-memory API and sealed as `85b195b96157c5f9a7c8c4674c2e126dd0b6f3b7370025f64915a2ab37aa0b11`. Status now reports `records:1`, `anchored:1`, `requireSeal:true`. This record validates capture/upload; it was not produced by a fresh model build.

Validation: full `npm test` passes on Linux Node 26.8.1. The changed test groups (`workspace-view`, `workspace-polish`, `workspace-logs`, `workspace-lifecycle`, `browser-check`, `frontend-copy`, `installer`, `release-security`, `app-research`) passed 20 consecutive rounds. `release.json` and `install-assets.js` were regenerated with `npm run build:installers` before commit and deployment.

## 1.9.11 — real browser verification (2026-10-22)

Commit `a8619a8` adds zero-dependency `browser-check.js`: a short-lived local HTTP server plus headless Chromium through the DevTools Protocol (global WebSocket). It reports load failures, runtime/console errors, HTTP failures, broken images, missing anchors, unlabeled visible controls, horizontal overflow at desktop (1440x900) and mobile (390x844), and primary controls that do nothing. Screenshots are saved under `.chode/visual/`. The agent gate and HTML-artifact repair loop both run it; browser failures become repair checks, so a dead button or runtime exception blocks completion until fixed. `CHODE_BROWSER_CHECK=0` disables it; environments without Chromium skip it and disclose the skip rather than claiming browser verification.

Validation: full `npm test` passes on Linux Node 26.8.1, including the real-Chromium regression that catches a `ReferenceError` and a dead button, feeds the gate, and then converges after a repair. Public installer now installs `Chode 1.9.11 · a8619a887838`; `chode --version` reports `1.9.11`, `chode doctor` passes, and the installed runtime contains `browser-check.js` with Chromium available. Windows remains untested.

## Landing page refresh (2026-10-22)

Commit `0f5eba8` updates https://chode.borken.app for the new capabilities. The hero, metadata, terminal demo, feature grid, pipeline, command reference, benchmark card, CTA, and footer now describe parallel plan workers and browser-verified output instead of the older 1.9.9 claims. Provider copy and `/api/status` are corrected to 17 providers (10 free-tier keyed, Ollama local, four keyless, two paid). Command blocks reserve space for the copy control, wrap long URLs, and use a two-column reference layout; mobile overflow was fixed after the wider grid caused a 46px overhang.

Validation: local and live Chromium checks pass at 1440x900 and 390x844 with no horizontal overflow, console errors, failed assets, broken controls, or missing anchors. Live `/api/status` reports version `1.9.11` and `providers: 17`; the deployed page contains the 1.9.11 badge, browser-verification feature, parallel-worker feature, and `chode verify` command.

## 1.9.10 — scoped parallel orchestration (2026-10-22)

Commit `e608314` adds an orchestrator for independent multi-file plans. After PLAN, a mutating v2 task with at least three file-disjoint units is split into scoped workers (up to three concurrent, max four units). Each worker owns only its listed files; `scopeTargets` denies writes/edits/multiedits outside that set. Workers retry once if a declared file is missing/empty or fails JS/JSON syntax, and receive a bounded `[DELEGATED WRITE REQUIRED]` nudge if they answer without writing. The parent then runs the same integrated `v2VerifyAndRepair`, so full-project checks and repair still decide completion. If a unit stays incomplete, the parent continues only the missing pieces with an `[ORCHESTRATOR INCOMPLETE]` note. `CHODE_ORCHESTRATOR=0` disables the feature.

Plan ownership is derived from the step instruction before the `check:` text, and an `Edit <file> to ...` step owns its first file; without this, check-text references (for example `check: open index.html`) collapsed every unit into one and silently disabled orchestration. Regression: `tests/orchestrator.test.js` plus package `test:agent`.

Validation: full `npm test` passes on Linux Node 26.8.1. Live free build of three independent helpers completed `VERIFIED` with three subagent sessions and all three files present. Public installer installed `Chode 1.9.10 · e60831429347`; the installed command repeated the three-file live build as `VERIFIED` with three subagent sessions. Earlier six-file website orchestration attempt exposed the check-text ownership bug and slow free-provider windows; after the fix the small live runs completed, but no fresh full website run has been certified yet. Windows remains untested.


## Current work — deterministic completion (Linux clone, 2026-10-22)

This checkout is the fresh master clone at `/home/rrr/chode-latest/chode`, not the Windows release tree above. The completion changes are **committed and pushed as d9b3eba, deployed to chode-hq, and verified through the public installer**. Windows remains untested. Full `npm test` passes on Linux Node 26.8.1 after the changes.

## 1.9.9 — repair protocol and watchdog progress (2026-10-22)

A live TUI test exposed two defects after 1.9.8. A website build ended `FAILED` on missing anchor targets (`#features`, `#showcase`, `#pricing`, `#faq`, `#contact`), and the first repair replied with prose instead of a tool call, so the harness stopped with "no observable changes". The automatic resume then sat for ten minutes and the TUI watchdog killed it.

Fixes:
- Repair prompts now require a concrete file-changing tool call and say prose-only replies are failed repairs. A repair that changes nothing gets one protocol retry with an explicit `[PREVIOUS REPAIR CHANGED NOTHING]` instruction before stopping.
- Missing-anchor failures now include the exact repair hint: add the matching `id` to a real section or point the link at an existing target.
- TUI watchdog progress now refreshes on narration, stdout and stderr, not only tool/token messages.
- Capacity waits are sliced into 30-second intervals with narration, so a legitimate wait no longer looks like a ten-minute stall.

Vertical tests cover the prose-only repair retry and all previous completion/recovery behavior. Full `npm test` passes on Linux. The public installer installed `Chode 1.9.9 · 2ce77aeb5269`, and a live installed-Chode anchor regression (five missing ids plus non-empty CSS/JS) completed `VERIFIED` via kilo with all five acceptance checks passing.

The product goal was clarified: make Chode roughly ten times better at finishing clean, polished work — not spray the registry with hundreds of unverified providers. Do not pursue provider-count inflation. Prefer measured completion, honest certification and recovery.

What changed:
- **No `UNVERIFIED` dead ends when local proof is strong.** `v2VerifyAndRepair` now returns deterministic certification (`verdict: STATIC`, `via: static-checks`, `completionStatus: VERIFIED`, `verifyStatic: true`) when the cheap gate plus `build-quality` checks pass but no independent reviewer exists, the reviewer is the author, its identity is missing, it returns no result or it returns an unclear verdict. The final answer discloses that checks were local/deterministic. A real independent `PASS`/`FAIL` still wins; real failures still `FAILED` and repair up to three rounds.
- **Completion rounds instead of early exit.** `cmdAI` runs bounded continuation rounds (`CHODE_COMPLETION_ROUNDS`, default 3, max 6), shares `agent-budget` across rounds, waits for temporary capacity (`CHODE_MAX_CAPACITY_WAIT_MS`, default 15 min), queues unfinished work, and exits nonzero only for genuinely `FAILED`/`UNVERIFIED` results. One-shot output now narrates progress.
- **Plain-language narration** through `onNarrate`: CLI, REPL, TUI worker and workspace TUI show planning, checking, local-certification and verified stages without raw tool noise.
- **Honest transport metadata**: `worker-transport` keeps `verifyVerdict`, `verifyStatic`, `verifyNote` and `repairRounds`.
- **Cross-platform safety**: `resolveWorkspaceTarget` now treats `\` as a separator on POSIX and rejects drive-letter/UNC paths, so Windows-style traversal cannot slip through as a filename. `resolveReaRunner` resolves `npx-cli.js` through version-manager symlinks and PATH, fixing shell-free REA execution on mise/nvm/asdf installs.
- Tests updated to the new contract (`v2-stages`, `agent-workflow`, `autonomous-repair`, `build-context`, `task-group`, `free-capacity-stop`) plus a new `tests/completion-rounds.test.js` that proves the outer `cmdAI` loop continues a failed build, edits the file and finishes locally certified. `release.json`/`install-assets.js` were regenerated with `npm run build:installers`. One cold-start-sensitive local HTTP test budget was raised from 150 ms to 500 ms; the tested bound is still 1.5 s.

Next highest-value steps:
1. Run the full suite on Windows and the frozen release harness; do not claim completion from Linux alone.
2. Exercise a real free build that previously ended `UNVERIFIED`; confirm the final answer names the local checks and still queues/repairs genuine failures.
3. Deterministic fallback was deliberately kept to known-safe checks (file existence, non-empty size, JS/JSON syntax, repo build/test, declared deliverables). Free-form plan `check:` strings are model-authored and are **not executed**; executing them would turn verification into an arbitrary command surface. If added later, use a strict command allowlist plus declared-file confinement and tests.
4. Only then commit/push/deploy; keep the version/checks honest. (The end-to-end `cmdAI` completion-rounds test is now in `tests/completion-rounds.test.js`.)

Live validation (2026-10-22): an earlier keyless attempt hit kilo 502, llm7 429, uncloseai public-beta-closed and an OVH timeout; Chode honestly queued the task instead of certifying it. After deploying the refreshed release metadata, the public installer first succeeded as 1.9.7 and then, after the version bump and worker redeploy, installed `Chode 1.9.8 · 37e4bff132f1`. A real `chode ai --check acceptance.cjs` dogfood build then completed with `status: VERIFIED` via OVH, wrote `convert.cjs`, and passed all five acceptance cases. The stale `/api/release` metadata was the only installation defect found: it still advertised the pre-commit chode.js hash and was fixed by redeploying the chode-hq worker.

## What changed

Opt-in Debtaur/Helios workflow memory implemented in reliability-store.js, reliability-services.js, reliability-memory.js and chode.js. Read RELIABILITY.md for exact contracts and limits. VERIFIED builds automatically archive immutable workspace-scoped evidence and eligible already-returned source excerpts. Recall rechecks current file hashes every model turn, uses deterministic bounded selection, labels history untrusted, and stays out of independent verification. noMemory disables it. Up to 1024 records, 64KB per record; 5KB recalled context. Credentials, links, foreign state and unobserved source excluded.

Helios receives ONLY opaque hash manifests, never source/prompts/pathnames. Actual API origin is https://ai.oooooooooo.se (helios.oooooooooo.se is an HTML landing site). Existing private workspace identity reused; signing key pinned. Local Ed25519 verification, Merkle proof/index/direction/root checks, hash binding and stable idempotency prevent tampering/duplicate seals. HTTPS ledger root is not independently signed: do not claim trustless consensus or improved coding accuracy from signatures.

Debtaur live WASM endpoint https://ooooo.fogeboro.workers.dev/api/judge receives only constant generic controlled-language policy facts. Grounding is established locally. Only exact derived direct verdicts accepted, never model prose or cone candidates. Both services have deadlines, cancellation, response limits and persisted Retry-After cooldowns. Offline service failure omits recall or queues seals; it cannot mark a failed build verified.

Integration is ENABLED in C:/Users/fogen/chode, requireSeal=true, identityConfigured=true, signing key pinned. Zero production records so far is expected: no fresh VERIFIED production workspace build has completed. It is per workspace: chode reliability enable; status; sync; disable; clear. Existing private config retained, no secrets committed.

## Validation and honest limitations

Candidate Linux Node18/22 CI PASSED: https://github.com/fogennnnn/chode/actions/runs/39786405174. Logs include both new integration suites and native packaged PTY startup.

Windows full frozen integration npm test passed: qa-expanded-final-1.9.7.log. After preserving ab5284c, merged npm run passed units/CLI/agent, then sandbox EPERM during jobs test temp cleanup. Unchanged dogfood, REA and robust groups were rerun with normal filesystem permissions, all exit0: qa-merged-dogfood-1.9.7.log, qa-merged-rea-1.9.7.log, qa-merged-robust-1.9.7.log. New tests cover actual HTTP/Ed25519/Merkle integration and 40 extra boundary cases including lying judge, signature/root tampering, lost response idempotency, 120s persisted rate limits, key rotation, symlinks/hardlinks, corruption, locks and actual 1024-record capacity. No tests weakened. An earlier unchanged 200ms watchdog test was timing-sensitive; its isolated rerun and final frozen suite passed, failed log retained.

Live Windows install.ps1 was downloaded, inspected and executed into a fresh isolated prefix. Installed 1.9.7 f531c43f79e7 and --version passed. Live installer rejected old1.7.3 and same-version tampered runtime before destination modification. The isolated prefix warned an older global command exists earlier on PATH; global installation was not overwritten. New live Linux qualification run: https://github.com/fogennnnn/chode/actions/runs/39786738029 PASSED on Linux Node18/22, including the public installer and native installed PTY startup.

Live services were exercised end to end with synthetic source only: real Debtaur derived verdict, real Helios write/idempotent reread, local signature/Merkle/root checks and recall. Digest 6174e9c6a80ac3d0d0b1401dcd52e71f51ccd0994c1c433fae5d37eead34bb08. Evidence in benchmarks/results/reliability-live-1.9.7.json.

Real strict-free inventory CLI dogfood produced a model-written program passing all15 unchanged original checks. Chode returned UNVERIFIED/exit1 because independent reviewer returned no result; correctly archived zero records/anchors. This is private development evidence, NOT an autonomous benchmark pass or accuracy improvement claim. Evidence benchmarks/results/reliability-inventory-1.9.7.json. The program was not manually repaired. Original tests unchanged. Next highest-value task is bounded reviewer-capacity recovery without treating author checks or unavailable review as verification, then another predeclared complex free build.

## Local artifacts and preserved work

Git root C:/Users/fogen; application C:/Users/fogen/chode. Always explicit app paths with git -c safe.directory=C:/Users/fogen; never stage home broadly. Stage/logs/backups: C:/Users/fogen/income/New folder/chode-integrations-2026-10-22. Actual dogfood source, golden acceptance and logs: ../reliability-dogfood-inventory. Live proof fixture: ../reliability-live-probe. Installer negative results: ../chode-release-verification/negative-install-results.json. New fresh installed package: stage/live-installed/node_modules/chode.

Preserve unrelated dirty expense-tracker source, tests/agent-workflow.test.js (appeared during qualification), untracked OpenCode/config/artifact work. Prior dirty handoff content is preserved in full below. No subagents, no quota bypass, no Pollinations, no credential disclosure. Public pilot2/5 and SWE-bench smoke0/10 remain historical evidence; no demonstrated superiority over OpenCode/Claude Code. Do not change original benchmark tests or budgets to improve scores.

---

## Prior handoff preserved verbatim


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

Resume: LIVE PROOF 2026-10-22 (artifact chain converged on user command) + HELIOS wire fix (content string, flat body) with real sealed record eda3fffc; full suite green on 1.9.18 branch. Next: fresh-user e2e on another machine.

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

## 2026-10-26 (opencode) — 1.9.19: 10-build dogfood campaign + PENDING-meta fix, deployed

- Dogfood campaign 10/10 VERIFIED-or-core on free lanes (ovh mostly; kilo rate-limited, llm7 429-blocked ~24h): gps2, quiz1, expense2, weather3, kanban2 (working DnD/persistence/CRUD core; label filter + done-this-week counter missing), notes1, pomodoro3, recipes1, budget1, chat2 (localStorage conversations + search + export; rename/delete missing). Losses banked honestly, no re-runs past two attempts: weather1/2 (old 8-step cap + passive model), kanban1 (llm7 429, zero files), kanban3 (edit-corrupted app.js), pomodoro1 (id drift, missing about.html), pomodoro2 (20-call edit death spiral), chat1 (placeholder stubs), mig1 (passive), mig2 (content-thin bonus).
- Process finding, now standard brief doctrine: WRITE-ONCE (whole-file writes, no edit, pinned element ids, flat code) converges in 6-9 calls with zero errors; incremental edit is where weak models die (empty/non-unique oldString, duplicate consts, nested functions).
- Engine fixes shipped: (1) same-run overwrite ownership — files a run creates are rewritable in-run, fresh runs still need create/overwrite declaration (TDD tests/v2-guards); (2) orchestrator uncapped by default, stagnation breakers instead (4 identical success turns / 6 zero-mutation turns → resumable PARTIAL; tests/agent-loop); (3) forced toolCap exhaustion now reports meta PARTIAL + saveProgress, fixing stale PENDING (notes1 hit exactly 24/24 tools; TDD tests/v2-budget toolCap:2 endless-writes asserts meta PARTIAL, fails PENDING without fix).
- Harness-only (temp, not chode source): verify-site.cjs now FAILs on zero site files and on missing index.html/app.js/styles.css/about.html; dogfood default budget 12→20.
- Release 1.9.19 = branch opencode/rea-fullstack fast-forwarded onto master (85b79e5 HELIOS wire fix + 93f4e07 prompt-integrity + 84a3afe overwrite + e7083a3 stagnation + e782180 PENDING-meta). Version bumped package.json/package-lock/chode-hq-worker.js(3 strings); install assets regenerated via npm run build:installers. Full npm test green (all suites, 0 failed) — see C:/Users/fogen/AppData/Local/Temp/opencode/npm-test-1.9.19.log.
- Deploy: node C:/Users/fogen/node_modules/wrangler/bin/wrangler.js deploy --config C:/Users/fogen/chode/wrangler-chode-hq.toml; verify https://chode.borken.app/api/release reads 1.9.19.
- Next: run benchmarks to update the benchmarks section at chode.borken.app (read benchmarks/PUBLIC-PILOT.md first; never overwrite measured snapshots). Test stray cleanup: cap-*/force-*.txt removed after TDD runs. Unrelated tracked chode/benchmarks/dogfood/expense-tracker/expense.cjs edit remains the user's — never stage.

## 2026-10-24 (Linux workspace /home/rrr) — 1.9.13 + metrics login/graphs deployed

- Committed `fd5641e` (CLI help documents `metrics`/`login`/`whoami`/`logout`) on top of `7ef9a23` (Release 1.9.13); pushed master to origin.
- Deployed chode-hq worker (version 138ea97d-120c-4ec6-af64-a14f4ff4f864) to https://chode.borken.app; verified live `/metrics` page renders login + Tokens-per-day/by-provider graphs.
- Metrics feature: `chode login [handle]` (optional local identity, token shown once), `chode whoami`/`logout`, `chode metrics --export [--days N] [--out file]`, explicit `chode metrics --sync --yes` (POST aggregates only — no prompts/keys — to `/api/metrics` with Bearer token). Server stores per-token windows in METRICS_KV; GET/DELETE require the token. Covered by `tests/metrics-login-sync.test.js` (already in `test:cli`).
- Full `npm test` passes on 1.9.13 with all current fixes.
- Build-matrix status: py-textstats, c-stats, node-inventory VERIFIED; cpp-calc and wasm-math now VERIFIED fresh (README checks added to both acceptance files); web-portfolio acceptance passes in workspace `runs/2026-10-23T23-39-38-757Z-web-portfolio` with only two browser micro-fixes left (submit-input aria-label, `.mobile-panel.open` class on toggle) — resume is saved, blocked on free-provider rate limits. web-dashboard/shop/game/docs not yet run (provider-blocked).
- Provider notes: OVH endpoints are Meta-Llama-3_3-70B / Qwen2.5-VL-72B / mistral / Qwen3.8-27B @4096 tokens (gpt-oss-120b removed for Harmony empty-content); 429s fail fast without burning endpoint buckets; 200-empty/5xx/400-empty rotate endpoints; `providerEndpointCursor` round-robins.
- Next: resume the portfolio micro-fixes when providers recover, then run web-dashboard/shop/game/docs, then release.
