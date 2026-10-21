# Public-task improvement baseline

Initial Chode 1.9.3 result: **0/5 fully solved**. See [measured results and failure analysis](results/polyglot-python-pilot-v1-2026-10-20.md). This baseline is preserved for subsequent iterations.

This is a small **adapted public-task pilot**, not an Aider leaderboard result. The upstream Polyglot benchmark has 225 exercises across six languages; this protocol uses five deterministically selected Python tasks, Chode's production v2 agent loop and a fixed inexpensive budget. Published full-benchmark scores cannot be compared directly.

Source: https://github.com/Aider-AI/polyglot-benchmark

Upstream harness/protocol: https://github.com/Aider-AI/aider/blob/main/benchmark/README.md

Exercise content belongs to Exercism and retains its upstream licensing. Reference implementations under `.meta` are never copied into agent workspaces. Official tests remain unchanged and are kept outside those workspaces. Agents receive instructions and original solution stubs. Evaluation runs all upstream Python unittest tests after generation; missing/failed tests are failures. This is workspace separation, not an OS security sandbox.

## Reproduce

Install Python and Node 18+, then clone the dataset at the recorded commit:

```sh
git clone https://github.com/Aider-AI/polyglot-benchmark.git polyglot-benchmark
git -C polyglot-benchmark checkout 7e0611e77b54e2dea774cdc0aa00cf9f7ed6144f
node benchmarks/public-pilot.cjs --dataset ./polyglot-benchmark --out ./pilot-runs
```

Use `--engine /absolute/path/to/chode.js` to test a different installed version. The runner records runtime SHA256, dataset commit, environment, task selection, test digests, budgets, per-task provider usage, logs and results. Each task gets fresh Chode state, strict free routing, no memory/web/reference solutions, one attempt, six logical model calls and 210 seconds. Provider retries/failover can make more HTTP requests than logical calls. Test execution has a separate 30-second limit. No paid-provider credentials are inherited.

This pilot deliberately uses 30-second request deadlines (the normal Chode agent default is 90 seconds), no external test-feedback retry and no TUI automatic capacity-window continuation. It measures that adapter/budget, not unrestricted product behavior. Label any protocol with different budgets or feedback separately.

Selection sorts all Python exercise names by SHA256 of `chode-pilot-v1:` followed by the exercise name and takes five. The fixed tasks are zebra-puzzle, grade-school, list-ops, affine-cipher and pov. No tasks are removed because they fail. Scores are all-tests-pass task percentages; raw logs and infrastructure failures remain visible.

The `protocol.json` is written before execution. Preserve every baseline result; do not overwrite a baseline with a later favorable run. Fix a general harness problem, rerun the same protocol, then compare:

```sh
node benchmarks/compare-pilots.cjs first/results.json next/results.json
```

Report changed tasks and regressions as well as aggregate percentage. Five tasks are a development smoke benchmark with very wide uncertainty. Public exercises may have appeared in model training. Free provider routing/model availability varies, so repeat runs and record providers before attributing a score difference to harness changes. Expand to a held-out set/full benchmark after improving this fixed development set.

## Protected test-guided protocol

Add `--checked` to expose each original upstream unittest file as a protected acceptance check. It uses 12 shared model calls and 420 seconds per task, with automatic implementation repair and independent final grading. This is a separately labelled protocol, not the six-call no-feedback baseline. Tests are hashed before/after in both the agent workspace and independent evaluator. No test rewriting, reference solutions or manual solution patches are permitted.

Provider cooldown metadata is carried across tasks; model context and source observations are isolated. `--capacity-from <directory>` imports already-known provider cooldowns when continuing development, so restarting an evaluation does not reset Retry-After. Preserve interruption records and infrastructure failures. The comparator refuses mismatched provider-state protocols.

Observed development results: original 1.9.3 no-feedback pilot 0/5; streamed native-tool candidate on that protocol 1/5; separate protected test-guided candidate 4/5. These five tasks were used during development and are not held-out evidence of general superiority.

## SWE-bench Lite smoke protocol (separate score)

`benchmarks/swebench-lite-instances.json` pins the 300 SWE-bench Lite tasks (`instance_id`, cloneable `repo` URL, 40-hex `base_commit`) generated from `princeton-nlp/SWE-bench_Lite` at dataset revision `6ec7bb89b9342f664a54a6e0a6ea6501d3437cc2` (recorded in the file header). The runner `benchmarks/swebench-runner.cjs` checks each repo out at `base_commit`, drives `benchmarks/swebench-agent.cjs` with a wall-clock kill, and appends one `model_patch` per instance to `predictions.jsonl` for offline Docker grading. Smoke commands:

```sh
swebench eval multilingual --gold -i <instance_id> --run-id validate-gold
node benchmarks/swebench-runner.cjs --instances benchmarks/swebench-lite-instances.json --limit 5
```

Mint a fresh `--run-id` per attempt; reusing a run id replays cached reports. The comparator accepts same-`protocol.name` runs and refuses cross-protocol comparison, so SWE-bench scores are never compared with the 5-task pilot. No test weakening: patches touching test paths are rejected and the Lite task set is never filtered by outcome.

## Capacity continuation protocol (separate score)

Use --checked --capacity-resume to wait for persisted capacity and resume saved work inside the same 420-second generation deadline, 12 shared model calls and 24 shared tool executions. Waits count against the deadline; original tests and independent grading remain unchanged. A maximum of 30 capacity resumes prevents zero-call loops. This is one checkpointed attempt, not fresh retries or quota bypass. Its distinct protocol name/settings prevent comparison as if it were the original checked pilot. No initial-source observations are replayed on resume. The original checked mode is unchanged.
