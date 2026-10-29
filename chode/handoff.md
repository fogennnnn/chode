# Candidate 1.9.36 — 2026-10-30 — terminal logo and vertical reflection

Current changes are NOT deployed yet. terminal-logo.js ports the actual worker LOGO_JS 75px/three-node phase gate and HSL equations into a low-resolution contiguous block-cell mark. An initial braille projection produced three horizontal row gaps; the user rejected the bands, so the candidate uses contiguous quadrant blocks. It occupies an 8-column x 4-row reserved header area on terminals >=60x18. Idle crawls, active workers animate faster, user questions slow it, reduced-motion mode is static. Timers paint only logo cells and save/restore the input cursor; small terminals retain the old compact header. No model/network calls. New tests compare actual worker-rendered points and colour/alpha output; layout, logs/hit-testing, real key input/cursor and timer cleanup pass.

Website reflection: retain the user-approved 0.90 horizontal scale and original total height; gently warp rows vertically with the existing ripple clock. Slogan remains removed with the empty 2.7em spacer. Frontend/reflection regressions pass.

Qualification pending: source was frozen after switching to block cells. The first full Windows suite stopped at the existing agent-workflow fixture's 120s outer timeout under disk pressure, not an assertion. Standalone agent-workflow recheck passed. Rerun the FULL frozen suite; do not claim release success until Windows and Linux qualification pass. Regenerated package/installer manifests include terminal-logo.js and version1.9.36. Linux workflow includes the new tests. Preserve source mixed line endings.

Disk remediation: removed only verified inactive private test installs 1.9.29–1.9.34 node_modules and the private api-test-tools cache, after resolving paths inside this evaluation root and checking no active process used them. Global user tools, source and reports remain. Current1.9.35 and benchmark baseline installs were kept. Optional API engine cache must be reinstalled for future local native-engine live tests. About240MB became free; monitor space during checks. The preview server and terminal-logo preview tab are temporary.

YOLO remains QUEUED, not implemented. User was told /yolo on|off and --yolo are intended controls; do not claim they exist. CLI pending-retry metadata loss and SGF failures remain next fixes. See earlier stress results.

---

# Current visual layout and hard-build results — 2026-10-29

Frontend commit 0b93b8a (geometry/reflection introduced by 5b2798b), Worker 5784a74d-892e-4a36-b2df-34d888c6323a is deployed. The horizon now anchors to the flow-layout gap between .hero-title and .hero-sub rather than a fixed viewport percentage; font loading, resizing and visual-viewport changes update it. Reveal transforms are excluded from the anchor. White letters have a faint mirrored, sliced reflection with the O's ripple timing, independent horizontal scale 0.90, original vertical size and 0.045 maximum opacity. The user approved the size and requested ONLY less horizontal spread. The two-line hero slogan was then removed, with an empty responsive 2.7em spacer preserving its space. Desktop/mobile/200%-scale iframe previews and viewport/DPR regression cases passed; frontend/reflection checks and Worker dry-run passed. CLI remains 1.9.35.

Strict-free hard builds through the public installed 1.9.35 are finished: durable Node reservations passed 35/35 independent checks in 466.6s; public Python SGF parser passed 16/23, failed 7, returned PARTIAL with unavailable provider and queued work in 524.0s. No manual code repair; original tests unchanged. See benchmarks/results/targeted-stress-1.9.35-2026-10-29.{json,md}; complete local artifacts are ../../hard-builds-1.9.35-yekINc. These selected development cases are NOT a leaderboard score. Both were allowed an hour, not stopped after seven minutes.

YOLO is NOT implemented or shipped. User asked where it lives; explained it remains queued and proposed user-controlled /yolo on|off plus --yolo with a visible indicator. Do not claim it exists. Also investigate CLI cmdPending retry losing acceptance/free/budget metadata (static inspection found it calls cmdAI([hit.prompt]) only). Do not use that path to resume a strict-free test until fixed or explicitly preserve flags through the normal CLI. The user's Downloads/chode.txt is a working/draft capture with syntax checks, MCP discovery and a failed npm test, not proof every tool works; avoid blanket certification claims and raw tool JSON in final answers.

The first geometry deployment hit ENOSPC; retry succeeded once free disk space returned (about 190MB free). No user files were deleted. Disk remains tight: inspect and remove only verified disposable generated caches if required. The local preview server may still be running until cleanup.

---

# Capability showcase + centered sunrise — 2026-10-29

Current frontend commitf49e2da, Worker2a5dc949-ea7a-4d0b-b3c1-43bd28b3d699 deployed. Hero now leads with the whole coding workshop:184 provider CATALOG profiles,37 workspace commands,3 optional API test engines, native MCP. Six cards cover MCP/OAuth, Wolfram standalone zero-model math, optional REA, API testing, grounded memory and research/tool discovery. Counts verified against shipped modules and guarded in frontend-copy tests. Catalog/account availability distinguished; unsupported zero-runtime-dependencies copy removed. Benchmark evidence/claims unchanged. CLI remains1.9.35.

Pink/purple elliptical sunrise and gradient rim peak at the horizon beneath the logo (glowX), fade toward edges, clip to the planet curve and follow the existing logo visibility fade. No additional animation loop. Frontend/reflection checks and Worker dry-run passed; local hero/cards and glow-off scroll state visually checked, live HTML/script verified. All previous deferred YOLO/restart/drift work remains queued below.

---

# Frontend visual update — 2026-10-29

Latest user design: stronger 3px VISIBLE OUTER logo-letter outline (6px centered stroke painted beneath fill), purple/pink GitHub pill with white black-outlined text, and more curved responsive planet/moon horizon (bounded by width/height, maximum64px). All sky lighting now clips to the curve, removing a flat rectangular seam exposed by the larger arch. Header remains text-only chOde. Commit1b6c62c, Workerb34ee075-3e1c-494c-a9b6-4a618eb1d3c0 deployed to chode.borken.app. Frontend/reflection regressions and Worker dry-run passed; live HTML/background script verified. CLI remains1.9.35; no runtime/installer change.

---

# Frontend header update — 2026-10-29

User replaced the C/reversed-e circle design: green header badge and its CSS removed entirely; header text is now chOde, 24px desktop / 22px mobile, visible on mobile. Hero animation/outline retained. Commitfd7badd, Worker9933def3-709d-498c-abca-9ed8828d1f29 deployed and visually verified. Frontend/reflection checks and Worker dry-run passed. Header-only change; CLI remains1.9.35. Prior C/reversed-e notes below are historical.

---

# CURRENT — 2026-10-29 — 1.9.35 PUSHED AND DEPLOYED

Runtime3b14caa91b58, promoted master07e5eef01038. Worker6840a92a-a987-4c04-bc94-f4dcc34d50a1 on chode.borken.app. Full isolated Windows npm suite EXIT0; Linux Node18/22 candidate CI40960741748 SUCCESS. Fresh LIVE PowerShell install into ../../installed-1.9.35 returned1.9.35/07e5eef; every runtime checksum matches release.json and installed permission code matches canonical source. Global user executable unchanged (installer correctly warned it shadows the private test prefix). Live /api/release and browser badge1.9.35 verified; screenshot ../../logo-live-1.9.35.png (evaluation root). Post-deploy public Linux verification40961620943 SUCCESS on Node18/22, including the live installer and installed native terminal workflows.

One-time permission-feedback automation completed and deleted. Allow/deny/Esc feedback is fixed and tested; YOLO/self-restart/drift investigation remains explicitly queued below. Existing local SHA-256 retained without adding network/model costs. Logo badge uses lowercase reversed e, U+0258.

---

# Candidate — 2026-10-29 — 1.9.35 permission feedback and branding

TUI permission replies now persist and render Allowed once / Denied / Cancelled acknowledgement, clear the pending question/input/scroll, and resume the worker with the original allow/deny/cancel IPC values. Enforcement unchanged. New tests/permission-feedback.test.js sends actual readline key bytes to the TUI and runs the real guarded dispatcher in a child: paused harmless fixture deletion, invalid answer rejection, allow executes, deny/Esc preserve file, acknowledgement is rendered, composer restored, answer never launches a second task. Added to npm and Linux Node18/22 CI.

Frontend: 3px black wordmark-letter outline, matching 3px black circular O border; green header badge uses C and reversed LOWERCASE e (U+0258), not uppercase reversed E. Browser preview visually checked. Worker dry-run passed. Existing local UTF-8 SHA-256 prompt-integrity regression passed; Wolfram Hash[string, "SHA256", "HexString"] is an optional independent cross-check, not a required network dependency. A prompt hash alone cannot make different model/evaluator/budget protocols comparable.

Qualification: full isolated Windows npm test EXIT0 (parent candidate-1.9.35-tests.log). Linux Node18/22 candidate CI40960741748 SUCCESS, including the new real-key permission regression, packaged native startup/workflows and real API engines. Worker dry-run passed. Promotion/deployment follows this checkpoint. Previous1.9.34 post-deploy Linux run40934212028 confirmed SUCCESS.

USER WORKLIST (deferred separately): explicit visible opt-in YOLO mode for Chode's own permission gates; safe own-process restart workflow; investigate repeated prompt-drift warnings and reported bare permission answer2 reaching Wolfram in the user's log. This patch tests that2 remains in the active permission flow; it does not claim YOLO/self-restart or the reported drift root cause fixed. Preserve host approval controls, credentials and unrelated processes. User requested follow-up after one hour; prior scheduling change was blocked by usage-limited automatic review, so do not claim that reschedule succeeded.

---

# CURRENT — 2026-10-29 —1.9.34 PUSHED AND DEPLOYED

User explicitly authorized promotion/deployment. Master/runtime9b4f820dc8c5 (implementationb9b86e7). Workerfa18b49d-79a0-4e6c-803f-78bf4fc7825b, chode.borken.app. Full Windows npm suite completed EXIT0: parent candidate-1.9.34-final-recheck.log. Candidate Linux Node18/22 CI40933512870 PASSED. Live release1.9.34 and fresh public Windows installer/runtime checksums PASSED into ../installed-1.9.34; global executable unchanged. Post-deploy public Linux verification40934212028 dispatched, pending at this checkpoint. Prior takeover statements below about1.9.34 not being deployed are superseded.

DEFERRED USER ISSUE — FOLLOW UP TWO HOURS LATER, NOT DURING THIS RELEASE
User first thought permission prompts were text-only/unusable, then CORRECTED: typing2 for Allow once DOES work, but there is no visible acknowledgement. Focus on feedback (Allowed once/Denied/Cancelled, pending-question dismissal, composer/focus restoration and resumed state), while preserving permission enforcement and testing that execution really pauses until answered. Reported request was a mixed Windows/Unix broad search for hurl (where hurl; find C:\ -name ... | head). Hurl should first be checked with `chode api-test doctor hurl`; avoid unnecessary broad drive scans. User wants lean token/output usage.
One-time thread follow-up CREATED in app: automationID chode-permission-feedback-follow-up,29October2026 at21:47:23 Europe/Stockholm (20:47:23UTC). Prompt contains the user's correction and calls for safe fixture reproduction plus input/allow/deny/cancel regressions. Do not describe permission submission as broken without reproducing it.

---

## Dispatch checkpoint

Candidate commit b9b86e7 is pushed to codex/quality-tool-guidance. Candidate Linux Node18/22 workflow: https://github.com/fogennnnn/chode/actions/runs/40933512870 (dispatched, pending completion at handoff). Fresh Windows full suite log: C:/Users/fogen/income/New folder/production-eval-2026-10-28/candidate-1.9.34-final-recheck.log; exec session87165 was running. Public master/deployment remains1.9.33. Read the takeover section immediately below before continuing. No candidate qualification/deployment success is claimed.

# OPENCODE TAKEOVER — 2026-10-29 — requested10%-remaining checkpoint

Codex usage read91% used (9% remaining), so this is the user's requested handoff. Public release remains1.9.33, runtime0a13abe3ae95, Worker607153fa-9518-4003-b242-d8ea835cb4e3; DO NOT claim1.9.34 deployed. Active isolated checkout C:/Users/fogen/income/New folder/production-eval-2026-10-28/source (app chode/). Preserve dirty original home checkout and unrelated work. Work below is candidate1.9.34, being committed/pushed on codex/quality-tool-guidance for continuation. User wants extremely economical output and no unnecessary narrated updates.

LATEST REQUESTS / IMPLEMENTATION
1. runn: user explicitly narrowed scope to know-how only, not a bundled adapter or eager install. toolbox registry + conditional task context identify SSH, browser/CDP screenshots/DOM, HTTP/gRPC/database capabilities. If needed/missing, use existing toolbox inspect to clone k1LoW/runn, reuse checkout, read relevant docs, follow official setup and verify. Nothing cloned/installed here. Relevant actual model-prompt test passes; unrelated tasks receive zero runn-specific prompt text. Generic tool instructions now seek official know-how/alternatives and preserve progress instead of premature surrender.
2. Quality: user supplied C:/Users/fogen/brain.html (3696 bytes), a D3 random-word/random-edge graph without the requested engine. User screenshot original brief: read C:/Users/fogen/Downloads/contextdebtnetworkrecode.txt and make localHTML brain with random word generation, contextual/grammatical token lattice, strict grammatical reader, unused-path decay, learning/reasoning/rewards/punishment and balanced generation/pruning. Reference TXT was NOT present at that path or matching Downloads *debt* here; never claim it was read/ported. User brain file unchanged; exact artifact copied to tests/fixtures/brain-display-only.html. Core requests containing multiple mechanism categories now require successful runtime/protected acceptance evidence before certification (even if independent reviewer would sayPASS). Static artifact shortcut routes to test-capable workspace; explicit HTML output retained/checked. Semantic review distinguishes core algorithms from visual labels/sample data. Existing simple HTML artifact behavior preserved after a broad HTML classifier initially regressed agent-workflow; fixed and targeted test passed. Core-quality regression, full-site regression, real prompt context and integrity tests passed. This is a minimum evidence bar, not proof every test covers every requirement; stronger requirement-to-test coverage remains useful.
3. Tools UX: /tools explains automatic selection; /tools forex shows guidance/example, not fake activation. NEW /tools check [NAME] runs model-free safe live probes for forex/geocode/weather/dev-recon; `chode tools check [NAME]` is CLI equivalent. Shows checkedAt, per-probe passed/failed/not-tested; unsupported tools explicitly need task-specific checks/setup. Worker failures bypass provider-retry queue. Module tool-health.js + tests/tool-health.test.js are packaged/wired. Actual forex/geocoding/weather calls passed; all4 live dev-recon probes passed (GitHub repo/search, CDNJS, lifecycle). FOUND/FIXED real dev-recon eol bug: legacy endpoint returns an array, code treated it as object and returned ok:true with emptyfields. Now extracts first release and rejects missinglatest. TUI named/unknown tool guidance test passes; actual TUI live-check success/failure journey still worth adding (dispatcher zero-model/mock health tests pass).

QUALIFICATION / WHAT TO DO NEXT
- Targeted tests passed: core-quality, build-completion, agent-workflow (after fixing classifier regression), platform-context including actual conditional runn prompt, toolbox, prompt-integrity, v2-corelib, TUI37-command matrix, tool-health, installer and release-security. Live tool probes described above passed; these are capabilities, not coding benchmarks.
- Full Windows npm test first failed in agent-workflow due to broadened HTML classifier. Fixed; targeted agent-workflow then passed. Fresh FULL suite is RUNNING with isolated CHODE_PROVIDER_HOME, log parent candidate-1.9.34-final-recheck.log. Prior failure preserved in candidate-1.9.34-final-tests.log. Check fresh exit/log, fix real failures, do not weaken checks. The candidate will have a dispatched Linux Node18/22 workflow; see next checkpoint below for runID.
- Inspect final diff carefully; runtimeversion/package-lock/Worker and installer hashes regenerated1.9.34, new tool-health.js included. New core-test fixture is tests-only. Any runtime edit needs `node build-installer-assets.cjs` again. Avoid line-ending churn in chode.js (mixed endings/NUL): preserve unchanged line bytes or restore equal blocks from git HEAD.
- Add real TUI /tools check forex (known mockedHTTP or actualpublicread) and failed-service tests if needed; do not report all tools working from a registration list. Consider additional schema checks for other services as real failures surface.
- After complete Windows + candidate Linux qualification, fetch originmaster to preserve external changes; fast-forward only, deploy using local pinned wrangler and wrangler-chode-hq.toml, verify live release/status1.9.34, public Windows install with checksums and post-deploy Linux public installer. Current source is already on an isolated branch, no global user executable overwritten. Never deploy an unqualified candidate.
- Existing docs API-TESTING.md record current tooling, runn know-how and quality contract. Optional browser-backed keyless coding workers, webpage/component library (provenance/license/dependencies/comments/examples/tests), and per-output-line timestamps/time-aware context remain queued. No such backend/library is claimed working. No banned provider, paid fallback, other-agent credential reuse, quota bypass or OpenCode dependency introduced.

---

# Current release — 2026-10-29 — Chode1.9.33, pushed and deployed

PUSHED: runtime0a13abe3ae95; subsequent0e33087 changes only CI's public metadata assertion to use the bounded reader. Branches master and codex/api-test-engines. DEPLOYED: Worker607153fa-9518-4003-b242-d8ea835cb4e3, chode.borken.app; live release/status report1.9.33. Fresh public Windows install ../installed-1.9.33 verified every runtime checksum; the installed package passed real Hurl/Schemathesis/k6, CLI and actual TUI success/failure/cancellation, idempotent setup and zero-model tests. Evidence: parent api-tools-installed-windows-1.9.33-{evidence.json,live.log}. Final post-deploy public installer/native engines/native PTY Linux Node18/22 CI40928629338 PASSED. Candidate1.9.33 CI40928088660 also passed.

Changes delivered:3 optional API engines with private pinned setup, CLI/TUI/toolbox discovery, bounded redacted native evidence, actual exit codes/digests/versions/timestamps, strict k6 failed-check and no-HTTP handling, schema case counts, process-tree timeout/cancellation and UTF8 output. Commands and limits: API-TESTING.md. 1.9.33 additionally retries transient verified-release metadata fetches (3 attempts, fresh20s signals, bounded backoff/Retry-After, terminal4xx fail closed); no stale/unverified fallback. This fixed the post-deploy1.9.32 Linux18 metadata timeout. Real local HTTP fault-injection plus integrity/security/startup/frontend/API regressions passed for the patch. The complete Windows npm suite passed for the unchanged API runtime in1.9.32 (parent candidate-1.9.32-final-tests.log), followed by targeted patch checks and full installed-engine qualification in1.9.33. All37 TUI commands have input/worker regression coverage. User global executable, home checkout and unrelated work were preserved.

Next requested directions: optional keyless website-backed coding workers; webpage DOM/layout/style/interaction analysis plus a searchable library of clean/commented reusable HTML/JS with source/license/dependencies/examples/tests. These remain design/research, not working backends in this release. API-TESTING.md records the per-site completion/extraction/verification and client/backend boundaries. Existing keyless APIs remain active; no private web sessions, paid fallback or banned provider was introduced. Optional per-output-line timestamps/time-aware context remains queued. Keep tokens/output low. Last usage reading primary67% used (33% remaining), secondary58% used (42% remaining):10%-remaining handoff threshold not reached; checkpoint saved proactively.

---

# Installer patch candidate — 2026-10-29 — 1.9.33

Post-deploy1.9.32 CI40927221026: Linux22 passed; Linux18 hit a transient15s timeout fetching verified release metadata (all engine tests passed). Installer failed closed as intended. New1.9.33 changes only installer retry behavior/version metadata: up to3 uncached reads, independent20s deadlines, bounded backoff/Retry-After, terminal4xx fail immediately, no cached/unverified fallback. Real local HTTP tests cover503, abort recovery, malformed responses,404 and429 Retry-After. Installer integrity/security, actual entry startup, frontend and API unit regressions passed. Full Windows suite and Linux18/22/native-engine qualification of unchanged API runtime remain recorded below. New installer candidate still needs CI/promotion/deploy/public install verification.

---

# Released — 2026-10-29 — Chode1.9.32 API testing

PUSHED: release d5fb7ff7feed on master and codex/api-test-engines (runtime introduced by9c495eb, followed by a fixture-only HTTP-method fix). DEPLOYED: Worker2fb37224-6f23-4d55-bf47-7032d8c071b9. Live /api/release and /api/status report1.9.32; api-testing.js is checksummed. Fresh public Windows install ../installed-1.9.32 verified every runtime checksum. The installed package then passed all real Hurl/Schemathesis/k6, CLI and actual TUI input/worker success/failure/cancellation cases, including idempotent setup and zero model calls. Evidence: parent api-tools-installed-windows-{evidence.json,live.log}. User global executable and unrelated home checkout were preserved.

Qualification: full frozen Windows npm test exit0 (parent candidate-1.9.32-final-tests.log). Linux Node18/22 exact-runtime/installed-package/native-engine/native-PTY CI40926349457 PASSED. Earlier CI40925748788 exposed the fixture's older-Node QUERY parser behavior; fixed405+Allow without disabling contract checks. Final test-only additions guard resolved fixture cleanup targets and record installed package provenance; no shipped runtime changed. Post-deploy public Linux qualification will be recorded below after dispatch.

Use `/api-test list`, `/api-test doctor`, `/api-test setup hurl|schemathesis|k6`, `/api-test run ENGINE FILE --base-url URL` (same CLI interface under chode api-test). API-TESTING.md describes flags, native metrics, private setup/reports and limits. All37 TUI commands have input/worker regression coverage. API tests are optional and consume no model calls. Failed checks, native threshold failures, empty HTTP runs, missing reports, input mutation and timeouts cannot count as passes. k6 load testing remains explicit. This is tool integration evidence, not a new coding benchmark score.

Next user directions are preserved: optional keyless website-backed code workers; webpage analysis and a reusable clean/commented HTML/JS component library with provenance, license, dependencies and tests. These remain design/research items, not enabled backends. API-TESTING.md records public-interface candidates and the client/backend boundary. Optional per-line timestamps/time-aware context is also queued. Keep tokens/output economical. Last observed primary51% used/secondary55% used, so the requested handoff threshold10% remaining was not reached; this checkpoint is proactive.

---

# Candidate — 2026-10-29 — Chode1.9.32 API test engines

New work: optional Hurl8.1.0, Schemathesis4.32.7 and k6 2.3.0 adapters. CLI `chode api-test list|doctor|setup ENGINE|run ENGINE FILE --base-url URL`; TUI `/api-test ...` runs through actual worker processes with zero model calls. Existing guarded exec can invoke these for build/repair feedback. No new production dependency; setup stays workspace-private (or explicit CHODE_API_TOOLS_HOME), uses pinned npm/venv releases and checksum-verified k6 archives. No global tools changed. Documentation: API-TESTING.md.

Actual Windows native tests passed using all3 real engines against a real local API: Hurl POST/capture/GET, deliberate Hurl failure and redaction; generated schema success/failure with coverage/negative checks retained; k6 success, failed checks despite native exit0, native threshold failure, no-HTTP rejection, timeout; actual TUI native Hurl success/failure and Ctrl+C closing its in-flight connection; no provider retries/model calls. Test evidence parent api-tools-windows-evidence.json and api-tools-windows-live.log. Fixed real Windows UTF8/launcher issues and actual k6 flags/summary format; fixture now correctly rejects undeclared methods with405+Allow (checks were not disabled). Unit tests cover path/secret/hardlink guards, plan mode, quoted paths, split UTF8 and descendant cleanup. TUI matrix now37 commands. Full Windows regression running in parent candidate-1.9.32-final-tests.log; Linux candidate CI still pending. Public release remains1.9.31 until qualification/promotion/deploy.

Latest user steering: keyless free web UIs as optional generation workers (not API-key free tiers), and webpage/component analysis plus reusable clean HTML/JS with comments. No browser-generation or component-library adapter is claimed in this release. API-TESTING.md records required completion/extraction/verification, provenance/license/dependency/test metadata and the client/backend boundary. AI Horde and documented Gradio public interfaces are research candidates, not coding-qualified routes. Optional timestamps remain queued. Keep output/tokens low; write an OpenCode handoff if remaining usage reaches10%.

---

# Released — 2026-10-29 — Chode1.9.31

PUSHED: runtime078f06aa7ab4 is on master and codex/provider-expansion. DEPLOYED: Worker fbacec15-54eb-446a-9070-74e9ab0a8edd at chode.borken.app. Live /api/release and /api/status report1.9.31; math module and provider catalog are checksummed. A fresh Windows install using the installer downloaded from the live site passed every runtime checksum into ../installed-1.9.31. Its CLI free on saved provider:auto/freeOnly:true in a new workspace; real installed chode math 7*8 --json returned56, tokens0/modelCalls0. The user's global executable was not overwritten (an older chode remains earlier on PATH).

Qualification: final full Windows npm test exit0, parent candidate-1.9.31-math-final-tests.log. Exact-runtime Linux Node18/22/native PTY CI40918477265 passed. Post-deploy public installer/native PTY CI40919133300 PASSED on Linux Node18/22. Provider catalog paths are exercised against local HTTP fixtures; actual authenticated vendor coverage is limited to Agnes model listing, Pro Beta quota failure and Flash streaming success. All36 TUI commands tested through actual input handling/worker processes with controlled model/tool responses. No new coding-quality benchmark or claim of10x free capacity.

User's latest clarification: use APIs/MCP rather than depending on OpenCode for code generation. No OpenCode dependency, adapter or configuration modification was added. Existing scoped workers call provider APIs directly; Chode owns orchestration, files and verification. Follow this direction. Standalone math uses the public Wolfram endpoint with zero model calls; explicit /math or chode math ensures selection. Reset/free recovery commands and catalog guide: PROVIDER-CONNECTIONS.md. Optional timestamp-per-human-output-line + model time awareness remains queued; preserve generated files, JSON/pipes and code-copy fidelity. At last usage check primary22% used/secondary51% used; requested10%-remaining cutoff was not reached. Save a fresh checkpoint if that threshold is reached later.

---

# Direction and qualification update — 2026-10-29

User clarification: no OpenCode dependency. They want a direct API or MCP coding engine, with Chode owning orchestration, context, pieces and final files. No OpenCode adapter was implemented or installed. Existing scoped delegated workers already call provider APIs with shared budgets/free-only policy; build on that instead of wrapping another CLI. No new hosted builder has been enabled or benchmarked. Standalone math now bypasses models through the fixed public Wolfram endpoint; explicit /math and chode math commands, zero-model failure behavior and JSON usage are covered. Actual What is 7*8 returned56 through Chode with model calls forcibly blocked. TUI matrix covers36 commands including real worker math, using a controlled Wolfram response. Latest reset/provider candidate b55c0b0 Linux Node18/22/native PTY CI40915464367 passed. New math changes still need final qualification and release. Optional request: timestamp each human-output line and include observed event times in context, preserving code/machine output. Do after core release if usage remains. Usage tool recovered: at this checkpoint primary22% used, secondary51% used; threshold10% remaining has not been reached.

---

# In progress — 2026-10-29 — Provider expansion, reset/free recovery, Wolfram candidate 1.9.31

The user requests 10x provider coverage, better free/paid choices, and end-to-end TUI testing, especially Agnes keys. Active isolated checkout: C:/Users/fogen/income/New folder/production-eval-2026-10-28/source; branch codex/provider-expansion. Preserve original home checkout changes and other-location work.

1.9.30 is pushed/deployed at runtime 67d3ae7cc6e3, Worker 8f402a33-e903-4185-8107-5c36abff3f5e. The usage-limit approval-review block from yesterday cleared after reset. On 29 October the live endpoints and fresh public Windows install passed; post-deploy Linux Node18/22 public-installer CI40865258503 passed. Final Windows groups passed, with robustness rerun after async cleanup repair. Prior exact-runtime CI40755989360 passed. Native skills/MCP functionality is documented in INTEGRATIONS.md; real account OAuth consent is still the user's action.

Candidate 1.9.31 changes: 184 selectable catalog profiles (181 community cloud profiles, 3 documented local presets), paged/searchable /connect and /providers, explicit endpoint confirmation, standard/legacy Agnes key resolution, user-scoped credential storage with key-free project references, legacy home config reads, stale-auth suppression reset without resetting rate cooldowns, selected-model probes and quota-aware setup/TUI errors. Existing strict-free semantics stay keyless/local; 55 zero-price catalog profiles do not establish free account access or quality. No catalog provider is enabled automatically. Profile counts include gateways/regions and overlap built-ins; do not claim 184 independently verified vendors or 10x free capacity. Catalog is release-checksummed and MIT attribution retained. Existing provider reference preserved, expansion guide PROVIDER-CONNECTIONS.md.

Live Agnes diagnostic used the existing saved key only against the official API: GET /v1/models HTTP200; a tiny completion with saved agnes-2.5-pro-beta returned HTTP403 insufficient_user_quota. Key validity is not the problem in that request. A subsequent tiny streaming request through Chode to agnes-2.5-flash SUCCEEDED from a fresh workspace using the same shared saved credential. The user's real Pro Beta selection was not modified. Never expose the key or promise a code fix can remove account quota.

Full Windows npm test passed (exit0): parent candidate-1.9.31-final-tests.log, using CHODE_PROVIDER_HOME instead of changing USERPROFILE (the latter interfered with Chromium). Current tests: tests/provider-directory.test.js passed all184 setup/request paths over real LOCAL HTTP fixtures, with credential precedence/shared-state/corruption/free-mode tests. tests/tui-command-matrix.test.js passed all34 registered commands through actual TUI input and real worker subprocesses: builds, plan/task, retry/resume, undo/checkpoints, verification, quota-aware Agnes setup, masked key/export and terminal restore. Report in parent directory tui-matrix-1.9.31.json. These use deterministic model/account fixtures, not live vendor credentials. Native Linux PTY workflow script tests/native-workflow.py is newly added and still needs CI qualification. No new benchmark quality score has been measured.

Latest user priorities: reset/free recovery first, optional Wolfram if usage remains. Fixed /free on clearing forced account providers, persisting automatic free routing, and preventing saved paid retry policy from overriding an explicit free selection. Added CLI free on/off/status and reset --confirm [--providers], plus interactive /reset choices. Reset keeps files/history/checkpoints/MCP and creates guarded private backups; saved-provider-key clearing is explicit. New settings-reset.test.js passes actual worker routing, restart, scoped reset, key removal and path guards. Wolfram preset is enabled in the user MCP config at https://agenttools.wolfram.com/mcp; actual discovery/evaluator/Alpha worked (integral x^2 from0to3 returned9), Context had an upstream504, now reported as retryable unavailability. INTEGRATIONS.md records limits. Linux pre-reset candidate27d9117 CI40870541855 passed on Node18/22 including native PTY. Final reset/Wolfram changes require fresh qualification.

Remaining before release: run final Windows regression groups with CHODE_PROVIDER_HOME isolated (leave USERPROFILE alone); push candidate and qualify Linux Node18/22, fixing native-PTY or other surfaced errors without weakening assertions; inspect package/release checksums including provider-directory.json; then promote, deploy and test the public installer. Update this handoff with final hashes, CI and remaining limitations. Usage tool transport remains closed, so the requested 10%-remaining threshold cannot be observed; checkpoint proactively.

---

# Current handoff — 2026-10-28 — Chode1.9.29 and full Python baseline

1.9.29 runtime8fc61f57fc13 is pushed/deployed (Worker09149981-445d-4278-87f2-63becd0de1aa). Fresh public Windows install and every runtime checksum passed after an earlier approval-review usage-limit block cleared. Explicit120-call limit is present. Full frozen Windows npm test passed; Linux Node18/22 candidate CI40682487280 and post-deploy public installer/native PTY CI40750149228 passed.

Changes: explicit --max-calls1–1000 (default30; historical12-call limits unchanged), failure summaries retain separate Python errors before raw-tail truncation with secret redaction, and agent edits/rewrites cannot regress valid Python syntax; grouped edits validate final composed state atomically. Normal request deadlines remain, and provider cooldowns are honored.

The complete34-task Python production-CLI evaluation FINISHED on installed1.9.28:20/34 (58.8%). All original tests and runtime hashes unchanged; no manual solution patches or omitted failures. Full report: benchmarks/results/full-python-production-1.9.28-2026-10-28.{json,md}. This is not the225-task six-language Aider leaderboard; do not compare it as the same protocol as the old five-task pilot. It does not measure1.9.29 fixes. Original run: C:/Users/fogen/income/New folder/production-eval-2026-10-28/runs/2026-10-28T11-26-02-961Z; frozen-adapter.cjs matches recorded hash.

Next user request: native integrations after release verification, prompted by Chode setting up OpenCode instead of itself for Cloudflare. Confirmed gaps: no native MCP client; skills list only reads ROOT/skills, missing the19 globally installed Cloudflare skills under ~/.agents/skills. Build Chode-owned MCP configuration and status/authentication, standard Agent Skills discovery and progressive loading, and native setup targeting. Preserve other agents' settings; configuration alone never proves connection. Research official OpenAI/Claude APIs/SDKs and MCP interoperability. Anthropic docs prohibit third-party claude.ai login/rate-limit reuse absent approval; do not repurpose subscription tokens. OpenAI Docs MCP is public/read-only and does not provide inference.

---

# Benchmark frontend update — 2026-10-28

Frontend commit 6dbc133 is pushed to master and codex/benchmark-comparability, deployed as Worker953f6630-a285-477c-9352-b41e1533e7cc. Runtime remains1.9.28; no CLI code or installer manifest changed. Live page assertions passed. Desktop/mobile Chromium checks passed after serving the Worker assets in preview; frontend-copy, app-research, installer, release-security and metrics-login-sync tests passed.

Removed adjacent Claude Code/OpenCode numerical cards. Official full-benchmark status is explicitly unmeasured. Five-task1.9.19/1.9.24 comparisons are separated by checked/no-feedback protocol and linked to reports, with sample-size/provider/development-exposure limits. Added1.9.27 reservation result (one application,35 assertions,107s, VERIFIED) separately, never as35 benchmark tasks or a public leaderboard score.

Read benchmarks/COMPARABILITY.md before publishing new numbers. Official Terminal-Bench4.0 instructions use Harbor, a GPU-capable sandbox and5 repetitions; existing2.1 shim lacks its Python Harbor adapter. Docker/Harbor not found on PATH in this environment; no official run or paid GPU provisioning was performed. Need a qualified current adapter and full official dataset/evaluator/repetition run, with version/model/budget/environment disclosures and per-task results, before adding a comparable leaderboard figure. Do not relabel the custom five-task pilot or private35-check build.

Local isolated source/logs/screenshots: C:/Users/fogen/income/New folder/benchmark-presentation-2026-10-28. Preserve other-location work and the original home checkout's expense-tracker edit.

---

# Current handoff — 2026-10-28 — Chode 1.9.21

## Release state
Runtime a591b9d255ff (on master and codex/complex-build-recovery) is deployed to chode.borken.app. Cloudflare Worker version c80309e8-991b-452e-acb5-195ce510686f. Live /api/release and /api/status both report 1.9.21. A fresh public Windows installation reports 1.9.21/a591b9d255ff; every installed runtime checksum matches the live manifest. The public installer rejects old source and altered same-version runtime before changing the destination. No global installation was overwritten.

## Fixes
1. orchestrator.js reserves up to 8 EXISTING parent calls (one quarter of the total, minimum2) for integration, repair and verification. Concurrent delegated calls cannot consume that reserve; total budget never increases. Regression exercises concurrent workers at total limits30/12/6. Existing scoped parallel and keyless-free orchestration tests pass.
2. HTML fallback reserves its own staging path atomically and never reads/overwrites/deletes a pre-existing user file at chode-artifact-build.html. Scope and an explicit staging plan limit mutations to that file, exec/task/toolbox stay denied, cross-file free-mode advice is suppressed, and validation exceptions fail closed. Existing workflow and new boundary tests pass. These restrictions apply to single-file artifact recovery, not normal multi-file builds.
3. Local acceptance certification builds its recap from observed files and local checks, without replaying raw tool calls or stale unfinished-repair prose. It explicitly states no independent AI review completed. The actual files still must pass the deterministic gate; this does not weaken verification.

## Evidence and limits
Private development test, NOT a public benchmark: same fixed 35-check room-reservation library/CLI contract, empty workspaces, strict free mode, unchanged tests and no manual source repairs. Installed1.9.20 stopped PARTIAL/exit1 after160s at34/35 (blank-room validation failed). Candidate a4a8cfd finished VERIFIED/exit0 after259s at35/35. Different free-model responses/providers mean one pair does not establish a causal performance improvement. The later recap-only fix has separate regression coverage.

The generated README includes usage but omits requested constraint documentation. The contract only tests README presence/length: passing35/35 is not proof that every prose requirement is fulfilled. This gap is explicitly retained in the report. The old failed Focus Harbor prompt now saved a page on unmodified1.9.20 in127s and passed built-in desktop/mobile/browser checks (including Start); full timer journeys such as pause/reset/persistence were not independently certified. Historical public checked4/5 and no-feedback0/5 scores remain unchanged.

Report: benchmarks/results/complex-recovery-1.9.21-2026-10-28.json. Repro brief + fixed contract: benchmarks/dogfood/room-reservations/{protocol.json,acceptance.cjs}. Original Windows checks were byte-identical during both runs; Git may normalize line endings in the committed reproduction.

## Qualification
Full frozen Windows npm test passed after final recap fix: C:/Users/fogen/income/New folder/chode-complex-2026-10-28/release-final-tests.log (exit0). Final candidate Linux Node18/22 CI passed: https://github.com/fogennnnn/chode/actions/runs/40638781961, with all three new regressions and packaged native PTY checks. Post-deploy public Linux installer qualification: https://github.com/fogennnnn/chode/actions/runs/40639140413 PASSED on Linux Node18/22, including the public installer and installed native PTY startup.

## Next work
Continue the user's complex, multi-language tests. Keep initial failures and unchanged independent contracts; separate development repair tasks from untouched evaluation cases. Highest-value next targets: preserve repair budget across other delegated workflows; improve per-feature acceptance coverage (including requested documentation); test richer web journeys and real multi-file/backend integration rather than only basic page/browser checks. The normal artifact recap can still say Files:no changes / Answered despite saving a page; record/fix harness-owned artifact writes accurately. Do not claim universal complex-build reliability or superiority. Never bypass quotas, enable Pollinations, weaken tests, or trade away existing behaviour.

## Workspace and preservation
Isolated source: C:/Users/fogen/income/New folder/chode-complex-2026-10-28/source/chode. Logs, original installed1.9.20, new installed1.9.21, generated apps and earlier handoff backup are under its parent run directory. User's original repo is C:/Users/fogen (app chode/); preserve dirty workspace-view.js, expense-tracker source and untracked OpenCode/config artifacts. Do not broad-stage the home Git root. Deployment used the clean isolated source, not dirty user files. Other-location tests/fixes may still be running: fetch/inspect before future promotion.

---
## Prior handoff preserved verbatim

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
- DONE 2026-10-26: checked pilot on 1.9.19 = 4/5 (80%) vs 2/5 on 1.9.6, same protocol+dataset, comparator +40pp (zebra-puzzle, affine-cipher flipped; pov fails both; kilo+ovh lanes, no starvation). Recorded benchmarks/results/polyglot-python-checked-1.9.19-2026-10-26.{json,md}; site card updated, committed ac6cf16, pushed, redeployed (d486c8f7) and verified live.
- DONE 2026-10-26: no-feedback baseline on 1.9.19 = 0/5 (same as 1.9.3; comparator refused, side-by-side only). Recorded benchmarks/results/polyglot-python-pilot-1.9.19-2026-10-26.{json,md}. Scorecard redesign live: header 'Measured scores, same harness', 'Checked pilot 4/5' + new 'No-feedback 0/5' cards; competitor cards kept as context. Committed 0164eb4, pushed, redeployed (0529d7eb) and verified live page text.

## 2026-10-24 (Linux workspace /home/rrr) — 1.9.13 + metrics login/graphs deployed

- Committed `fd5641e` (CLI help documents `metrics`/`login`/`whoami`/`logout`) on top of `7ef9a23` (Release 1.9.13); pushed master to origin.
- Deployed chode-hq worker (version 138ea97d-120c-4ec6-af64-a14f4ff4f864) to https://chode.borken.app; verified live `/metrics` page renders login + Tokens-per-day/by-provider graphs.
- Metrics feature: `chode login [handle]` (optional local identity, token shown once), `chode whoami`/`logout`, `chode metrics --export [--days N] [--out file]`, explicit `chode metrics --sync --yes` (POST aggregates only — no prompts/keys — to `/api/metrics` with Bearer token). Server stores per-token windows in METRICS_KV; GET/DELETE require the token. Covered by `tests/metrics-login-sync.test.js` (already in `test:cli`).
- Full `npm test` passes on 1.9.13 with all current fixes.
- Build-matrix status: py-textstats, c-stats, node-inventory VERIFIED; cpp-calc and wasm-math now VERIFIED fresh (README checks added to both acceptance files); web-portfolio acceptance passes in workspace `runs/2026-10-23T23-39-38-757Z-web-portfolio` with only two browser micro-fixes left (submit-input aria-label, `.mobile-panel.open` class on toggle) — resume is saved, blocked on free-provider rate limits. web-dashboard/shop/game/docs not yet run (provider-blocked).
- Provider notes: OVH endpoints are Meta-Llama-3_3-70B / Qwen2.5-VL-72B / mistral / Qwen3.8-27B @4096 tokens (gpt-oss-120b removed for Harmony empty-content); 429s fail fast without burning endpoint buckets; 200-empty/5xx/400-empty rotate endpoints; `providerEndpointCursor` round-robins.
- Next: resume the portfolio micro-fixes when providers recover, then run web-dashboard/shop/game/docs, then release.
