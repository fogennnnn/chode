# Chode 1.9.6 development pilot — 2026-10-21

**2/5 (40%)** on the unchanged protected-test checked protocol. Same task outcomes as the preceding 1.9.4 run; zero percentage-point change. All original test hashes unchanged.

This measured frozen candidate runtime 1b733bb (SHA256 b722d99b3d33963766d0e09403cfe6715243cfbf38c6ff36a63cc72d55d729e8), before the later stream cooldown, universal platform, stderr diagnostics and optional shared-tool-cap fixes. It is not a measurement of final runtime 124355d. No task was removed or manually repaired.

| Task | Pass | Tests run | Model calls | Answers |
|---|---|---:|---:|---:|
| zebra-puzzle | false | 0 | 4 | 3 |
| grade-school | true | 20 | 9 | 8 |
| list-ops | true | 24 | 7 | 5 |
| affine-cipher | false | 16 | 2 | 1 |
| pov | false | 15 | 0 | 0 |

Zebra timed out during grading; grade-school and list-ops passed; affine failed; POV made zero calls because provider capacity was unavailable. Provider routing varied, so this is not causal evidence of a harness change. Five public development tasks are not the official Aider leaderboard or held-out evaluation.

An independently labelled capacity-continuation protocol is now being measured on final runtime 124355d. It waits/resumes inside the original shared 12-call, 24-tool, 420-second budget; its score must not be compared as if this protocol were unchanged.
