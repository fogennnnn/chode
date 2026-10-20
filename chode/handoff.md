# chode Handoff — 2026-10-20 — Public benchmark pilot

## Status

- Commit/version: 1.9.3 runtime commit 5d864de, pushed to master/chode-1.1-agentic; Worker deployment 58b5bae2-318d-47e4-aeb5-24bf3163b47d. Live installer installed/launched 1.9.3, rejected old/tampered source. Linux Node 18/22 workflow 39415778888 passed, including public install/native startup.
- Fully working: public Polyglot Python pilot runner, pinned deterministic five-task selection, unchanged official tests, preserved JSON/Markdown results and protocol-checked comparison tooling. Initial strict score 0/5; list-ops passed 22/24 checks. Phase 1 items 1–6; bounded Ollama discovery/routing; model catalog paging/search/metadata. Provider setup/OAuth/discovery now have a ten-second total deadline and 4 MB response limit, safe JSON errors, bounded cancellation even for hung adapters, and no settings saved after a failed connection test. Robustness/provider/setup/catalog/local-model, installer security and startup regressions pass.
- Partial: Phase 2 provider/local-model support; real local generation quality is unverified because localhost Ollama is unavailable (connection failure on 2026-10-20). Controlled HTTP routing/setup fixtures pass. Cost budget enforcement and race/resume audit remain.
- Broken/missing: remaining Phase 2 budgets/reliability and Phase 3/4 items 11–17 in BUILD-REQUIREMENTS.md. Separate uncommitted expense-tracker implementation is preserved; rerun immutable acceptance checks before claiming its outcome. No supremacy/flawless-build claim.

## Exact next actions for next agent

1. User priority is now public-benchmark iteration: inspect benchmarks/results/polyglot-python-pilot-v1-2026-10-20.md and raw local evidence. Improve general no-answer recovery/tool-schema adherence, then rerun the SAME fixed protocol; preserve baseline and all regressions. No hand-coded task answers.
2. Continue Phase 2: finish local capability/inference handling, cost accounting/budget enforcement, then race/circuit/lossless-resume audit. Provider setup response bounds are now implemented.
3. Continue items 11–17 sequentially, keep HELIOS/HEMO, write this handoff after major items, push/deploy tested releases. User already authorized publication.

## Key files changed

- benchmarks/public-pilot.cjs, public-pilot-agent.cjs — real v2 strict-free agent adapter and unchanged public unittest grading.
- benchmarks/compare-pilots.cjs, tests/public-pilot.test.js — reject mismatched/incomplete/falsified comparisons; expose task changes.
- benchmarks/PUBLIC-PILOT.md and results/polyglot-python-pilot-v1-2026-10-20.{json,md} — protocol, score, evidence and limitations.

- provider-request.js, tests/provider-request.test.js — total deadline, response byte bounds, safe JSON errors, cancellation, real HTTP fixtures and setup no-save failure checks.

- model-catalog.js — bounded validated catalog metadata, conservative zero-price labels, stable sort, paging/search, raw-ID selection.
- provider-connect.js — shared picker integration in existing key/OAuth/custom/local setup; settings and requests contain IDs rather than display labels.
- tests/model-catalog.test.js — malformed/partial pricing, additional fees, capabilities, bounds, duplicates, paging/search, exact IDs and real helper request/settings tests.
- PROVIDERS.md — setup, selection, metadata limits and quota/free-mode behavior.
- local-models.js, tests/local-models.test.js, LOCAL-MODELS.md — previous shell-free discovery and real CLI/custom endpoint tests.
- package.json, package-lock.json, chode-hq-worker.js, release.json, install-assets.js — version/package/verified installation assets.
- ../.github/workflows/chode-startup.yml — catalog/local model regression coverage on Linux Node 18 and 22.

## Design decisions

- Pilot is NOT an official full Aider leaderboard score: five Python tasks, six logical calls, 30-second request deadlines (normal default 90), one attempt, tests outside agent workspace, no external feedback retry/TUI capacity continuation. Protocol changes need separately labelled baselines.

- Pure Node; extend existing provider setup/routing. No automatic model downloads, new account provisioning or paid fallback.
- Only explicit zero prompt/completion prices with no other listed charge establish a zero-price label. Missing, malformed, negative and partial pricing remain unverified. Metadata is not a quality benchmark or an access guarantee.
- Account providers remain excluded from strict free mode even when a model lists zero price. Selecting another model never resets shared provider cooldowns/quotas.
- Limit normalization to 5,000 input entries/500 distinct valid model IDs, 20 rows/page, 30 selection attempts. Preserve current/manual model selection and cancellation-before-save.

## Risks / debt

- Existing cost reporting uses hardcoded provider rates and response-character token estimates, not complete provider-reported input/output usage. Replace this foundation before claiming reliable dollar limits; unknown costs must not be represented as measured zero.

- Setup responses over 4 MB are refused; users can still enter a model manually if a large catalog cannot be loaded. Real fetch uses a bounded stream; injected non-stream response adapters are size-checked after their JSON method returns and remain deadline-bounded.
- Displayed capabilities do not automatically switch tool protocols. Live local generation quality and hardware requirements still need actual evidence.
- Phase 1 journals contain source; never commit .chode state. Helpers are context-isolated, not OS sandboxes; task-record retention needs pruning. Undo refuses external-edit conflicts.

## How to test what was just built

- node tests/public-pilot.test.js
- node benchmarks/public-pilot.cjs --dataset <pinned-clean-polyglot-checkout> --engine <chode.js> --out <runs-directory>
- node benchmarks/compare-pilots.cjs <baseline-results.json> <new-results.json>

- node tests/provider-request.test.js

- node tests/model-catalog.test.js
- node tests/provider-connect.test.js
- node tests/provider-connect-runtime.test.js
- node tests/local-models.test.js
- npm run test:robust
- node tests/release-security.test.js
- node tests/installer.test.js
- node tests/entry-startup.test.js
- chode connect; use next/previous/search and verify saved model ID. Local inference: chode connect ollama; chode models; chode status.
- Relevant robust/setup/catalog/local-model/installer/startup checks passed for 1.9.3; full six-group suite passed for 1.9.1. Current logs: qa-provider-request.log and qa-linux-1.9.3.log in writable stage.

## Context the next agent needs

- Original measured run: C:/Users/fogen/income/New folder/chode-public-bench/runs/2026-10-20T12-14-32-089Z. Dataset: ../public-polyglot at 7e0611e77b54e2dea774cdc0aa00cf9f7ed6144f. Raw tests/checkpoints/generated artifacts retained locally. All five runs stopped following a no-answer call; only list-ops changed source.

- Git root C:/Users/fogen; app C:/Users/fogen/chode. Root contains personal files: Git safe.directory=C:/Users/fogen and explicit app paths only.
- Writable development stage C:/Users/fogen/income/New folder/chode-parity. promote-catalog.cjs/captured hashes and pre-1.9.2-backup preserve baselines; never blindly copy stale staging over new source changes.
- Maintain master/chode-1.1-agentic. Deploy chode-hq using wrangler-chode-hq.toml after regenerating installer assets. Live install must match latest release hashes; no obsolete runtime fallback.
- User approved <=18 KB already-returned build context excluding credential files. Preserve verification independence, strict-free mode, checkpoints, REA and HELIOS/HEMO.
