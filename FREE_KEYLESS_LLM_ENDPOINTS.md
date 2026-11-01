# Free Keyless LLM Endpoints — verified 2026-11-01

Live-tested from this machine (plain HTTP, zero auth headers) on 2026-11-01. Community research cross-checked against actual public code (tgpt, gpt4free, freellmpool) and the 2026 live-tracker crowd (mnfst/awesome-free-llm-apis, 0xzr/freellmpool, stillworks.supercapybara.com).

## Tier 1 — OpenAI-compatible chat, zero credentials ✅ verified today

### 1. OVHcloud AI Endpoints — best overall (best models, keyless, EU)
`POST https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions` — no auth header at all.
- Chat models (all keyless): `gpt-oss-120b` (131k ctx), `gpt-oss-20b`, `Meta-Llama-3_3-70B-Instruct` (131k), `Qwen3.5-397B-A17B` (256k), `Qwen3.6-27B`, `Qwen3.8-27B`, `Qwen3.5-9B`, `Mistral-Small-3.2-24B-Instruct-2506`, `Mistral-Nemo-Instruct-2407`
- Vision: `Qwen2.5-VL-72B-Instruct` · Guard: `Qwen3Guard-Gen-8B/0.6B`
- Extras: embeddings (`bge-m3`, `Qwen3-Embedding-8B`), TTS (`nvr-tts-*`), STT (`whisper-large-v3[-turbo]`), images (`stable-diffusion-xl-base-v10`)
- List: `GET /v1/models` (keyless)
- Limits: **2 req/min per IP per model** anonymous → round-robin across models to multiply throughput. 429 after.
- Also supports OpenAI-style `model` values like `Qwen3.5-397B-A17B` directly (virtual-model aliases like `qwen@latest` exist too per docs).

```bash
curl -X POST https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{"model":"gpt-oss-120b","messages":[{"role":"user","content":"Say OK"}]}'
```

### 2. Pollinations.ai — keyless classic, geo-varies
- Simple GET: `https://text.pollinations.ai/Say%20OK` → plain text (verified)
- OpenAI-compat: `POST https://text.pollinations.ai/openai` body `{"model":"openai-fast","messages":[...]}` → `openai-fast` = **GPT-OSS 20B** with reasoning + tool calling (verified)
- New gateway: `POST https://gen.pollinations.ai/v1/chat/completions` with `model:"openai"` alias works anonymously (verified 200); explicit ids like `gpt-5.4-nano` 401 anonymously — use `openai` alias
- Images: `https://image.pollinations.ai/prompt/{prompt}?width=&height=` (keyless, 1/45s)
- Limits: **1 req / 30s per IP** (402 + `Retry-After` if exceeded). Anonymous tier = legacy; only the anonymous tier (`openai-fast`, alias `openai`) survives reliably.

### 3. LLM7.io — keyless "turbo" tier
`POST https://api.llm7.io/v1/chat/completions` — no header (docs bless literal `Authorization: Bearer unused`).
- Anonymous-accessible ids (live `GET /v1/models`, `tier:"turbo"`): `codestral-latest` (32k, tools; verified 200), `gpt-oss:20b` (128k), `mistral-Nemo-Instruct-2407` (128k), `nemotron-3-nano:30b` (**1M ctx**; verified 200)
- Limits: 1 concurrent request per IP (parallel calls 429 in ~10s). Several listed models 400 `model_unavailable` — catalog rotates; query `/models` for live set.
- Optional free token (token.llm7.io, email) lifts to 60 RPM / 1 RPS / 250 req/hr for everything else in the list.

### 4. Kilo Gateway — highest request cap
`POST https://ai-gateway.kilo.ai/api/v1/chat/completions` — no header. `GET /api/v1/models` open.
- Use `kilo-auto/free` (auto-router; verified 200, routed to `stealth/glyph-cluster`) or any `:free` id from the models list — ~13 free entries incl. `nvidia/nemotron-3-ultra-550b-a55b:free` (1M ctx), `nvidia/nemotron-3.5-lightning:free`, `x-ai/grok-code-fast-1:free`, `minimax/minimax-m2.5:free` (per community research; catalog rotates)
- Limits: **200 req/hr per IP** anonymous. Free pool occasionally returns empty content w/ 200 — emulate streaming. Some backends log prompts.

## Tier 2 — keyless but scrape-style / special formats ✅/⚠️

### 5. binjie (Yqcloud) — the classic proxy
`POST https://api.binjie.fun/api/generateStream` — browser-ish headers:
`Origin: https://chat18.aichatos.xyz` + `Referer: https://chat18.aichatos.xyz/` + random `userId`
Body: `{"prompt":"hi","userId":"test","network":false,"system":"","withoutContext":false,"stream":false}` → plain text (verified "OK"). Marketed gpt-4, actually a mid-size model behind a proxy. Unstable, Chinese operator.

### 6. Aitopia extension API
`POST https://extensions.aitopia.ai/ai/send` body `{"userInput":"hi","category":"chat","isPokegpt":false}` + `Origin: https://aitopia.ai` → SSE chat deltas. Verified: **guests = 1 req/min** (rate-limit msg proves functional).

### 7. AI Horde — crowdsourced queue (async)
- `POST https://aihorde.net/api/v2/generate/text/async` header `apikey: 0000000000` (anonymous, no signup) + `Client-Agent: name:1.0:contact` → 202 job id → poll `GET /api/v2/generate/text/status/{id}` (verified end-to-end, got completion from a 7B koboldcpp model)
- No more throughput trick: `oai.aihorde.net/v1/chat/completions` now rejects the documented shared key ("register"). Anonymous pool = slow (minutes) & small models. Text-worker availability varies by hour.
- Heartbeat: `GET https://aihorde.net/api/v2/status/heartbeat`

### 8. Any public KoboldAI/Gradio Hugging Face Space
e.g. `POST https://koboldai-koboldcpp-tiefighter.hf.space/api/extra/generate/stream` body `{"prompt":"hi","max_length":20,"max_context_length":100}` → token SSE (verified 200). Free but per-space limits, cold boots, model quality is whatever the host runs.

### 9. Duck.ai (DuckDuckGo) — no account, but JS challenge
- `GET https://duckduckgo.com/duckchat/v1/models` — keyless 200 (verified today): `gpt-6-luna`, `gpt-5.4-mini`, `claude-haiku-4-5`, `mistral-small-2603`, `tinfoil/gpt-oss-120b`, `tinfoil/gemma4-31b`
- Chat flow: `GET /duckchat/v1/status` with `x-vqd-accept: 1` → take `x-vqd-4` resp header → `POST /duckchat/v1/chat` with `x-vqd-4` (+ now an `x-vqd-hash-1` JS challenge; empty string worked for some clients). Requires browser UA, HTTP/2, token rotation. Fragile; region/UA dependent (our plain probe got no vqd).

### 10. isou.chat (AI search w/ citations)
`POST https://isou.chat/api/chat` (from tgpt source):
```json
{"model":"gpt-5.4-mini","provider":"openai","language":"all","categories":["general"],"engine":"SEARXNG","messages":[{"role":"user","content":"hi"}]}
```
Headers: Firefox UA, `Referer: https://isou.chat/chat`, `Origin: https://isou.chat`, `Accept: text/event-stream`. Handler alive (4xx payload probes); stream unconfirmed in our tests.

## Tier 3 — helpers & meta-tools

- **Jina Reader**: `GET https://r.jina.ai/{url}` — keyless LLM-ish markdown reader/summarizer, rate-limited (not a general chat API).
- **freellmpool** (`pip install freellmpool`, github.com/0xzr/freellmpool): self-hosted OpenAI endpoint with failover over Pollinations/OVH/Kilo/LLM7 — exactly these keyless providers, maintained (updated Oct 29 2026).
- **g4f (self-hosted)**: `pip install -U g4f[all]` runs a local OpenAI-compat server using community no-auth providers (Pollinations, DDG, binjie…). Public instance g4f.space now demands PoW "cake" credits (402).
- **KeylessAI worker** (https://keylessai.thryx.workers.dev/v1): community Cloudflare-Worker failover over Pollinations + api.airforce anonym tiers. Single-owner proxy — it sees all prompts, zero SLA.
- **Puter.js**: `puter.ai.chat(...)` in webpage JS — no dev key (end-user popup). Browser-only.
- **Hugging Face chat Spaces via gradio_client**: free, keyless, per-space limits.

## Negative results (dead or now keyed — don't chase)

| Endpoint | Status 2026 |
|---|---|
| api.airforce | needs free-signup key (g4f docs outdated) |
| ai.hackclub.com | 404 (Hack Club member-gated) |
| playground.ai.cloudflare.com/api/inference | 404 |
| api.deepinfra.com | 401 (must pre-pay) |
| router.huggingface.co | 401 |
| integrate.api.nvidia.com | 401 (free account + phone verification) |
| api.groq.com | 401 |
| api.chutes.ai | 401 (free tier ended) |
| lmarena.ai/api/chat | 403 route not allowed |
| fx.sh/fx-wasm gateway | 401 |
| g4f.space anonymous | 402 (PoW credits) |
| deepsearch.jina.ai / s.jina.ai | 401 |
| Duck.ai chat (naive) | no vqd / 418 challenge dance |
| opencode.ai/zen/v1 | free only inside OpenCode client (FreeUsageLimitError); tgpt ships key `public` |
| oai.aihorde.net | requires registered horde key |

## Reality check

- The 2026 trackers' finding holds: of "keyless-claimed" lists, only OVH / Pollinations / LLM7 / Kilo / AI Horde actually answered a chat completion with zero auth — most lists are stale counts of `/models` endpoints that 401 the chat call. Treat `/models` 200 ≠ chat 200.
- Rate limits are per-IP: behind shared IPs everything degrades. Round-robin OVH models for ~16 rpm total; Kilo for 200 hr.
- Expect model churn weekly: catalog-style endpoints (LLM7, Kilo, Pollinations) rotate ids; always fetch `/models` first. Fundamentals that don't rotate: OVH, Pollinations.

## Chode integration status (2026-11-01)

Integrated into chode (shipped 1.9.45): Kilo replaced its dead legacy gateway with the working base https://ai-gateway.kilo.ai/api/v1/chat/completions; OVHcloud gained gpt-oss-120b and Qwen3.5-397B-A17B (256k); LLM7 gained codestral-latest and nemotron-3-nano:30b (1M ctx); dead uncloseai (401 public_beta_closed) was removed from the registry, chips, and docs.

Verified keyless but NOT integrated (engine protocol limits - chode supports OpenAI-JSON, OpenAI-SSE, or GET-only endpoints): binjie (plain-text response), aitopia + isou + Kobold HF space (custom SSE frame shapes), AI Horde (two-phase async submit/poll). Duck.ai chat is gated behind an x-vqd-4/x-vqd-hash-1 challenge dance and stays skipped. Pollinations remains structurally retired by provider-policy.

