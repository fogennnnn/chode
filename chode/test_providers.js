const https = require('https');
const http = require('http');
const fs = require('fs');

const tests = [
  // 1. OpenRouter free models
  {
    name: "OpenRouter (free/qwen-2.5-7b-instruct)",
    provider: "openrouter",
    method: "POST",
    host: "openrouter.ai",
    path: "/api/v1/chat/completions",
    headers: { "Content-Type": "application/json", "HTTP-Referer": "https://x", "X-Title": "x" },
    body: { model: "free/qwen-2.5-7b-instruct", messages: [{ role: "user", content: "say hi" }], max_tokens: 20, temperature: 0.1 }
  },
  // 2. DeepSeek free
  {
    name: "DeepSeek (no auth)",
    provider: "deepseek",
    method: "POST",
    host: "api.deepseek.com",
    path: "/beta/chat/completions",
    headers: { "Content-Type": "application/json" },
    body: { model: "deepseek-chat", messages: [{ role: "user", content: "say hi" }], max_tokens: 20, temperature: 0.1 }
  },
  // 3. Google Gemini flash
  {
    name: "Google Gemini Flash (no key)",
    provider: "gemini",
    method: "POST",
    host: "generativelanguage.googleapis.com",
    path: "/v1beta/models/gemini-2.0-flash-exp:generateContent",
    headers: { "Content-Type": "application/json" },
    body: { contents: [{ parts: [{ text: "say hi" }] }] }
  },
  // 4. HuggingChat free
  {
    name: "HuggingChat (Qwen2.5-7B)",
    provider: "huggingchat",
    method: "POST",
    host: "huggingface.co",
    path: "/api/chat",
    headers: { "Content-Type": "application/json" },
    body: { model: "Qwen/Qwen2.5-7B-Instruct", messages: [{ role: "user", content: "say hi" }] }
  },
  // 5. AI Horde
  {
    name: "AI Horde",
    provider: "ahorde",
    method: "POST",
    host: "corsproxy.io",
    path: "/?https://ai.api.aihorde.net/api/v2/chat/completions",
    headers: { "Content-Type": "application/json" },
    body: { model: "Flux", messages: [{ role: "user", content: "say hi" }] }
  },
  // 6. Perplexity
  {
    name: "Perplexity (no auth)",
    provider: "perplexity",
    method: "POST",
    host: "api.perplexity.ai",
    path: "/chat/completions",
    headers: { "Content-Type": "application/json" },
    body: { model: "sonar", messages: [{ role: "user", content: "say hi" }] }
  },
  // 7. Groq
  {
    name: "Groq (no auth)",
    provider: "groq",
    method: "POST",
    host: "api.groq.com",
    path: "/openai/v1/chat/completions",
    headers: { "Content-Type": "application/json" },
    body: { model: "llama-3.1-8b-instant", messages: [{ role: "user", content: "say hi" }], max_tokens: 20 }
  },
  // 8. Cerebras
  {
    name: "Cerebras (no auth)",
    provider: "cerebras",
    method: "POST",
    host: "api.cerebras.ai",
    path: "/v1/chat/completions",
    headers: { "Content-Type": "application/json" },
    body: { model: "llama3.1-8b", messages: [{ role: "user", content: "say hi" }], max_tokens: 20 }
  },
  // 9. NVIDIA NIM
  {
    name: "NVIDIA NIM (no auth)",
    provider: "nvidia",
    method: "POST",
    host: "integrate.api.nvidia.com",
    path: "/v1/chat/completions",
    headers: { "Content-Type": "application/json" },
    body: { model: "meta/llama-3.1-8b-instruct", messages: [{ role: "user", content: "say hi" }], max_tokens: 20 }
  },
  // 10. Mistral
  {
    name: "Mistral (no auth)",
    provider: "mistral",
    method: "POST",
    host: "api.mistral.ai",
    path: "/chat/completions",
    headers: { "Content-Type": "application/json" },
    body: { model: "mistral-small-latest", messages: [{ role: "user", content: "say hi" }], max_tokens: 20 }
  },
  // 11. OpenAI
  {
    name: "OpenAI (no auth)",
    provider: "openai",
    method: "POST",
    host: "api.openai.com",
    path: "/v1/chat/completions",
    headers: { "Content-Type": "application/json" },
    body: { model: "gpt-3.5-turbo", messages: [{ role: "user", content: "say hi" }], max_tokens: 20 }
  },
  // 12. Cloudflare Workers AI
  {
    name: "Cloudflare Workers AI",
    provider: "cloudflare",
    method: "POST",
    host: "api.cloudflare.com",
    path: "/client/v4/accounts/testai/chat/completions",
    headers: { "Content-Type": "application/json" },
    body: { model: "@cf/meta/llama-3.1-8b-instruct", messages: [{ role: "user", content: "say hi" }], max_tokens: 20 }
  },
  // 13. Scaleway
  {
    name: "Scaleway LLM",
    provider: "scaleway",
    method: "POST",
    host: "llm-api.scaleway.com",
    path: "/v1/chat/completions",
    headers: { "Content-Type": "application/json" },
    body: { model: "mistral-mistral-large-latest", messages: [{ role: "user", content: "say hi" }], max_tokens: 20 }
  },
  // 14. Cohere
  {
    name: "Cohere (no auth)",
    provider: "cohere",
    method: "POST",
    host: "api.cohere.ai",
    path: "/v1/chat",
    headers: { "Content-Type": "application/json" },
    body: { model: "command-r", messages: [{ role: "user", content: "say hi" }] }
  },
  // 15. Anyscale Endpoints
  {
    name: "Anyscale Endpoints",
    provider: "anyscale",
    method: "POST",
    host: "api.endpoints.anyscale.com",
    path: "/v1/chat/completions",
    headers: { "Content-Type": "application/json" },
    body: { model: "lmsys/vicuna-7b-v1.5", messages: [{ role: "user", content: "say hi" }], max_tokens: 20 }
  },
  // 16. Together AI
  {
    name: "Together AI (no auth)",
    provider: "together",
    method: "POST",
    host: "api.together.xyz",
    path: "/v1/chat/completions",
    headers: { "Content-Type": "application/json" },
    body: { model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo", messages: [{ role: "user", content: "say hi" }], max_tokens: 20 }
  },
  // 17. Fireworks AI
  {
    name: "Fireworks AI (no auth)",
    provider: "fireworks",
    method: "POST",
    host: "api.fireworks.ai",
    path: "/inference/v1/chat/completions",
    headers: { "Content-Type": "application/json" },
    body: { model: "accounts/fireworks/models/qwen2.5-7b-instruct", messages: [{ role: "user", content: "say hi" }], max_tokens: 20 }
  },
  // 18. Jina AI embeddings
  {
    name: "Jina AI embeddings",
    provider: "jina",
    method: "POST",
    host: "api.jina.ai",
    path: "/v1/embeddings",
    headers: { "Content-Type": "application/json" },
    body: { model: "jina-embeddings-v3", input: ["say hi"] }
  },
  // 19. Replicate
  {
    name: "Replicate (no auth)",
    provider: "replicate",
    method: "POST",
    host: "api.replicate.com",
    path: "/v1/predictions",
    headers: { "Content-Type": "application/json" },
    body: { version: "23f7a2e1b3c5e1e7d4a0c8f5b3e1d4a0c8f5b3e1d4a0c8f5b3e1d4a0c8f5b3e1", input: { prompt: "say hi" } }
  },
  // 20. Stability AI
  {
    name: "Stability AI (no auth)",
    provider: "stability",
    method: "POST",
    host: "api.stability.ai",
    path: "/v1/generation/stability.stable-diffusion-xl/txt2img",
    headers: { "Content-Type": "application/json" },
    body: { text_prompts: [{ text: "hi" }], width: 256, height: 256 }
  },
  // 21. 6.ai
  {
    name: "6.ai",
    provider: "6ai",
    method: "POST",
    host: "api.6.ai",
    path: "/chat",
    headers: { "Content-Type": "application/json" },
    body: { messages: [{ role: "user", content: "say hi" }] }
  },
];

function makeRequest(test) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const bodyStr = JSON.stringify(test.body);
    const options = {
      hostname: test.host,
      path: test.path,
      method: test.method,
      headers: test.headers || {},
      timeout: 15000,
    };

    const mod = test.host.includes("https://") || options.hostname === "generativelanguage.googleapis.com" || options.hostname === "huggingface.co" || options.hostname === "openrouter.ai" || options.hostname === "api.deepseek.com" || options.hostname === "corsproxy.io" || options.hostname === "api.perplexity.ai" || options.hostname === "api.groq.com" || options.hostname === "api.cerebras.ai" || options.hostname === "integrate.api.nvidia.com" || options.hostname === "api.mistral.ai" || options.hostname === "api.openai.com" || options.hostname === "api.cloudflare.com" || options.hostname === "llm-api.scaleway.com" || options.hostname === "api.cohere.ai" || options.hostname === "api.endpoints.anyscale.com" || options.hostname === "api.together.xyz" || options.hostname === "api.fireworks.ai" || options.hostname === "api.jina.ai" || options.hostname === "api.replicate.com" || options.hostname === "api.stability.ai" || options.hostname === "api.6.ai"
      ? https
      : http;

    const req = mod.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        let parsed = null;
        try { parsed = JSON.parse(data); } catch (e) {}
        const elapsed = Date.now() - startTime;
        let responsePreview = "";
        let works = false;
        let error = "";

        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (parsed) {
            if (parsed.choices && parsed.choices[0] && parsed.choices[0].message) {
              responsePreview = parsed.choices[0].message.content || JSON.stringify(parsed.choices[0]).substring(0, 200);
              works = responsePreview.length > 3;
            } else if (parsed.message || parsed.response || parsed.generated_text || parsed.text || (parsed.data && parsed.data[0])) {
              responsePreview = JSON.stringify(parsed).substring(0, 200);
              works = responsePreview.length > 10;
            } else if (parsed.result !== undefined) {
              responsePreview = JSON.stringify(parsed).substring(0, 200);
              works = true;
            } else {
              responsePreview = JSON.stringify(parsed).substring(0, 200);
              works = true;
            }
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
      resolve({
        name: test.name,
        status: "TIMEOUT",
        response: "",
        works: false,
        error: "Request timed out",
        elapsed: "15000ms",
      });
    });

    req.write(bodyStr);
    req.end();
  });
}

async function runAll() {
  console.log(`Testing ${tests.length} providers in parallel...`);
  const results = await Promise.all(tests.map(makeRequest));

  results.sort((a, b) => {
    if (a.works && !b.works) return -1;
    if (!a.works && b.works) return 1;
    return a.name.localeCompare(b.name);
  });

  const lines = [];
  lines.push("=" .repeat(120));
  lines.push("AI PROVIDER NO-AUTH TESTING RESULTS");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("=" .repeat(120));
  lines.push("");
  lines.push(`${"Provider".padEnd(36)} | ${"Status".padEnd(8)} | ${"Works".padEnd(6)} | ${"Time".padEnd(10)} | Error / Response Preview`);
  lines.push("-".repeat(120));

  for (const r of results) {
    const statusStr = String(r.status).padEnd(8);
    const worksStr = (r.works ? "YES" : "no").padEnd(6);
    const timeStr = r.elapsed.padEnd(10);
    let preview = r.error || r.response || "";
    if (preview.length > 60) preview = preview.substring(0, 57) + "...";
    lines.push(`${r.name.padEnd(36)} | ${statusStr} | ${worksStr} | ${timeStr} | ${preview}`);
  }

  lines.push("-".repeat(120));
  const working = results.filter(r => r.works);
  const notWorking = results.filter(r => !r.works);
  lines.push(`\nSUMMARY: ${working.length} work without auth, ${notWorking.length} require auth or failed\n`);

  if (working.length > 0) {
    lines.push("WORKING PROVIDERS:");
    for (const r of working) {
      lines.push(`  [OK] ${r.name} - ${r.response.substring(0, 150)}`);
    }
  }

  lines.push("\nREQUIRES AUTH / FAILED:");
  for (const r of notWorking) {
    lines.push(`  [X] ${r.name} - ${r.error || r.response.substring(0, 100)}`);
  }

  lines.push("\n" + "=".repeat(120));

  const output = lines.join("\n");
  console.log(output);
  fs.writeFileSync("C:\\Users\\fogen\\chode\\provider_test_results.txt", output, "utf8");
  console.log("\nResults written to provider_test_results.txt");
}

runAll().catch(console.error);
