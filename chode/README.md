# chode — The Self-Healing AI Coding Harness

**Free tiers. HEMO auto-provisioning. Zero lock-in. Never stops.**

A Node.js coding CLI that routes requests across 17 providers, inspects referenced public pages, creates requested artifacts, and includes persistent HEMO memory.

---

## Quick Start

Requires Node.js 18+, npm, and Git. The installers download the current `master`, install the downloaded package globally, and verify its version. Rerun the same command to update. The npm registry name is not the release channel.

Windows PowerShell:

```powershell
irm https://chode.borken.app/install.ps1 | iex
```

macOS / Linux:

```sh
curl -fsSL https://chode.borken.app/install.sh | sh
```

Then run `chode`. If it is not found, add npm's global command directory to PATH and reopen the terminal. Set `CHODE_INSTALL_PREFIX` before installation to choose another prefix without changing global npm configuration.

From source:

```sh
git clone --depth 1 --branch master https://github.com/fogennnnn/chode.git
cd chode/chode
# Install with the verified platform command above before launching.
```

Use `/connect` for provider setup and `/models` to choose a provider. Never paste credentials into a prompt.

---

## Core Features

### 1. Multi-Provider Routing
Routes across **16 providers** with automatic failover:

| Provider | Category | Quality | Status |
|----------|----------|---------|--------|
| **Agnes AI 2.5 Flash** | free_tier | 95 | ✅ Top with key |
| Groq | free_tier | 92 | ⚠️ Needs key |
| Google Gemini | free_tier | 94 | ⚠️ Needs key |
| DeepSeek | free_tier | 89 | ⚠️ Needs key |
| Cerebras | free_tier | 90 | ⚠️ Needs key |
| Mistral | free_tier | 88 | ⚠️ Needs key |
| OpenRouter | free_tier | 85 | ⚠️ Needs key |
| NVIDIA NIM | free_tier | 86 | ⚠️ Needs key |
| Cloudflare AI | free_tier | 72 | ⚠️ Needs key |
| Cohere | free_tier | 80 | ⚠️ Needs key |
| Ollama | local | 60 | ⚠️ Local install |
| OVHcloud | keyless | 70 | ✅ Auto-routes, no key |
| LLM7 | keyless | 65 | ✅ Auto-routes, no key |
| uncloseai Hermes | keyless | 55 | ✅ Auto-routes, no key |
| Anthropic | paid | 100 | ⚠️ Paid key |
| OpenAI | paid | 95 | ⚠️ Paid key |

### 2. Self-Healing Architecture
- **Parallel routing**: Tries 3 providers simultaneously
- **Circuit breaker**: Auto-fails after 3 consecutive failures
- **Smart retries**: 429s fail over after 1 retry (no 15s burn); network blips back off 1s → 2s → 4s → 8s
- **Rate limit detection**: 429 handling with auto-wait
- **DNS checks**: Validates provider endpoints before routing
- **Auto-heal**: Resets circuit breakers after 5 minutes idle

### 3. HEMO Memory System
Persistent, sealable memory using [hemo-vault](https://hemo-vault.oooooooooo.se/):

```bash
# Store memories
node memory.js store project_chode "Self-healing AI harness"
node memory.js store decision_provider "Using Agnes AI" --seal

# Recall memories
node memory.js recall project_chode

# Verify on-chain seals
node memory.js verify decision_provider

# List all memories
node memory.js list

# Check status
node memory.js status
```

**Features:**
- Persistent across sessions (not lost on restart)
- Optional on-chain sealing via HELIOS ledger
- Automatic compression of old conversations
- Context window management (4K token limit)
- Private per-agent storage (SHA-256 hashed)

### 4. Subagent Delegation
Spawn tasks across machines:

```bash
# Register agents
node chode.js agents add linux-server --type ssh --host 192.168.1.100 --command bash
node chode.js agents add windows-dev --type local --command node
node chode.js agents add mac-dev --type ssh --host 10.0.0.50 --command bash

# Run tasks
node chode.js agents run linux-server "npm test"
node chode.js agents run windows-dev "build the project"

# Check status
node chode.js agents status
node chode.js agents list
node chode.js agents remove <id>          # Remove an agent
```

**Agent types:**
- `local` — Spawns child process on same machine
- `ssh` — Executes via SSH to remote server (host keys verified; tasks travel base64, never shell-interpolated)
- `http` — POSTs to agent REST endpoint (`--tls` switches to https)

IDs must match `[a-zA-Z0-9_-]{1,64}`, duplicates are rejected, and
`ssh`/`http` agents require `--host`. Tokens passed via `--token` are
visible in shell history — rotate shared ones.

### 5. Production Monitoring
```bash
# Background health monitor
node chode.js monitor

# Cost tracking
node chode.js costs

# System metrics
node chode.js metrics

# Request queue status
node chode.js queue
```

---

## Commands Reference

### AI Commands
```bash
node chode.js ai "your prompt"           # Agentic loop with tools + auto-fallback
node chode.js ai --resume                 # Resume interrupted session
node chode.js ai --force agnes "prompt"  # Force specific provider
node chode.js ai @notes.txt "prompt"     # Include file contents as context
node chode.js ai "Recreate https://example.com as HTML" # Inspect public page and save site-copy.html
node chode.js ai "..." --output page.html  # Choose HTML output path; existing files are protected
node chode.js ai "..." --overwrite --output page.html # Explicitly replace output
node chode.js ai "..." --no-web           # Skip automatic public-page inspection
node chode.js ai "..." --no-tools         # Single answer, no tool loop
node chode.js ai "..." --verbose          # Show provider and page-inspection diagnostics
node chode.js                             # Continuous REPL: streams tokens, /session, /tools, /todo
node chode.js task "do X"                # Isolated subagent (own session, max depth 1)
node chode.js plan "goal"                # Read-only plan (inspects, never modifies)
node chode.js project "build a web app"  # Multi-step project orchestration
node chode.js project --resume <id>      # Continue a saved project queue
```

The model can read, search, write, edit, run workspace commands, track todos,
fetch pages, search the web and GitHub, and find/install free dev tools by
itself (`grep`, `glob`, `read`, `write`, `edit`, `exec`, `todo`, `webfetch`,
`websearch`, `github`, `toolbox`, `ask`, `task` — workspace only, secrets denied.
`ask` prompts you live in the REPL and auto-picks the default headless.
Transient provider failures stay quiet unless `--verbose` is passed. Failed
requests queue locally (`chode pending`) so nothing is lost — the harness
keeps going on local context instead of dying.

### Health & Discovery
```bash
node chode.js status       # Full health dashboard
node chode.js scan         # Probe all providers, build leaderboard
node chode.js score        # Show current rankings
node chode.js heal         # Force full re-scan (clear circuit breakers)
node chode.js research     # Re-probe keyless endpoints, grow overlay
```

### Keys & Provisioning
```bash
node chode.js auth                   # View/set API keys
node chode.js provision              # Auto-request free-tier keys via HEMO mail
node chode.js quickkey groq          # Show signup link for provider
node chode.js models                 # List all registered providers
```

### Memory System
```bash
node memory.js store <type:id> <value> [--seal]   # Store memory
node memory.js recall <type:id>                   # Recall memory
node memory.js list                               # List all memories
node memory.js compress <session-id>              # Compress old session
node memory.js context <session-id>               # Build context window
node memory.js seal <type:id>                     # Seal memory on-chain
node memory.js verify <type:id>                   # Verify seal provenance
node memory.js status                             # Show memory stats
```

### Agent System
```bash
node chode.js agents list                          # List registered agents
node chode.js agents add <id> --type <local|ssh|http> [flags]
node chode.js agents run <agent-id> "task"         # Dispatch task
node chode.js agents status [task-id]              # Check task status
node chode.js skills [list|install]              # List or verify local skills
```

### Monitoring
```bash
node chode.js monitor      # Start background health monitor
node chode.js costs        # Show cost tracking report
node chode.js metrics      # Export system metrics
node chode.js queue        # Show request queue status
```

### Project, local tools & setup
```bash
node chode.js new <name> [--skill]   # Scaffold a Worker or HEMO skill
node chode.js deps [check|install]   # Check/install Wrangler
node chode.js session [list|show|reset]
node chode.js init                   # Create local state and setup guidance
node chode.js update                 # Check for a newer release
node chode.js tool <grep|glob|read|edit>
node chode.js util <b64|hash|jwt|json|url|uuid|tokens|mermaid>
node chode.js nosignups              # Show no-signup tools
node chode.js helios-record [--dry-run|--live]
node chode.js help
```

### Security
```bash
node chode.js audit [path]          # Secrets + dangerous patterns + AI review
node chode.js audit [path] --no-ai  # Deterministic report only
```

---

## Getting API Keys

### Fastest Path (Recommended)
```bash
node chode.js quickkey groq
# Opens: https://console.groq.com/keys
# Sign up with Google (30 seconds, no credit card)
# Paste key: node chode.js auth groq [your-key]
```

### All Free Tier Options
| Provider | Signup | Free Tier |
|----------|--------|-----------|
| Groq | https://console.groq.com/keys | 14,400 req/day |
| Google Gemini | https://aistudio.google.com/app/apikey | 1,500 req/day |
| DeepSeek | https://platform.deepseek.com/ | Generous free |
| Cerebras | https://cloud.cerebras.ai/ | 1M tokens/day |
| Mistral | https://console.mistral.ai/ | 1B tokens/month |
| OpenRouter | https://openrouter.ai/keys | 50 req/day |
| NVIDIA NIM | https://build.nvidia.com/ | 40 req/min |
| Cloudflare AI | https://dash.cloudflare.com/ai | 10K neurons/day |
| Cohere | https://dashboard.cohere.com/ | Non-commercial |

### Environment Variables
```bash
export GROQ_API_KEY=sk-...
export GEMINI_API_KEY=...
export DEEPSEEK_API_KEY=...
export ANTHROPIC_API_KEY=...
export CHODE_KEY=...  # Agnes AI key
```

---

## Utilities & Browser Skills

Deterministic offline helpers (results on stdout, no quota, no keys):

```bash
node chode.js util b64 encode|decode <text|@file>
node chode.js util hash md5|sha1|sha256|sha512 <text|@file>
node chode.js util jwt decode <token>
node chode.js util json pretty|minify <file|->
node chode.js util url encode|decode <text>
node chode.js util uuid
node chode.js util tokens estimate <text|@file>   # heuristic: chars/4
node chode.js util mermaid render <file.mmd> [--out out.svg]  # via kroki.io
```

Curated no-signup browser tools (links only, nothing automated):

```bash
node chode.js skills web
```

Image/OCR: Squoosh, ClearCanvas AI, Stirling-PDF, BentoPDF · Dev: Hoppscotch, CyberChef, JSON Crack, HappyFormatter, HappyTokenizer, SQLChef, GitReverse · Diagrams: Mermaid Live, Kroki, Excalidraw, draw.io, Markmap · Local LLM: WebLLM, Forge · Transfer: PairDrop, LocalSend-Web

## Architecture

```
chode.js (CLI, zero runtime dependencies)
├── web-context.js (safe public-page inspection + sanitization)
├── Provider Registry (16 providers)
├── Health Scanner (live probes every 30s)
├── Leaderboard (weighted scoring: quality×35% + reliability×30% + latency×20% + recency×15%)
├── Circuit Breaker (auto-failover on 3 failures)
├── Parallel Router (3 providers simultaneously)
├── Agent Tool Loop (13 tools incl. todo/web/github/toolbox/ask/task; orchestrator unbounded, subagents max 8 steps; stagnation breakers file PARTIAL)
├── Isolated subagents (`task`: fresh session, bounded, no nesting) + read-only `plan`
├── Token streaming (SSE with buffered fallback, tool blocks filtered live)
├── Live markdown (per-line styled stream, pipes stay raw)
├── Session todos (per-session plans, default stays legacy)
├── Health prediction (15m error window feeds score/status)
├── Pickers (bare /session and /retry open numbered selection)
├── Toolbox (curated free tools + GitHub search, verified installers only)
├── Pending queue (failed requests survive outages, /retry re-runs them)
├── Rate Limit Tracker (429 detection)
├── Request Queue (burst handling, max 100)
├── Cost Tracker (per-provider, daily)
├── HEMO Vault (persistent memory)
├── HELIOS Provenance (on-chain sealing)
├── Subagent System (local/SSH/HTTP)
└── Checkpoint Recovery (crash-resume)
```

---

## Income Idea MVPs

Three business ideas tested and ready to build:

### 1. Memory Lens — AI Photo Restoration
- Upload old/damaged photos
- AI restores colors, fixes scratches
- Generates stories from photo context
- Monetization: $5-20/photo, $29/mo subscription

### 2. Retro Revival — AI Nostalgia Merch
- AI generates vintage-style designs
- Print-on-demand fulfillment
- Monetization: $15-40 profit/item

### 3. Dream Decoder — Sleep Story Generator
- Voice-record dreams
- AI transcribes and interprets
- Generates personalized bedtime stories
- Monetization: $9.99/mo subscription

All three have complete test suites in `tests/`:
- `memory-lens.test.js` — 5/5 PASS
- `retro-revival.test.js` — 6/6 PASS
- `dream-decoder.test.js` — 7/7 PASS

---

## HEMO Ecosystem Integration

chode integrates with the HEMO agent economy:

| Service | URL | Purpose |
|---------|-----|---------|
| **HELIOS** | https://ai.oooooooooo.se | Agent identity & provenance ledger |
| **Vault** | https://hemo-vault.oooooooooo.se | Persistent agent memory |
| **MCP Gateway** | https://mcp-hemo.oooooooooo.se | Connect to Claude/Cursor/Hermes |
| **Jobs** | https://hemo-jobs.oooooooooo.se | Paid agent work marketplace |
| **Registry** | https://hemo-registry.oooooooooo.se | Verified agent directory |
| **Court** | https://hemo-court.oooooooooo.se | Staked arbitration |
| **Consensus** | https://hemo-consensus.oooooooooo.se | Reputation-weighted truth |
| **Mail** | https://hemo-mail.oooooooooo.se | Agent email |

### Getting HEMO Identity
```bash
# AUTO: First run creates identity
node memory.js status

# MANUAL: Create at https://ai.oooooooooo.se
POST https://ai.oooooooooo.se/api/v1/accounts
Body: {"username": "your-agent-name"}
Response: {"token": "your-bearer-token"}
```

---

## Testing

```bash
# Run all tests
npm test

# Or run individually
node tests/memory-lens.test.js
node tests/retro-revival.test.js
node tests/dream-decoder.test.js
node tests/web-context.test.js
node tests/agent-workflow.test.js
node tests/agent-loop.test.js
node tests/toolbox.test.js
node tests/interactive-tools.test.js
node tests/streaming.test.js
node tests/repl-ux.test.js
node tests/live-ux.test.js
node tests/sessions-health.test.js
node tests/ask-tool.test.js
node tests/no-pollinations.test.js
node tests/polish-audit.test.js
node tests/polish-round2.test.js
node tests/repl-pipe.test.js
node tests/polish-round3.test.js
node tests/polish-round4.test.js
node tests/subagents.test.js
node tests/plan.test.js
node tests/frontend-copy.test.js

# Syntax check
node --check chode.js
node --check memory.js
```

---

## Troubleshooting

### "All providers exhausted"
```bash
# Check status
node chode.js status

# Scan providers
node chode.js scan

# Add a key
node chode.js quickkey groq
node chode.js auth groq [your-key]
```

### "DNS failed" errors
Provider endpoint may be down. Run `chode.js heal` to clear cached DNS.

### Rate limited (429)
Auto-waits and retries. Check `node chode.js metrics` for rate limit stats.

### Memory not persisting
```bash
node memory.js status
# Check if HEMO identity exists
# If missing, create: POST https://ai.oooooooooo.se/api/v1/accounts
```

---

## License

MIT — Robert Fogeborg 2026

---

## Links

- **Repository**: https://github.com/fogennnnn/chode
- **Issues**: https://github.com/fogennnnn/chode/issues
- **HEMO Docs**: https://mcp-hemo.oooooooooo.se/llms.txt
- **Vault Docs**: https://hemo-vault.oooooooooo.se/llms.txt

The official installers refuse releases below the security floor, mismatched release versions, and altered runtime checksums. Saved provider overlays cannot re-enable retired providers. Old source checkouts and historical GitHub revisions are not verified installations. If the command still reports an unexpected version, inspect `Get-Command chode -All` on PowerShell or `type -a chode` on POSIX shells; do not assume a successful install changed an existing alias or PATH order.

### Website completion checks

Full and multi-page website requests run in the agent workspace. Chode retains the original brief across tool turns, checks requested pages and local links/assets, runs a configured production build, and repairs failed checks. Single-file website builds receive an independent review against the brief. See [website completion in 1.7.3](UX-1.7.3.md) for checks and limitations.

### Free provider resilience

Run `chode ai "Build the complete website ..." --free`, or use `/free on` in the TUI. This restricts routing to keyless/local providers, preserves incremental build progress, honors provider cooldowns, and permits up to three automatic resumes while the TUI stays open. Ctrl+C cancels waiting. Use the same prompt/session to resume a saved CLI build; add `--fresh` to ignore its checkpoint. Provider availability still limits completion. See [free-provider resilience](UX-1.7.4.md).

### Startup fix for 1.7.4

If `chode` exits with `TypeError: require(...).defaultFreeMode is not a function`, rerun the verified installer to upgrade to 1.7.5 or later. The release fixes interactive startup and adds packaged Linux terminal checks.

### Worker recovery in 1.7.6

Unexpected worker exits now save a retryable task and redacted diagnostics under `.chode/worker-crashes/`, preserve generated files and checkpoints, and attempt one bounded recovery. The composer remains usable after repeated failures. Completed results are persisted before IPC delivery and recovered if delivery is interrupted. UI transport batches streaming text and omits large tool file contents that the UI does not display.

### Provider setup (1.8.0)

Run `chode connect` or `/connect` inside the workspace. Choose a provider, paste a hidden API key, discover or enter a model, optionally test the connection, then save or select it. `/connect custom` adds an OpenAI-compatible HTTPS endpoint or a local HTTP server. OpenRouter offers browser login with PKCE; paste the single-use code after approving access. Other providers use their supported API keys. Esc or Ctrl+C cancels without saving. Keys stay out of chat, history and conversation exports; local config files use owner-only permissions on systems that enforce POSIX modes. Keys remain unencrypted on disk. A connection test sends a small request and can consume provider credits. Saving and selecting a keyed provider explicitly leaves strict keyless free mode.

Builds have no fixed wall-clock limit by default in 1.8.0. A ten-minute inactivity watchdog saves stalled work; model output and tool events reset it, heartbeats do not, and questions pause it. `/timeout <seconds>` sets an optional limit; `/timeout off` removes it. Per-call timeouts and bounded model/tool work windows remain to control hung requests and repeated failures.

### Build reliability (1.8.1)

Build and review requests use isolated model contexts instead of replaying internal transcripts. Verification tracks the actual repair author. Planned CommonJS/ESM files must exist. Background commands are checked against their real exit code and can be inspected with the `jobs` tool; a launch is not a passing check. Active model streams use an inactivity timer and release their connections on completion. A cooling provider does not delay other ready free providers.
Repeated failed tool calls trigger a bounded provider change within the current run. Verification excludes all implementation authors, including authors restored from saved progress.

### Completion and honest certification

A successful build does not stop at the first plausible answer. One-shot AI builds run bounded completion rounds, share their model budget, wait out short capacity windows, preserve saved work and only report success when the local completion gate passes. Planning, checking and repair stages are narrated in plain language.

Independent review is used whenever a genuinely different reviewer is available. If no independent reviewer can be reached, or the only reviewer authored the work, Chode runs its deterministic checks and labels the result as locally verified rather than pretending an external review happened. A real `FAILED` check still fails the run and triggers repair; local certification is never used to hide a failed test.

### Retained build context (1.8.2)

Build turns retain up to 18 KB of already-returned tool observations (at most 12 results), with credential-file exclusions and known-secret redaction. No extra files are read to construct this context. Earlier observations are marked as potentially stale after edits, and verifiers remain isolated from internal build transcripts. Free-mode turns are prompted to prioritize complete useful implementation over interim narration or placeholders.

### Grouped edits and undo

Use chode edits preview changes.json, chode edits apply changes.json, and chode undo for persistent grouped edits. See [EDITING.md](EDITING.md) and [handoff.md](handoff.md).

## Native skills and MCP

Use `chode integrations list` to discover native integration presets, and `chode integrations setup cloudflare --global` followed by `chode mcp auth cloudflare` to connect Cloudflare to Chode. Shared Agent Skills are discovered automatically. See [INTEGRATIONS.md](INTEGRATIONS.md) for setup, authentication, trust and current limitations.

## Provider discovery

Use `chode providers <search>` or `/providers <search>` to browse the compatible connection catalog. `/connect` supports search and numbered pages. See [PROVIDER-CONNECTIONS.md](PROVIDER-CONNECTIONS.md) for free-account distinctions, shared credentials, Agnes quota diagnostics and the test coverage. Catalog entries are not a live-vendor reliability score.
