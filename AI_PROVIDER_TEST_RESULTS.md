# AI Provider No-Auth Testing Results

## WORKING PROVIDERS (No Authentication Required)

### 1. POLLINATIONS.AI - The ONLY fully working no-auth provider
All endpoints return AI-generated text without any API key.

| Endpoint | Method | Status | Response |
|----------|--------|--------|----------|
| `https://text.pollinations.ai/` | GET | **200** | AI chat response |
| `https://text.pollinations.ai/chat` | GET | **200** | AI chat response |
| `https://text.pollinations.ai/api/` | GET | **200** | AI chat response |
| `https://text.pollinations.ai/generate` | GET | **200** | AI chat response |
| `https://text.pollinations.ai/openai/v1/chat/completions` | POST | **200** | **OpenAI-compatible** chat completion JSON |
| `https://text.pollinations.ai/v1/chat/completions` | POST | **200** | **OpenAI-compatible** chat completion JSON |
| `https://text.pollinations.ai/openai/v1/models` | GET | **200** | AI info about OpenAI models |
| `https://text.pollinations.ai/v1/models` | GET | **200** | AI info about models |
| `https://text.pollinations.ai/speak` | GET | **200** | AI chat response |
| `https://text.pollinations.ai/write` | GET | **200** | AI chat response |
| `https://text.pollinations.ai/code` | GET | **200** | AI chat response |
| `https://text.pollinations.ai/joke` | GET | **200** | AI-generated joke |
| `https://text.pollinations.ai/help` | GET | **200** | AI chat response |
| `https://text.pollinations.ai/health` | GET | **200** | AI chat response |
| `https://image.pollinations.ai/prompt/{prompt}` | GET | **200** | Returns actual image (binary) |
| `https://audio.pollinations.ai/` | GET | **200** | AI chat response |

**Key Finding:** `text.pollinations.ai/openai/v1/chat/completions` accepts standard OpenAI format:
```json
POST https://text.pollinations.ai/openai/v1/chat/completions
Content-Type: application/json
(no auth headers needed)

{
  "model": "openai",
  "messages": [{"role": "user", "content": "hi"}]
}

Response (200):
{
  "id": "pllns_xxx",
  "choices": [{"index": 0, "message": {"role": "assistant", "content": "Hey there! ..."}}],
  "model": "gpt-oss-20b",
  "object": "chat.completion",
  "usage": {"prompt_tokens": 309, "completion_tokens": 47, "total_tokens": 356},
  "user_tier": "anonymous"
}
```

**Note:** Some endpoints like `/seed`, `/summarize`, `/translate`, `/explain`, `/math`, `/science`, `/history`, `/philosophy`, `/creative`, `/brainteaser` are rate-limited (429) with "Queue full" errors.

---

## NON-WORKING PROVIDERS (All Require Authentication)

### OpenAI
| Endpoint | Status | Response |
|----------|--------|----------|
| `api.openai.com/v1/chat/completions` | 401 | "You didn't provide an API key" |
| `api.openai.com/v1/models` (no key) | 401 | "You didn't provide an API key" |
| `api.openai.com/v1/models` (empty Bearer) | 401 | "Incorrect API key provided: ''" |
| `api.openai.com/v1/models` (empty x-api-key) | 401 | "Missing bearer authentication" |

### Anthropic
| Endpoint | Status | Response |
|----------|--------|----------|
| `api.anthropic.com/v1/messages` | 401 | "x-api-key header is required" |
| `api.anthropic.com/v1/models` | 401 | "x-api-key header is required" |

### DeepSeek
| Endpoint | Status | Response |
|----------|--------|----------|
| `api.deepseek.com/v1/chat/completions` | 401 | "Authentication Fails (governor)" |
| `api.deepseek.com/chat/completions` | 401 | "Authentication Fails (governor)" |

### OpenRouter
| Endpoint | Status | Response |
|----------|--------|----------|
| `openrouter.ai/api/v1/chat/completions` (free/* models) | 401 | "No cookie auth credentials found" |
| `openrouter.ai/api/v1/chat/completions` (no model) | 401 | "No cookie auth credentials found" |
| `openrouter.ai/api/v1/models` | 000 | Connection failed |

### Perplexity
| Endpoint | Status | Response |
|----------|--------|----------|
| `api.perplexity.ai/chat/completions` | 401 | "Invalid API key provided" |

### Groq
| Endpoint | Status | Response |
|----------|--------|----------|
| `api.groq.com/openai/v1/chat/completions` | 401 | "Invalid API Key" |
| `console.groq.com/v1/chat/completions` | 404 | Page not found |

### HuggingFace
| Endpoint | Status | Response |
|----------|--------|----------|
| `api-inference.huggingface.co/models/...` | 000 | Connection failed |

### Proxies (All Failed)
| Endpoint | Status | Response |
|----------|--------|----------|
| `api.allorigins.win/raw?url=...` | 200 | Empty body |
| `corsproxy.io/?url=...` | 403 | "Anonymous legacy proxy URLs no longer supported" |
| `api.codetabs.com/v1/proxy?...` | 000 | Connection failed |
| `thingproxy.freeboard.io/fetch/...` | 000 | Connection failed |

### Other Major Providers (All Require API Keys)
| Provider | Status | Notes |
|----------|--------|-------|
| Fireworks AI | 404 | Path not found |
| Together AI | 401 | Missing API key |
| AI21 Studio | 401 | API key required |
| Mistral AI | 401 | Invalid API Key |
| Cohere | 401 | no api key supplied |
| Replicate | 401 | Unauthenticated |
| DeepInfra | 401 | missing API key |
| Jina AI | 401 | AUTH_MISSING_API_KEY |
| 302.ai | 401 | Missing 302 Apikey |
| ChatAnyWhere | 401 | wrong api key |
| Moonshot AI | 401 | Incorrect API key |
| xAI/Grok | 000 | Connection failed |
| X.AI API | 400 | Model not found |
| Bard/Gemini | 404 | Not found |
| Poe.com | 400 | Bad Request |
| Chat.qwen.ai | 504 | Gateway timeout |
| Dify AI | 400 | Bad or missing authentication |

### Proxy/OpenAI-Compatible Services (All Failed)
| Endpoint | Status |
|----------|--------|
| `api.openai-proxy.com` | 000 |
| `api.openai-proxy.org` | 401 |
| `api.openai-proxy.io` | 000 |
| `api.gpt4free.org` | 000 |
| `api.gptr.dev` | 000 |
| `api.fakeopen.com` | 000 |
| `api.chatbot.ai` | 000 |
| `api.gpt-proxy.com` | 000 |

---

## SUMMARY

**Total endpoints tested: ~100+**
**Total providers tested: ~50+**

### WORKS (No Auth): 1 provider
1. **Pollinations.ai** - `https://text.pollinations.ai/openai/v1/chat/completions`
   - Fully OpenAI-compatible API format
   - No authentication required
   - Model: `gpt-oss-20b` (open source reasoning model)
   - Also works for GET requests on multiple paths
   - Image generation at `https://image.pollinations.ai/prompt/{prompt}`

### REQUIRES API KEY: All other providers
Every major AI provider (OpenAI, Anthropic, DeepSeek, OpenRouter, Groq, Perplexity, Mistral, Cohere, Fireworks, Together, etc.) requires authentication. No bypass was found.

### Browser/API combinations tested:
- All CORS proxies: Either blocked, rate-limited, or return empty
- All direct API attempts: Return 401/403
- All "free tier" claims: Require registration/API key
- All Chinese providers (DeepSeek, Moonshot, etc.): Require keys
