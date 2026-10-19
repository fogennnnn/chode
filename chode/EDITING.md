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
