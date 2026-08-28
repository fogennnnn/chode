# chode — The Self-Healing Coding Harness

**Free models. Open output. Zero lock-in.**

A single-file Node.js CLI that probes 33+ AI providers, builds a live reputation score, and routes your work to whatever is actually working right now.

---

## Architecture

```
chode.js (single file, zero deps)
├── Provider Registry (33 endpoints)
├── Health Scanner (live probes every 30s)
├── Leaderboard (weighted scoring: quality + reliability + latency + recency)
├── Circuit Breaker (auto-failover on 3 consecutive failures)
├── Work Queue (persistent multi-step project state)
├── Checkpoint Recovery (crash-resume any task)
├── Session Manager (50-message context windows)
└── OmniRoute Gateway (optional local reverse proxy, 11 free tiers)
```

### Core Loops

| Loop | Interval | Purpose |
|------|----------|---------|
| `scan` | On-demand | Full probe of all 33 providers |
| `monitor` | 30s | Background re-scan, focus on failed providers |
| `circuit_breaker` | Instant | Open after 3 failures, cooldown 2min |
| `checkpoint` | Per-task | Save progress before every call |
| `leaderboard` | Per-scan | Re-rank: quality(35%) + reliability(30%) + latency(20%) + recency(15%) |

---

## Commands

### AI & Projects
```
chode ai "prompt"                          AI call with auto-fallback routing
chode ai --resume                          Resume from last checkpoint
chode project "<spec>"                     Multi-provider orchestration (AI-decomposed)
chode project --resume <qid>               Resume interrupted project
```

### Health & Discovery
```
chode status                               Full health dashboard (providers, circuits, usage)
chode scan                                 Probe ALL providers, build live leaderboard
chode monitor                              Background health monitor (every 30s)
chode score                                Show current rankings
chode heal                                 Force full re-scan (clear circuit breakers)
```

### Project Scaffolding
```
chode new <name>                           Scaffold a Cloudflare Worker
chode new <name> --skill <slug>            Scaffold a HEMO skill
chode dev                                  Local dev server (wrangler)
chode deploy                               Deploy to Cloudflare
chode deps [check|install|update]          Manage dependencies
```

### Sessions & Auth
```
chode session list                         List active sessions
chode session show [id]                    Show session context
chode session reset                        Clear all sessions
chode auth                                 Set API keys for paid providers
chode init                                 One-time setup wizard
```

### Other
```
chode models                               List all registered providers
chode omniroute [start|stop|install]       Manage local OmniRoute gateway
chode evolve <skill>                       Update a skill from remote repo
chode bench                                Run hemo-jobs benchmark suite
chode update                               Check for chode updates
chode help
```

---

## Provider Tiers

| Tier | Count | Auth | Description |
|------|-------|------|-------------|
| `noauth` | 20 | None | Browser-based, no keys, may require browser cookies |
| `omni_free` | 11 | Local gateway | OmniRoute proxy to 11 free-tier models |
| `free_tier` | 2 | Optional key | DeepSeek free, HuggingChat free |
| `paid` | 7 | Required key | Anthropic, OpenAI, Perplexity, Groq, etc. |
| `local` | 1 | None | Ollama (requires local install) |

### No-Auth Providers (work without keys)
```
omnimix, omnibestfree, omnicodefree, omnibest, omnireason, omnifast,
omnichat, omnichaos, omniglm, omnigemini, omnillama, omnimimo,
deepseek, openrouter, hf_free, ai_horde, aug, tllm, oc, ddgw, agentrouter, felo
```

### Paid Providers (require API key via `chode auth`)
```
anthropic   → ANTHROPIC_API_KEY     (claude-3-sonnet, claude-3-opus)
openai      → OPENAI_API_KEY        (gpt-4o-mini, gpt-4o)
perplexity  → PERPLEXITY_API_KEY    (sonar, sonar-pro)
cloudflare  → CLOUDFLARE_API_KEY    (cloudflare AI workers)
groq        → GROQ_API_KEY          (llama-3, gemma-2)
cerebras    → CEREBRAS_API_KEY      (cs-*-8b)
nvidia      → NVIDIA_API_KEY        (NIM microservices)
scaleway    → SCALEWAY_API_KEY      (mistral, llama)
gemini      → GEMINI_API_KEY        (gemini-1.5-flash)
mistral     → MISTRAL_API_KEY       (mistral-large)
```

---

## Configuration

Stored in `.chode/` relative to project root:

```
.chode/
├── config.json              # Global config (omniroute port, monitor enabled)
├── providers.json           # Per-provider API keys
├── checkpoint.json          # Last AI task state (for --resume)
├── work_queue_*.json        # Persistent multi-step project state
├── sessions/
│   └── default.json         # Message history (50 msgs, keyed by role)
└── monitor/
    ├── leaderboard.json     # Live provider scores
    ├── registry.json        # Endpoint drift detection hashes
    └── usage.json           # Daily request/token/error counts
```

### Setting API Keys

```bash
chode auth anthropic sk-ant-...
chode auth openai sk-proj-...
# or via environment
ANTHROPIC_API_KEY=sk-ant-... node chode.js ai "prompt"
```

### OmniRoute Gateway (optional)

```bash
chode omniroute install    # Install local proxy
chode omniroute start      # Start on port 20128
chode omniroute stop       # Stop proxy
```

OmniRoute gives access to 11 free models behind a single local endpoint. Requires Node.js + npm.

---

## Scoring Algorithm

```
score = quality × 0.35 + reliability × 0.30 + latency_score × 0.20 + recency × 0.15

where:
  quality          = provider's base quality score (static, set at registration)
  reliability      = success_rate = successes / total_probes
  latency_score    = max(0, 100 - avg_latency_ms / 100)
  recency          = min(100, 100 - (minutes_since_last_success × 2))
```

Circuit breaker opens when `consecutive_failures >= 3`, enforced for 120s cooldown.

---

## Checkpoint Recovery

Every AI call saves a checkpoint before execution:

```json
{
  "taskId": "default",
  "stepIndex": 2,
  "stepDesc": "Analyze codebase structure",
  "lastProvider": "omnimix",
  "lastPrompt": "prompt text...",
  "lastResult": "result text...",
  "ts": 1724880000000
}
```

On crash or Ctrl+C, `chode ai` auto-resumes from the last checkpoint. Projects save after each step.

---

## Work Queue (Multi-Step Projects)

```bash
# Decompose and run
chode project "Build a React todo app with auth"

# Resume interrupted project
chode project --resume proj_1724880000000
```

Each project creates a `work_queue_*.json` file with steps, results, and completion status. Failed steps can be retried individually.

---

## Drift Detection

Endpoints are hashed and compared against stored registry. When an endpoint URL changes:

```
~  Drift detected: Ollama endpoint updated (http://localhost:11434/api/chat -> http://localhost:11434/api/generate)
```

The new URL is stored, scored, and used going forward. No manual intervention needed.

---

## Installation

```bash
# Clone or download
git clone <repo>
cd chode

# Test
node chode.js scan
node chode.js status
node chode.js ai "hello"
```

**Requirements:** Node.js 18+, no other dependencies required for core functionality.

---

## Current State (2026-08-28)

| Metric | Value |
|--------|-------|
| Registered providers | 33 |
| No-auth providers | ~20 (most require cookies/browser now) |
| Paid providers | 9 (require keys) |
| Local providers | 1 (Ollama) |
| Circuit breaker threshold | 3 consecutive failures |
| Circuit breaker cooldown | 120 seconds |
| Parallel provider calls | 3 simultaneous per batch |
| Monitor interval | 30 seconds |
| Session context | 50 messages |
| Checkpoint interval | Per-call |
| Rate limit tracking | 429 auto-detection + backoff |
| Usage stats | Per-provider daily counters |

---

## Planned Roadmap

See [ROADMAP.md](./ROADMAP.md) for detailed planning.

**Quick summary of upcoming work:**
- [ ] Parallel provider calls (currently sequential)
- [ ] Rate limit awareness per provider
- [ ] Automatic key validation on startup
- [ ] Usage quota tracking and alerts
- [ ] OmniRoute as optional dependency (not required)
- [ ] Cross-platform health probes
- [ ] Skill marketplace integration

---

*Self-healing. Never stops. Free models first.*
