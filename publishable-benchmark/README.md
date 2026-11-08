# Publishable Chode benchmark (Aider Polyglot Python)

This folder is the correct, ready-to-run benchmark workspace for Chode 1.9.53.

## Why not feed the raw polyglot folder to Chode?

`polyglot-benchmark` is only a dataset (stubs + tests). Chode cannot turn "Run the benchmarks in polyglot-benchmark" into reproducible published scores by itself; that causes provider-capacity/doom-loop failures because the task is ambiguous and unisolated.

Use the official runner instead. It gives every task fresh workspace/provider state, protects original tests, runs independent grading, records hashes, and aggregates a score.

## What this folder contains

- `dataset/` — clean pinned copy of `Aider-AI/polyglot-benchmark@7e0611e77b54e2dea774cdc0aa00cf9f7ed6144f` (Python track starts at 34 exercises).
- `RUN_BENCHMARK.ps1` / `RUN_BENCHMARK.cmd` — one-command benchmark run.
- `summarize-results.cjs` — turns the runner output into publishable Markdown and brief text.
- `BENCHMARK_PROMPT.txt` — exact prompt/commands if you drive it from the TUI.

## Engine and version

- Chode runtime: `C:\Users\fogen\chode\chode\chode.js`
- SHA256: `826992AC3A77BF9B8A384FB2A1B43989AB193F2413643EABC3CB7BBCB9B0758E`
- Version: 1.9.53
- Provider: configured `ollama-cloud` by default; run uses `--free`, so free routing/provider state is carried task to task.
- Dataset commit: `7e0611e77b54e2dea774cdc0aa00cf9f7ed6144f`

## Run

```powershell
.\RUN_BENCHMARK.ps1
```

or:

```powershell
node "C:\Users\fogen\chode\chode\benchmarks\production-public.cjs" --dataset "C:\Users\fogen\chode\publishable-benchmark\dataset" --out "C:\Users\fogen\chode\publishable-benchmark\runs" --engine "C:\Users\fogen\chode\chode\chode.js"
```

Expected: `START <task>` ... `RESULT ...` ... `COMPLETE x/34`. Duration can be up to 34 hours depending on providers.

## Publish

After completion:

```powershell
node summarize-results.cjs runs\<timestamp>\results.json
```

Then copy the run's `results.json` and generated `results.md` into `C:\Users\fogen\chode\chode\benchmarks\results\` under a name like `full-python-production-1.9.53-YYYY-MM-DD.{json,md}`.

Update `C:\Users\fogen\chode\chode\chode-hq-worker.js` benchmark brief (`X of 34 Python tasks solved`) and deploy the Worker. Do not overwrite earlier snapshots; each run keeps its timestamped folder.

## Notes

- `dataset/` must remain clean at the pinned commit. The runner rejects a changed dataset.
- Do not edit tests, wrappers, or the engine during the run.
- This is the 34-task Python track, not the full 225-task/six-language Aider leaderboard; label it that way in any publication.
- Provider variation must be disclosed. The run records per-task provider/status in `results.json`.
