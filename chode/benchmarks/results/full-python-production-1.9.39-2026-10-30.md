# Full Python production-CLI development evaluation — Chode 1.9.39

**21/34 tasks solved (61.8%)**. All 34 tasks completed; 13 failed. Every original test hash and all frozen release runtime hashes match. All outcomes were independently regraded again before publication and agreed with the recorded results.

Complete pinned Python track only, not the full six-language Aider leaderboard or a comparison with other agents. One attempt per task, 30 shared logical model calls and up to 3600 seconds generation per task; separate 30-second grading timeout. Strict free routing, protected original tests visible, no web/reference solutions or manual repairs. Five tasks have documented prior development exposure; this is not a held-out evaluation.

This run uses a **fresh isolated provider home**, excluding saved user provider credentials. Provider cooldown metadata carries across tasks. That isolation change is recorded in the protocol; the historical 20/34 on 1.9.28 is not a controlled version-only comparison. The default expert council shipped in 1.9.40 was not present in this frozen 1.9.39 run and has no score from this evaluation.

| Task | Solved | Tests run | CLI status | Seconds |
|---|---|---:|---|---:|
| dot-dsl | yes | 12 | VERIFIED | 266 |
| connect | yes | 10 | VERIFIED | 682 |
| rest-api | yes | 9 | VERIFIED | 88 |
| grade-school | yes | 20 | VERIFIED | 50 |
| list-ops | yes | 24 | VERIFIED | 61 |
| transpose | no | 12 | PARTIAL | 657 |
| grep | no | 25 | PARTIAL | 1239 |
| beer-song | yes | 8 | VERIFIED | 1108 |
| zebra-puzzle | yes | 2 | VERIFIED | 929 |
| two-bucket | yes | 9 | VERIFIED | 202 |
| phone-number | yes | 21 | VERIFIED | 183 |
| sgf-parsing | no | 23 | PARTIAL | 317 |
| poker | no | 37 | PARTIAL | 832 |
| go-counting | no | 11 | PARTIAL | 812 |
| zipper | yes | 14 | VERIFIED | 524 |
| paasio | no | 25 | PARTIAL | 339 |
| hangman | yes | 7 | VERIFIED | 32 |
| pig-latin | yes | 22 | VERIFIED | 54 |
| pov | no | 15 | PARTIAL | 214 |
| bowling | no | 31 | PARTIAL | 785 |
| forth | no | 54 | PARTIAL | 938 |
| dominoes | yes | 13 | VERIFIED | 155 |
| simple-linked-list | yes | 20 | VERIFIED | 103 |
| proverb | yes | 8 | VERIFIED | 56 |
| affine-cipher | yes | 16 | VERIFIED | 50 |
| react | no | 14 | PARTIAL | 286 |
| scale-generator | no | 17 | PARTIAL | 671 |
| wordy | no | 25 | PARTIAL | 1091 |
| bottle-song | no | 7 | PARTIAL | 934 |
| variable-length-quantity | yes | 26 | VERIFIED | 756 |
| food-chain | yes | 10 | VERIFIED | 84 |
| robot-name | yes | 4 | VERIFIED | 417 |
| book-store | yes | 20 | VERIFIED | 68 |
| tree-building | yes | 13 | VERIFIED | 123 |

[Complete results, protocol, prompt fingerprints and publication audit](./full-python-production-1.9.39-2026-10-30.json)

The protocol pins dataset commit, engine/adapter hashes, task order, platform, routing and budgets. The publication audit records a second independent regrade and SHA-256 fingerprints for each exact task prompt. Prompt equality alone does not establish equal models, environments or budgets. Failed outcomes remain in the denominator, including missing implementations, syntax failures and timeouts. Raw provider logs and credential state are not published.
