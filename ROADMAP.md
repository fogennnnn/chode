# chode — Work Roadmap

Last updated: 2026-08-28 (Phase 1 complete)

---

## Phase 1: Resilience Core (DONE / IN PROGRESS)

### Completed (Phase 1)
- [x] Single-file architecture (zero external deps)
- [x] 33 provider registry with health probes
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
- [x] Optional OmniRoute gateway (11 free tiers via local proxy)
- [x] Parallel provider calls (3 at a time, batch-based)
- [x] Rate limit tracking per provider (429 detection, auto-backoff)
- [x] Usage statistics (requests, tokens, errors per provider per day)
- [x] `validateStoredKeys()` function for key validation
- [x] Documentation: README.md + ROADMAP.md

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

- [ ] **Background monitor improvements**
  - Log health events to file (not just stdout)
  - Alert on provider failures (optional webhook/email)
  - Daily health report generation
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

- [ ] **Background monitor improvements**
  - Log health events to file (not just stdout)
  - Alert on provider failures (optional webhook/email)
  - Daily health report generation

---

## Phase 3: Provider Ecosystem

### Planned
- [ ] **New provider registration**
  - `chode register <name> <endpoint> [--free|--paid]`
  - Auto-discover new free-tier endpoints
  - Community contributor support

- [ ] **OmniRoute decoupling**
  - Make OmniRoute purely optional (not required for core functionality)
  - Document offline mode: all no-auth providers work standalone
  - Health probe fallback when OmniRoute is unavailable

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

### Planned
- [ ] **Smart step decomposition**
  - LLM-assisted task breakdown (current: simple string split)
  - Dependency graph between steps
  - Parallel execution where possible

- [ ] **Result validation**
  - Auto-verify step outputs (syntax check, test run)
  - Flag low-quality AI responses
  - Regenerate failed steps automatically

- [ ] **Project templates**
  - `chode project template <type>` (web app, API, CLI tool, skill)
  - Pre-defined step sequences for common patterns
  - Community template marketplace

- [ ] **Integration hooks**
  - Git commit on project completion
  - Cloudflare deploy trigger
  - HEMO skill export

---

## Phase 5: Observability & Analytics

### Planned
- [ ] **Usage analytics**
  - `chode stats` show historical usage patterns
  - Top providers by success rate
  - Cost estimation (paid provider usage)

- [ ] **Performance benchmarking**
  - `chode bench` with standardized test suite
  - Leaderboard includes latency percentiles (p50, p95, p99)
  - Compare providers across multiple test types

- [ ] **Error reporting**
  - Aggregate error types across providers
  - Common failure patterns detection
  - Anonymous telemetry opt-in

---

## Phase 6: Distribution & Ecosystem

### Planned
- [ ] **npm package**
  - `npm install -g chode`
  - Update check via npm registry
  - Plugin system for custom providers

- [ ] **HEMO integration**
  - `chode new --skill` scaffolds HEMO-compatible skills
  - Skill marketplace discovery
  - `chode evolve` pulls latest from skill repos

- [ ] **Cross-platform support**
  - Windows-native scripts (currently PowerShell-wrapped)
  - macOS/Linux compatibility testing
  - Docker container option

---

## Known Issues / Limitations

| Issue | Severity | Workaround |
|-------|----------|------------|
| No working API keys in current env | High | Run `chode init` and add keys |
| Ollama not installed | Medium | Run `winget install Ollama.Ollama` |
| OmniRoute requires separate install | Low | Use no-auth providers directly |
| Batch sequential calls are slow | Medium | Phase 2 parallel calls |
| Some no-auth providers blocked by CORS | Medium | Use OmniRoute gateway |
| Leaderboard scores are cold (no real usage data yet) | Low | Run `chode scan` then `chode ai` multiple times |

---

## Weekly Targets

### Week 1 (CURRENT - COMPLETED)
- [x] Parallel provider calls implemented
- [x] Key validation function added
- [x] Rate limit tracking (429 detection)
- [x] Documentation complete (README + ROADMAP)

### Week 2
- [ ] Usage quota tracking
- [ ] Stale checkpoint cleanup
- [ ] Background monitor logging
- [ ] Graceful degradation modes

### Week 3
- [ ] Provider health prediction
- [ ] New provider registration CLI
- [ ] OmniRoute decoupling verified
- [ ] Key expiry detection

### Week 4
- [ ] Smart step decomposition
- [ ] Result validation
- [ ] Project templates
- [ ] Performance benchmarks

---

## File Map

```
chode.js              # Main CLI (single file, ~2800 lines)
README.md             # User documentation
ROADMAP.md            # This file
upgrade-production.js # Production resilience patch script
package.json          # Package metadata (name: OLDGREG)
AGENTS.md             # HEMO discipline banner
.chode/               # Runtime state directory
├── config.json
├── providers.json
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
1. Edit the `PROVIDERS` object in `chode.js`
2. Add endpoint URL, method, body template, headers, parse function
3. Run `chode scan` to verify
4. Submit PR with test results

---

*Last review: 2026-08-28 | Next review: 2026-09-04*
