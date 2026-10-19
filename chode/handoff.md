# chode Handoff — 2026-10-19 — Phase 1 edit and isolation foundations

## Status

- Commit/version: 1.9.0 candidate, item 1 commit 135e376; based on public 1.8.6. Not pushed/deployed yet.
- Fully working: focused tests for grouped preflight, unified preview, persistent LIFO undo, rollback/recovery, protected paths and CLI/TUI commands.
- Partial: items 1–2 are implemented; item 1 full suite passed, item 2 focused real-Git tests passed. Existing plan/subagent/verification features still need the later parity audit.
- Broken/missing: items 3–17 remain. The live free-model expense benchmark still fails five checks; no autonomous-build completion or supremacy claim.

## Exact next actions for next agent

1. Items 1–2 are implemented and tested; record item 2 commit before proceeding.
2. Implement Phase 1 item 3: explicit plan versus execute modes. Preserve readonly enforcement including multiedit; add CLI/TUI tests and docs.
3. Continue BUILD-REQUIREMENTS.md in sequence. Push/deploy verified work when done; user already authorized this.

## Key files changed

- edit-transactions.js — persistent journal, unified diff, lock, rollback/recovery and conflict-aware undo.
- chode.js — grouped tool/CLI, single-edit history, author attribution and plan-mode protection.
- workspace-commands.js — /changes and /undo, with busy-build guard.
- tests/edit-transactions.test.js — real file/process tests, Git-valid patches, injected failures and recovery.
- EDITING.md, BUILD-REQUIREMENTS.md — usage/guarantees and original user scope.
- package.json, package-lock.json, chode-hq-worker.js, release.json, install-assets.js — version/package and verified installer metadata.

- worktrees.js, tests/worktrees.test.js — shell-free Git isolation, preservation of original dirty work, safe removal and real CLI tests.

## Design decisions

- Extend existing edits/snapshots with one shared undo history; no new dependencies.
- Preflight all operations, preserve original bytes, recheck before commit, roll back ordinary failures. Individual replacements use rename; OS-wide multi-file atomic visibility is not promised.
- Preserve workspace, secret, fixture, overwrite and immutable-acceptance guards.

## Risks / debt

- Local .chode/changes journals contain edited source; never commit them.
- Bounds: 50 records, 20 operations/batch, 200 KB/file, 1 MB total before/after. Links, binary and invalid UTF-8 are refused.
- External editor/rewind changes can conflict with undo; refuse rather than forcing restoration. Corrupt/live locks require inspection.
- Final candidate Linux/public installer checks remain required. Previous Linux CI was queued, not passed.

## How to test what was just built

- node tests/edit-transactions.test.js
- node tests/v2-edit.test.js
- node tests/plan.test.js
- node tests/worktrees.test.js
- node build-installer-assets.cjs && npm test
- Disposable workspace: chode edits preview changes.json; chode edits apply changes.json; chode edits history; chode undo. See EDITING.md for the manifest.

## Context the next agent needs

- Repo root C:/Users/fogen; app C:/Users/fogen/chode; writable staging C:/Users/fogen/income/New folder/chode-parity. Use Git safe.directory=C:/Users/fogen. Commit explicit chode paths only; the root includes unrelated personal files.
- Maintain master and chode-1.1-agentic. Read BUILD-REQUIREMENTS.md; finish each Phase 1 item before the next, with atomic commits and this format.
- Keep startup, worker recovery, strict free-only, quotas, verifier isolation, checkpoints, REA and HELIOS/HEMO intact.
- User approved <=18 KB of already-returned build context, excluding credential files. No automatic source snapshots into model context; do not re-ask.
- Regenerate installers, test, push both branches, deploy chode-hq via wrangler-chode-hq.toml, verify live version/integrity and dispatch Linux startup/public-install CI.
