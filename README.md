# chode — The Self-Healing Coding Harness

**Free tiers. HEMO auto-provisioning. Zero lock-in.**

A single-file Node.js CLI that routes AI requests across 10 real free-tier providers. Falls back to bootstrap providers when no keys are configured. Never stops.

---

## Architecture

```
chode.js (single file, zero runtime deps)
├── Provider Registry (10 real + 1 bootstrap + 1 local + 2 paid)
├── Health Scanner (live probes every 30s)
├── Leaderboard (weighted scoring: quality + reliability + latency + recency)
├── Circuit Breaker (auto-failover on 3 consecutive failures)
├── Parallel Router (3 providers simultaneously per batch)
├── Rate Limit Tracker (429 detection, auto-backoff)
├── Work Queue (persistent multi-step project state)
├── Checkpoint Recovery (crash-resume any task)
└── Bootstrap Fallback (when no keys configured)
```

### How Routing Works

```
User: "Write a binary search"
  │
  ├─► Load leaderboard (latest scan scores)
  ├─► Filter viable providers (has key, circuit closed, not rate-limited)
  ├─► Send prompt to top 3 providers IN PARALLEL
  ├─► First response wins → return it
  ├─► On failure → record error, open circuit breaker, try next batch
  ├─► On 429 → record rate limit, back off that provider
  └─► If ALL fail → fall back to bootstrap (Pollinations) if available
      → If bootstrap fails → show signup links for free tiers
```

### Bootstrap Strategy

When zero provider keys are configured:
1. chode tries all configured providers (they all fail with auth errors)
2. After all real providers exhaust retries, falls back to bootstrap
3. Bootstrap provider (Pollinations) may be rate-limited
4. If bootstrap also fails, shows signup URLs for free-tier providers
5. User gets one free-tier key → chode routes across all providers automatically

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
chode provision                            Show free-tier signup links and instructions
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

## Provider Registry (13 Providers)

### Free Tier (require signup, no credit card)

| Provider | Quality | Free Tier | Key | Signup |
|----------|---------|-----------|-----|--------|
| **Groq** | 92 | 14,400 req/day | `GROQ_API_KEY` | https://console.groq.com/keys |
| **Google Gemini** | 94 | 1,500 req/day | `GEMINI_API_KEY` | https://aistudio.google.com/app/apikey |
| **Cerebras** | 90 | 1M tokens/day | `CEREBRAS_API_KEY` | https://cloud.cerebras.ai/ |
| **DeepSeek** | 89 | Generous free | `DEEPSEEK_API_KEY` | https://platform.deepseek.com/ |
| **Mistral** | 88 | 1B tokens/month | `MISTRAL_API_KEY` | https://console.mistral.ai/ |
| **OpenRouter** | 85 | 50 req/day | `OPENROUTER_API_KEY` | https://openrouter.ai/keys |
| **NVIDIA NIM** | 86 | 40 req/min | `NVIDIA_API_KEY` | https://build.nvidia.com/ |
| **Cloudflare AI** | 72 | 10K neurons/day | `CLOUDFLARE_API_KEY` | https://dash.cloudflare.com/ai |
| **Cohere** | 80 | Non-commercial | `COHERE_API_KEY` | https://dashboard.cohere.com/ |

### Local
| Provider | Quality | Notes |
|----------|---------|-------|
| **Ollama** | 60 | Unlimited local inference. `winget install Ollama.Ollama` |

### Bootstrap Fallback
| Provider | Quality | Notes |
|----------|---------|-------|
| **Pollinations** | 30 | No key. Used ONLY when all others fail. Subject to rate limits. |

### Paid (reference)
| Provider | Quality | Key |
|----------|---------|-----|
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
# Fastest path: get ONE free key (30 seconds, no credit card)
chode provision              # Shows all signup links
# Sign up at https://console.groq.com/keys
chode auth groq gsk_xxx      # Set the key

# Or via environment variable
GROQ_API_KEY=gsk_xxx node chode.js ai "hello"
```

With one free key, chode routes across all 10 providers automatically.

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
chode project "Build a URL shortener API with analytics"
chode project --resume proj_1724880000000
```

---

## Installation

```bash
git clone <repo>
cd chode
node chode.js scan
node chode.js ai "hello"
```

**Requirements:** Node.js 18+, no other dependencies.

---

## Getting Started (Fastest Path)

```bash
# 1. Get ONE free API key (30 seconds, no credit card)
#    https://console.groq.com/keys  →  copy key
#    https://aistudio.google.com/app/apikey  →  copy key

# 2. Set it
chode auth groq gsk_your_key_here

# 3. Start building
chode ai "write me a Python script"
chode project "Build a REST API with auth"
```

---

## Known Limitations

| Issue | Severity | Solution |
|-------|----------|----------|
| All cloud AI providers require keys in 2026 | High | Get one free key (Groq/Gemini/Cerebras) |
| Pollinations rate-limits aggressively | Medium | Use as emergency fallback only |
| HEMO mail DNS sometimes unreachable | Low | Manual `chode auth <provider> <key>` |
| Ollama requires local install | Low | `winget install Ollama.Ollama` |

---

*Self-healing. Never stops. Free tiers first.*
