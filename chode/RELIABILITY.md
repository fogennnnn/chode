# Debtaur + Helios workflow memory

Enable once in each workspace:

```sh
chode reliability enable
chode reliability status
```

Enable checks Debtaur's positive and negative policy cases, pins Helios's public
Ed25519 key, and reuses the workspace's Helios identity. If none exists, it creates
one and saves its token through Chode's private credential store. Tokens never
appear in status output or memory. A changed signing key requires explicit review;
it is not silently trusted. Existing provider settings are preserved.

The Helios site at `helios.oooooooooo.se` is the landing page. The documented API
origin is `https://ai.oooooooooo.se` (the landing host returns HTML for API paths).
Debtaur's current WASM judge is `https://ooooo.fogeboro.workers.dev/api/judge`.
These contracts were exercised against both live services on 2026-10-22.

## What happens automatically

1. A VERIFIED Chode agent build archives its changed-file hashes, hashes of
   successful completed checks, and eligible already-observed source excerpts.
   Failed, pending and unverified builds never become verified memory.
2. Records are canonical JSON addressed by SHA-256. Repeating identical evidence
   produces the same ID. Up to 1,024 records of at most 64 KB each are retained,
   separately from the existing 20-run project-memory summary. The archive does
   not silently evict older records when full.
3. Helios receives only an opaque project digest, record digest, schema and policy
   version. Source, paths, prompts and command text stay local. Stable idempotency
   keys prevent duplicate ledger leaves when a write is retried.
4. Chode fetches the stored record and proof, verifies the signature locally with
   its pinned public key, verifies Merkle directions/hashes/index/depth, and
   compares the proof root with a separately fetched HTTPS tree-root snapshot.
   One bounded proof reread handles concurrent tree growth; POST is not repeated
   in that attempt. This is issuer-signed integrity plus an observed ledger root,
   not a claim that the server's root itself carries an independent signature.
5. On a later build, deterministic lexical ranking selects at most eight relevant
   records from at most 32 candidates. Files are checked against current hashes
   before every model turn (maximum 8 MB of file hashing per recall). Changed,
   missing, linked, foreign or invalid records are omitted. Ties use record IDs.
6. Debtaur's controlled-language policy derives `this memory is reusable` from
   `all grounded are reusable` and a locally established grounding premise. The
   model never supplies that premise. Only the direct WASM verdict is used;
   generated candidates and prose are ignored. The same validated selection
   reuses its proof within the build, avoiding a network call on every turn.
7. Recall requires a valid Helios anchor by default. No more than 5 KB of selected
   summaries/excerpts enters the prompt, labelled untrusted historical evidence.
   It never goes to the independent verifier as author guidance. Stored memory
   capacity increases; the model's context window is not enlarged.

## Controls and failure handling

```sh
chode reliability sync       # attempt at most five pending hash-only anchors
chode reliability disable    # stop recall/capture; preserve stored records
chode reliability connect    # configure/reuse an identity without enabling recall
chode reliability clear      # erase generated local records and receipts
chode memory clear           # clear legacy project memory and the new archive
chode ai "your task" --no-memory
```

Enable with `--allow-unanchored` only when local hash-checked history is desired
without a required Helios anchor. Status identifies this mode. Normal enable
requires anchored recall. The full `--no-memory` opt-out bypasses integration
reads, capture and service requests. The feature is opt-in per workspace;
benchmark adapters that use noMemory keep their original behavior.

Unavailable services omit recalled history or leave anchors queued, rather than
blocking the build or inventing verification. Requests include body deadlines,
response limits and cancellation. Retry-After is persisted per service across builds and client instances, including waits longer than one minute. There is no rapid retry loop on 429. Retrying
`sync` keeps the same idempotency key. A corrupt archive or active lock is preserved
for inspection. Stale locks are recovered only when their recorded process no
longer exists. Clear only removes recognized generated files after preflight;
it does not delete source files, credentials, settings or public ledger hashes.

Archive files and credentials use private file modes. Workspace escape, linked
paths, hardlinked files, credential paths and oversized inputs are excluded.
Only already-returned source excerpts whose full-file hash still matches can be
retained; Chode does not scan unrelated source files to populate memory.

## Reliability and determinism boundaries

The archive addresses, ranking, file validation and proof checks are deterministic.
Helios proves that the anchored bytes are intact; Debtaur enforces a recall policy.
Neither proves arbitrary software correct or turns a model claim into evidence.
Current tests, protected acceptance checks, tool permissions, independent review,
provider limits and model-call budgets remain necessary. A pinned provider/model
and fixed evaluation protocol are still needed for reproducible model comparisons.
No benchmark accuracy improvement is claimed from these integration tests.

Run `node tests/reliability-memory.test.js` and `node tests/reliability-boundaries.test.js` for local HTTP, real cryptography and
actual Chode agent-loop tests. The separate live probe uses synthetic content and
hash-only metadata, not a public coding benchmark or an autonomous build score.
