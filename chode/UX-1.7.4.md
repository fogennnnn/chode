# Free-provider resilience in 1.7.4

Use `chode ai "Build the complete website ..." --free` for strict keyless/local provider routing. With no API keys configured, the TUI starts in free mode automatically. Otherwise use `/free on`; `/free off` restores normal selection. Free mode excludes API-key providers, including accounts advertised as free tiers that might incur usage charges. It also applies to planning, isolated tasks, repair and independent verification.

Provider HTTP 429 and 503 cooldowns honor Retry-After seconds or HTTP dates. Missing rate-limit headers use exponential cooldowns; transient connection failures use a short cooldown. Cooldowns survive worker restarts, expire, and are cleared by successful calls. The router can use another available provider during the cooldown. It does not reset quotas, create accounts, rotate identities or bypass provider limits.

Agent build progress is saved after planning and each tool result. Retrying the same prompt and session restores the plan and observed file changes, asks the model to inspect current files, and reruns verification. Verified completion clears the checkpoint. `--fresh` ignores the previous build checkpoint without deleting existing project files. Acceptance-test digests distinguish checkpoints with different protected requirements.

Free builds use the agent workspace by default, allowing multi-file increments instead of an oversized HTML-only response. Standard provider output-limit metadata survives buffered/streaming routing. Incomplete tool JSON is not executed; the model gets up to two requests to use smaller complete chunks. Partial work remains partial.

With free mode enabled and the TUI open, unfinished work can resume automatically after a provider cooldown or a bounded work window. There are at most three automatic retries. The wait is visible and Ctrl+C cancels it; new prompts or session/provider changes cancel the old wait. Long cooldowns remain queued. Closing the UI stops automatic work; saved files, prompts and build checkpoints remain on disk. This is not an always-on background service.

Validation includes real tool/filesystem execution with controlled provider responses, persistent cooldown reloads, free-only failover, no paid provider calls, incomplete-output recovery, checkpoint resume through verification, and real child-worker TUI retry/cancellation/budget scenarios. Live free-provider testing during this work encountered OVH timeouts and LLM7 HTTP 429; no claim of guaranteed availability or universal completion is made.
