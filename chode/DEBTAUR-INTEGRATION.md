# Debtaur orchestration integration

Status: implementation in progress; default activation requires an installed, pinned private runtime. No Cone dependency, remote service, model call or permission-policy replacement.

## What runs where

- `debtaur-engine.js`: public Node bridge, strict native protocol encoder/decoder, pinned runtime hashes, worker lifecycle/deadlines and explicit local setup/status.
- `debtaur-worker.cjs`: isolated worker thread loading the private standalone WASM. Calls are serialized. It uses the native `_judge_run(input,output,capacity)` ABI; high-water native state resets per batch. Never substitutes a JS judge, HTTP demo or model answer.
- `debtaur-orchestration.js`: host-owned scoped leases, artifact snapshots, policy facts and decision receipts. Recorded history is audit data; it is never loaded as authority for a new build.
- `orchestrator.js`: obtains leases before dispatch, validates file checks against stable hashes before accepting handoffs, and releases failed/retried workers.
- `chode.js`: binds local acceptance/browser checks to artifact generations and rechecks that binding after independent review before final certification.

Private engine C/WASM is not redistributed in Chode. Its backup/source histories remain in the private `fogennnnn/debtaur` repository. Review source revision: phase3-harness `7f0b84b` (full revision recorded in the private recovery index). The saved WASM has been functionally probed; exact source-to-binary reproducibility is not yet claimed. Pinned byte hashes are in debtaur-engine.js. Changing a pin requires explicit review and rerunning native/bridge parity and negative controls.

## Setup and control

```sh
# From your separately authorized private Debtaur checkout:
chode debtaur setup /absolute/path/to/debtaur/backups/2026-11-02/worker/wasm
chode debtaur status
```

Setup copies only the known glue and WASM into `~/.chode/runtimes/debtaur`, using private file permissions. It preserves differing existing files for review. No credentials or network access are needed. CHODE_PROVIDER_HOME, when configured, replaces the user home for this location. Override the runtime directory with `CHODE_DEBTAUR_RUNTIME`; hashes still must match. Explicitly opt out with `CHODE_DEBTAUR=off`. YOLO and existing permissions are unchanged.

Without an installed runtime Chode continues its established local verification. Metadata reports unavailable, never a Debtaur approval. If an available judge explicitly denies, or host checks detect stale/conflicting evidence, that checkpoint cannot be accepted. A timeout, malformed response or runtime-integrity failure is unavailable, not approval; useful baseline work can continue without claiming native certification.

## Evidence and decisions

The host creates facts only from actual scoped ownership, completed checks and current artifact hashes. Prompts, expert-panel advice and worker completion prose never become trusted facts. The original user goal remains authoritative.

| Boundary | Required facts | Meaning of allow |
| --- | --- | --- |
| Dispatch | valid source scope; no conflicting active owner | Worker may start its scoped work |
| Handoff | current lease; stable checked artifact generation; successful worker/file checks | Parent may accept these files for integration |
| Verification | stable artifacts across actual checks; checks passed; workers settled | Current check evidence may be consumed |
| Final confirmation | same checked artifacts after independent review; workers settled | Check binding is still current |

An allowance establishes these policy conditions, not arbitrary code correctness or satisfaction of every user requirement. Existing protected tests, quality checks, browser checks and independent review remain necessary. Native failures do not spend or enlarge provider budgets.

Each batch is rebuilt from current host facts. Withdrawal/changed hashes remove the premise supporting the allowance; no stale conclusion is reasserted. Leases are reserved synchronously before awaiting native decisions, so concurrent workers cannot race into the same scope. Retries acquire new leases; failed leases cannot submit later handoffs.

The pinned native parser supports the tested two-premise conjunction form. Three required facts are expressed as two chained two-premise rules, not a guessed flat three-way conjunction. Every truth-table combination is checked against the real binary.

## Native protocol contract

This is the judge-WASM/judge_cli tab protocol, not the plugin JSON shim or raw gate_cli prefix protocol:

```text
stated<TAB>if the artifact is current and the check is passed then the evidence is usable
stated<TAB>the artifact is current
stated<TAB>the check is passed
!<TAB>the evidence is usable
```

Only stated, dreamt, ! and - operations are accepted by the public encoder. No control characters or unbounded clauses. Unsupported native prefixes can become facts, so the host rejects them before the worker. One output row per operation is required. Gate rows must have op:gate, the exact input clause, a recognized verdict, an explicit consistent boolean allow, nonempty reason and typed evidence. Unknown/malformed outputs cannot authorise.

Limits:48 operations,180 UTF-8 bytes per clause,24KB batch,512KB output,4 in-flight requests,5-second worker deadline (bounded configuration up to10 seconds). Native calls in one module never interleave. Timeout/cancellation terminates the worker and resolves outstanding requests as unavailable. Idle workers are unreferenced; build-finally cleanup closes owned workers.

## Storage, replay and privacy

Local `.chode/orchestration/<run-uuid>.json` contains the task digest, scoped file hashes, controlled policy facts/proofs, runtime/input/output hashes and a hash-linked bounded decision journal. It contains no source contents, prompts, API keys or shell-command output. No service receives it. Storage failures do not convert checks into approvals. `--no-memory` disables this journal while retaining current in-process correctness checks; no historical memory is recalled by this integration.

The journal is inspectable audit evidence, not an authenticated store against a user able to rewrite the workspace. New builds never use it to grant ownership or mark tests passed. File hashes are recomputed from current bytes. Preserve reports when diagnosing; do not label replayed history as a newly executed test.

Snapshot scope is observed write/edit paths, existing planned paths, the protected acceptance test and package.json when present. It is not a snapshot of every dependency or the whole filesystem. Bounds:256 files,16MB per file,64MB total. Linked/hardlinked/credential/internal-state paths are excluded. An unobservable set cannot claim native certification; existing host checks remain in force.

## Verification and maintenance checklist

Before default release: native C make test; direct native/WASM protocol probes; bridge malformed/empty/timeout/cancellation/concurrency controls; ownership conflict/crash/retry/stale-handoff controls; artifact mutation during and after checks; actual multi-worker build and protected acceptance; deterministic repeated input/output; deliberately broken variants that must fail; full Chode regression suite and release-integrity checks.

When changing the integration, document the exact stage, fact sources, invalidation rules, protocol version/hash, positive/negative controls and any unsupported cases. Never accept a model's self-reported pass as a host fact, silently truncate a world, treat no verdict as native approval, or add Cone as a hidden dependency.
