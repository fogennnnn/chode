# chode

A CLI tool that scaffolds Cloudflare Workers and makes AI calls through a pool of providers with automatic fallback when one fails.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange.svg)](https://workers.cloudflare.com)

## Install

```bash
git clone https://github.com/fogennnnn/chode.git
cd chode
node chode.js init
```

## Commands

| Command | What it does |
|---|---|
| `node chode.js new <name>` | Scaffold a Cloudflare Worker |
| `node chode.js new <name> --skill` | Scaffold a HEMO skill |
| `node chode.js ai "prompt"` | One-shot AI call with auto-fallback |
| `node chode.js ai --resume` | Interactive session |
| `node chode.js scan` | Probe all providers, build leaderboard |
| `node chode.js monitor` | Background health checks every 30s |
| `node chode.js score` | Show current provider rankings |
| `node chode.js heal` | Force-rebuild leaderboard |
| `node chode.js deps [check|install]` | Check/install dependencies |
| `node chode.js project "<spec>"` | Multi-step project across providers |
| `node chode.js session [list\|show\|reset]` | Manage sessions |
| `node chode.js models` | List available AI providers |
| `node chode.js auth` | Connect free AI (OmniRoute one-click) |
| `node chode.js omniroute [start\|open\|install]` | Manage OmniRoute gateway |

## How it works

`chode ai` picks the best available provider from a live leaderboard. If a provider fails (rate limit, endpoint change, downtime), it retries up to 5 times with exponential backoff (1s → 2s → 4s → 8s → 16s). If all retries fail, it switches to the next ranked provider and continues. Session context is preserved across switches.

Session checkpoints are written to `.chode/sessions/` — if the terminal crashes, run `node chode.js ai --resume` to pick up where you left off.

## Providers

| Provider | Auth | Notes |
|---|---|---|
| Cloudflare AI | `CLOUDFLARE_API_KEY` | 1k req/day free |
| Anthropic | `ANTHROPIC_API_KEY` | Claude Sonnet 4 |
| OpenAI | `OPENAI_API_KEY` | GPT-4o-mini |
| Ollama | `OLLAMA_URL` | Local, offline |
| DeepSeek | API key | Generous free tier |
| Groq | API key | 14.4K req/day |
| Cerebras | API key | 1M tokens/day |
| NVIDIA NIM | API key | 40 RPM forever |
| Scaleway | API key | 1M tokens |
| Kiro (Claude) | AWS Builder ID | Via OmniRoute |
| Qoder (Kimi) | Google OAuth | Via OmniRoute |
| LongCat | None | 50M tokens/day |
| Qwen | Device code | Unlimited |
| Gemini CLI | Google OAuth | 180K/month |

Zero-api-key providers (LongCat, Qwen) work immediately. For the rest, run `node chode.js auth` and click the links.

## OmniRoute

A local gateway that connects to 11 providers without individual API keys. Set up once, use everywhere:

```bash
node chode.js omniroute install   # npm install -g omniroute
node chode.js omniroute start     # runs at localhost:20128
node chode.js omniroute open      # opens dashboard in browser
```

## Scaffolding

`node chode.js new <name>` creates a Cloudflare Worker project with:

- secz6 glass layout (frosted glass, animated gradient, scroll-aware logo)
- boundaries-bg animation (Conway's Game of Life + tentacles, centered on the logo)
- HEMO doctrine banner
- `wrangler.toml`, `package.json`, deploy assets

## License

MIT
