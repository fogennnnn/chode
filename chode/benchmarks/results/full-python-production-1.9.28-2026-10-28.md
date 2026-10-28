# Full Python production-CLI development evaluation — Chode1.9.28

**20/34 tasks solved (58.8%)**. All34 tasks completed; original tests and runtime hashes unchanged. This is the complete pinned Python track, not the225-task six-language Aider leaderboard and not an agent-to-agent comparison.

Installed runtime1.9.28;30 shared logical model calls/task;3600s generation allowance/task; normal CLI provider request handling; strict free routing; protected upstream tests; independent grading with a separate30s test timeout. No reference solutions or manual repairs. All failed tasks remain counted.

| Task | Solved | Tests run | CLI status | Seconds |
|---|---|---:|---|---:|
| dot-dsl | no | 1 | PARTIAL | 469 |
| connect | yes | 10 | VERIFIED | 171 |
| rest-api | yes | 9 | VERIFIED | 195 |
| grade-school | yes | 20 | VERIFIED | 97 |
| list-ops | yes | 24 | VERIFIED | 63 |
| transpose | no | 12 | PARTIAL | 779 |
| grep | yes | 25 | VERIFIED | 851 |
| beer-song | yes | 8 | VERIFIED | 306 |
| zebra-puzzle | no | 0 | PARTIAL | 646 |
| two-bucket | yes | 9 | VERIFIED | 121 |
| phone-number | yes | 21 | VERIFIED | 71 |
| sgf-parsing | no | 23 | PARTIAL | 735 |
| poker | no | 1 | PARTIAL | 1200 |
| go-counting | yes | 11 | VERIFIED | 1421 |
| zipper | no | 1 | PARTIAL | 355 |
| paasio | no | 25 | PARTIAL | 389 |
| hangman | yes | 7 | VERIFIED | 756 |
| pig-latin | yes | 22 | VERIFIED | 169 |
| pov | no | 15 | PARTIAL | 1746 |
| bowling | no | 31 | PARTIAL | 388 |
| forth | no | 54 | PARTIAL | 477 |
| dominoes | yes | 13 | VERIFIED | 609 |
| simple-linked-list | yes | 20 | VERIFIED | 113 |
| proverb | yes | 8 | VERIFIED | 71 |
| affine-cipher | yes | 16 | VERIFIED | 102 |
| react | no | 14 | PARTIAL | 2299 |
| scale-generator | no | 17 | PARTIAL | 599 |
| wordy | no | 25 | PARTIAL | 317 |
| bottle-song | yes | 7 | VERIFIED | 213 |
| variable-length-quantity | yes | 26 | VERIFIED | 267 |
| food-chain | no | 10 | PARTIAL | 1134 |
| robot-name | yes | 4 | VERIFIED | 506 |
| book-store | yes | 20 | VERIFIED | 981 |
| tree-building | yes | 13 | VERIFIED | 263 |

The five historical pilot tasks were previously used for development. Routing/models may vary. This new production protocol has different scope and budgets, so its58.8% cannot be compared as an improvement/regression versus the old4/5 pilot.

General defects observed and fixed separately in1.9.29: test-feedback tails hid earlier failures; edits could corrupt valid Python indentation; explicit requested budgets were silently clamped to30. This run stayed frozen on1.9.28 and does not measure those fixes.

Reproduce with benchmarks/production-public.cjs and the recorded dataset/runtime/adapter hashes. Do not rerun only the failures and present that as a full-track score.
