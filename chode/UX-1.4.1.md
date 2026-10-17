# Chode 1.4.1 — native analysis reliability

- Added the missing `chode tool rea doctor` and `chode tool rea analyze <local-file> [--timeout <ms>]` CLI routes with JSON output and failure exit codes.
- JSON error responses, nonzero exits and empty evidence no longer count as successful binary analysis. Unrecognized doctor results report unknown readiness.
- Added all existing REA regression tests to the default suite, plus false-success regression cases.

Live validation used a locally compiled, harmless Windows x64 PE fixture. The actual Chode -> pinned REA 6.5.0 -> Ghidra 12.1.4 path returned SHA-256 219e0b4e1853e6c22a3664809e860da04d4f5663cd43909caea835915ea5c92f, 19 segments, 149 procedures and 279 strings. These are static inventory observations, not a claim that the business logic was recovered. Binary contents were not sent to a model provider.

The complex multi-file HTTP application run is recorded separately from passing local regressions. Provider availability is not a passing build, and no general superiority is claimed.

Complex-build outcome: the default agent run reached its 240-second external test timeout and created no application files. Separate bounded Kilo and OVH attempts returned HTTP 503 and a request timeout. This remains an unresolved provider-dependent quality gate. No successful complex build is claimed.

Run the opt-in native integration gate with an existing Ghidra/Java process environment and `CHODE_REA_TARGET` pointing to a local test executable: `npm run test:rea:live`. The test verifies SHA-256, nonempty inventory and unchanged executable bytes. It never executes the target.
