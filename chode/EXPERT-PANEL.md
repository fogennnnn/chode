# Sequential expert panel

Coding builds in CLI and TUI now run two sequential read-only expert passes by default, then use the existing implementation/repair/verification pipeline. Lightweight direct tool, math and settings routes stay direct. Use `--no-council` for a one-shot build or `CHODE_COUNCIL=off` to disable the panel. Explicit budgets below five calls reserve their capacity for the build instead. Incomplete expert analysis is reported and does not block native build recovery.

Standalone command, installed alongside `chode`:

```sh
chode-council "Build the requested application" --check acceptance.cjs
chode-council "Implement the parser" --experts 4 --providers kilo,llm7,kilo,llm7 --max-calls 30 --check acceptance.py
```

Three experts means two sequential analysis passes followed by the staff synthesizer; four adds a security/correctness reviewer. Each analysis receives the original goal and bounded prior contributions. Analysts make actual separate calls and cannot execute tools. Only the synthesizer uses the existing build/repair/verification engine. Default automatic routing may choose the same provider; recorded provider IDs show what actually happened. Forced IDs must be registered. Strict free mode is default; paid routes require explicit `--allow-paid`.

The model-call budget is shared across all passes, including synthesis and verification; default30. Native tool execution also has one shared cap. Intermediate advice is bounded, redacted and saved privately in `.chode/panels/`; it is not promoted into verified project memory. Actual source files and native test results remain authoritative. Panel failure returns PARTIAL with its saved report, not a fabricated synthesis. Existing command approvals remain enforced. The ongoing frozen Python benchmark remains on its original installed runtime. The standalone command also supports an explicit four-expert panel.

Run `node expert-panel.cjs ...` from a source checkout if the new executable is not installed yet. Provider and MCP availability still depend on configured access. The panel does not add provider quotas or bypass cooldowns.
