# Chode handoff

Current release: **1.8.3**, deployed at https://chode.borken.app. Both master and chode-1.1-agentic are maintained together. Source lives in chode/ under the repository root; Node 18+.

## Progress on 2026-10-19

Resumed after checking GitHub, the live release and uncommitted local changes. Preserved the local expense CLI edits (the same seven acceptance failures remain). Finished the GitHub Models provider draft: GITHUB_TOKEN required, selected setup key/model respected, never routed in strict --free mode. No real GitHub inference credential was used; the selected key/model request is covered by a local HTTP contract test.

Added --verifier <provider> with missing/unknown value validation and strict-free validation. A selected implementation author cannot verify its own work or consume a known-invalid verifier call. Existing automatic independent verification remains available. Free capacity exhaustion no longer prints a misleading missing-key signup wall.

All npm test groups passed; Windows job cleanup required an elevated rerun of dogfood, RE and robustness groups. Targeted provider, verifier-author, configured HTTP request and release-integrity tests passed after final changes. These are regression checks, not proof that public free models finish complex builds.

## Unfinished work

Goal: use Chode with actual free providers to build complex apps and improve reliability, accuracy and layout. Neither the bird tracker nor the expense benchmark is complete; no competitive supremacy is established.

Bird prompt: **Make me a bird tracking website using public GPS bird data on a global map**. Run in a fresh workspace with `node /absolute/path/to/chode/chode.js ai --free "..."`. Use real GPS tracks with provenance; do not fabricate data or silently substitute sightings.

Portable expense baseline and independent acceptance test: benchmarks/dogfood/expense-tracker/. Basic add/list/summary pass, seven validation/CSV/corrupt-storage checks fail. A failed repair was preserved locally and Chode rewind restored this baseline. Do not weaken acceptance tests or claim completion from stubs, file existence, process launch or mocked model tests.

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
