# chode Handoff — 2026-10-21 — Integrated reliability candidate 1.9.4

## Status

- Commit/version: application working tree is now **1.9.4**, integrated from the reviewed candidate. Production remains **1.9.3** until the release gates below pass. Base master/chode-1.1-agentic: c349eb25cdcea049e9fdb2b53f61f55a00bcece9. Candidate branch codex/reliability-1.9.4 was pushed at 22c4eb4075453c70ad58442673f29e91a86a377d; Linux Node 18/22 workflow 39585589014 passed. A follow-up source/input fix is being committed and requires CI on its exact commit. No production deployment yet.
- Fully working: integrated provider racing/cancellation, native core tool calls and streamed arguments, bounded complete file pages, Python unittest acceptance, correct shared free repair accounting, explicit capacity pauses, and early bounded acceptance feedback. Main checkout full npm test passed before the feedback addition and final full npm test passed after it; see qa-main-1.9.4.log and qa-main-feedback-1.9.4.log in the staging directory. Installer integrity passes again. Early-feedback regression proves an actual failing check reaches the next turn, gets repaired, and still requires independent verification.
- Partial: real strict-free three-file CSV ledger dogfood produced all implementation files and passed 17/20 immutable checks, then honestly returned PARTIAL. Two broader continuation windows remained PARTIAL with 17/20 checks: one made no edits before timeouts; the next attempted an edit that failed its exact-text precondition, then paused on provider failures. A supervisor-scoped targeted repair briefly reached 19/20 then regressed to 17/20; the context-fixed attempt also remained PARTIAL at 17/20. Exact edit preconditions failed repeatedly. A separately labelled whole-module rewrite with clarified contract is being evaluated under ledger-rewrite; inspect final results before claims. No manual generated-solution edits or acceptance-test changes.
- Broken/missing: latest completed adapted public checked pilot remains **1/5 (20%)**; historical 4/5 is not the latest score. No public benchmark rerun was completed for this integration yet. Full BUILD-REQUIREMENTS items, local generation quality, accounting, prompt slimming and broad RE/website dogfood remain incomplete. Do not claim supremacy or flawless builds.

## Exact next actions for next agent

1. Inspect the latest explicit-contract whole-module attempt under C:/Users/fogen/income/New folder/chode-dogfood-1.9.4/ledger-rewrite and previous ledger-context / ledger-targeted / ledger-repair attempts. Require immutable contract digest and independent grading; diagnose the actual final outcome. Do not edit its solution yourself and attribute that to Chode. If partial, resume observed remaining work, preserve cooldowns, and fix general harness problems supported by the trace.
2. Qualify the integrated 1.9.4 release: retain passed regressions, commit only explicit reviewed files, run Linux Node 18/22 packaging/startup CI and verify fresh Windows installation of the final archive. Do not publish a failing candidate or weaken integrity checks. User already authorized push/deploy after validation.
3. Once qualified, push intended branches, deploy the existing Worker configuration, verify live metadata and fresh install, update this handoff with commit/deployment/evidence. Then run the same protected public pilot against a new frozen engine, retain cooldowns and every failure, and improve general repair/capacity behavior before expanding to held-out tasks.

Keep exactly three concrete next actions. After compaction, read this handoff and the active action instead of rereading the project or repeating provider research. OpenCode previously had 11 compactions/11 repeated objective summaries in its inspected latest 120 parts and a stale 1.8.2 TODO. Replace those TODOs through normal tools; do not edit its session database.

## Key files changed

- chode.js, provider-race.js: first nonempty answer wins, request cancellation reaches transport/retries, empty recovery remains bounded, nested free repair preserves shared budget identity. All-cooling free providers now pause before spending model calls, return PARTIAL with retryAt and preserve checkpoints; resumed verification is tested.
- Native timeouts/cancellation no longer duplicate a failed streamed request as a buffered request. A real silent-SSE server regression verifies only one native HTTP request is sent.
- native-tools.js, chode.js: six typed core schemas (read/write/edit/glob/grep/exec), bounded streamed arguments, guarded conversion, incomplete/length-cut calls never execute. Legacy fenced tools remain available for other capabilities. Native default Kilo agent calls get an 8192 output allowance; non-native/manual-model default is retained at 2048. Foreground checks are recommended; background job IDs must be copied exactly.
- read-window.js, tool-call-validation.js, read dispatcher/prompt: line offset/limit and character continuation, eof/nextRead, bounded serialized pages, CRLF/Unicode reconstruction, unchanged 100 KB/secret/binary/workspace guards. Direct toolRead(file) retains legacy full reads.
- acceptance-check.js: shell-free bounded immutable Python unittest checks, nonzero discovered test count, durable redacted output/exit/digest evidence; JS checks retained.
- chode.js early feedback: when an explicitly configured acceptance check exists, successful mutation batches receive real acceptance feedback in the existing bounded observation history. Maximum three feedback checks shared across nested repairs, existing 30-second/output bounds. This does not replace final acceptance or independent verifier requirements.
- New tests: provider-race, provider-recovery, native-tools, native-stream, python-acceptance, read-window, read-window-agent, free-repair-budget, free-capacity-stop, acceptance-feedback. Existing v2-providers preserves equivalent keyed-provider exclusion even with a configured key.
- The pre-existing OpenCode GitHub Models removal and Groq connection fixture were retained, not silently overwritten. Do not treat it as new research or restore/delete providers casually. Other GitHub tools remain intact.
- package.json/lockfile, Worker version, release.json/install-assets.js: 1.9.4 packaging and regenerated verified assets. ../.github/workflows/chode-startup.yml adds the new Linux regressions.
- Free empty-answer termination now returns explicit PARTIAL with saved progress rather than leaving a finished run PENDING. Persisted cooldowns are still respected and retries bounded.
- The public pilot adapter separates initial source observations from immutable task requirements; initial source is supplied once, current read/edit observations drive later turns. This fixes stale-source replay in the adapter, not a claim that every production prompt was rewritten. Test public-pilot-input validates this contract with an explicitly synthetic adapter fixture; measured generations remain real.
- benchmarks runners/docs/results preserve historical native/checked runs and latest checked-3 20% result. Protocol comparison refuses differing provider-state policies.

## Design decisions

- Extend the existing pure Node runtime. No new external service, paid fallback, automatic model download or training pipeline was added.
- Use only typed native calls or documented tool fences; arbitrary JSON is never executable. Keep permissions, workspace/secret guards, verifier independence, REA and HELIOS/HEMO.
- Preserve the approved <=18 KB of already-returned tool context excluding credentials. This does not authorize training-data export/publication.
- Respect Retry-After/persisted cooldowns. No proxy/key cycling, repeated introductory-credit issuance, or model switching to evade shared quotas. Pollinations and aliases remain forbidden.
- Tool execution is not proof of effect; a background launch is not a successful test. Completion requires nonempty immutable checks and independent verification. Capacity pauses must remain visible/cancellable and resumable.
- Do not deploy while runtime/package files and published integrity metadata disagree. Regenerate assets after any packaged source change.

Ajax/Odysseus lessons and primary sources:

- https://data.pewdiepie.com/ — checked 2026-10-21: planned Qwen 3.5 9B fine-tune, release when ready, no model download found. Verify current availability before claims.
- https://github.com/odysseus-dev/odysseus/discussions/2724 — reliable tool selection/arguments, concise results and error recovery; proposed GGUF/Q4 targets are not available-weight or quality evidence.
- https://github.com/odysseus-dev/odysseus/issues/2750 — measure/slim static prompt and schema overhead; load guidance just in time. Prompt slimming is still future work, not claimed implemented here.
- https://github.com/odysseus-dev/odysseus/discussions/6466 — distinguish discovery, ownership, authorization, execution and observed effects. A PID does not establish ownership. Review licensing before copying any source.
- Test existing local models against real tool/repair tasks before fine-tuning. Reduced refusals do not establish coding competence; no verified Ajax coding superiority was found.

## Risks / debt

- Final full integrated npm test passed after the native-timeout/status/context fixes: qa-final-1.9.4.log. This supersedes the earlier local-suite checkpoints. Full npm regression success is not evidence of high general build quality. Latest measured public score is 20%. Free routing/model availability varies. Model identity is not yet captured comprehensively; unknown usage/cost must not be reported as measured zero.
- Native support is currently scoped to compatible default agent routing, not every provider or every tool. Some nonstandard SSE framing/fragment cases still need broader interoperability evaluation.
- Early acceptance feedback executes the user's explicitly selected check after edits, bounded to three checks per shared work window. Tests should be appropriate to execute; no background launch is treated as acceptance success.
- Main application is in a home-directory Git repository. Use explicit paths; never stage home contents, credentials or .chode state.
- Preserve unrelated dirty expense-tracker implementation and untracked .npmrc/config/backups, nested chode/, .opencode/, oldgreg/, replica artifacts and validation files. They are not release artifacts by default.
- Prior OpenCode logs contain credentials. Do not copy secrets into handoffs, commits, public results or model prompts. MyAi connectivity research is not independent confirmation of indefinite free capacity, billing, privacy or coding quality; no MyAi integration was added.
- Remaining master features and real local inference, real multi-page website/RE builds, process longevity, complete cost accounting and held-out evaluation remain open. Existing RE/unit/worker/TUI regressions pass; do not present fixtures as real end-to-end feature evidence.

## How to test what was just built

From C:/Users/fogen/chode:

~~~powershell
node tests/provider-race.test.js
node tests/provider-recovery.test.js
node tests/native-tools.test.js
node tests/native-stream.test.js
node tests/read-window.test.js
node tests/read-window-agent.test.js
node tests/python-acceptance.test.js
node tests/free-repair-budget.test.js
node tests/free-capacity-stop.test.js
node tests/acceptance-feedback.test.js
node tests/public-pilot.test.js
npm run build:installers
npm test
~~~

Final full integrated suite evidence: C:/Users/fogen/income/New folder/chode-parity/qa-final-1.9.4.log. Earlier candidate suites: qa-reconciled-1.9.4.log and qa-release-1.9.4.log. Source/package changes after these checks require relevant revalidation. Installer security test now passes; stale/tampered source rejection remains enabled.

Initial isolated archive installation at C:/Users/fogen/income/New folder/chode-release-1.9.4/installed launched version/help successfully, but predates the early-feedback delta: regenerate/reinstall the final archive before release. Verify actual installed terminal startup, not just --version. Linux workflow is Chode packaged Linux startup; final public install/tamper checks remain required.

## Context the next agent needs

- Git root C:/Users/fogen; app C:/Users/fogen/chode. Use git -c safe.directory=C:/Users/fogen -C C:/Users/fogen with explicit app/workflow paths only.
- User complete directions C:/Users/fogen/agents2.txt; app BUILD-REQUIREMENTS.md is the complete feature backlog. This handoff supersedes stale sequencing, not user requirements.
- Writable stage C:/Users/fogen/income/New folder/chode-parity. Main integration used reconciled-promotion.json and feedback-promotion.json with per-file before/after hashes and backups under pre-reconciled-backup / pre-feedback-backup. Never reuse old promotion scripts against newer source without rechecking state.
- Real dogfood C:/Users/fogen/income/New folder/chode-dogfood-1.9.4/ledger: seeded three-file CSV parser/report/CLI, 20 immutable checks, first real run 17/20 and PARTIAL. ledger-repair is a separate continuation (prior attempt archived under attempt-1); ledger-targeted is an explicitly supervisor-scoped single-file continuation (transient 19/20, final 17/20); ledger-context fixes observation/requirement separation (final 17/20); ledger-rewrite explicitly clarifies the existing plain-object/reserved-key contract and requests an authorized whole-file write. These are supervised continuations, not autonomous fresh-build scores. Check protocol.json for engine/helper/contract hashes, input.json, calls.json, provider-attempts.json, generation.log, agent.json and after.log. No model-generated solution was manually patched.
- Distinct frozen engines under C:/Users/fogen/income/New folder/chode-public-bench/candidates/reconciled-1.9.4, reconciled-feedback-1.9.4 and final-1.9.4. Do not overwrite a measured snapshot. Protocol hashes distinguish them.
- Public dataset C:/Users/fogen/income/New folder/public-polyglot, pinned 7e0611e77b54e2dea774cdc0aa00cf9f7ed6144f.
- Latest public run C:/Users/fogen/income/New folder/chode-public-bench/checked-3/2026-10-20T14-59-23-127Z: 1/5, all official tests unchanged. Zebra grading timed out at 30s; grade-school passed 20 tests; list-ops passed 22/24 with foldr failures; affine/pov made no edits and received zero answers with cooldown metadata. Zero answers do not establish model coding capability.
- Historical original no-feedback pilot 0/5; streamed-native no-feedback 1/5; checked-1 historical 4/5; checked-2 interrupted after shared-budget defect discovery. Preserve these and interruption records. Five public development tasks are not an official Aider score or held-out evaluation.
- Checked protocol: fixed hash-selected five Python tasks, one attempt, strict free, 12 shared model calls, 24 tool cap, 420s generation, 30s provider setting, protected upstream tests visible with feedback, independent final grading at 30s, cooldowns retained across tasks. Do not change budgets/test visibility silently, remove failures, hand-solve tasks or select favorable reruns.
- Production installer https://chode.borken.app/api/release was verified at 1.9.3 before this integration. Existing deploy command uses C:/Users/fogen/node_modules/wrangler/bin/wrangler.js deploy --config C:/Users/fogen/chode/wrangler-chode-hq.toml. Push/deploy is authorized after qualification; verify side effects before claiming completion.
