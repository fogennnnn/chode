# Grouped edits and undo

Chode supports one undoable batch across up to 20 text edits. Every operation is prepared before any user file changes. An invalid match, protected path or missing permission rejects the batch. Several edits to one file compose in order.

Save a workspace-relative manifest:

```json
{
  "edits": [
    {"file":"src/a.js","oldString":"oldName","newString":"newName"},
    {"file":"src/b.js","oldString":"oldName","newString":"newName"},
    {"op":"write","file":"src/new.js","content":"export const answer = 42;\n"}
  ]
}
```

```sh
chode edits preview changes.json
chode edits apply changes.json
chode edits history
chode undo
```

Preview returns a unified diff without modifying the target files or recording an edit. Apply prepares against current contents and rechecks the original bytes before committing. Manual single-file `write`/`edit` and agent edits share the same persistent history. `/changes` lists it in the TUI; `/undo` restores the latest applied edit group. Undo removes files that a group created and rejects any content conflicts before restoring other files. Stop an active build before using `/undo`.

The agent tool is `multiedit {edits:[...], preview?:true}`. Existing workspace, secret, fixture and whole-file overwrite permissions still apply. Protected acceptance tests are excluded. Plan mode disables batch mutation. An applied batch is recorded as implementation work for verification.

History retains 50 records under `.chode/changes`; journal contents contain the edited files' before/after text and must not be committed. Each file is UTF-8 text, <=200 KB; combined before/after contents are <=1 MB. Binary files, symbolic links, hard-linked files and harness/Git metadata are excluded. File modes are retained where supported by the host filesystem.

Each individual replacement uses a temporary file and rename. An ordinary batch failure rolls back committed files; an interrupted apply/undo is recovered at the next edit operation if contents still match the journal. A concurrent external modification produces a conflict rather than overwriting it. Multi-file visibility is not an operating-system atomic primitive: other processes may briefly observe intermediate files. A dead process's lock can be recovered; an unreadable or live-owner lock is left intact for inspection.

Content is rechecked immediately before each replacement. External programs do not share Chode's lock, so concurrent-edit detection cannot eliminate the interval between that check and rename; stop external writers when applying a batch.

The older `chode rewind` snapshot interface remains available. Undoing changes through an external editor or `rewind` may cause a history conflict; inspect the current files and history instead of forcing restoration.

## Isolated Git worktrees

```sh
chode worktree create fix-map --ref HEAD
chode worktree list
chode worktree remove fix-map
```

Creation makes a new `codex/fix-map` branch and checkout under the repository's `.chode/worktrees/`. The JSON result includes `directory`: change into that directory and start Chode there to work in isolation. From a repository subdirectory, the matching subdirectory is selected when it exists in the new checkout. `/worktree` exposes the same management commands in the TUI; it does not change an active process's workspace.

Creation starts from a committed ref, preserves all uncommitted work in the original checkout and never copies credentials or ignored local state. Existing destinations/branches are not overwritten. Removal uses Git's normal checks, refuses dirty/untracked changes and never deletes the branch. No force-removal option is provided. Git must be installed, the repository must have a commit, and Git's own safe-directory rules apply. If checkout is interrupted, inspect `git worktree list` and the retained branch before cleanup.

## Plan and execute

Use `chode plan "goal"` or `chode ai --mode plan "goal"` to inspect and produce a plan without model-driven project mutations or command execution. `chode execute "goal"` and `chode ai --mode execute "goal"` use the normal tool and verification loop. Explicit `--mode` overrides the default; invalid values fail before model access. JSON planning output is supported with `--json`.

In the TUI, `/mode plan` makes subsequent prompts read-only; `/mode execute` restores normal builds. `/plan <goal>` explicitly plans, and `/execute <goal>` explicitly builds regardless of the current default. The current mode is visible in the header. A queued retry retains its original mode. Task delegation is refused in plan mode; manual management commands such as undo/worktree remain explicit user actions. Planning can save local plan/session/todo metadata, but cannot execute model-supplied file edits, commands, installation or nested tasks. Enforcement happens in the shared dispatcher, including the grouped-edit tool.

## Project guidance and observed memory

Chode reads workspace-root `AGENTS.md`, `CLAUDE.md` and `CHODE.md` as project guidance, subordinate to the current user request and permissions. It does not scan arbitrary ancestor folders or rewrite these human-maintained files. Guidance is bounded to 6 KB; historical observations to 4 KB. Use `--no-memory` on a build or plan to disable both inputs for that run.

After a verified build, `.chode/project-memory.json` records changed-file names/hashes and successful, completed checks. It stores no source snapshots, model summaries, prompt transcripts or raw command output. Simple test commands are retained; other successful commands are represented by a hash. Failed/unverified runs are not promoted into verified memory. Credentials and harness state are excluded. Recall is explicitly historical: current files must be rechecked, and independent verification does not inherit this author context.

`chode memory show` inspects the local record; `chode memory clear` clears only that generated record. Records are bounded to 20 runs and 60 KB, use atomic replacement and a writer lock, and preserve corrupt data for inspection. Each workspace is separate, so worktree memory is local to that checkout. No extra model call is used for automatic updates. Never commit `.chode` state.

## Subagent spawn and join

The existing `task {prompt,label?}` tool still runs one isolated helper and waits for it. For parallel investigation, use `task {action:"spawn",prompt,label?}`; it returns an ID immediately. Use `task {action:"status",id}` and `task {action:"join",id}` to collect the result. Join before finishing: an unjoined group prevents a complete parent result. At most three spawned helpers are active, with six total per parent run. The parent and helpers share its bounded model-call budget and free-only policy. Nested tasks are disabled.

Spawned helpers are read-only to avoid simultaneous writes in a shared checkout. The synchronous task path retains its existing workspace mutation guards; implementation should use an isolated worktree when independent branches are needed. Context isolation is not an OS sandbox. Parent prompts/transcripts are not copied into child sessions. Legacy child mutations/actions and writer identities are included in parent verification evidence.

Results are saved under `.chode/tasks` and can be retrieved later with `chode task status <id>` or `chode task join <id>`. A running record from another/interrupted process is unresolved, not successful. A new process cannot restart an in-flight Promise; rerun the task if its owner was interrupted. Child failures are collected and results are bounded/redacted. Parent cleanup awaits its bounded helper runs so a normal worker exit does not abandon them.
