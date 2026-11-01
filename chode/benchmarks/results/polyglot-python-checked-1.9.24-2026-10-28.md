# Chode 1.9.24 development pilot — 2026-10-28

**4/5 (80%)** on the unchanged protected-test checked protocol, same score as 1.9.19 (comparator: 80 → 80, no changed tasks; pov fails on both). All original test hashes unchanged.

This measured engine 1.9.24 (SHA256 9c631faa344a6d4111c8558b5799c15512b8833154038c9c200efbee011f932b), which includes the same-run overwrite ownership, uncapped-orchestrator stagnation breakers, forced-cap PARTIAL-meta fixes, TUI install-and-run agent defaults, dead-paste/empty-Enter connect hints, single-method connect skip, and surfaced connection-test causes. No task was removed or manually repaired.

| Task | Pass | Tests run | Model calls | Answers |
|---|---|---:|---:|---:|
| zebra-puzzle | true | 2 | 4 | 4 |
| grade-school | true | 20 | 7 | 6 |
| list-ops | true | 24 | 5 | 5 |
| affine-cipher | true | 16 | 7 | 7 |
| pov | false | 15 | 12 | 12 |

All five tasks ran on kilo+ovh free routing with answers on every task (no capacity starvation this run). Provider routing varied, so repeat scores alone do not isolate a harness improvement. Five public development tasks are not the official Aider leaderboard or held-out evaluation.
