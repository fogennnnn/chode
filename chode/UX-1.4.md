# Chode 1.4 — dogfooded workflows

This release was exercised using Chode's actual tool dispatcher and exact-match
edit tool. A live keyless model run built a 349-byte reverse-words program; the
dogfood fixture independently executed it and checked its output against a fixed
sample. Local workflow checks cover tools, commands, queues, sessions, jobs,
rewind, UI editing and recovery. Auth/provisioning and network integrations are
covered by guarded/mock fixtures; this release did not create accounts or spend
paid API credits to exercise them.

## What improved

- The terminal now exposes /tools, /models, /status, /doctor, /todo, /sessions,
  /queue, /retry, /jobs, /rewind, /sources, /activity, /plan and /task. Slash
  suggestions appear while typing. Invalid provider ids are rejected locally.
- Conversations are saved locally and restored on launch and session switching.
  Transcript storage is bounded; the pending queue keeps the complete failed
  prompt rather than truncating it to 500 characters.
- Failed interactive requests now enter the queue with their originating session.
  Failed retries retain their task; successful retries acknowledge it. Queue
  writes are atomic; older tasks are no longer silently dropped after 20 entries.
- Todo and pending-task ids include random suffixes to avoid same-millisecond
  collisions.
- Multiline up/down/home/end editing works. Recalling history preserves the
  unsent draft. SIGINT/SIGTERM restore the terminal, and stopping work preserves
  the visible conversation.
- Activity start/completion events compact into one row. Diagnostic notes remain
  available through /activity even when the side panel was closed.
- Read-only plan mode cannot escape its restrictions through the task tool.
  Uncaught one-shot command errors now exit unsuccessfully.
- `chode doctor` checks runtime completeness, state JSON and common configuration
  issues. `chode doctor --fix` can convert a UTF-16 .npmrc to UTF-8 while preserving
  its contents and keeping a private local backup. It never prints credentials.
- The landing page reflects the release, includes the previously omitted Kilo
  provider, and removes the unsupported infinite-uptime claim.

## Measured rendering improvement

The fixed local repaint scenario uses 40 existing messages, 30 composer updates,
and a 120x32 terminal. Version 1.3 took 162.85 ms; this candidate took 2.58 ms in
that run, about 63x faster. This is a warmed terminal-rendering microbenchmark,
not an end-to-end model speedup or a general superiority claim. The result is
recorded in benchmarks/render-1.4.0.json. Bounded line-fitting and message-wrap
caches eliminate repeated work; resizing and changed content still invalidate
the relevant cached output.

Public competitor scores remain separate. Chode has no published score on those
benchmarks, and this release does not claim benchmark supremacy.
