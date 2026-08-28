# chode — The Self-Healing Coding Harness

**Free tiers. HEMO auto-provisioning. Zero lock-in.**

A single-file Node.js CLI that routes AI requests across 10 real free-tier providers with automatic fallback to bootstrap providers when no keys are configured. Never stops.

---

## Architecture

```
chode.js (single file, zero runtime deps)
├── Provider Registry (11 real endpoints + 1 bootstrap)
├── Health Scanner (live probes every 30s)
├── Leaderboard (weighted scoring: quality + reliability + latency + recency)
├── Circuit Breaker (auto-failover on 3 consecutive failures)
├── Parallel Router (3 providers simultaneously per batch)
├── Rate Limit Tracker (429 detection, auto-backoff)
├── Work Queue (persistent multi-step project state)
├── Checkpoint Recovery (crash-resume any task)
└── Bootstrap Fallback (Pollinations when no keys available)
```

### Bootstrap Strategy

When zero provider keys are configured:
1. chode tries all configured providers (they all fail with auth errors)
2. After all real providers exhaust retries, falls back to Pollinations
3. Pollinations responds instantly with no key required
4. User then runs `chode provision` to get real free-tier keys
5. Subsequent calls use real providers instead of bootstrap

### Core Loops

| Loop | Interval | Purpose |
|------|----------|---------|
| `scan` | On-demand | Full probe of all providers |
| `monitor` | 30s | Background re-scan |
| `circuit_breaker` | Instant | Open after 3 failures, cooldown 2min |
| `checkpoint` | Per-call | Save progress before every AI call |
| `leaderboard` | Per-scan | Re-rank providers by quality/reliability/speed/recency |
| `parallel_router` | Per-call | Try 3 providers simultaneously, take first success |

---

## Commands

### AI & Projects
```
chode ai "prompt"                          AI call with parallel auto-fallback routing
chode ai --resume                          Resume from last checkpoint
chode ai --force <provider>                Force specific provider
chode project "<spec>"                     Multi-step project orchestration
chode project --resume <qid>               Resume interrupted project
```

### Health & Discovery
```
chode status                               Full health dashboard
chode scan                                 Probe ALL providers, build leaderboard
chode score                                Show current rankings
chode heal                                 Force full re-scan (clear circuit breakers)
```

### Keys & Provisioning
```
chode auth                                 View/set API keys
chode provision                            Show free-tier signup links and keys needed
chode models                               List all registered providers
```

### Project Scaffolding
```
chode new <name>                           Scaffold a Cloudflare Worker
chode new <name> --skill <slug>            Scaffold a HEMO skill
chode deps [check|install]                 Manage dependencies
```

### Other
```
chode session list                         List active sessions
chode session show [id]                    Show session history
chode session reset                        Clear all sessions
chode init                                 One-time setup wizard
chode update                               Check for chode updates
chode help
```

---

## Provider Registry (11 Real + 1 Bootstrap)

### Free Tier Providers (require signup, no credit card)

| Provider | Quality | Free Tier | Key Env Var | Signup |
|----------|---------|-----------|-------------|--------|
| **Groq** | 92 | 14,400 req/day, 6K tok/min | `GROQ_API_KEY` | https://console.groq.com/keys |
| **Google Gemini** | 94 | 1,500 req/day, 60 req/min | `GEMINI_API_KEY` | https://aistudio.google.com/app/apikey |
| **Cerebras** | 90 | 1M tokens/day, 30 req/min | `CEREBRAS_API_KEY` | https://cloud.cerebras.ai/ |
| **DeepSeek** | 89 | Generous free tier | `DEEPSEEK_API_KEY` | https://platform.deepseek.com/ |
| **Mistral** | 88 | 1B tokens/month | `MISTRAL_API_KEY` | https://console.mistral.ai/ |
| **OpenRouter** | 85 | 50 req/day free | `OPENROUTER_API_KEY` | https://openrouter.ai/keys |
| **NVIDIA NIM** | 86 | 40 req/min, phone verify | `NVIDIA_API_KEY` | https://build.nvidia.com/ |
| **Cloudflare AI** | 72 | 10K neurons/day | `CLOUDFLARE_API_KEY` | https://dash.cloudflare.com/ai |
| **Cohere** | 80 | Non-commercial only | `COHERE_API_KEY` | https://dashboard.cohere.com/ |

### Local Provider
| Provider | Quality | Notes |
|----------|---------|-------|
| **Ollama** | 60 | Unlimited local inference. Install: `winget install Ollama.Ollama` |

### Bootstrap Fallback
| Provider | Quality | Notes |
|----------|---------|-------|
| **Pollinations** | 30 | No key needed. Used ONLY when all other providers fail. |

### Paid Providers (reference)
| Provider | Quality | Key Env Var |
|----------|---------|-------------|
| Anthropic Claude | 100 | `ANTHROPIC_API_KEY` |
| OpenAI GPT-4o | 95 | `OPENAI_API_KEY` |

---

## Configuration

Stored in `.chode/` relative to project root:

```
.chode/
├── config.json              # Global config (HELIOS token, provider keys)
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
# Option 1: Get a free key, then set it
chode provision              # Shows signup links
# Sign up at https://console.groq.com/keys (no CC needed)
chode auth groq gsk_xxx      # Set the key

# Option 2: Environment variable
GROQ_API_KEY=gsk_xxx node chode.js ai "hello"

# Option 3: Interactive setup
chode init                   # Creates HEMO agent, guides through setup
```

---

## Scoring Algorithm

```
score = quality × 0.35 + reliability × 0.30 + latency_score × 0.20 + recency × 0.15

where:
  quality          = provider's base quality score (static)
  reliability      = success_rate = successes / total_probes
  latency_score    = max(0, 100 - avg_latency_ms / 100)
  recency          = min(100, 100 - (minutes_since_last_success × 2))
```

Circuit breaker opens when `consecutive_failures >= 3`, enforced for 120s cooldown.
Rate limiter triggers when `consecutive_429s >= 3`, provider skipped until next scan.

---

## Checkpoint Recovery

Every AI call saves a checkpoint before execution:

```json
{
  "taskId": "default",
  "lastProvider": "groq",
  "lastPrompt": "prompt text...",
  "lastResult": "result text...",
  "ts": 1724880000000
}
```

On crash or Ctrl+C, `chode ai` auto-resumes from the last checkpoint.

---

## Work Queue (Multi-Step Projects)

```bash
# Decompose and run
chode project "Build a URL shortener API with analytics"

# Resume interrupted project
chode project --resume proj_1724880000000
```

---

## Drift Detection

Endpoints are hashed and compared against stored registry. When an endpoint URL changes, it's auto-updated with a warning.

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

**Requirements:** Node.js 18+, no other dependencies required.

---

## Current State (2026-08-28)

| Metric | Value |
|--------|-------|
| Registered providers | 12 (10 free-tier + 1 bootstrap + 1 local + 2 paid) |
| OmniRoute dependency | Removed |
| Pollinations | Included as bootstrap fallback only |
| Circuit breaker threshold | 3 consecutive failures |
| Circuit breaker cooldown | 120 seconds |
| Parallel provider calls | 3 simultaneous per batch |
| Monitor interval | 30 seconds |
| Session context | 50 messages |
| Checkpoint interval | Per-call |
| Rate limit tracking | 429 auto-detection + backoff |
| HEMO auto-provisioning | Graceful fallback when unavailable |
| Usage stats | Per-provider daily counters |

---

## Known Limitations

| Issue | Severity | Workaround |
|-------|----------|------------|
| All cloud AI providers require keys in 2026 | High | Get a free Groq/Gemini key (no CC) |
| Pollinations occasionally returns 402 | Medium | Falls back gracefully, try again |
| HEMO mail DNS unreachable from some networks | Medium | Use manual `chode auth <provider> <key>` |
| Ollama not installed by default | Low | Run `winget install Ollama.Ollama` |
| Free tiers have daily quotas | Info | Router tracks usage, switches providers |

---

## Getting Started (Fastest Path)

```bash
# 1. Get a free Groq key (takes 30 seconds, no credit card)
#    Visit: https://console.groq.com/keys

# 2. Set the key
chode auth groq gsk_your_key_here

# 3. Test chode
chode ai "write me a python function"
```

With one free key, chode routes across all configured providers automatically.

---

## Planned Roadmap

See [ROADMAP.md](./ROADMAP.md) for detailed planning.

**Completed:**
- [x] Single-file architecture (zero external deps)
- [x] 10 real free-tier providers (no OmniRoute)
- [x] Bootstrap fallback to Pollinations when no keys
- [x] Parallel provider calls (3 simultaneous)
- [x] Rate limit tracking (429 detection)
- [x] Circuit breaker pattern
- [x] Work queue persistence
- [x] Checkpoint recovery
- [x] HEMO provisioning (with graceful fallback)
- [x] Documentation (README + ROADMAP)
- [x] Package name: OLDGREG (chode unavailable on npm)

---

*Self-healing. Never stops. Free tiers first.*
