# chode Handoff — 2026-10-20 — Local-model reliability

## Status

- Commit/version: 1.9.1 runtime commit 82752c4, pushed to master and chode-1.1-agentic; Worker deployed as 1bbea68f-ca09-44fa-9e00-0aea4d6dcf6e. Live PowerShell installer installed and launched 1.9.1; live stale/tampered-source rejection passed. Based on 8a5e1b5. Phase 1 shipped as 1.9.0 at 6c0f939; both branches pushed, Worker deployment 377625c4-6648-4f95-8857-25c41f3d711c. Public installation/integrity verified. Linux Node 18/22 workflow 39320349381 succeeded, including the public installer.
- Fully working: Phase 1 items 1–6. Bounded Node Ollama discovery honors OLLAMA_URL across routing/models/status, validates HTTP/schema/size, lists installed models and distinguishes empty installations. Focused HTTP and real CLI tests pass; release-security tests pass.
- Partial: Phase 2 providers/local models. Existing local 90-second timeout and explicit website-verifier fixes retained. All six regression groups passed: units/CLI/agent in qa-1.9.1.log; dogfood/REA/robust in qa-1.9.1-rest.log after rerunning Windows job cleanup outside the sandbox. Final local-model/provider/release-security checks passed. Publication completed. Linux 1.9.1 workflow 39399169602 passed on Node 18 and 22, including public install/native terminal startup and local-model regression. Installed 1.9.1 strict-free routing also passed a controlled Ollama-compatible HTTP fixture (health, custom URL, selected model and parsed response; not a model-quality benchmark).
- Broken/missing: remaining provider expansion, costs/budgets, race/resume audit and Phase 3/4 items 11–17. No supremacy or flawless-build claim. Separate local expense benchmark work preserved outside this release; rerun immutable acceptance checks before updating its outcome.

## Exact next actions for next agent

1. Continue Phase 2 provider discovery; 1.9.1 release verification is complete. Preserve the separately modified expense tracker.
2. Continue item 7: capability/pricing-aware provider discovery, respecting shared provider quotas; then complete item 8 with installed-model selection and actual local inference checks.
3. Implement costs/budgets, audit race/circuit/resume, then items 11–17 in BUILD-REQUIREMENTS.md. Update handoff after each major item.

## Key files changed

- local-models.js — shell-free bounded discovery and shared base URL validation.
- chode.js — shared discovery for routing/models/status, custom endpoints, accurate empty/error state, asynchronous legacy status; restores removed GitHub Models entry.
- tests/local-models.test.js — disposable HTTP server and real models/status CLI tests.
- tests/provider-connect-runtime.test.js, tests/v2-providers.test.js — restore published authenticated GitHub Models coverage.
- LOCAL-MODELS.md — setup, URL handling, bounds and verification limits.
- package.json, package-lock.json, chode-hq-worker.js, release.json, install-assets.js — 1.9.1 package/assets.

## Design decisions

- Extend existing routing and /connect without dependencies, automatic model downloads or paid fallback.
- Require HTTP 200 and a validated model list; an empty list is reachable but not inference-ready.
- One asynchronous discovery per command/routing attempt, two-second total deadline, 1 MB response limit. Never interpolate endpoint URLs into shell commands.
- Preserve local timeout/verifier fixes. Restore GitHub provider/tests to avoid a regression; strict free mode still excludes credential-requiring providers.

## Risks / debt

- Model discovery is not proof of generation quality or successful inference. Model capability discovery and actual local builds remain required.
- Phase 1 journals contain source; never commit .chode state. Helpers are context-isolated, not OS sandboxes. Task-record retention needs pruning.
- External writers can conflict with undo; refuse conflicts rather than overwrite.

## How to test what was just built

- node tests/local-models.test.js
- node tests/provider-connect-runtime.test.js
- node tests/v2-providers.test.js
- node tests/free-capacity.test.js
- node tests/release-security.test.js
- npm test
- chode connect ollama; chode models; chode status; chode ai --force ollama "Reply OK"

## Context the next agent needs

- Git root C:/Users/fogen; app C:/Users/fogen/chode. Root contains personal files: explicit chode paths only; safe.directory=C:/Users/fogen.
- Writable stage: C:/Users/fogen/income/New folder/chode-parity. Fresh source copies and guards: chode-local-reliability. Compare hashes and back up targets before promotion.
- Maintain master and chode-1.1-agentic. Push/deploy authorized. Deploy chode-hq via wrangler-chode-hq.toml after tests and asset generation.
- User approved <=18 KB already-returned build context excluding credentials. Preserve strict free-only, independent verification, checkpoints, REA and HELIOS/HEMO.
