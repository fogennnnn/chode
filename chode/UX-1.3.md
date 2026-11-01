# Chode 1.3 — app building, research, and the terminal workspace

## Start

Run `node chode.js` in an interactive terminal. `chode tui` explicitly opens the
workspace. The ordinary command line and piped REPL remain available. Set
`CHODE_LEGACY_REPL=1` for the older interactive readline interface.

The workspace keeps the composer pinned while the conversation scrolls. It
uses a separate engine process, so synchronous tool commands do not freeze
typing. Ctrl+O opens activity; PgUp/PgDn scroll; Alt+Enter or Ctrl+J adds a line;
Ctrl+C stops an active run, clears idle input, or exits an empty idle composer.
Windows multiline input packets stay in the composer even when the terminal
strips bracketed-paste markers. Paste requires a separate Enter to send.

Commands: `/help`, `/details on|off`, `/session name`, `/new`, `/model id|auto`,
and `/quit`. Responses streamed before final verification are labelled Draft.
The final result replaces the draft. Activity uses the wide right panel or stays
available behind Ctrl+O in a wide terminal. The terminal buffer, cursor, raw mode,
and wrapping are restored on exit. Narrow/wide frames and grapheme widths are
covered by layout tests.

## Apps and evidence

Mentioning an HTML file together with JavaScript, CSS, JSON, React or a backend
now selects the normal agent workflow. Previously this could select single-file
HTML mode, which disabled the writers needed for a multi-file app. Explicit
`--output page.html` still selects a single self-contained HTML artifact.

Changed JS/CJS/MJS files receive `node --check`; changed JSON must parse. The
independent verifier receives bounded artifact content as well as observed tool
results. A syntax error blocks verification. This is stronger evidence than file
existence, but syntax and a model verdict are not substitutes for browser or
behavioral tests. JSX/TypeScript still require the project's build tools.

Verifier selection prefers keyed providers only when they actually have a key.
With no configured keys it selects a different keyless provider instead of
guaranteeing an authentication failure in the verifier lane.

Successful reads and page retrievals produce source records with an id, locator,
retrieval time and SHA-256 content digest. Repeated observations of identical
content deduplicate; changed content remains a separate observation. Failed
fetches are not evidence. URL citations that were not retrieved in the run are
flagged for review. This checks provenance, not whether a source entails a claim.
Initial automatic page inspection also contributes source records.

`chode ai "prompt" --json` produces a versioned result envelope with completion
status, answer, sources and usage. Queued/partial/unverified JSON results exit
unsuccessfully. HTML artifacts are labelled ARTIFACT_SAVED, not VERIFIED.

## Public comparison targets

`npm run benchmark:targets` prints the dated public baseline snapshot in
`benchmarks/public-baselines.json`. No competitor API calls are made.

- Terminal-Bench 4.0: Claude Code / Opus 5.5 max — 64.8% ± 3.1 percentage points.
  Source: https://www.tbench.ai/ (hydrated 4.0 leaderboard, retrieved 2026-10-17).
- Terminal-Bench 2.0, Opus 4.5: Claude Code 52.1% ± 2.5; OpenCode 51.7%, with
  no confidence interval supplied. Source: https://www.tbench.ai/?version=2.0 .
  These older rows are not comparable to 4.0 and do not establish a significant
  difference between the two harnesses.
- WebDev Arena, 2026-10-16: Claude Opus 5.5 Max — 1807 ± 14 Arena score.
  Source: https://arena.ai/leaderboard/code/webdev . This is a model/build
  preference score, not a Claude Code harness score or a percentage.
- Research methodology: DeepResearch Bench II evaluates recall, analysis, and
  presentation across 132 tasks / 9,430 rubrics. Its project page marks the older
  score table as superseded and notes a judge change, so that table is not used
  as a current numeric target. Source:
  https://agentresearchlab.com/benchmarks/deepresearch-bench-ii/ .

Chode has no measured score on those public benchmarks. No public number is
assigned to Chode, and no superiority claim is made. The local regression fixtures
check product behavior; they are not a substitute for those benchmark protocols.
No local competitor runs are part of this release's validation.

## Validation

The default suite now also runs the classify/plan/verify/repair, guard, provider,
budget, edit, self-state, and core-tool fixtures. New fixtures cover multi-file app
routing, malformed JS/JSON rejection, source records, JSON output, worker IPC,
layout bounds, Unicode, multiline paste and cancellation. Real Windows PTY smoke
checks cover launch, help, paste and exit. Originals are backed up before applying
the local release; no website deployment is included.
