# Website completion in 1.7.3

Full and multi-page websites use the agent workspace rather than silently becoming one HTML page. Requests with a backend or several HTML deliverables cannot use the single-file --output mode; omit that option and name the required files in the brief. --check works with website agent builds.

Each tool continuation retains the original request, tool instructions, completion contract and file progress. Planning, independent verification and repair retain substantially more of the original brief. The verifier must assess every requested requirement, beyond the model's own plan.

For website agent builds, verification checks requested HTML deliverables, local navigation/assets, fragment targets, unfinished placeholders and inline classic JavaScript syntax. When package.json defines a production build, that build must pass. Failures feed the existing bounded repair loop.

Single-file website artifacts receive the same static integrity checks and an independent model review against their full brief. Missing requirements allow up to two repairs within the existing shared model budget. Empty or rejected repairs cannot publish the previous invalid draft. Existing files remain untouched when generation fails.

Static checks and independent model review do not prove visual quality or live integration behavior. Browser interaction and viewport checks still require available browser tooling, and unavailable credentials/services must be reported explicitly. There is no claim that every arbitrary prompt can be fulfilled flawlessly.

Validation: full offline regression suite; controlled model fixtures with real filesystem/tool execution show incomplete three-page builds repaired, semantic omissions rejected/repaired, failed production builds rejected, and empty repairs leaving no artifact. Real free-provider attempts were blocked by OVH timeouts and LLM7 HTTP 429; they did not establish live website completion.
