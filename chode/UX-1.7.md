# Chode 1.7 — bounded autonomous repair

The agent loop shares a budget of at most 30 model-stage calls across planning, execution, verification and nested repairs. Provider attempts default to a 30-second timeout with at most two configured retries per stage. This is a bounded request loop, not a perpetual background agent. Existing permission checks and the workspace request deadline remain in place.

Use `chode ai "Implement the calculator" --check tests/acceptance.cjs` to supply an existing JavaScript acceptance test inside the workspace. The loop runs that test, includes the actual failure diagnostics in repair prompts, repairs automatically for at most two rounds, and reruns the checks. The original test digest is checked before and after execution; changing it prevents verification. JavaScript syntax checks now cover every recorded changed file, not only the first twelve. Model verification remains a separate gate: passing a model-written self-test alone does not establish correctness.

Verification uses the provider identity actually returned, and cannot pass if that identity matches the drafter or is absent. Repair tool activity and questions remain visible in the UI. Repairs with no observable changes stop early instead of spending another identical round.

Failed, unverified, pending and partial workspace runs stay queued with the original prompt/session and bounded failure details. `/retry` carries those diagnostics forward as untrusted context, with an instruction to recheck current files and preserve completed work. Successful verified retries can acknowledge the queued item.

Offline end-to-end validation wrote an incorrect calculator, ran a real failing acceptance process, repaired it through the actual edit tool, reran acceptance successfully, and required a separate verifier identity. Model responses were deterministic fixtures; no live-model success rate is claimed. Additional regressions cover provider fallback, shared call limits, changed tests, no-progress repair and recovery of all unfinished statuses.

In the workspace, use `/check tests/acceptance.cjs` to select a test for subsequent builds, `/check` to inspect the selection, and `/check off` to clear it. Failed tasks preserve the selected check when queued so `/retry` can use it after reopening the workspace.

Release retest: rebuilt and executed a harmless Windows native fixture through Chode (expected result: invoice total 31), reran the real REA CLI hash/immutability gate, and reran automatic RE through actual Ghidra with an isolated model fixture. The 21 existing program checks and responsive website interactions were rerun as well.

The live automatic-RE retest exposed filename contamination in task classification: `re-test.exe` was mistaken for a request to run tests. Classification now excludes filenames from verb detection, handles trailing sentence punctuation, and keeps multi-verb read-only requests out of mutation planning/verification. Explicit regression cases cover these routes. This retest validates native inventory and integration, not recovery of arbitrary program behavior from a binary.

Acceptance-test selection and its original hash also survive provider failure and workspace timeout. Retry diagnostics retain detailed assertion output while final failure messages stay concise.
