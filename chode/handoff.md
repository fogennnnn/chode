# chode Handoff — 2026-10-21 — Verified release 1.9.5

## Status

Production is **1.9.5**, pushed to GitHub master and chode-1.1-agentic at release commit 137c1dcf67f3587525c6ff6be1f74406d11747cc (runtime 24020b049998a28d19358761abd541306b82ee2c). Worker chode-hq deployment b6888550-e359-4d39-93c3-d353dab0a80f serves chode.borken.app.

Full candidate npm test passed. Linux Node 18/22 candidate CI 39636839228 passed. Latest public installer/native Linux PTY CI 39637417812 passed on both versions. Live PowerShell installation returned 1.9.5; actual installed Windows ConPTY opened the composer and exited with Ctrl+D, exit 0. Live installer rejected older source and modified latest-version runtime before changing the destination.

Latest COMPLETE public development pilot remains **2/5 (40%), measured on released 1.9.4**. Grade-school (20/20) and list-ops (24/24) passed. Zebra timed out; affine failed 5 of 16 checks; POV made no implementation. All original tests stayed unchanged. This is five adapted public Python development tasks, not the official 225-task Aider leaderboard or a held-out result. Provider routing varies; do not attribute the 20-to-40-point change solely to code.

The targeted 1.9.5 POV probe FAILED with unchanged tests; it is not a new overall score. Replay of the unchanged hanging zebra solver captured its active solve stack after five seconds and still timed out at the original 30-second limit. Diagnostics work; the solver remains unfixed.

A real three-file CSV ledger reached 20/20 and VERIFIED after multiple explicitly supervised continuations and a contract-clarified whole-module rewrite. No manual solution edits. This is supervised repair evidence, not autonomous fresh-build performance. Published artifact: benchmarks/dogfood/csv-ledger-1.9.4.

## Exact next actions for next agent

1. Exercise actual Chode repair with the new Python stack evidence and safe edit recovery. Diagnose repeated read/todo turns and empty provider responses from recorded traces; make general harness fixes, never hand-solve public tasks. The targeted POV probe did not exercise the new edit recovery successfully.
2. Measure prompt overhead and evaluate bounded typed native tool-result continuation against current text observation replay. Re-run the same fixed five-task protocol after qualified runtime changes. Any capacity-wait/resume experiment needs a separately declared protocol with shared total budgets; retain cooldowns and every failure.
3. Once repair reliability improves, continue BUILD-REQUIREMENTS.md, real complete website/bird-data/RE builds and held-out evaluation. Qualify releases with full relevant regressions, Linux/Windows startup, fresh public install and integrity rejection before push/deploy. No superiority claims without evidence.

## Key files changed

- chode.js/provider-race.js: first nonempty answer wins, transport cancellation, bounded empty retries, shared repair call accounting, explicit resumable PARTIAL/capacity stops, acceptance feedback after mutation (maximum three checks shared across repairs).
- native-tools.js/tool validation: six typed native core tools, bounded streamed arguments, no execution of incomplete calls or arbitrary JSON; cancelled native streams do not duplicate requests through buffered fallback. Native Kilo agent allowance 8192; legacy/manual default 2048 retained.
- read-window.js: bounded complete paginated observations, line and character continuation, Unicode/CRLF preservation; direct legacy read remains compatible. Workspace, credential, binary and size guards retained.
- acceptance-check.js: immutable JS/Python acceptance with nonempty test discovery, durable redacted evidence, 30-second/output limits and independent verification. 1.9.5 adds one Python stack dump at five seconds, canceled on completion, without changing tests or deadlines.
- 1.9.5 toolEdit mismatch guidance returns current-file read instructions and suggests small full replacement ONLY when an existing plan already authorizes overwrite. No mutation on mismatch or expanded permissions.
- Public pilot adapter separates initial source observations from permanent requirements. Focused tests cover racing, streams, paging, accounting, capacity, acceptance feedback, input separation, edit recovery and Python hang diagnostics. Package/lock, release/install assets and Linux workflow updated.
- Reports: benchmarks/results/polyglot-python-released-1.9.4-2026-10-21* and repair-diagnostics-1.9.5-2026-10-21.json. Historical failed/interrupted runs preserved.

## Design decisions

Extend the existing Node runtime and permission system. No quota evasion, paid fallback, automatic training/download pipeline or Pollinations (including aliases). Respect Retry-After and persisted cooldowns. Keep strict-free keyed-provider exclusions and prior OpenCode GitHub Models removal/Groq fixture.

Execution is not proof of effect. Completion requires real immutable checks and independent verification; background launch is not success. Never weaken tests, omit failures, hand-patch measured solutions or silently change budgets. Retain at most the user-approved 18 KB of already-returned observations excluding credentials; this is not consent to training/export.

Ajax/Odysseus lessons: reliable typed tools, concise outputs, recovery, measured prompt slimming and verified effects. Research checked 2026-10-21: https://data.pewdiepie.com/ announced a planned Qwen 3.5 9B fine-tune; no downloadable model or validated coding superiority established. Primary discussions: https://github.com/odysseus-dev/odysseus/discussions/2724 ; https://github.com/odysseus-dev/odysseus/issues/2750 ; https://github.com/odysseus-dev/odysseus/discussions/6466 . Do not copy AGPL code without license review. Prompt slimming remains future work.

## Risks / debt

Broad feature parity, local model quality, measured cost accounting, prompt slimming, complete autonomous bird websites and broad RE dogfood remain incomplete. Models still waste turns or return no answer; free capacity is finite. Native requests currently replay observations through legacy text, so typed continuation is a hypothesis to evaluate, not an established cause/fix. Python stack evidence identifies hotspots but does not itself repair algorithms. Avoid another cycle of repeated provider research and stale objective summaries.

Unrelated tracked benchmarks/dogfood/expense-tracker/expense.cjs and all untracked user artifacts were preserved. Do not stage them or touch OpenCode session databases. User already authorized routine fixes, tests, push/deploy; no new blanket confirmation is needed.

## How to test what was just built

From C:/Users/fogen/chode: npm test. Focused checks: node tests/edit-recovery.test.js and node tests/python-hang-diagnostic.test.js. Full candidate log: C:/Users/fogen/income/New folder/chode-parity/qa-candidate-1.9.5.log. Candidate CI: https://github.com/fogennnnn/chode/actions/runs/39636839228 . Public installer CI: https://github.com/fogennnnn/chode/actions/runs/39637417812 . Documentation-only commits after release do not imply runtime tests were rerun.

Live verification: GET https://chode.borken.app/api/release ; install in an isolated prefix from the actual published script; run --version and native terminal startup/exit. Latest Windows installation: C:/Users/fogen/income/New folder/chode-release-1.9.5/live-installed/node_modules/chode/chode.js. Integrity verifier: C:/Users/fogen/income/New folder/chode-release-verification/verify-live-install.cjs (requires main package and production versions to agree).

Public protocol: pinned Aider dataset 7e0611e77b54e2dea774cdc0aa00cf9f7ed6144f at C:/Users/fogen/income/New folder/public-polyglot. Fixed SHA256-selected zebra-puzzle, grade-school, list-ops, affine-cipher, pov. Strict free, one attempt, 12 shared logical calls/task, 24 tool cap, 420-second generation, 30-second provider setting, protected original unittest feedback and independent 30-second grading. Retain cross-task cooldowns. Latest full run: C:/Users/fogen/income/New folder/chode-public-bench/released-1.9.4/2026-10-21T10-45-45-272Z; frozen runtime SHA256 65f8824e0309d26ebe6df2505bdd9697e29e6e701974b88f7aef5832423c902b; helper hashes in engine-manifest.json. Targeted evidence: sibling targeted-1.9.5-pov and zebra-diagnostic-1.9.5. Never overwrite frozen engines.

## Context the next agent needs

Git ROOT is C:/Users/fogen; app is C:/Users/fogen/chode. Use git -c safe.directory=C:/Users/fogen -C C:/Users/fogen and explicit application/workflow paths only. Never broad-stage the home directory. Current branch master; no local chode-1.1-agentic branch exists. For authorized atomic promotion use master:master and HEAD:chode-1.1-agentic. Stop dependent shell commands when a native command fails; PowerShell does not do this automatically.

Writable stage C:/Users/fogen/income/New folder/chode-parity. Source changes outside it require approved guarded promotion: verify HEAD, target status/hashes, backups and post-copy hashes. chode.js contains NUL: use rg -a/Node UTF8 and avoid whole-file PowerShell normalization. Requirements: BUILD-REQUIREMENTS.md and C:/Users/fogen/agents2.txt. Continue from the three actions above; do not repeatedly reread the whole project.

Deploy command: node C:/Users/fogen/node_modules/wrangler/bin/wrangler.js deploy --config C:/Users/fogen/chode/wrangler-chode-hq.toml. Regenerate installer assets after packaged source changes. Deployment and GitHub push are authorized, but only claim the exact version/checks actually verified.
