# Chode1.9.51 evaluation checkpoint — 2026-11-02

Frozen runtime: f86b78f; all release hashes verified in a private installed prefix. The previous checkout has local subtree deletions and was left untouched. New snapshot: benchmark-2026-11-02/source.

Focused suites pass: local-memory, plan-z6, z6-integration, session-claim, history-export, production-public, entry-startup, expert-panel and YOLO. Full npm test fails in tests/reliability-memory.test.js: grounded history does not reach the actual implementation model. Do not describe the full suite as green. Logs remain outside the repo in ../checks and ../full-regression.log.

A separate real API probe confirms handoff persistence is broken: saveHandoffToMemory returns false because localMemory.storeMessage is not exported; loadHandoffFromMemory returns null because localMemory.getSession is not exported. Component tests do not cover this persistence path. Static integration review also finds that serializeHandoff returns no handoffId while the loop stores one, the loop does not await the async handoff load, and deserializeHandoff returns a wrapper rather than a Z6Plan instance. These runtime integration issues are not repaired in the frozen measured version.

Full34 Python evaluation is active on frozen1.9.51. Same pinned dataset and30 logical calls/3600 seconds per task; explicit YOLO added and all runtime hashes checked each task. Protocol records this difference from1.9.39. Do not publish partial progress as a full score.

Six-language evaluator: benchmarks/polyglot-six. All225 tasks, original upstream Docker grader, two attempts, original tests absent from generation containers, original failure output for attempt2. Each attempt has30 logical calls/1800s; upstream grader timeout180s. Different Chode scaffold means this is a full Aider Polyglot task-set evaluation, NOT an official Aider model leaderboard row. Must pass actual original-stub grading in all6 languages before inference; fixture tests alone are insufficient. Official adapter/toolchain/data commits are pinned in README and protocol. Public development exposure is disclosed.

Frontend development history removed, evidence retained in GitHub. Deployed d522ed1 / Workerc0834aa0-68f6-4eaf-90f4-361d771f49d6. Live content verified. No new score is claimed yet.
