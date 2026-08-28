# chode — Work Roadmap

Last updated: 2026-08-28 (Phase 1 Complete)

---

## Phase 1: Resilience Core ✅ COMPLETE

### Completed
- [x] Single-file architecture (zero external deps)
- [x] 10 real free-tier providers (no OmniRoute dependency)
- [x] Leaderboard scoring (quality + reliability + latency + recency)
- [x] Exponential backoff retry (5 attempts, 1s-8s delays)
- [x] Checkpoint recovery (save before every call, resume on restart)
- [x] Session management (50-message context windows)
- [x] Endpoint drift detection (hash comparison, auto-update)
- [x] Circuit breaker pattern (3 failures, 2min cooldown)
- [x] Work queue persistence (multi-step projects with resume)
- [x] `chode status` dashboard command
- [x] `chode project` multi-provider orchestration
- [x] `chode auth` key management
- [x] `chode provision` free-tier key discovery
- [x] Parallel provider calls (3 at a time, batch-based)
- [x] Rate limit tracking per provider (429 detection, auto-backoff)
- [x] Usage statistics (requests, tokens, errors per provider per day)
- [x] Bootstrap fallback (Pollinations when no keys configured)
- [x] HEMO auto-provisioning (with graceful fallback)
- [x] Documentation: README.md + ROADMAP.md
- [x] Package name: OLDGREG (chode taken on npm)

---

## Phase 2: Week-Long Autonomous Operation

- [ ] **Usage quota tracking**
  - Track tokens/requests per provider per day
  - Alert when approaching provider limits
  - Auto-throttle known rate-limited providers

- [ ] **Provider health prediction**
  - Learn peak failure times per provider
  - Avoid scheduling critical tasks during known outage windows
  - Predictive circuit breaker extensions

- [ ] **Stale checkpoint cleanup**
  - Auto-expire checkpoints older than 24h
  - Clean up abandoned work queues
  - Storage growth monitoring

- [ ] **Graceful degradation modes**
  - `strict`: only use providers with >80% reliability
  - `balanced`: include all working providers
  - `aggressive`: try even unknown/low-score providers
  - Configurable via `chode config set mode=...`

---

## Phase 3: Provider Ecosystem

- [ ] **New provider registration**
  - `chode register <name> <endpoint> [--free|--paid]`
  - Auto-discover new free-tier endpoints
  - Community contributor support

- [ ] **Key validation improvements**
  - Lightweight key test on `chode auth` (not just store)
  - Show remaining quota for providers that expose it
  - Detect and warn about expiring keys

- [ ] **Local model support**
  - Ollama auto-detection and model listing
  - `chode ai --local` force local-only path
  - Model quantization awareness (GGUF vs GGML)

---

## Phase 4: Project Intelligence

- [ ] **Smart step decomposition**
  - LLM-assisted task breakdown
  - Dependency graph between steps
  - Parallel execution where possible

- [ ] **Result validation**
  - Auto-verify step outputs (syntax check, test run)
  - Flag low-quality AI responses
  - Regenerate failed steps automatically

---

## Phase 5: Distribution

- [ ] **npm package**
  - `npm install -g OLDGREG`
  - Update check via npm registry

- [ ] **Cross-platform support**
  - Windows/macOS/Linux compatibility testing
  - Docker container option

---

## Current Provider Status

| Provider | Category | Free Tier | Status |
|----------|----------|-----------|--------|
| Groq | free_tier | 14.4K req/day | ✅ Works with key |
| Google Gemini | free_tier | 1.5K req/day | ✅ Works with key |
| Cerebras | free_tier | 1M tokens/day | ✅ Works with key |
| DeepSeek | free_tier | Generous | ✅ Works with key |
| Mistral | free_tier | 1B tokens/month | ✅ Works with key |
| OpenRouter | free_tier | 50 req/day | ✅ Works with key |
| NVIDIA NIM | free_tier | 40 req/min | ✅ Works with key |
| Cloudflare AI | free_tier | 10K neurons/day | ✅ Works with key |
| Cohere | free_tier | Non-commercial | ✅ Works with key |
| Ollama | free_local | Unlimited | ⚠️ Requires local install |
| Pollinations | bootstrap | No key | ⚠️ Rate-limited, emergency only |
| Anthropic Claude | paid | N/A | ⚠️ Requires paid key |
| OpenAI GPT-4o | paid | N/A | ⚠️ Requires paid key |

---

## File Map

```
chode.js              # Main CLI (single file, ~1350 lines)
README.md             # User documentation
ROADMAP.md            # This file
package.json          # Package metadata (name: OLDGREG)
AGENTS.md             # HEMO doctrine banner
.chode/               # Runtime state directory
├── config.json
├── checkpoint.json
├── work_queue_*.json
├── sessions/
│   └── default.json
└── monitor/
    ├── leaderboard.json
    ├── registry.json
    └── usage.json
```

---

## Contributing

To add a new provider:
1. Add entry to `PROVIDERS` object in `chode.js`
2. Include: name, category, requiresKey, qualityScore, signupUrl, freeTier, endpoints
3. Run `node chode.js scan` to verify
4. Submit PR with test results

---

*Last review: 2026-08-28 | Next review: 2026-09-04*
