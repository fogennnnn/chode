# Chode 1.5 — automatic investigation and bounded recovery

Chode now automatically inspects a local native binary when the task calls for understanding it and names one existing target (.exe, .dll, .elf, .so or .dylib). Quote paths containing spaces. Ordinary source work, remote URLs, missing paths and ambiguous multiple targets do not trigger native analysis. `--no-re` or `--no-tools` disables this preflight. Analysis is capped at 60 seconds, does not execute the target, and supplies only bounded observed metadata to model reasoning. Missing tooling is reported as a limitation. Metadata is not recovered program behavior; further decompilation still depends on supported REA capabilities.

- Workspace requests have a three-minute active-time limit. `/timeout <10–1800 seconds>` changes the limit for subsequent requests. Waiting for an answer to a question pauses the clock. On timeout Chode stops the worker tree and preserves the complete prompt and originating session for `/retry`.
- Corrupt or malformed pending-task files are never silently treated as empty. Chode reports the problem and preserves the original file, preventing later writes from erasing the queue.
- `chode doctor --rea` and `/doctor --rea` inspect the Ghidra/Java process settings and offer a concrete diagnostic command. Doctor also validates state shape and checks the new runtime modules.
- Starting a new conversation saves the previous transcript and clears stale source references. Queue acknowledgement errors no longer crash the workspace after receiving an answer. Informational activity entries are no longer shown as successes.
- Failed one-shot prompts retain their originating session in the queue.

Regression gates cover actual cmdAI automatic-RE integration with isolated model/native subprocess fixtures, explicit target routing, opt-out, bounded metadata, queue corruption, a genuinely hung worker, question-time exclusion and cancellation. Live native integration remains an opt-in gate. No benchmark superiority or successful complex model build is claimed by these reliability improvements.

On Windows, REA can reuse existing user/machine Ghidra and Java paths when the launching process has stale settings. Only these two paths are read, existing process settings take precedence, and no registry or global environment changes are made. No analysis engines are installed automatically.
