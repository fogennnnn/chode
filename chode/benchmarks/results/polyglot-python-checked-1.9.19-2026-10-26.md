# Chode 1.9.19 development pilot — 2026-10-26

**4/5 (80%)** on the unchanged protected-test checked protocol, vs 2/5 (40%) for 1.9.6 on the same protocol, dataset commit and task set (+40pp; comparator-validated same-protocol comparison). Changed tasks: zebra-puzzle and affine-cipher now pass; pov fails on both. All original test hashes unchanged.

This measured released runtime 745e5f6 (engine SHA256 52f1e022a7d04d1e27bbef2aa68be6f2bec9abb9c32becf318716ffcd641b1cf), which includes the same-run overwrite ownership, uncapped-orchestrator stagnation breakers, and forced-cap PARTIAL-meta fixes. No task was removed or manually repaired.

| Task | Pass | Tests run | Model calls | Answers |
|---|---|---:|---:|---:|
| zebra-puzzle | true | 2 | 7 | 7 |
| grade-school | true | 20 | 6 | 5 |
| list-ops | true | 24 | 7 | 6 |
| affine-cipher | true | 16 | 12 | 11 |
| pov | false | 15 | 12 | 12 |

All five tasks ran on kilo+ovh free routing with answers on every task (no capacity starvation this run). Provider routing varied, so the delta alone does not isolate a harness improvement. Five public development tasks are not the official Aider leaderboard or held-out evaluation.
