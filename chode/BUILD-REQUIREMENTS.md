# chode FULL BUILD PROMPT



You are a senior systems engineer. Implement the complete feature set below into the existing chode repo (github.com/fogennnnn/chode, \~v1.8.6). Zero compromises on correctness, reliability, or handoff quality.



### Hard rules

- Pure Node preferred. Minimal new deps.

- Atomic, testable commits only.

- Extend existing patterns (provider race, sessions/checkpoints, scaffolding, REA). Do not rewrite the core.

- Free-tier / $0 path remains first-class.

- After every major item (or when context gets long) you MUST write/update `handoff.md` using the exact format at the bottom.



### Priority order (do in sequence)



**Phase 1 – Coding parity**

1. Multi-file edit + unified diff preview + undo stack

2. Worktree / isolated branch support

3. Explicit `plan` (read-only) vs `execute` mode

4. Project memory (CLAUDE.md + AGENTS.md style, auto-update)

5. Clean subagent spawn + join

6. Verification loop (test → capture → iterate)



**Phase 2 – Reliability**

7. Expand providers cleanly (free-tier first)

8. First-class local models (Ollama etc.)

9. Cost tracking + budget limits

10. Strengthen parallel race + circuit breakers + lossless resume



**Phase 3 – Longevity**

11. Cross-session memory

12. Skill extraction from successful runs

13. Minimal messaging gateway (Telegram or Discord)

14. Basic cron/scheduled tasks



**Phase 4 – Unique edge**

15. Make `chode reverse <target>` first-class + evidence-heavy

16. One-command: reverse → scaffold Worker → test → deploy

17. Keep any HELIOS/HEMO hooks alive



### Execution

1. Read the current codebase thoroughly first.

2. Finish one Phase 1 item completely (code + tests + docs) before the next.

3. Update `handoff.md` after every major item.

4. Continue until Phase 1 is done, then keep going.



### Mandatory handoff.md format



```markdown

# chode Handoff — [ISO date] — [short title]



## Status

- Commit/version:

- Fully working:

- Partial:

- Broken/missing:



## Exact next actions for next agent

1. …

2. …



## Key files changed

- path — change



## Design decisions

- Decision + why



## Risks / debt

- …



## How to test what was just built

- exact commands



## Context the next agent needs

- env, gotchas, non-obvious stateStart now: read the repo, then implement Phase 1 item 1 (multi-file edit + diff + undo).