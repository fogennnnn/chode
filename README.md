# chode

> The self-healing coding harness. Never stops.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange.svg)](https://workers.cloudflare.com)

**chode** is the world's first coding harness that *actually never stops*. While other tools give up when an API key expires, a rate limit hits, or a provider changes their endpoint — chode silently switches to the next working provider, preserves your conversation context, and keeps going. No "continue" needed.

## Why this exists

Every developer has been there: you're 47 steps into a complex task, your free-tier quota just depleted, and your AI tool hands you a dead end. You stare at the cursor. You type "continue." Nothing happens. You try a different provider. Same dead end.

**chode solves this by never trusting a single provider.**

It probes 14 free-tier AI endpoints every 30 seconds, builds a live reputation score, and routes your work to whatever is actually working *right now*. When one provider dies, it's already forgotten. Your session keeps moving.

## What makes it different

### Never-Stop Guarantee

```
chode ai "build me a worker that does X"
```

If the top-ranked provider hits a rate limit, chode:
1. Retries up to 5 times with exponential backoff (1s → 2s → 4s → 8s → 16s)
2. Silently switches to the next best provider
3. Preserves your full conversation history
4. Continues as if nothing happened

You never see a 429. You never type "continue." You just keep working.

### Live Provider Intelligence

```
chode scan     # probes all 14 providers, builds live leaderboard
chode monitor  # background health checks every 30 seconds
chode score    # see who's fastest and most reliable right now
```

Providers are scored on quality × reliability × speed × recency. The ranking updates constantly — so chode always knows which provider to use, even mid-session.

### Endpoint Drift Detection

When a provider changes their API endpoint (happens more often than you'd think), chode detects it automatically:

```
~  Drift detected: Groq endpoint updated
   Old: https://api.groq.com/openai/v1/...
   New: https://api.groq.com/openai/v2/...
   Registry auto-updated.
```

No config changes. No broken sessions. It just works.

### Checkpoint Recovery

Crash your terminal? Run `chode ai --resume` and pick up exactly where you left off. Every response is checkpointed to disk.

## Quick Start

```bash
# Install
git clone https://github.com/fogennnnn/chode.git
cd chode
node chode.js init

# Discover what's working
node chode.js scan

# Start an AI session (auto-routes to best provider)
node chode.js ai "write a Cloudflare Worker that returns JSON with current time"

# Or interactive mode with AFK detection
node chode.js ai --resume
```

## Commands

| Command | What it does |
|---|---|
| `chode new <name>` | Scaffold a Cloudflare Worker (secz6 glass layout) |
| `chode new <name> --skill` | Scaffold a HEMO skill |
| `chode ai "prompt"` | One-shot AI call with auto-fallback |
| `chode ai --resume` | Interactive session (survives crashes) |
| `chode scan` | Probe all providers, build leaderboard |
| `chode monitor` | Background health monitoring |
| `chode score` | Show current provider rankings |
| `chode heal` | Force-rebuild leaderboard |
| `chode deps` | Check/install/update dependencies |
| `chode project "<spec>"` | Multi-step project across providers |

## The Provider Pool

chode routes to these providers in quality order:

| Tier | Provider | Auth | Free Tier |
|---|---|---|---|
| **Paid** | Claude Sonnet 4 | API key | — |
| **Paid** | GPT-4o-mini | API key | — |
| **Free** | Cloudflare AI | API key | 1k req/day |
| **Free** | Ollama | Local | Unlimited |
| **Free** | DeepSeek | API key | Generous |
| **Free** | Groq | API key | 14.4K req/day |
| **Free** | Cerebras | API key | 1M tokens/day |
| **Free** | NVIDIA NIM | API key | 40 RPM forever |
| **Free** | Scaleway | API key | 1M tokens |
| **Omni** | Kiro (Claude) | AWS Builder ID | Unlimited |
| **Omni** | Qoder (Kimi) | Google OAuth | Unlimited |
| **Omni** | LongCat | None | 50M tokens/day |
| **Omni** | Qwen | Device code | Unlimited |
| **Omni** | Gemini CLI | Google OAuth | 180K/month |

**No API keys needed?** Use `chode omniroute start` to run the local gateway, then connect providers by clicking links in the dashboard. LongCat and Qwen work with zero setup.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    chode CLI                         │
│                                                      │
│  chode ai ──► callWithBestProvider()                │
│               │                                      │
│               ├─► Load Leaderboard (live scores)     │
│               ├─► Filter viable providers            │
│               ├─► retry(fn, 5x, exponential backoff)│
│               │       │                              │
│               │       ├─► Success → return result   │
│               │       └─► Fail → switch provider    │
│               │              checkpoint saved        │
│               └─► All failed → log & exit           │
│                                                      │
│  chode scan ─► runFullScan() ──► Leaderboard        │
│  chode monitor ─► setInterval(30s) ──► re-rank     │
└─────────────────────────────────────────────────────┘
```

## Dependencies

- **Node.js 18+**
- **wrangler** (for dev/deploy) — auto-installed
- **npm** — for package management
- **omniroute** (optional) — for 11 free providers via local gateway

Run `chode deps` to check. Run `chode deps install` to fix.

## Philosophy

> "The best error handling is the one that happens before the user notices there was an error."

chode is built on three principles:

1. **Never expose failure to the user.** If a provider throttles, switch silently. If an endpoint changes, update the registry. If the terminal crashes, resume the session.
2. **Measure everything.** Every provider is scored on quality, reliability, latency, and recency. Decisions are data-driven, not hopeful.
3. **Work offline-first.** The harness works without any cloud services. API keys are optional. Free tiers are the default.

## License

MIT — build something great.

---

*Built for the HEMO economy. The conglomerate is watching.*
