# Benchmark comparability and evaluation readiness

As of 28 October 2026, Chode has **no completed, directly comparable full-leaderboard result**. Development pilots and private build checks must never be ranked alongside published full-benchmark percentages. Missing is not zero.

## Recorded evidence

- Protected-test Python development pilot: 1.9.24 solves4/5, same as1.9.19; 12 logical model calls and420 seconds/task. Same pinned task set and protocol; original tests immutable. See results/polyglot-python-checked-1.9.24-2026-10-28.{json,md}.
- No-feedback pilot: 1.9.24 solves1/5 versus0/5 on1.9.19; 6 logical calls and210 seconds/task. Separate protocol, not an interchangeable estimate of protected-test performance. See results/polyglot-python-pilot-1.9.24-2026-10-28.{json,md}.
- Private reservation build: 1.9.27, one application,35 acceptance assertions,107 seconds, VERIFIED/exit0. This is not35 benchmark tasks, not a held-out score, and not the latest release's result. See results/reservations-1.9.27-2026-10-28.json.

Five public exercises were used in development. They are not the official225-task, six-language Aider Polyglot evaluation. Provider/model routing varied, so even same-protocol version deltas do not isolate the effect of the harness. Use compare-pilots.cjs before publishing version comparisons, retain failed tasks and infrastructure failures, and link immutable reports.

## Official comparison route investigated

Primary sources checked28 October2026:
- https://www.tbench.ai/run
- https://www.tbench.ai/
- https://aider.chat/docs/leaderboards/
- https://github.com/Aider-AI/aider/blob/main/benchmark/README.md

Current official Terminal-Bench instructions specify Harbor, dataset terminal-bench/terminal-bench@4.0.0, a GPU-capable sandbox and5 repetitions (-k5). A CPU-only subset, older2.x task revision or one repetition cannot be labelled the4.0 leaderboard score. Aider publishes its own task set, edit/scaffold and attempt details; our five-task custom adapter is not that harness.

Local readiness check: Docker and Harbor are not on PATH. benchmarks/harbor-chode-agent/chode_agent.cjs explicitly says its Harbor Python agent wrapper remains to be added; it is a2.1 prototype, not a registered4.0 adapter. No GPU sandbox credentials or runtime were established in this task. No official run was attempted and no comparable score was manufactured. Paid GPU infrastructure was not provisioned.

## Required before publishing a comparable score

1. Implement and qualify the Harbor agent against its current API, inside the benchmark environment. Preserve official task files, tests, timeouts, sandbox boundaries and reward evaluation. Verify known gold/oracle tasks before measuring the agent.
2. Pin the full dataset release/revision, evaluator and agent commits, model/provider identities, tool access and attempt policy before running. Use the complete required task set and repetitions; record failures and missing trials in the denominator.
3. Run the same official protocol, not a five-task adaptation. Publish per-task rewards, trial counts, aggregate resolution rate, uncertainty, cost or unavailable-cost disclosure, and trajectories with secrets removed. Keep diagnostics/development trials distinct from final evaluation.
4. Compare only matching benchmark versions and evaluation conditions. Disclose model/routing/environment differences: a different model+agent result is not an isolated test of harness quality. Link the official submission or a reproducible independent report, and state which it is.

Until these conditions are met, the landing page must say the official result is unmeasured and keep pilots/private checks in distinct sections. Do not copy competitor numbers into adjacent score cards or replace task pass rates with individual assertion counts.
