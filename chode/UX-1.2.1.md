# Chode 1.2.1 — terminal UX and reliability

Implemented locally on 2026-10-17. Maintained source: `C:\Users\fogen\chode`.
The repository is `C:\Users\fogen`; its current baseline is `3f9ecb9`.
Tracked Chode files were clean before this change. Nested `chode\chode` copies
are old snapshots and should not be used to start the maintained harness.
`wrangler-chode-hq.toml` maps `chode.borken.app` to `chode-hq-worker.js`.
OpenCode context is in `.slim/deepwork/chode-worlds-best-harness.md` and the
saved `C:\Users\fogen\OPENCODEterminalOUTPUTEXAMPLE.txt`.

## Behavior

- Compact session frame and one completion line per tool, with readable verbs
  and file names. Tool bodies and argument JSON stay out of routine output.
- `/details on|off` controls tool starts, bounded diagnostics and routing details.
  One-shot commands use `--verbose`.
- Markdown keeps code fences across streamed chunks. Code remains literal;
  heading and list styling never rewrites fenced code. Terminal controls are
  filtered from rendered model text.
- Redirected output, `NO_COLOR`, and dumb terminals receive plain status text.
  Redirected stdout receives complete answers even when interactive streaming
  is available elsewhere.
- Only one provider owns a live stream. Internal planning and independent
  verification do not stream protocol text into the conversation.
- Final verification failures remain visible even after a draft was streamed.
  Footers distinguish Answered, Verified, Queued, and Needs attention.
- New prompts wait in order while a request runs. EOF waits for pending answers.
- Retried queued tasks remain saved until success; degraded, pending, failed,
  and unverified results do not acknowledge the queue item.
- Routine calls avoid the global 60-second rate-limit wait. Duplicate provider
  exhaustion messages and routine routing/tool summaries are suppressed.
- Assistant instructions ask for concise, direct language, evidence-backed
  completion claims, actual test outcomes, and explicit remaining blockers.
- Package version and lock metadata agree; terminal-ui.js ships in npm files.

## Validation

The full default npm suite passed in the working copy. The new terminal UI and
REPL lifecycle fixtures cover quiet tool output, content suppression, friendly
errors, color policy, stateful Markdown, ordered requests and EOF draining.
The classify/plan/verify/repair, guard, provider, edit, budget, core tools, and
self-write fixtures were also exercised. The toolbox approval fixture now
simulates a missing tool instead of assuming ripgrep is absent on the host.
The integration runner uses argument arrays so paths containing spaces work.

This release makes no measured claim of outperforming OpenCode or Claude Code.
Live model quality and a full-screen interactive terminal layout require separate
evaluation. No website deployment is included in this local CLI change.
