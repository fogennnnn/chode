# Longer free builds and production evaluation

The historical pilot intentionally forced30-second provider deadlines and6 or12 logical model calls. Those measurements remain frozen under their original protocol; they do not represent an unrestricted interactive build. Provider rate limits and outages are separate constraints and must still be honored.

The next runtime candidate supports an explicit larger total budget:

    chode ai "Build the complete application" --free --max-calls 120

Default30 remains unchanged; an explicit integer1–1000 is accepted without silently clamping it to30. CHODE_MAX_MODEL_CALLS also supports the explicit larger limit (useful for the TUI). Model calls remain shared across workers, repair, verification and continuation rounds; increasing the limit never resets provider cooldowns, permits paid fallback or changes test requirements. Existing tool caps, continuation limits, stagnation checks and checkpoints remain active. This is a controlled larger run, not an unlimited completion guarantee. Actual upstream request/server limits cannot be overridden; completed files are kept when capacity runs out.

The production evaluator is separate from that candidate and is currently pinned to installed1.9.28 at30 calls/task. It uses all34 pinned Python exercises, normal CLI request handling,3600 seconds/task including generation/waits, and a separate30-second independent grading timeout. The latter cannot terminate generation. It protects every upstream test/support file through a hash-checking immutable discovery wrapper; grading reruns original tests outside the model workspace with bytecode writes disabled. No reference implementations or manual repairs are used. Full Python track is not the complete225-task/six-language Aider leaderboard, and provider/model variation must be disclosed.

Reproduce:

    node benchmarks/production-public.cjs --dataset <clean-pinned-polyglot> --engine <installed-chode.js> --out <new-directory>

Runtime fixes in the candidate: compact summaries preserve distinct Python failures even when later tracebacks are large (raw tails remain bounded/redacted); automated edits cannot turn valid Python into a syntax-invalid file; grouped edits validate their final composed state before writing anything. This does not prove semantic correctness. The current baseline remains unmodified so candidate results can be measured separately.
