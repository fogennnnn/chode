# Released 1.9.4 public development pilot

**2/5 (40%)**, all five completed, original official test hashes unchanged. Prior checked-3 run: 1/5 (20%). List-ops changed from failed to passed; other task pass/fail outcomes are unchanged. This is an adapted five-task Python development pilot, not an official Aider leaderboard score or held-out evidence. Provider routing varied; the delta does not isolate a causal harness effect.

| Task | Outcome |
|---|---|
| zebra-puzzle | Failed: generated solver exceeded independent 30-second grading deadline |
| grade-school | Passed 20/20 tests |
| list-ops | Passed 24/24 tests |
| affine-cipher | Failed 5/16 tests: generated formatting/case semantics wrong |
| pov | No implementation: exact edits failed; subsequent capacity/response failures |

Fixed protocol: pinned dataset 7e0611e77b54e2dea774cdc0aa00cf9f7ed6144f; one attempt; strict free; 12 shared model calls, 24 tools, 420-second generation window per task; protected upstream tests visible and independently rerun afterward; provider cooldowns retained. All failures count. No manual solution edits. Runtime/helper/adapter manifest is retained with the raw run.
