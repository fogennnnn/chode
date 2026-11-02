# Full six-language Polyglot evaluation

This adapter evaluates Chode on all 225 pinned Aider Polyglot tasks. It is **not an official Aider model leaderboard row**: Chode replaces Aider's Coder scaffold, with its own council, tools and verification. Do not rank results as interchangeable with that leaderboard.

Upstream harness: `Aider-AI/aider@5dc9490bb35f9729ef2c95d00a19ccd30c26339c`.
Dataset: `Aider-AI/polyglot-benchmark@7e0611e77b54e2dea774cdc0aa00cf9f7ed6144f`.

The original upstream Dockerfile supplies the six toolchains. `grade.py` invokes its unmodified `run_unit_tests`, including Java disabled-test removal and JavaScript `xtest` activation. Generated code is graded from a fresh original scaffold; only designated solution files are transferred. Original dataset tests remain read-only. Unlike upstream's truthiness check, an empty error string cannot turn a nonzero process exit into a pass.

Each task has at most two attempts. Original tests are absent from the generation container; attempt two receives grading failure output. Each attempt permits 30 logical model calls and 1800 generation seconds. Grading follows upstream's 180-second timeout. Strict free mode and explicit YOLO are enabled; no host API keys, credentials, dataset or original tests are mounted into the generation container. The model may run its own checks, so this remains an agent evaluation with a disclosed different scaffold. Public development exposure means it is not held out.

Before inference, the evaluator must reject one untouched stub in **each** language. Infrastructure errors stop the run rather than manufacture a score. Incomplete runs cannot be called full results. Completed tasks are retained on resume; interrupted tasks require an explicit audit before reuse. Reports record all failures, attempts and original test hashes. Run in Linux with a local Docker engine:

```sh
python3 run.py --dataset /path/to/pinned-dataset --out /path/to/results --preflight-only
python3 run.py --dataset /path/to/pinned-dataset --out /path/to/results
```

Build the original Aider benchmark image as `chode-polyglot-eval:5dc9490-lf`. The derived `chode-polyglot-agent:1.9.51` image installs the frozen Chode tarball and verifies every release hash during its build. Pin image IDs in the recorded protocol. Run `python3 test_runner.py` for adapter fixture checks. Adapter checks do not establish that the six actual graders work; the container preflight does that.

Windows/WSL preflight: use a Linux LF checkout of the pinned dataset, not a Windows CRLF worktree. The local `-lf` grader image restores the two shell graders byte-for-byte from the pinned Git commit and marks them executable; no test logic changes. Container CPU cap is two, recorded in the protocol. All failed preparation artifacts are retained and all six preflights rerun before inference.

Gradle distribution is warmed before scoring, and grader-only Gradle/Cargo/Go cache volumes persist across tasks as in the upstream long-lived container. They are never mounted into model-generation containers. Cold dependency setup must not silently consume the original180-second test allowance. The scoring timeout remains180 seconds.
