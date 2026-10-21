# Chode 1.9.6 capacity-continuation pilot — 2026-10-21

**2/5 (40%)** on final runtime 124355d (SHA256 bf75f1b5ed33fc3731b1d034e9d5fa51f485c62dc0373add4f203775bd9a87f9). Same aggregate as the checked protocol, different composition: zebra and list-ops passed; grade-school, affine-cipher and pov failed. Not comparable to the original checked protocol: waits/resumes ran inside the same shared 12-call, 24-tool, 420s budgets; adapter ec45c3436b27, continuation 7f79e847a4dc. All test hashes unchanged.

| Task | Pass | Tests run | Model calls | Answers |
|---|---|---:|---:|---:|
| zebra-puzzle | true | 2 | 6 | 3 |
| grade-school | false | 20 | 12 | 12 |
| list-ops | true | 24 | 6 | 5 |
| affine-cipher | false | 16 | 6 | 3 |
| pov | false | 15 | 8 | 6 |

Failure notes: grade-school dict-keyed added() collapsed repeat adds (acceptance bug, budget exhausted at 12 calls); affine-cipher left pass stubs after provider timeouts (PARTIAL, 0 writes); pov single-level reorient/parent-only path_to plus uncollected exec observations (PARTIAL). Repeated unknown-job-id polls observed in pairs in pov/grade-school logs; generic failed-tool recovery never fired (streak reset by interleaved ok calls).
