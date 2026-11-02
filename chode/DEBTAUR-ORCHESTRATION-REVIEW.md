# Debtaur orchestration review — 2 November 2026

Status: architecture review and local contract probes; **no orchestration integration enabled or changed**. Scope is Debtaur alone, excluding Cone. Chode baseline is 1.9.52, runtime fix commit69db211. The full regression suite and live RE checks passed before this review.

## Sources actually inspected

- Chode `runAgentLoop` and `cmdAI` in chode.js, orchestrator.js, expert-panel.cjs, tui-worker.js, reliability-memory.js, reliability-services.js and RELIABILITY.md.
- [aiudit-plugins at53a6d94](https://github.com/fogennnnn/aiudit-plugins/tree/53a6d94e46be30c6e719f57fe41a97e4fa048545): root contract, all three adapter implementations, Codex protocol reference and host setup documentation. This repository contains adapters, **not the native Debtaur engine**.
- Local actual Worker adapter: C:/Users/fogen/debtaur-worker/src/engine_do.mjs and cone/judge_wasm_only.mjs, plus its compiled WASM through its documented ABI. The adapter imports only the judge for the direct probes; Cone was not loaded. Artifact SHA-256 values are recorded with the probes. This local binary is not established as the latest native engine revision.
- The separate public debtaur-demo and local cone-debtaur JS reference were identified, then excluded as substitutes for the native engine.

The documented C source path C:/Users/fogen/root/context-debt-engine is absent. The user is locating the current native source. Full C architecture/source review remains pending; no claim of complete native verification.

## What Chode currently does

Debtaur is used only for opt-in historical-memory recall. The adapter submits the fixed policy `all grounded are reusable` and a locally established grounding fact; it does not assess worker plans or decide completion. This checkout has no reliability settings enabling recall. `--no-memory` bypasses it, and delegated orchestrator workers explicitly use noMemory:true.

The orchestrator groups disjoint owned files, reserves calls for parent integration/verification, dispatches workers and retries missing/invalid files. Its unit-level checks establish file presence, nonempty content and JS/JSON syntax. The parent runs broader completion/acceptance/browser checks. Expert-panel outputs are advisory. Debtaur should consume real evidence from these paths rather than reinterpret expert prose as fact.

## Protocol boundaries that must remain distinct

1. Plugin JSON policy shim: `{tool,command}` to `{allow:boolean,why?}`. The README requires explicit `allow===true`. Offline fail-open is an explicit plugin design, not proof of successful evaluation.
2. Raw gate_cli: plain assertion lines, `!` authorisation and `-` retraction; outputs use `kind:gate`. JSON requests must not be piped directly to this engine as facts.
3. The local judge WASM ABI `_judge_run(inputPtr,outputPtr,capacity)`: tab-separated stated/dreamt/!/retraction operations; gate rows use `op:gate`. The two raw harnesses cannot be interchanged by guessing prefixes or accepting the first arbitrary JSON object.
4. The deployed-style `/api/judge` wrapper adds Cone candidate work, truncates world entries to50 and strings to400 characters, prefixes world entries as stated, and derives named gaps from reason text. That is not a lossless generic orchestrator protocol. A judge-only bridge should preserve actual provenance and structured engine evidence.

## Measured findings

See [adapter probes](benchmarks/results/debtaur-adapter-probes-2026-11-02.json) and [WASM probes](benchmarks/results/debtaur-wasm-probes-2026-11-02.json).

- Direct local WASM calls work independently of Cone. Repeating the policy batch gives identical response bytes. A subsequent batch with no world does not retain the previous facts. The orchestrator therefore needs its own evidence state and must rebuild/replay the applicable world for each decision.
- Grounded membership allows, missing membership denies, dreamt support denies, contradiction refuses, and withdrawing membership removes the allowance. This demonstrates specific supported cases, not arbitrary code correctness.
- Unsupported `teacher`, `taught` and `bogus` prefixes are not rejected as protocol errors by this local binary; they become ordinary stated input. Validate operation enums and delimiters before encoding. Do not transplant the JS reference protocol into native WASM.
- Real local HTTP probes through Codex gateCheck accept `{}` and `[]` as `allowed`, contradicting the shared explicit-allow contract. Both explicit allow and explicit deny controls worked.503 produces the documented offline fail-open result.
- Source inspection: Claude's hook reads decision/reason rather than the shared allow/why response. OpenCode enforces explicit allow on a usable body, but treats transport/error statuses as unavailable. Codex exposes an advisory tool: it does not intercept an execution that skips gate_check.
- The Codex JS files rely on CommonJS without a package boundary; cloning under a type:module parent fails at runtime. The probe directory was isolated as CommonJS to test the adapter logic. No plugin installation or user configuration changes were made.

## Proposed Chode integration

Put a judge-only adapter inside the host orchestrator, with typed events and a deterministic evidence reducer. Use scoped identities for task, worker, attempt, artifact generation and check execution. Record real tool exits, artifact hashes, protected-test digests and ownership; model statements remain hypotheses/advice. Preserve the original user requirements independently.

Evaluate policy at worker dispatch, handoff acceptance, retry/resume and final certification. A file mutation invalidates dependent check evidence; a crash invalidates worker ownership while preserving files and completed independent checks. Rebuild the judge world from current evidence so a past pass cannot certify changed bytes. Persist the reducer state and decision receipts for replay instead of retaining the whole conversation.

Missing evidence should produce a concrete next action, such as running the affected acceptance check. Contradiction should prevent conflicting completion claims. An unavailable or malformed judge response must be represented distinctly from allow/deny: it cannot count as Debtaur certification. Chode can continue useful work under its existing local checks without claiming an unperformed judge evaluation. Existing permission modes, provider budgets and cancellation remain authoritative.

First integration acceptance cases: parent/worker session delegation, worker crash and reassignment, changed artifact after a passing test, stale check after retry, contradictory completion facts, unknown protocol operations, malformed/timeout/offline verdicts, replay isolation across tasks and deterministic retraction. Require real end-to-end execution, deliberate negative controls and byte-identical replay. Do not make it the default until the current native source and its limits are pinned and these cases pass.
