# Chode 1.9.19 no-feedback baseline — 2026-10-26

**0/5 (0%)** on the six-call no-feedback protocol (same score as the 1.9.3 baseline on this protocol; formal comparator comparison refused — `Protocol differs: providerState` — so this is a side-by-side reading, not a validated delta). All original test hashes unchanged.

Engine 1.9.19 (SHA256 52f1e022a7d04d1e27bbef2aa68be6f2bec9abb9c32becf318716ffcd641b1cf). Every task got 6/6 answers on kilo+ovh; no capacity starvation.

| Task | Pass | Grading note |
|---|---|---|
| zebra-puzzle | false | grader SIGTERM/ETIMEDOUT, 0 tests ran (generated solution hangs) |
| grade-school | false | exit 1, 20 tests ran |
| list-ops | false | exit 1, 24 tests ran |
| affine-cipher | false | exit 1, 16 tests ran |
| pov | false | exit 1, 15 tests ran |

Six one-shot calls with no test feedback do not solve these tasks on free lanes — consistent with the checked protocol (same engine: 4/5) being the meaningful measure. No task removed or manually repaired.
