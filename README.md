# chode — The Self-Healing Coding Harness

**Free tiers. HEMO auto-provisioning. Zero lock-in.**

A single-file Node.js CLI that routes AI requests across 10 real free-tier providers with automatic key provisioning via HEMO mail. Never stops.

---

## Architecture

```
chode.js (single file, zero runtime deps)
├── Provider Registry (10 real free-tier endpoints)
├── Health Scanner (live probes every 30s)
├── Leaderboard (weighted scoring: quality + reliability + latency + recency)
├── Circuit Breaker (auto-failover on 3 consecutive failures)
├── Parallel Router (3 providers simultaneously per batch)
├── Rate Limit Tracker (429 detection, auto-backoff)
├── Work Queue (persistent multi-step project state)
├── Checkpoint Recovery (crash-resume any task)
├── Session Manager (50-message context windows)
└── HEMO Key Provisioning (auto-request free-tier keys via HEMO mail)
```

### Core Loops

| Loop | Interval | Purpose |
|------|----------|---------|
| `scan` | On-demand | Full probe of all 10 providers |
| `monitor` | 30s | Background re-scan, focus on failed providers |
| `circuit_breaker` | Instant | Open after 3 failures, cooldown 2min |
| `checkpoint` | Per-call | Save progress before every AI call |
| `leaderboard` | Per-scan | Re-rank: quality(35%) + reliability(30%) + latency(20%) + recency(15%) |
| `parallel_router` | Per-call | Try 3 providers simultaneously, take first success |

### How It Works

```
User: "Write a binary search"
  │
  ├─► Load leaderboard (latest scan scores)
  ├─► Filter viable providers (has key OR no key, circuit closed, not rate-limited)
  ├─► Send prompt to top 3 providers IN PARALLEL
  ├─► First response wins → return it
  ├─► On failure → record error, open circuit breaker, try next batch
  ├─► On 429 → record rate limit, back off that provider
  └─► Save checkpoint → survives crashes
```

### Key Provisioning (HEMO)

When no provider keys are configured:
1. `chode ai` shows signup URLs for each free tier
2. `chode provision` sends key requests via HEMO mail
3. HEMO agent identity created automatically via HELIOS
4. Keys arrive in HEMO mail inbox within minutes
5. Run `chode auth` to confirm receipt, then `chode ai` works

---

## Commands

### AI & Projects
```
chode ai "prompt"                          AI call with parallel auto-fallback routing
chode ai --resume                          Resume from last checkpoint
chode ai --force <provider>                Force specific provider
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

### Keys & Provisioning
```
chode auth                                 View/set API keys
chode provision                            Auto-request free-tier keys via HEMO mail
chode models                               List all registered providers
```

### Project Scaffolding
```
chode new <name>                           Scaffold a Cloudflare Worker
chode new <name> --skill <slug>            Scaffold a HEMO skill
chode deps [check|install|update]          Manage dependencies
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

## Provider Registry (10 Real Free Tiers)

| Provider | Quality | Free Tier | Key | Signup |
|----------|---------|-----------|-----|--------|
| **Groq** | 92 | 14,400 req/day, 6K tok/min | `GROQ_API_KEY` | https://console.groq.com/keys |
| **Google Gemini** | 94 | 1,500 req/day, 60 req/min | `GEMINI_API_KEY` | https://aistudio.google.com/app/apikey |
| **Cerebras** | 90 | 1M tokens/day, 30 req/min | `CEREBRAS_API_KEY` | https://cloud.cerebras.ai/ |
| **DeepSeek** | 89 | Generous free tier | `DEEPSEEK_API_KEY` | https://platform.deepseek.com/ |
| **Mistral** | 88 | 1B tokens/month | `MISTRAL_API_KEY` | https://console.mistral.ai/ |
| **OpenRouter** | 85 | 50 req/day free | `OPENROUTER_API_KEY` | https://openrouter.ai/keys |
| **NVIDIA NIM** | 86 | 40 req/min, phone verify | `NVIDIA_API_KEY` | https://build.nvidia.com/ |
| **Cloudflare AI** | 72 | 10K neurons/day | `CLOUDFLARE_API_KEY` | https://dash.cloudflare.com/ai |
| **Cohere** | 80 | Non-commercial only | `COHERE_API_KEY` | https://dashboard.cohere.com/ |
| **Ollama** | 60 | Unlimited (local) | None | winget install Ollama.Ollama |

Plus 2 paid providers for reference: Anthropic Claude, OpenAI GPT-4o-mini.

**Total free capacity: ~15M+ tokens/day across all providers.**

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
# Option 1: Get free key, then set it
chode provision              # Auto-request via HEMO mail
# Check HEMO mail, copy key
chode auth groq [your-key]   # Set the key

# Option 2: Direct environment variable
GROQ_API_KEY=gsk_xxx node chode.js ai "hello"

# Option 3: Interactive setup
chode init                   # Creates HEMO agent, guides through key setup
```

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

On crash or Ctrl+C, `chode ai` auto-resumes from the last checkpoint. Projects save after each step.

---

## Work Queue (Multi-Step Projects)

```bash
# Decompose and run
chode project "Build a URL shortener API with analytics"

# Resume interrupted project
chode project --resume proj_1724880000000
```

Each project creates a `work_queue_*.json` file with steps, results, and completion status. Failed steps can be retried individually.

---

## Drift Detection

Endpoints are hashed and compared against stored registry. When an endpoint URL changes:

```
~  Drift: Groq endpoint updated (https://api.groq.com/... -> https://new.groq.com/...)
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
| Registered providers | 12 (10 free-tier + 2 paid) |
| OmniRoute dependency | Removed |
| Pollinations | Not included (per user request) |
| Circuit breaker threshold | 3 consecutive failures |
| Circuit breaker cooldown | 120 seconds |
| Parallel provider calls | 3 simultaneous per batch |
| Monitor interval | 30 seconds |
| Session context | 50 messages |
| Checkpoint interval | Per-call |
| Rate limit tracking | 429 auto-detection + backoff |
| HEMO auto-provisioning | Yes (via HEMO mail) |
| Usage stats | Per-provider daily counters |

---

## Known Limitations

| Issue | Severity | Solution |
|-------|----------|----------|
| No working API keys in current env | High | Run `chode provision` or add keys manually |
| Ollama not installed | Medium | Run `winget install Ollama.Ollama` |
| HEMO mail unreachable | Medium | Requires HEMO infrastructure |
| Some providers require phone verify | Low | NVIDIA NIM needs phone number |
| Free tiers have daily quotas | Info | Router tracks usage, switches providers |

---

## Planned Roadmap

See [ROADMAP.md](./ROADMAP.md) for detailed planning.

**Quick summary of completed work:**
- [x] Single-file architecture (zero external deps)
- [x] 10 real free-tier providers (no OmniRoute)
- [x] Parallel provider calls (3 simultaneous)
- [x] Rate limit tracking (429 detection)
- [x] Circuit breaker pattern
- [x] Work queue persistence
- [x] Checkpoint recovery
- [x] HEMO auto-provisioning
- [x] Documentation (README + ROADMAP)

---

*Self-healing. Never stops. Free tiers first.*
