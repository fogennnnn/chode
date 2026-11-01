# Chode 1.9.24 no-feedback baseline — 2026-10-28

**1/5 (20%)** on the six-call no-feedback protocol, vs 0/5 on 1.9.19 (+20pp; comparator-validated same-protocol comparison). Changed task: zebra-puzzle now passes; all other tasks fail as before. All original test hashes unchanged.

Engine 1.9.24 (SHA256 9c631faa344a6d4111c8558b5799c15512b8833154038c9c200efbee011f932b). Every task got 6/6 answers on kilo+ovh; no capacity starvation.

| Task | Pass | Grading note |
|---|---|---|
| zebra-puzzle | true | exit 0, 2 tests ran |
| grade-school | false | exit 1, 20 tests ran |
| list-ops | false | exit 1, 24 tests ran |
| affine-cipher | false | exit 1, 16 tests ran |
| pov | false | exit 1, 15 tests ran |

One-shot calls with no test feedback still solve almost nothing on free lanes — consistent with the checked protocol (same engine: 4/5) being the meaningful measure. No task removed or manually repaired.
