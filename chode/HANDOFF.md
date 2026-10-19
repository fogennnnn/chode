# Chode handoff

Current release: **1.8.5**, deployed at https://chode.borken.app. Both master and chode-1.1-agentic are maintained together. Source lives in chode/ under the repository root; Node 18+.

## Progress on 2026-10-19

Resumed after checking GitHub, the live release and uncommitted local changes. Preserved the local expense CLI edits (seven acceptance failures at initial audit; five after a real free-provider repair). Finished the GitHub Models provider draft: GITHUB_TOKEN required, selected setup key/model respected, never routed in strict --free mode. No real GitHub inference credential was used; the selected key/model request is covered by a local HTTP contract test.

Added --verifier <provider> with missing/unknown value validation and strict-free validation. A selected implementation author cannot verify its own work or consume a known-invalid verifier call. Existing automatic independent verification remains available. Free capacity exhaustion no longer prints a misleading missing-key signup wall.

All npm test groups passed; Windows job cleanup required an elevated rerun of dogfood, RE and robustness groups. Targeted provider, verifier-author, configured HTTP request and release-integrity tests passed after final changes. These are regression checks, not proof that public free models finish complex builds.

## Unfinished work

Goal: use Chode with actual free providers to build complex apps and improve reliability, accuracy and layout. Neither the bird tracker nor the expense benchmark is complete; no competitive supremacy is established.

Bird prompt: **Make me a bird tracking website using public GPS bird data on a global map**. Run in a fresh workspace with `node /absolute/path/to/chode/chode.js ai --free "..."`. Use real GPS tracks with provenance; do not fabricate data or silently substitute sightings.

Portable expense baseline and independent acceptance test: benchmarks/dogfood/expense-tracker/. Basic add/list/summary pass, five validation/CSV/corrupt-storage checks fail. A failed repair was preserved locally and Chode rewind restored this baseline. Do not weaken acceptance tests or claim completion from stubs, file existence, process launch or mocked model tests.

## Preserve shipped fixes

- Startup initialization, streaming-abort handling, worker outcomes, checkpoints and queued crash recovery.
- `/connect` / `chode connect`: providers, selected models, hidden API keys, custom endpoints, documented OpenRouter PKCE login. Other providers use keys; do not invent unsupported OAuth.
- No default fixed build time limit. Ten-minute inactivity watchdog; meaningful progress resets it, questions pause it, heartbeats do not. `/timeout off` removes an optional selected limit. Per-call stall handling and bounded work windows remain.
- Build/verifier context isolation; all implementation authors, including restored authors, excluded from independent verification.
- Planned .cjs/.mjs deliverables, incomplete websites, comment-only implementations and browser Node require mistakes checked. Background jobs use actual status/exit codes. Repeated invalid tools can trigger bounded provider failover.
- Active streams use inactivity, accept terminal finish_reason, release connections and bound failed cancellation/DNS. One cooling provider does not delay another eligible ready provider.
- **User approved** retaining up to 18 KB of already-returned file/tool observations with selected providers, including Kilo, OVHcloud, LLM7 and uncloseai. tool-history.js retains at most 12 results, excludes credential files, redacts known secrets and warns of stale results. No automatic source snapshots; read-only retention unchanged. Do not ask for this approval again.

## Verification and publication

From chode/, run `npm test`. Full regressions passed for 1.8.2. Linux Node 18/22, packaged startup and live installation passed: https://github.com/fogennnnn/chode/actions/runs/39147289856.

Runtime changes: bump package.json/package-lock.json and worker version; run `node build-installer-assets.cjs`; test; commit explicit paths; push master and chode-1.1-agentic. Deploy chode-hq with Wrangler and chode/wrangler-chode-hq.toml. Previous host command: `node <repo-root>/node_modules/wrangler/bin/wrangler.js deploy --config <repo-root>/chode/wrangler-chode-hq.toml`. Dispatch .github/workflows/chode-startup.yml after deployment for public installer checks. User authorized verified upgrades to be pushed/deployed.

Keep installers uncached and runtime hashes/version checks intact. Installer clones master and installs a verified local npm archive; never use a similarly named registry package or reintroduce retired fallback providers. Stale and tampered source rejection passed.

Do not commit credentials, caches, provider state, sessions or unrelated untracked files.

## Latest measured run and publication

1.8.3 pushed to both branches at 812c347; deployed worker df6750af-4d5c-4f55-8fa1-2a8e3adbb24b. Live manifest and status report 1.8.3. Windows public PowerShell installation returned 1.8.3. Public Linux installation plus terminal startup passed on Node 18 and 22: https://github.com/fogennnnn/chode/actions/runs/39276513484. Live installer rejected stale and same-version-tampered source before installation mutation.

Real free-mode expense repair on 2026-10-19 read the source and protected acceptance, ran the failing check, and applied three edits. Invalid month and infinite amount now pass; basic behavior remains passing. Five checks still fail: impossible calendar date, malformed amount, missing category, safe CSV and preservation of corrupt storage. The independent acceptance file is byte-for-byte unchanged. Partial implementation progress is retained in the portable fixture.

The run later emitted exec/read/edit/write calls with empty arguments; these were rejected. The external QA runner stopped its child after eight minutes without a final result. This was a test-runner deadline, not a fixed product build timeout; do not call this build complete. Next work: improve recovery from repeated invalid model tool arguments, then resume these five checks. The run process started before the version bump and its local report labels itself 1.8.2; it included the staged provider/verifier changes but predates the quieter capacity-message patch.

## 1.8.4 recovery changes

Saved raw responses showed that apparently empty tool calls actually used flat JSON fields beside tool instead of an args envelope. The parser now retains explicitly supplied known fields for read/write/edit/exec/jobs when no argument envelope exists. Explicit envelopes retain precedence, and parsed array calls are capped at six. No filenames, content or commands are guessed.

Model-generated read/write/edit/exec calls validate required fields before dispatch. Missing write content cannot clobber a file; explicit empty content, deletion edits and whitespace edits remain supported. Two malformed requests can trigger automatic provider failover even with successful commands between them; explicitly forced providers remain selected and all work stays bounded.

Plan prompts explain exact create/overwrite declarations, and implementation turns receive the generated active plan and file-edit rules. Existing overwrite, fixture, workspace and acceptance guards remain in force. New regression tests exercise real edits after failover and declared whole-file replacement.

## 1.8.5 protocol follow-up

A real 1.8.4 free-mode repair emitted complete tool-shaped JSON inside a generic json fence, which the tool parser correctly did not execute but previously treated as final prose. Mutating builds now receive at most two protocol-recovery turns for unparsed tool intent. Generic JSON is never executed automatically. Recovery requests one complete tool fence, retains task context and all existing guards, and uses another provider when routing is automatic. Repeated malformed protocol remains PARTIAL, never VERIFIED. Controlled regressions cover both successful recovery and bounded failure.

Full npm test passed for 1.8.4. The final 1.8.4 live repair applied four edits but still failed the same five expense checks; the portable baseline is unchanged. The external QA runner stopped after eight minutes with no final worker result. A final 1.8.5 continuation is tested separately; do not conflate protocol-regression passes with free-model build completion.
