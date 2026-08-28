const https = require('https');
const http = require('http');
const fs = require('fs');

// Additional endpoints from awesome-ai research - some are known truly no-auth
const extraTests = [
  // Ollama local (standard endpoint, no auth needed)
  {
    name: "Ollama (local default)",
    provider: "ollama",
    method: "POST",
    host: "localhost",
    port: 11434,
    path: "/api/generate",
    headers: { "Content-Type": "application/json" },
    body: { model: "qwen2.5:7b", prompt: "say hi", stream: false }
  },
  // Ollama chat endpoint
  {
    name: "Ollama /api/chat",
    provider: "ollama",
    method: "POST",
    host: "localhost",
    port: 11434,
    path: "/api/chat",
    headers: { "Content-Type": "application/json" },
    body: { model: "qwen2.5:7b", messages: [{ role: "user", content: "say hi" }], stream: false }
  },
  // LM Studio (local default)
  {
    name: "LM Studio (local default)",
    provider: "lmstudio",
    method: "POST",
    host: "localhost",
    port: 1234,
    path: "/v1/chat/completions",
    headers: { "Content-Type": "application/json" },
    body: { model: "local-model", messages: [{ role: "user", content: "say hi" }], max_tokens: 20 }
  },
  // LM Studio v1/chat/completions (some versions)
  {
    name: "LM Studio /chat/completions",
    provider: "lmstudio2",
    method: "POST",
    host: "localhost",
    port: 1234,
    path: "/chat/completions",
    headers: { "Content-Type": "application/json" },
    body: { model: "local-model", messages: [{ role: "user", content: "say hi" }], max_tokens: 20 }
  },
  // llama.cpp server (default)
  {
    name: "llama.cpp server (local)",
    provider: "llamacpp",
    method: "POST",
    host: "localhost",
    port: 8080,
    path: "/v1/chat/completions",
    headers: { "Content-Type": "application/json" },
    body: { model: "local", messages: [{ role: "user", content: "say hi" }], max_tokens: 20 }
  },
  // Tabby (local)
  {
    name: "Tabby (local)",
    provider: "tabby",
    method: "POST",
    host: "localhost",
    port: 8080,
    path: "/v1/chat/completions",
    headers: { "Content-Type": "application/json" },
    body: { model: "local", messages: [{ role: "user", content: "say hi" }], max_tokens: 20 }
  },
  // vLLM (local)
  {
    name: "vLLM (local)",
    provider: "vllm",
    method: "POST",
    host: "localhost",
    port: 8000,
    path: "/v1/chat/completions",
    headers: { "Content-Type": "application/json" },
    body: { model: "local", messages: [{ role: "user", content: "say hi" }], max_tokens: 20 }
  },
  // GPT4All
  {
    name: "GPT4All (local)",
    provider: "gpt4all",
    method: "POST",
    host: "localhost",
    port: 4891,
    path: "/v1/chat/completions",
    headers: { "Content-Type": "application/json" },
    body: { model: "local", messages: [{ role: "user", content: "say hi" }], max_tokens: 20 }
  },
  // LocalAI
  {
    name: "LocalAI (local)",
    provider: "localai",
    method: "POST",
    host: "localhost",
    port: 8080,
    path: "/v1/chat/completions",
    headers: { "Content-Type": "application/json" },
    body: { model: "local", messages: [{ role: "user", content: "say hi" }], max_tokens: 20 }
  },
  // Portkey local
  {
    name: "Portkey (local)",
    provider: "portkey",
    method: "POST",
    host: "localhost",
    port: 8787,
    path: "/chat/completions",
    headers: { "Content-Type": "application/json" },
    body: { model: "local", messages: [{ role: "user", content: "say hi" }], max_tokens: 20 }
  },
  // LiteLLM proxy (local)
  {
    name: "LiteLLM Proxy (local)",
    provider: "litellm",
    method: "POST",
    host: "localhost",
    port: 4000,
    path: "/v1/chat/completions",
    headers: { "Content-Type": "application/json" },
    body: { model: "local", messages: [{ role: "user", content: "say hi" }], max_tokens: 20 }
  },
  // Oobabooga webui (local)
  {
    name: "Oobabooga WebUI (local)",
    provider: "oobabooga",
    method: "POST",
    host: "localhost",
    port: 5000,
    path: "/v1/chat/completions",
    headers: { "Content-Type": "application/json" },
    body: { model: "local", messages: [{ role: "user", content: "say hi" }], max_tokens: 20 }
  },
  // KoboldCPP (local)
  {
    name: "KoboldCPP (local)",
    provider: "koboldcpp",
    method: "POST",
    host: "localhost",
    port: 5001,
    path: "/v1/chat/completions",
    headers: { "Content-Type": "application/json" },
    body: { model: "local", messages: [{ role: "user", content: "say hi" }], max_tokens: 20 }
  },
  // Dolly (local)
  {
    name: "Dolly (local)",
    provider: "dolly",
    method: "POST",
    host: "localhost",
    port: 5000,
    path: "/chat/completions",
    headers: { "Content-Type": "application/json" },
    body: { model: "local", messages: [{ role: "user", content: "say hi" }], max_tokens: 20 }
  },
  // Continue.dev proxy (local)
  {
    name: "Continue.dev Proxy (local)",
    provider: "continue",
    method: "POST",
    host: "localhost",
    port: 7867,
    path: "/proxy",
    headers: { "Content-Type": "application/json" },
    body: { model: "local", messages: [{ role: "user", content: "say hi" }], max_tokens: 20 }
  },
  // Jan.ai (local)
  {
    name: "Jan AI (local)",
    provider: "jan",
    method: "POST",
    host: "localhost",
    port: 1337,
    path: "/api/chat/completions",
    headers: { "Content-Type": "application/json" },
    body: { model: "local", messages: [{ role: "user", content: "say hi" }], max_tokens: 20 }
  },
  // Whisper (local STT)
  {
    name: "Whisper API (local)",
    provider: "whisper",
    method: "POST",
    host: "localhost",
    port: 8080,
    path: "/v1/audio/transcriptions",
    headers: { "Content-Type": "application/json" },
    body: { file: "test", model: "whisper-1" }
  },
  // OpenAI Compatible servers on public ports (these are rare but let's try a few known patterns)
  // Together AI has a free tier demo sometimes
  {
    name: "Together AI (public)",
    provider: "together",
    method: "POST",
    host: "api.together.xyz",
    path: "/v1/models",
    headers: { "Content-Type": "application/json" },
    body: {}
  },
  // Cerebras has a public playground
  {
    name: "Cerebras (public models)",
    provider: "cerebras",
    method: "GET",
    host: "api.cerebras.ai",
    path: "/v1/models",
    headers: {},
    body: null
  },
  // OpenRouter has a public models endpoint
  {
    name: "OpenRouter (public models)",
    provider: "openrouter",
    method: "GET",
    host: "openrouter.ai",
    path: "/api/v1/models",
    headers: {},
    body: null
  },
  // Groq has a public models endpoint
  {
    name: "Groq (public models)",
    provider: "groq",
    method: "GET",
    host: "api.groq.com",
    path: "/openai/v1/models",
    headers: {},
    body: null
  },
  // Mistral has a public models endpoint
  {
    name: "Mistral (public models)",
    provider: "mistral",
    method: "GET",
    host: "api.mistral.ai",
    path: "/v1/models",
    headers: {},
    body: null
  },
  // NVIDIA NIM has a catalog
  {
    name: "NVIDIA NIM (catalog)",
    provider: "nvidia",
    method: "GET",
    host: "integrate.api.nvidia.com",
    path: "/v1/models",
    headers: {},
    body: null
  },
  // Perplexity
  {
    name: "Perplexity (public)",
    provider: "perplexity",
    method: "GET",
    host: "api.perplexity.ai",
    path: "/models",
    headers: {},
    body: null
  },
  // Anyscale public endpoint
  {
    name: "Anyscale (public)",
    provider: "anyscale",
    method: "GET",
    host: "api.endpoints.anyscale.com",
    path: "/v1/models",
    headers: {},
    body: null
  },
  // Fireworks public
  {
    name: "Fireworks (public)",
    provider: "fireworks",
    method: "GET",
    host: "api.fireworks.ai",
    path: "/v1/models",
    headers: {},
    body: null
  },
  // Cohere public
  {
    name: "Cohere (public)",
    provider: "cohere",
    method: "GET",
    host: "api.cohere.ai",
    path: "/v1/models",
    headers: {},
    body: null
  },
  // Jina public
  {
    name: "Jina (public)",
    provider: "jina",
    method: "GET",
    host: "api.jina.ai",
    path: "/v1/models",
    headers: {},
    body: null
  },
  // Replicate public
  {
    name: "Replicate (public)",
    provider: "replicate",
    method: "GET",
    host: "api.replicate.com",
    path: "/v1/models",
    headers: {},
    body: null
  },
  // Stability AI public
  {
    name: "Stability AI (public)",
    provider: "stability",
    method: "GET",
    host: "api.stability.ai",
    path: "/v1/models",
    headers: {},
    body: null
  },
  // HuggingFace Inference API (free tier, no key for some models)
  {
    name: "HuggingFace Inference API (free)",
    provider: "huggingface",
    method: "POST",
    host: "api-inference.huggingface.co",
    path: "/models/qwen/Qwen2.5-7B-Instruct/v1/chat/completions",
    headers: { "Content-Type": "application/json" },
    body: { model: "qwen/Qwen2.5-7B-Instruct", messages: [{ role: "user", content: "say hi" }], max_tokens: 20 }
  },
  // HuggingFace Inference API (serverless, no model path)
  {
    name: "HuggingFace Inference API (serverless)",
    provider: "huggingface2",
    method: "POST",
    host: "api-inference.huggingface.co",
    path: "/pipeline/feature-extraction",
    headers: { "Content-Type": "application/json" },
    body: { inputs: "say hi" }
  },
  // HF spaces - some are publicly accessible
  {
    name: "HF Spaces (public)",
    provider: "hfspaces",
    method: "GET",
    host: "huggingface.co",
    path: "/spaces",
    headers: {},
    body: null
  },
  // Together's free tier (requires key but let's check docs endpoint)
  {
    name: "Together (docs)",
    provider: "together_docs",
    method: "GET",
    host: "docs.together.ai",
    path: "/",
    headers: {},
    body: null
  },
];

function makeRequest(test) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const mod = (test.host === "localhost" || test.host === "127.0.0.1") ? http : https;

    const options = {
      hostname: test.host,
      path: test.path,
      method: test.method,
      headers: test.headers || {},
      timeout: 10000,
    };

    if (test.port) options.port = test.port;

    const req = mod.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        const elapsed = Date.now() - startTime;
        let parsed = null;
        try { parsed = JSON.parse(data); } catch (e) {}
        let responsePreview = "";
        let works = false;
        let error = "";

        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (parsed) {
            responsePreview = JSON.stringify(parsed).substring(0, 200);
            works = true;
          } else {
            responsePreview = data.substring(0, 200);
            works = data.length > 10;
          }
        } else if (res.statusCode === 401 || res.statusCode === 403) {
          error = `Auth required (${res.statusCode})`;
          responsePreview = data.substring(0, 200);
        } else if (res.statusCode === 404) {
          error = `Not found (${res.statusCode})`;
          responsePreview = data.substring(0, 200);
        } else if (res.statusCode >= 500) {
          error = `Server error (${res.statusCode})`;
          responsePreview = data.substring(0, 200);
        } else {
          error = `HTTP ${res.statusCode}`;
          responsePreview = data.substring(0, 200);
        }

        resolve({
          name: test.name,
          status: res.statusCode,
          response: responsePreview,
          works: works,
          error: error,
          elapsed: `${elapsed}ms`,
        });
      });
    });

    req.on("error", (err) => {
      const elapsed = Date.now() - startTime;
      resolve({
        name: test.name,
        status: "ERR",
        response: "",
        works: false,
        error: err.message,
        elapsed: `${elapsed}ms`,
      });
    });

    req.on("timeout", () => {
      req.destroy();
      const elapsed = Date.now() - startTime;
      resolve({
        name: test.name,
        status: "TIMEOUT",
        response: "",
        works: false,
        error: "Request timed out",
        elapsed: "10000ms",
      });
    });

    if (test.body !== null) {
      const bodyStr = JSON.stringify(test.body);
      req.setHeader("Content-Length", Buffer.byteLength(bodyStr));
      req.write(bodyStr);
    }
    req.end();
  });
}

async function runAll() {
  console.log(`Testing ${extraTests.length} additional endpoints...`);
  const results = await Promise.all(extraTests.map(makeRequest));

  results.sort((a, b) => {
    if (a.works && !b.works) return -1;
    if (!a.works && b.works) return 1;
    return a.name.localeCompare(b.name);
  });

  const lines = [];
  lines.push("=" .repeat(120));
  lines.push("EXTRA ENDPOINT TESTING RESULTS");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("=" .repeat(120));
  lines.push("");
  lines.push(`${"Provider".padEnd(40)} | ${"Status".padEnd(8)} | ${"Works".padEnd(6)} | ${"Time".padEnd(10)} | Error / Response Preview`);
  lines.push("-".repeat(120));

  for (const r of results) {
    const statusStr = String(r.status).padEnd(8);
    const worksStr = (r.works ? "YES" : "no").padEnd(6);
    const timeStr = r.elapsed.padEnd(10);
    let preview = r.error || r.response || "";
    if (preview.length > 60) preview = preview.substring(0, 57) + "...";
    lines.push(`${r.name.padEnd(40)} | ${statusStr} | ${worksStr} | ${timeStr} | ${preview}`);
  }

  lines.push("-".repeat(120));
  const working = results.filter(r => r.works);
  const notWorking = results.filter(r => !r.works);
  lines.push(`\nSUMMARY: ${working.length} work, ${notWorking.length} failed/rejected\n`);

  if (working.length > 0) {
    lines.push("WORKING ENDPOINTS:");
    for (const r of working) {
      lines.push(`  [OK] ${r.name} - ${r.response.substring(0, 200)}`);
    }
  }

  lines.push("\nFAILED / REQUIRES AUTH:");
  for (const r of notWorking) {
    lines.push(`  [X] ${r.name} - ${r.error || r.response.substring(0, 100)}`);
  }

  lines.push("\n" + "=".repeat(120));

  const output = lines.join("\n");
  console.log(output);
  fs.writeFileSync("C:\\Users\\fogen\\chode\\extra_endpoint_results.txt", output, "utf8");
  console.log("\nResults written to extra_endpoint_results.txt");
}

runAll().catch(console.error);
