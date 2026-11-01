# Chode 1.9.35 targeted stress builds — 29 October 2026

These are two selected development cases, not a leaderboard score. Runtime: freshly installed public 1.9.35, strict free mode, isolated provider home, 60 shared logical model calls requested, one-hour outer ceiling per case. No manual solution edits. Original protected tests were independently rerun outside the agent workspace and their hashes remained unchanged. Full local evidence: evaluation-root hard-builds-1.9.35-yekINc.

| Case | Independent result | Generation |
| --- | --- | --- |
| Node.js durable room reservations | 35/35 checks passed | 466.6 seconds; agent exit 0 |
| Public Python SGF parser | 16/23 tests passed; 7 failures | 524.0 seconds; PARTIAL, unavailable provider, task queued |

Reservations cover interval conflicts/adjacency, defensive copies, validation, atomic JSON persistence, corrupt-data preservation, prototype-safe IDs and real CLI success/failure. The successful application is in the local evidence directory's reservations/workspace. The SGF task covers recursive trees, escapes/whitespace and exact errors. Its tests match the pinned official test digest recorded by the original production evaluator. This run did not time out at seven minutes; the SGF CLI returned a partial result after its completion/capacity handling. Do not report it as verified or solved.

Next: reproduce the seven SGF failures through Chode after free capacity recovers; keep the original failed result. Also audit CLI pending retry: cmdPending currently rebuilds cmdAI from hit.prompt alone and does not explicitly restore the selected acceptance test, free-mode flag or requested call budget. TUI retry has its own richer path. No fix for that CLI path is claimed here. YOLO remains queued; it is not in 1.9.35.
