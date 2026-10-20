# chode Handoff — 2026-10-20 — Bounded provider setup

## Status

- Commit/version: 1.9.3 candidate; publication pending. Previous: 1.9.2 runtime commit 188c436, pushed to master and chode-1.1-agentic. Worker deployment 88bf481b-64a8-49f9-9b21-bc0d4eb8290c. Live PowerShell installer installed/launched 1.9.2 and rejected old/tampered source. Linux Node 18/22 workflow 39406817356 passed, including public installation and native terminal startup.
- Fully working: provider setup/OAuth/discovery now use a shared ten-second total deadline and 4 MB body limit, validate JSON, and remain cancellable even with broken fetch/read/cancel adapters. Oversized failed connection tests do not save settings. Phase 1 items 1–6 (1.9.0). 1.9.1 bounded shell-free Ollama discovery across routing/models/status with OLLAMA_URL support. 1.9.2 catalog labels, conservative price/capability metadata, stable zero-price/tool-first ordering, 20-row pagination/search, exact-ID selection and manual fallback. Existing OAuth/key setup, strict-free eligibility and shared provider cooldowns preserved.
- Partial: Phase 2 item 7 catalog discovery/selection implemented; broader provider protocol adapters remain incremental. Item 8 local setup/discovery/routing works with controlled HTTP fixtures; real hardware/model quality and capabilities need verification. No completed-cost-budget/race audit claim.
- Broken/missing: remaining Phase 2 budgets/reliability and Phase 3/4 items 11–17 in BUILD-REQUIREMENTS.md. Separate uncommitted expense-tracker implementation is preserved; rerun immutable acceptance checks before claiming its outcome. No supremacy/flawless-build claim.

## Exact next actions for next agent

1. Complete 1.9.3 publication/install/Linux checks; preserve the separate expense benchmark.
2. Continue Phase 2: finish local capability/inference handling, cost accounting/budget enforcement, then race/circuit/lossless-resume audit. Provider setup response bounds are now implemented.
3. Continue items 11–17 sequentially, keep HELIOS/HEMO, write this handoff after major items, push/deploy tested releases. User already authorized publication.

## Key files changed

- provider-request.js, tests/provider-request.test.js — total deadline, response byte bounds, safe JSON errors, cancellation, real HTTP fixtures and setup no-save failure checks.

- model-catalog.js — bounded validated catalog metadata, conservative zero-price labels, stable sort, paging/search, raw-ID selection.
- provider-connect.js — shared picker integration in existing key/OAuth/custom/local setup; settings and requests contain IDs rather than display labels.
- tests/model-catalog.test.js — malformed/partial pricing, additional fees, capabilities, bounds, duplicates, paging/search, exact IDs and real helper request/settings tests.
- PROVIDERS.md — setup, selection, metadata limits and quota/free-mode behavior.
- local-models.js, tests/local-models.test.js, LOCAL-MODELS.md — previous shell-free discovery and real CLI/custom endpoint tests.
- package.json, package-lock.json, chode-hq-worker.js, release.json, install-assets.js — version/package/verified installation assets.
- ../.github/workflows/chode-startup.yml — catalog/local model regression coverage on Linux Node 18 and 22.

## Design decisions

- Pure Node; extend existing provider setup/routing. No automatic model downloads, new account provisioning or paid fallback.
- Only explicit zero prompt/completion prices with no other listed charge establish a zero-price label. Missing, malformed, negative and partial pricing remain unverified. Metadata is not a quality benchmark or an access guarantee.
- Account providers remain excluded from strict free mode even when a model lists zero price. Selecting another model never resets shared provider cooldowns/quotas.
- Limit normalization to 5,000 input entries/500 distinct valid model IDs, 20 rows/page, 30 selection attempts. Preserve current/manual model selection and cancellation-before-save.

## Risks / debt

- Setup responses over 4 MB are refused; users can still enter a model manually if a large catalog cannot be loaded. Real fetch uses a bounded stream; injected non-stream response adapters are size-checked after their JSON method returns and remain deadline-bounded.
- Displayed capabilities do not automatically switch tool protocols. Live local generation quality and hardware requirements still need actual evidence.
- Phase 1 journals contain source; never commit .chode state. Helpers are context-isolated, not OS sandboxes; task-record retention needs pruning. Undo refuses external-edit conflicts.

## How to test what was just built

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
- All above passed for 1.9.2; full six-group regression passed for 1.9.1. Release verification logs are in writable stage qa-model-catalog.log and qa-linux-1.9.2.log.

## Context the next agent needs

- Git root C:/Users/fogen; app C:/Users/fogen/chode. Root contains personal files: Git safe.directory=C:/Users/fogen and explicit app paths only.
- Writable development stage C:/Users/fogen/income/New folder/chode-parity. promote-catalog.cjs/captured hashes and pre-1.9.2-backup preserve baselines; never blindly copy stale staging over new source changes.
- Maintain master/chode-1.1-agentic. Deploy chode-hq using wrangler-chode-hq.toml after regenerating installer assets. Live install must match latest release hashes; no obsolete runtime fallback.
- User approved <=18 KB already-returned build context excluding credential files. Preserve verification independence, strict-free mode, checkpoints, REA and HELIOS/HEMO.
