# chode — The Self-Healing Coding Harness

**Free tiers. HEMO auto-provisioning. Zero lock-in.**

A single-file Node.js CLI that routes AI requests across 10 real free-tier providers. Never stops.

---

## Quick Start

```bash
node chode.js
# → "I'm OLDGREG"
# → Pick your path (Groq/Gemini/Bootstrap)
# → Paste key → Start using AI
```

That's it. Baby and researcher friendly.

---

## Architecture

```
chode.js (single file, zero runtime deps)
├── Provider Registry (10 real + 1 bootstrap + 1 local + 2 paid)
├── Health Scanner (live probes every 30s)
├── Leaderboard (weighted scoring)
├── Circuit Breaker (auto-failover on 3 failures)
├── Parallel Router (3 providers simultaneously)
├── Rate Limit Tracker (429 detection)
├── Work Queue (persistent multi-step projects)
├── Checkpoint Recovery (crash-resume)
└── Auto-Provisioning (guided key setup on startup)
```

### Startup Flow

```
User runs: node chode.js
  │
  ├─► Prints: "I'm OLDGREG"
  ├─► Checks for API keys
  │
  ├─► No keys? Show simple menu:
  │     1. Groq (30s signup, no CC)
  │     2. Google Gemini (free, 1500 req/day)
  │     3. Bootstrap (Pollinations, works now, limited)
  │     4. Skip setup
  │
  ├─► User picks → Paste key → Done
  │
  └─► Has keys? Start AI session immediately
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
  └─► If ALL fail → show signup links or use bootstrap
```

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
chode provision                            Show free-tier signup links
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

| Provider | Quality | Free Tier | Key Env | Signup |
|----------|---------|-----------|---------|--------|
| **Groq** | 92 | 14,400 req/day | `GROQ_API_KEY` | https://console.groq.com/keys |
| **Google Gemini** | 94 | 1,500 req/day | `GEMINI_API_KEY` | https://aistudio.google.com/app/apikey |
| **Agnes AI** | 95 | ~180M tokens/day | `AGNES_API_KEY` | https://agnes.ai/signup |
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
| **Ollama** | 60 | Unlimited local. `winget install Ollama.Ollama` |

### Bootstrap Fallback
| Provider | Quality | Notes |
|----------|---------|-------|
| **Pollinations** | 30 | No key. Emergency only. Rate-limited. |

### Paid (reference)
| Provider | Quality | Key Env |
|----------|---------|---------|
| Anthropic Claude | 100 | `ANTHROPIC_API_KEY` |
| OpenAI GPT-4o | 95 | `OPENAI_API_KEY` |

---

## Configuration

Stored in `.chode/` relative to project root:

```
.chode/
├── config.json              # Global config (provider keys)
├── checkpoint.json          # Last AI task state (for --resume)
├── work_queue_*.json        # Persistent multi-step project state
├── sessions/
│   └── default.json         # Message history (50 msgs)
└── monitor/
    ├── leaderboard.json     # Live provider scores
    ├── registry.json        # Endpoint drift detection
    └── usage.json           # Daily request/token/error counts
```

### Setting API Keys

```bash
# Fastest path (30 seconds):
node chode.js           # → Pick option 1 → Paste key
# Or manually:
chode auth groq gsk_xxx
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

Every AI call saves a checkpoint before execution. On crash or Ctrl+C:

```bash
chode ai --resume
# → Restores session, continues from where you left off
```

---

## Work Queue (Multi-Step Projects)

```bash
chode project "Build a URL shortener API with analytics"
# → Decomposes into steps, runs each with best provider
# → Saves progress after each step
# → Resume: chode project --resume proj_XXXXXX
```

---

## Installation

```bash
git clone <repo>
cd chode
node chode.js          # Interactive setup
# or
node chode.js scan     # Test providers
node chode.js ai "hello"  # Start AI session
```

**Requirements:** Node.js 18+, no other dependencies.

---

## Getting Started (Fastest Path)

```bash
# 1. One command
node chode.js

# 2. Pick option 1 (Groq) or 2 (Gemini)
#    Browser opens signup page

# 3. Sign up (30 seconds, no credit card)

# 4. Paste key
#    → Start using AI immediately
```

---

## Known Limitations

| Issue | Severity | Solution |
|-------|----------|----------|
| All cloud AI providers require keys in 2026 | High | Get one free key (Groq/Gemini) |
| Pollinations rate-limits aggressively | Medium | Use as emergency fallback only |
| HEMO mail sometimes unreachable | Low | Manual key setup via `chode auth` |
| Ollama requires local install | Low | `winget install Ollama.Ollama` |

---

## Phase 1 Complete ✅

- [x] Single-file architecture (zero external deps)
- [x] 10 real free-tier providers
- [x] Parallel routing (3 simultaneous)
- [x] Circuit breaker + rate limiting
- [x] Checkpoint recovery
- [x] Auto-provisioning on startup
- [x] Simple UX ("I'm OLDGREG")
- [x] Documentation (README + ROADMAP)
- [x] Package name: OLDGREG

---

*Self-healing. Never stops. Free tiers first.*
