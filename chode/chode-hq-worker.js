/**
 * ============================================================
 * HEMO EMPIRE DOCTRINE — NORTH STAR (FDM internal systems)
 * We are building a CONGLOMERATE, not a narrow business.
 *
 * HEMO daily discipline:
 *   1. SCAN    world inefficiencies vs our capability stack
 *              (keyless data rails, agent workforce,
 *               sealed verifiable resolution, Stripe rails).
 *   2. CONVERT winners into HEMO real-world backing
 *              (buy-and-lock assets, work-burn services,
 *               treasury assets).
 *   3. RE-EVALUATE DAILY against the ranked opportunity backlog.
 *
 * Polymarket arbitrage is ONE candidate among many - never the scope.
 * Every change in this file must either compound a capability or
 * convert an opportunity into HEMO backing. If neither, question it.
 * Canonical guidance: income/AGENTS.md
 * ============================================================
 */
// chode-hq — Premium landing page for the self-healing coding harness.
const PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#0a0a0a">
<title>chode — The Self-Healing Coding Harness</title>
<meta name="description" content="chode is the world's most resilient AI coding harness. 16 providers, silent failover, production output. Never stops.">
<meta name="robots" content="index,follow">
<meta property="og:type" content="website">
<meta property="og:title" content="chode — Never stops coding">
<meta property="og:description" content="16 AI providers. Auto-fallback. Production output. The last coding harness you'll ever need.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{--g:#22dd55;--g2:#3dffa0;--g3:#1aaf44;--bg:#0a0a0a;--surface:rgba(13,26,18,.6);--border:rgba(34,221,85,.12);--border-hover:rgba(34,221,85,.3);--text:#e8f5e9;--text-dim:#a5d6a7;--muted:#5c9e68;--radius:16px;--radius-sm:10px;--fm:'IBM Plex Mono',ui-monospace,SFMono-Regular,Menlo,monospace;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth;background:#000}
body{background:#000;color:var(--text);font-family:var(--fm);overflow-x:hidden;-webkit-font-smoothing:antialiased;position:relative;min-height:100vh}

/* ── Background ── */
.bg-canvas{position:fixed;top:-2%;left:-2%;width:104%;height:104%;z-index:0;pointer-events:none;background:#000}
@media(prefers-reduced-motion:reduce){.bg-canvas{display:none}}

/* ── Layout ── */
.page{position:relative;z-index:2;max-width:1100px;margin:0 auto;padding:0 24px}
section{padding:100px 0}
section[id]{scroll-margin-top:84px}

/* ── Header ── */
.site-header{position:fixed;top:0;left:0;right:0;z-index:100;height:72px;display:flex;align-items:center;justify-content:space-between;padding:0 32px;background:rgba(10,16,10,.6);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--border)}
.header-brand{display:flex;align-items:center;gap:12px;text-decoration:none;color:var(--text)}
.header-logo{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--g),var(--g3));display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:#000}
.header-title{font-size:18px;font-weight:600;letter-spacing:-.02em}
.header-nav{display:flex;align-items:center;gap:28px}
.header-nav a{color:var(--muted);text-decoration:none;font-size:13px;font-weight:500;transition:color .2s}
.header-nav a:hover{color:var(--g)}
.header-cta{display:flex;align-items:center;gap:12px}
.btn{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:99px;font-size:13px;font-weight:600;text-decoration:none;transition:all .2s;font-family:inherit;cursor:pointer;border:none}
.btn-ghost{background:transparent;color:var(--text-dim);border:1px solid var(--border)}
.btn-ghost:hover{border-color:var(--border-hover);color:var(--text)}
.btn-primary{background:var(--g);color:#000;border:1px solid var(--g)}
.btn-primary:hover{background:var(--g2);transform:translateY(-1px);box-shadow:0 8px 32px rgba(34,221,85,.3)}
.btn-lg{padding:14px 28px;font-size:14px}

/* ── Hero ── */
.hero{min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:120px 0 80px;position:relative}
.hero-badge{display:inline-flex;align-items:center;gap:8px;background:var(--surface);border:1px solid var(--border);border-radius:99px;padding:6px 16px;font-size:12px;color:var(--text-dim);width:fit-content;margin-bottom:32px}
.hero-badge .dot{width:6px;height:6px;border-radius:50%;background:var(--g);animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
.hero-title{font-size:clamp(64px,12vw,160px);font-weight:700;line-height:1;letter-spacing:.02em;margin-bottom:24px}
.hero-title .chode-wrap{position:relative;display:inline-block}
.hero-title .chode-wrap .o-slot{position:relative;display:inline-block;color:transparent}
.hero-title .chode-wrap .o-slot #logo-wrapper{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:.82em;height:.82em;z-index:0;border-radius:50%;overflow:hidden;box-shadow:0 0 20px rgba(192,132,252,.15);border:1px solid rgba(168,85,247,.25);background:#010102;pointer-events:none}
.hero-title .chode-wrap .o-slot #logo-wrapper canvas#logo{width:100%;height:100%;display:block}
.hero .accent{color:var(--g)}
#squid-anchor{width:100%;height:clamp(100px,16vh,200px);pointer-events:none}
.hero-sub{font-size:clamp(16px,2vw,20px);color:var(--text-dim);line-height:1.6;max-width:600px;margin:0 auto 40px}
.hero-actions{display:flex;gap:16px;flex-wrap:wrap;justify-content:center;margin-bottom:64px}
.hero-stats{display:flex;gap:48px;flex-wrap:wrap;justify-content:center}
.stat{display:flex;flex-direction:column;gap:4px}
.stat-value{font-size:32px;font-weight:700;color:var(--text)}
.stat-label{font-size:12px;color:var(--muted);letter-spacing:.08em;text-transform:uppercase}

/* ── Terminal ── */
.terminal{background:rgba(0,0,0,.7);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;margin:0 auto;max-width:720px}
.terminal-header{display:flex;align-items:center;gap:8px;padding:14px 18px;border-bottom:1px solid var(--border);background:rgba(255,255,255,.02)}
.terminal-dot{width:12px;height:12px;border-radius:50%}
.terminal-dot.red{background:#ff5f57}
.terminal-dot.yellow{background:#febc2e}
.terminal-dot.green{background:#28c840}
.terminal-title{font-size:12px;color:var(--muted);margin-left:8px}
.terminal-body{padding:20px;font-size:14px;line-height:1.8;overflow-x:auto}
.terminal-body .prompt{color:var(--g)}
.terminal-body .cmd{color:var(--text)}
.terminal-body .out{color:var(--muted)}
.terminal-body .success{color:var(--g2)}
.terminal-body .routed{color:#ffd700}

/* ── Features ── */
.features-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px;margin-top:48px}
.feature-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:28px;transition:all .3s}
.feature-card:hover{border-color:var(--border-hover);transform:translateY(-2px)}
.feature-icon{width:44px;height:44px;border-radius:var(--radius-sm);background:rgba(34,221,85,.1);border:1px solid rgba(34,221,85,.2);display:flex;align-items:center;justify-content:center;font-size:20px;margin-bottom:16px}
.feature-card h3{font-size:17px;font-weight:600;margin-bottom:8px;color:var(--text)}
.feature-card p{font-size:14px;color:var(--muted);line-height:1.6}

/* ── Providers ── */
.providers-section{padding:80px 0}
.providers-header{text-align:center;margin-bottom:48px}
.providers-header h2{font-size:clamp(28px,4vw,42px);font-weight:700;margin-bottom:12px}
.providers-header p{color:var(--muted);font-size:16px}
.providers-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;max-width:800px;margin:0 auto}
.provider-chip{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px 16px;font-size:13px;color:var(--text-dim);transition:all .2s;text-align:center}
.provider-chip:hover{border-color:var(--border-hover);color:var(--text)}
.provider-chip .count{font-size:11px;color:var(--muted);margin-top:2px}

/* ── Install ── */
.install-section{padding:80px 0}
.install-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;margin-top:48px}
.install-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:28px;transition:border-color .3s,transform .3s}
.install-card:hover{border-color:var(--border-hover);transform:translateY(-2px)}
.install-card h3{font-size:17px;font-weight:600;margin-bottom:12px;color:var(--text)}
.install-card p{font-size:14px;color:var(--muted);margin-bottom:16px;line-height:1.6}
.code-block{background:rgba(0,0,0,.5);border:1px solid var(--border);border-radius:var(--radius-sm);padding:16px;font-size:13px;color:var(--g2);overflow-x:auto;line-height:1.7}
.code-block .copy-btn{float:right;background:none;border:none;color:var(--muted);cursor:pointer;font-size:12px;padding:4px 8px;border-radius:4px;font-family:inherit}
.code-block .copy-btn:hover{color:var(--text);background:rgba(255,255,255,.05)}

/* ── CTA ── */
.cta-section{text-align:center;padding:120px 0}
.cta-section h2{font-size:clamp(32px,5vw,56px);font-weight:700;margin-bottom:16px}
.cta-section p{font-size:18px;color:var(--text-dim);margin-bottom:40px;max-width:500px;margin-left:auto;margin-right:auto}

/* ── Footer ── */
footer{border-top:1px solid var(--border);padding:40px 0;background:rgba(10,16,10,.5)}
.footer-inner{max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px}
.footer-links{display:flex;gap:24px}
.footer-links a{color:var(--muted);text-decoration:none;font-size:13px;transition:color .2s}
.footer-links a:hover{color:var(--g)}
.footer-copy{font-size:12px;color:var(--muted)}

/* ── Accessibility: skip link, focus, reduced motion ── */
.skip-link{position:fixed;top:-60px;left:16px;z-index:10000;background:var(--g);color:#000;font-size:13px;font-weight:700;padding:10px 18px;border-radius:0 0 10px 10px;text-decoration:none;transition:top .2s;font-family:inherit}
.skip-link:focus{top:0}
:focus-visible{outline:2px solid var(--g);outline-offset:3px;border-radius:4px}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.bg-fallback{position:fixed;inset:auto 0 0 0;z-index:0;text-align:center;font-size:11px;color:var(--muted);opacity:.5;padding:8px;pointer-events:none}

/* ── Terminal live reveal ── */
.term-step{opacity:0;transform:translateY(4px);transition:opacity .35s ease,transform .35s ease}
.term-step.show{opacity:1;transform:none}
.caret{display:inline-block;width:8px;height:14px;background:var(--g);vertical-align:-2px;margin-left:2px;animation:blink 1s steps(1) infinite}
@keyframes blink{50%{opacity:0}}
@media(prefers-reduced-motion:reduce){.term-step{opacity:1 !important;transform:none !important;transition:none}.caret{display:none}.hero-badge .dot{animation:none}.reveal{opacity:1 !important;transform:none !important;transition:none}html{scroll-behavior:auto}}

/* ── Animations ── */
.reveal{opacity:0;transform:translateY(24px);transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1)}
.reveal.in{opacity:1;transform:none}
.reveal-delay-1{transition-delay:.1s}
.reveal-delay-2{transition-delay:.2s}
.reveal-delay-3{transition-delay:.3s}

@media(max-width:768px){
  .site-header{padding:0 16px;height:64px}
  .header-nav{display:none}
  .hero{padding:100px 0 60px}
  .hero-stats{gap:24px}
  .footer-inner{flex-direction:column;text-align:center}
  .footer-links{flex-direction:column;gap:12px}
}
@media(max-width:400px){
  .page{padding:0 16px}
  section{padding:64px 0}
  .hero-actions .btn{width:100%;justify-content:center}
  .providers-grid{grid-template-columns:repeat(2,1fr)}
  .terminal-body{font-size:12.5px;padding:16px}
  .hero-stats{gap:20px}
  .stat-value{font-size:26px}
}
</style>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<script src="/logo.js" defer></script>
<canvas id="space" class="bg-canvas" aria-hidden="true"></canvas>
<p class="bg-fallback" aria-hidden="true">chode · self-healing coding harness</p>
<span class="sr-only">Decorative animated background. All content remains available if the animation fails to load.</span>
<script src="/shared-bg-client.js" defer></script>
<div class="page">
<header class="site-header">
  <a href="/" class="header-brand">
    <div class="header-logo">c</div>
    <span class="header-title">chode</span>
  </a>
  <nav class="header-nav" aria-label="Primary">
    <a href="#features">Features</a>
    <a href="#providers">Providers</a>
    <a href="#commands">Commands</a>
    <a href="#how">How it works</a>
    <a href="#install">Install</a>
    <a href="https://github.com/fogennnnn/chode" target="_blank">GitHub</a>
  </nav>
  <div class="header-cta">
    <a href="#install" class="btn btn-ghost">Get started</a>
  </div>
</header>

<main id="main">
<section class="hero">
  <div class="hero-badge reveal"><span class="dot" aria-hidden="true"></span> 16 providers · auto-fallback · zero lock-in</div>
  <h1 class="hero-title reveal reveal-delay-1"><span class="chode-wrap">ch<span class="o-slot">o<span id="logo-wrapper" aria-hidden="true"><canvas id="logo" aria-hidden="true"></canvas></span></span>de</span></h1>
  <p class="hero-sub reveal reveal-delay-2">The coding harness that <span class="accent">never stops</span>. When one AI provider dies, chode is already gone. 16 endpoints. Up to 5 tries with 1s&rarr;2s&rarr;4s&rarr;8s waits. Checkpoint recovery. Your session keeps moving.</p>
  <div id="squid-anchor" aria-hidden="true"></div>
  <div class="hero-actions reveal reveal-delay-3">
    <a href="#install" class="btn btn-primary btn-lg">Install chode &rarr;</a>
    <a href="https://github.com/fogennnnn/chode" target="_blank" class="btn btn-ghost btn-lg">View on GitHub</a>
  </div>
  <div class="hero-stats reveal reveal-delay-3">
    <div class="stat"><span class="stat-value">16</span><span class="stat-label">Providers</span></div>
    <div class="stat"><span class="stat-value">10</span><span class="stat-label">Free tiers</span></div>
    <div class="stat"><span class="stat-value">5</span><span class="stat-label">Retry attempts</span></div>
    <div class="stat"><span class="stat-value">∞</span><span class="stat-label">Uptime</span></div>
  </div>
</section>

<div class="terminal reveal" id="demo-terminal">
  <div class="terminal-header">
    <span class="terminal-dot red" aria-hidden="true"></span>
    <span class="terminal-dot yellow" aria-hidden="true"></span>
    <span class="terminal-dot green" aria-hidden="true"></span>
    <span class="terminal-title">chode — terminal</span>
  </div>
  <div class="terminal-body" id="term-body" role="status" aria-label="chode terminal demo: routes a prompt across providers">
    <div class="term-step show"><span class="prompt">$</span> <span class="cmd" id="typed-cmd"></span><span class="caret" id="term-caret" aria-hidden="true"></span></div>
    <div class="term-step out">&#9733; Probing 16 providers...</div>
    <div class="term-step out">&#9733; Groq — score 91, 214ms</div>
    <div class="term-step routed">&#9733; Routed to: Groq</div>
    <div class="term-step success">✓ Generated worker.js (864 bytes)</div>
    <div class="term-step success">✓ Scaffolded wrangler.toml</div>
    <div class="term-step out">Run: cd my-worker && npx wrangler dev</div>
    <noscript><div class="out">$ chode ai "build me a Cloudflare Worker that caches API responses"<br>&#9733; Probing 16 providers...<br>&#9733; Groq — score 91, 214ms<br>&#9733; Routed to: Groq<br>✓ Generated worker.js (864 bytes)<br>✓ Scaffolded wrangler.toml<br>Run: cd my-worker && npx wrangler dev</div></noscript>
  </div>
</div>

<section class="providers-section" id="providers">
  <div class="providers-header">
    <h2 class="reveal">16 AI providers.<br>One command.</h2>
    <p class="reveal">Auto-routes to the best available. 10 free tiers, local Ollama, and paid keys when you need them.</p>
  </div>
  <div class="providers-grid reveal">
    <div class="provider-chip">OmniRoute Auto<span class="count">136 models</span></div>
    <div class="provider-chip">Groq<span class="count">free tier</span></div>
    <div class="provider-chip">Cerebras<span class="count">free tier</span></div>
    <div class="provider-chip">Gemini<span class="count">free tier</span></div>
    <div class="provider-chip">Mistral<span class="count">free tier</span></div>
    <div class="provider-chip">OpenRouter<span class="count">free tier</span></div>
    <div class="provider-chip">NVIDIA NIM<span class="count">free tier</span></div>
    <div class="provider-chip">Cloudflare AI<span class="count">free tier</span></div>
    <div class="provider-chip">DeepSeek<span class="count">free tier</span></div>
    <div class="provider-chip">Cohere<span class="count">free tier</span></div>
    <div class="provider-chip">Agnes AI<span class="count">free tier</span></div>
    <div class="provider-chip">Ollama<span class="count">local</span></div>
    <div class="provider-chip">OVHcloud<span class="count">bootstrap</span></div>
    <div class="provider-chip">LLM7<span class="count">keyless</span></div>
    <div class="provider-chip">uncloseai<span class="count">keyless</span></div>
    <div class="provider-chip">Claude<span class="count">paid key</span></div>
    <div class="provider-chip">GPT-4o mini<span class="count">paid key</span></div>
  </div>
</section>

<section id="features">
  <div class="features-grid">
    <div class="feature-card reveal">
      <div class="feature-icon">&#9889;</div>
      <h3>Never stops</h3>
      <p>5 tries max with 1s&rarr;2s&rarr;4s&rarr;8s waits. 429s fail over after 1 retry — silently. Your session continues as if nothing happened.</p>
    </div>
    <div class="feature-card reveal reveal-delay-1">
      <div class="feature-icon">&#9733;</div>
      <h3>Live intelligence</h3>
      <p>The monitor ticks every 30s; a full re-scan runs at most every 5 minutes across all providers. Composite scoring weights quality, reliability, speed, and recency. The leaderboard updates continuously.</p>
    </div>
    <div class="feature-card reveal reveal-delay-2">
      <div class="feature-icon">&#9830;</div>
      <h3>Checkpoint recovery</h3>
      <p>Crash your terminal? Run chode with --resume and pick up exactly where you left off. Full message history preserved.</p>
    </div>
    <div class="feature-card reveal reveal-delay-1">
      <div class="feature-icon">&#9776;</div>
      <h3>Scaffold anything</h3>
      <p>One command creates production Cloudflare Workers with secz6 glass layout, boundaries-bg animation, and self-healing AI routing built in.</p>
    </div>
    <div class="feature-card reveal reveal-delay-2">
      <div class="feature-icon">&#9881;</div>
      <h3>OmniRoute gateway</h3>
      <p>136 models through one endpoint. Kiro, Qoder, LongCat, and more — no individual API keys. Just run omniroute and go.</p>
    </div>
    <div class="feature-card reveal reveal-delay-3">
      <div class="feature-icon">&#9744;</div>
      <h3>Zero lock-in</h3>
      <p>MIT licensed. Works offline with Ollama. No vendor lock-in, no required accounts. Free tiers are the default.</p>
    </div>
  </div>
</section>

<section class="install-section" id="commands">
  <div class="providers-header">
    <h2 class="reveal">Everything it does</h2>
    <p class="reveal">The full command reference. Every line below runs from the cloned repo with Node 18+.</p>
  </div>
  <div class="install-cards">
    <div class="install-card reveal">
      <h3>AI</h3>
      <p>One-shot answers, interactive sessions, and multi-step projects.</p>
      <div class="code-block">node chode.js ai "your prompt"</div>
      <p>One-shot: routes to the best live provider and keeps going when one fails.</p>
      <div class="code-block">node chode.js</div>
      <p>Bare run: opens an interactive session and restores your checkpoint.</p>
      <div class="code-block">node chode.js ai --force groq "prompt"</div>
      <p>--force: pin one provider instead of auto-routing.</p>
      <div class="code-block">node chode.js ai --resume</div>
      <p>--resume: interrupts are forgiven — continue exactly where you stopped.</p>
      <div class="code-block">node chode.js ai "fix @file worker.js"</div>
      <p>@file: point the prompt at repo files to give it context.</p>
      <div class="code-block">node chode.js project "launch plan"</div>
      <p>project: breaks a spec into steps and works the queue. project --resume continues the same queue.</p>
    </div>
    <div class="install-card reveal reveal-delay-1">
      <h3>Discovery</h3>
      <p>See what is actually working right now.</p>
      <div class="code-block">node chode.js status</div>
      <p>Full health dashboard, one line per provider.</p>
      <div class="code-block">node chode.js scan</div>
      <p>Probe all 16 providers with per-provider result lines.</p>
      <div class="code-block">node chode.js score</div>
      <p>Live leaderboard, ranked by composite score.</p>
      <div class="code-block">node chode.js heal</div>
      <p>Force a full re-scan and clear tripped circuit breakers.</p>
    </div>
    <div class="install-card reveal reveal-delay-2">
      <h3>Security</h3>
      <p>Audits that redact secrets before they reach the report.</p>
      <div class="code-block">node chode.js audit</div>
      <p>Full audit — writes masked markdown reports.</p>
      <div class="code-block">node chode.js audit --no-ai</div>
      <p>Static-only audit: no AI calls, no data leaves the machine.</p>
    </div>
    <div class="install-card reveal">
      <h3>Keys</h3>
      <p>Free-tier keys in, validated before they are saved.</p>
      <div class="code-block">node chode.js auth groq [key]</div>
      <p>auth: validates the key, then saves it.</p>
      <div class="code-block">node chode.js provision</div>
      <p>provision: guided setup for every free-tier key.</p>
      <div class="code-block">node chode.js quickkey deepseek</div>
      <p>quickkey: signup link and instructions per provider.</p>
      <div class="code-block">node chode.js models</div>
      <p>models: list all 16 registered providers.</p>
    </div>
    <div class="install-card reveal reveal-delay-1">
      <h3>Scaffolding</h3>
      <p>Generate workers, skills, and a healthy toolchain.</p>
      <div class="code-block">node chode.js new my-worker</div>
      <p>new: scaffolds a production Cloudflare Worker.</p>
      <div class="code-block">node chode.js new my-skill --skill</div>
      <p>--skill: scaffolds a reusable HEMO skill pack.</p>
      <div class="code-block">node chode.js deps</div>
      <p>deps: checks tooling, installs what is missing.</p>
    </div>
    <div class="install-card reveal reveal-delay-2">
      <h3>Sessions &amp; agents</h3>
      <p>History you can inspect, agents you can dispatch.</p>
      <div class="code-block">node chode.js session list</div>
      <p>session list / show / reset: inspect or wipe saved sessions.</p>
      <div class="code-block">node chode.js agents run worker-1 "task"</div>
      <p>agents add / run / list / status: dispatch work to local, SSH, or HTTP agents.</p>
      <div class="code-block">node chode.js skills</div>
      <p>skills: browse reusable skill packs for the agent workforce.</p>
    </div>
    <div class="install-card reveal">
      <h3>Ops</h3>
      <p>Run it like infrastructure, not a script.</p>
      <div class="code-block">node chode.js monitor</div>
      <p>Background health monitor with auto-heal.</p>
      <div class="code-block">node chode.js costs</div>
      <p>Cost report — free tiers track at $0.</p>
      <div class="code-block">node chode.js metrics</div>
      <p>Export system metrics as JSON.</p>
      <div class="code-block">node chode.js queue</div>
      <p>Inspect the pending request queue.</p>
      <div class="code-block">node chode.js nosignups</div>
      <p>No-signup AI tools and prompt engineering helpers.</p>
      <div class="code-block">node chode.js update</div>
      <p>Check for harness updates.</p>
      <div class="code-block">node chode.js init</div>
      <p>init: one-time setup. Setup-gated — run this first.</p>
    </div>
  </div>
</section>

<section class="install-section" id="how">
  <div class="providers-header">
    <h2 class="reveal">How it never stops</h2>
    <p class="reveal">The request pipeline, stage by stage. 16 on the roster: 10 free-tier keyed, Ollama local, OVHcloud + LLM7 + uncloseai keyless (explicit <code>--force</code>), Anthropic + OpenAI paid.</p>
  </div>
  <div class="install-cards">
    <div class="install-card reveal">
      <h3>1 · Prompt in</h3>
      <p>ai loads your session and checkpoint, then routes the prompt. Never bare, never cold.</p>
    </div>
    <div class="install-card reveal reveal-delay-1">
      <h3>2 · Leaderboard scoring</h3>
      <p>Every provider scored live: quality 35, reliability 30, latency 20, recency 15.</p>
    </div>
    <div class="install-card reveal reveal-delay-2">
      <h3>3 · Parallel batches ×3</h3>
      <p>The top providers race three at a time. First good answer wins.</p>
    </div>
    <div class="install-card reveal">
      <h3>4 · Per-provider failover</h3>
      <p>401 skips instantly, 429 gets one retry — then chode is already on the next provider.</p>
    </div>
    <div class="install-card reveal reveal-delay-1">
      <h3>5 · Circuit breaker</h3>
      <p>3 consecutive fails opens the circuit. Idle providers auto-heal back in.</p>
    </div>
    <div class="install-card reveal reveal-delay-2">
      <h3>6 · Keyless bootstrap</h3>
      <p>Zero keys? chode runs local Ollama when it's up, else shows a ranked free-key guidance wall. OVHcloud + LLM7 answer keyless when picked explicitly via <code>--force</code>.</p>
    </div>
    <div class="install-card reveal">
      <h3>7 · Checkpoint + session</h3>
      <p>Every result persisted. Resume continues the same queue — crashes cost nothing.</p>
    </div>
    <div class="install-card reveal reveal-delay-1">
      <h3>8 · Cost footer</h3>
      <p>Tokens and spend tracked per provider. Free tiers stay at $0.</p>
    </div>
    <div class="install-card reveal reveal-delay-2">
      <h3>State layer</h3>
      <p>All state is plain JSON under .chode, plus an append-only usage log. Restart-proof by design.</p>
    </div>
    <div class="install-card reveal">
      <h3>One file, zero deps</h3>
      <p>chode.js, about 2400 lines, Node 18+. No packages to install, nothing to break.</p>
    </div>
  </div>
</section>

<section class="install-section" id="install">
  <div class="providers-header">
    <h2 class="reveal">Get started in 30 seconds</h2>
    <p class="reveal">No accounts. No config. Just code.</p>
    <p class="reveal">Prefer npm? A fixed global package is pending name recovery — from-source meanwhile.</p>
  </div>
  <div class="install-cards">
    <div class="install-card reveal reveal-delay-1">
      <h3>Start coding</h3>
      <p>Run from the cloned repo — bare for interactive mode, or pass a prompt directly.</p>
      <div class="code-block"><button class="copy-btn" type="button" data-copy aria-label="Copy start command">copy</button>node chode.js
node chode.js ai "build me a worker"</div>
    </div>
    <div class="install-card reveal reveal-delay-2">
      <h3>From source</h3>
      <p>Clone and run directly. Good for contributing or development.</p>
      <div class="code-block"><button class="copy-btn" type="button" data-copy aria-label="Copy clone commands">copy</button>git clone https://github.com/fogennnnn/chode.git
cd chode
node chode.js ai "hello"</div>
    </div>
  </div>
</section>

<section class="cta-section">
  <h2 class="reveal">Ready to build?</h2>
  <p class="reveal">The best coding harness doesn't exist yet. Let's build it together.</p>
  <div class="reveal">
    <a href="https://github.com/fogennnnn/chode" target="_blank" class="btn btn-primary btn-lg">Star on GitHub &rarr;</a>
  </div>
</section>
</main>
<footer>
  <div class="footer-inner">
    <div class="footer-links">
      <a href="https://github.com/fogennnnn/chode" target="_blank">GitHub</a>
      <a href="https://github.com/fogennnnn/chode#readme">Docs</a>
      <a href="https://github.com/fogennnnn/hemo-skills">Skills</a>
      <a href="https://github.com/fogennnnn/chode" target="_blank">Contact</a>
    </div>
    <span class="footer-copy">chode &middot; MIT &middot; 2026</span>
  </div>
</footer>
</div>
<script>
(function(){
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:0.1});
document.querySelectorAll('.reveal').forEach(function(el){io.observe(el)});
function copyCode(btn){
  try{
    var clone=btn.parentElement.cloneNode(true);
    var b=clone.querySelector('.copy-btn');if(b)b.remove();
    var text=(clone.textContent||'').replace(/^\s+|\s+$/g,'');
    function done(){var o=btn.dataset.label||'copy';btn.textContent='copied';setTimeout(function(){btn.textContent=o},1600)}
    function fallback(){var ta=document.createElement('textarea');ta.value=text;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');done()}catch(e){}ta.remove()}
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done,fallback)}
    else{fallback()}
  }catch(e){}
}
document.addEventListener('click',function(e){var b=e.target&&e.target.closest?e.target.closest('[data-copy]'):null;if(b)copyCode(b)});
var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var term=document.getElementById('demo-terminal');
var cmdText='chode ai "build me a Cloudflare Worker that caches API responses"';
var typedEl=document.getElementById('typed-cmd');
var caret=document.getElementById('term-caret');
function showSteps(){
  var steps=document.querySelectorAll('#term-body .term-step');
  steps.forEach(function(s,i){if(i===0)return;setTimeout(function(){s.classList.add('show')},260*i)});
  setTimeout(function(){if(caret)caret.style.display='none'},260*steps.length);
}
if(reduced){
  if(typedEl)typedEl.textContent=cmdText;
  document.querySelectorAll('#term-body .term-step').forEach(function(s){s.classList.add('show')});
  if(caret)caret.style.display='none';
}else if(term&&typedEl){
  var started=false;
  var tio=new IntersectionObserver(function(es){es.forEach(function(e){
    if(e.isIntersecting&&!started){started=true;tio.unobserve(term);typeCmd()}
  })},{threshold:0.3});
  tio.observe(term);
  function typeCmd(){
    var i=0;
    (function tick(){
      if(i<=cmdText.length){typedEl.textContent=cmdText.slice(0,i);i++;setTimeout(tick,34)}
      else{showSteps()}
    })();
  }
}
})();
</script>
</body>
</html>`;

const CLIENT_JS = `(function () {
  const canvas = document.getElementById("space");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
  if (!ctx) return;

  const query = new URLSearchParams(window.location.search);
  const configuredRadius = Number(query.get("radius"));
  const reducedMotion = Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const CELL_SIZE = 12;
  const NORMAL_COLOR = "#27ff8e";
  const SPECIAL_COLORS = ["#ff4fd8", "#b56cff", "#55b8ff"];
  const DEFAULT_SANCTUARY_RADIUS = 38;

  let width = 1;
  let height = 1;
  let dpr = 1;
  let cols = 1;
  let rows = 1;
  let generation = 0;
  let visualTime = 0;
  let currentAliveIndices = [];
  let tentacleCells = [];
  let squid = null;
  let sanctuaryRadius = Number.isFinite(configuredRadius) && configuredRadius > 0
    ? Math.max(18, Math.min(80, configuredRadius))
    : DEFAULT_SANCTUARY_RADIUS;
  // FIXED camera: oSlot lookup runs ONCE for first-frame placement; stored
  // world->screen fit is reused thereafter so squid.x/y roams freely.
  let viewFixed = null;
  let drewReducedFrame = false;

  let ws = null;
  let reconnectAttempts = 0;
  const MAX_RECONNECT_ATTEMPTS = 10;
  const RECONNECT_DELAY = 2000;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function sanctuary() {
    return {
      x: width * 0.5,
      y: height * 0.5,
      radius: sanctuaryRadius
    };
  }

  function draw() {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    // Glow follows the moving squid mantle; sanctuary area is fallback only (back-compat).
    const area = squid ? { x: squid.x, y: squid.y, radius: sanctuaryRadius } : sanctuary();

    const glow = ctx.createRadialGradient(
      area.x, area.y, area.radius * 0.2,
      area.x, area.y, area.radius * 2.4
    );
    glow.addColorStop(0, "rgba(255, 79, 216, 0.08)");
    glow.addColorStop(0.42, "rgba(181, 108, 255, 0.05)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(area.x, area.y, area.radius * 2.4, 0, Math.PI * 2);
    ctx.fill();

    // No dashed sanctuary ring: server streams solid mantle + arms in tentacleCells.
    // Render order: clear -> glow -> lime aliveIndices -> tentacleCells.
    // prefers-reduced-motion: client is event-driven (draw on WS message only), so this
    // single static frame already satisfies reduced motion (no pulse/animation loop).

    const inset = Math.max(1, Math.floor(CELL_SIZE * 0.16));
    const size = CELL_SIZE - inset * 2;
    ctx.fillStyle = NORMAL_COLOR;
    ctx.globalAlpha = 0.7;
    for (const index of currentAliveIndices) {
      const x = (index % cols) * CELL_SIZE + inset;
      const y = Math.floor(index / cols) * CELL_SIZE + inset;
      ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;

    for (let i = 0; i < tentacleCells.length; i += 1) {
      const cell = tentacleCells[i];
      const color = SPECIAL_COLORS[cell.color % SPECIAL_COLORS.length];
      ctx.fillStyle = color;
      ctx.fillRect(cell.col * CELL_SIZE, cell.row * CELL_SIZE, size, size);
      if (cell.thick >= 2) {
        if (cell.col + 1 < cols) ctx.fillRect((cell.col + 1) * CELL_SIZE, cell.row * CELL_SIZE, size, size);
        if (cell.row + 1 < rows) ctx.fillRect(cell.col * CELL_SIZE, (cell.row + 1) * CELL_SIZE, size, size);
      }
      if (cell.thick === 3) {
        if (cell.col + 1 < cols && cell.row + 1 < rows) {
          ctx.fillRect((cell.col + 1) * CELL_SIZE, (cell.row + 1) * CELL_SIZE, size, size);
        }
      }
    }
  }

  function ensureView(cssWidth, cssHeight, rect, anchor) {
    if (viewFixed) return viewFixed;
    // First-frame placement only: align the initial anchor once, then freeze.
    const oSlot = document.getElementById('squid-anchor') || document.querySelector('.hero h1 .accent');
    let targetX = cssWidth / 2;
    let targetY = cssHeight * 0.4;
    if (oSlot) {
      const oRect = oSlot.getBoundingClientRect();
      targetX = oRect.left + oRect.width / 2 - rect.left;
      targetY = oRect.top + oRect.height / 2 - rect.top;
    }
    if (cssWidth >= 1100) {
      // Genuine negative space: right of the wordmark/subhead, clear of CTAs and stats.
      const title = document.querySelector('.hero-title');
      const sub = document.querySelector('.hero-sub');
      const armPx = Math.min(cssWidth, cssHeight) * 0.275;
      if (title) {
        const t = title.getBoundingClientRect();
        const textRight = Math.max(t.right, sub ? sub.getBoundingClientRect().right : t.right);
        targetX = Math.min(textRight + armPx + 56 - rect.left, cssWidth - armPx - 24);
        targetY = (t.top + t.bottom) / 2 - rect.top;
      }
    }
    // HQ extent-scale variant (preserved): fit 80% of the smaller world extent.
    const extent = Math.min(width, height) * 0.8;
    const scale = Math.min(cssWidth, cssHeight) / extent || 1;
    viewFixed = { scale, tx: targetX - anchor.x * scale, ty: targetY - anchor.y * scale };
    return viewFixed;
  }

  function applyState(state) {
    width = state.width;
    height = state.height;
    dpr = state.dpr;
    cols = state.cols;
    rows = state.rows;
    generation = state.generation;
    visualTime = state.visualTime;
    sanctuaryRadius = state.sanctuary?.radius || DEFAULT_SANCTUARY_RADIUS;
    squid = state.squid || null;

    const rect = canvas.getBoundingClientRect();
    const cssWidth = rect.width;
    const cssHeight = rect.height;

    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    canvas.style.width = cssWidth + "px";
    canvas.style.height = cssHeight + "px";

    // FIXED transform: anchor captured once, squid roams across canvas after.
    const anchor = squid ? { x: squid.x, y: squid.y } : (state.sanctuary || sanctuary());
    const view = ensureView(cssWidth, cssHeight, rect, anchor);
    ctx.setTransform(view.scale * dpr, 0, 0, view.scale * dpr,
      view.tx * dpr, view.ty * dpr);

    currentAliveIndices = state.aliveIndices || [];
    tentacleCells = state.tentacleCells || [];
    draw();
  }

  function connect() {
    const wsUrl = 'wss://shared-bg-v2.fogeboro.workers.dev/websocket';
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      reconnectAttempts = 0;
      sendResize();
    };

    ws.onmessage = (event) => {
      try {
        const state = JSON.parse(event.data);
        if (state.type === 'init' || state.type === 'state' || state.type === 'resize_ack') {
          if (reducedMotion) {
            if (!drewReducedFrame) {
              drewReducedFrame = true;
              applyState(state);
            }
            try { ws.close(); } catch (e) {}
            return;
          }
          applyState(state);
        }
      } catch (e) {
      }
    };

    ws.onclose = () => {
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        setTimeout(connect, RECONNECT_DELAY * Math.min(reconnectAttempts, 5));
      }
    };

    ws.onerror = () => {
    };
  }

  function sendResize() {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const rect = canvas.getBoundingClientRect();
      ws.send(JSON.stringify({
        type: 'resize',
        width: Math.max(1, rect.width),
        height: Math.max(1, rect.height),
        dpr: Math.min(window.devicePixelRatio || 1, 2.5)
      }));
    }
  }

  let resizeFrame = 0;
  function onResize() {
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      sendResize();
    });
  }

  connect();
  addEventListener("resize", onResize, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) sendResize();
  });
})();`;

const LOGO_JS = `(function(){
function initLogo(canvas,size,speed,mono){
if(!canvas||canvas.dataset.z6)return;canvas.dataset.z6='1';
const ctx=canvas.getContext('2d',{alpha:true});let width=size,height=size;let cx=width/2,cy=height/2;let dotSize=1.0;
function initCanvas(){const dpr=window.devicePixelRatio||1;canvas.width=width*dpr;canvas.height=height*dpr;ctx.scale(dpr,dpr);dotSize=Math.max(1.0,1.5/dpr)}initCanvas();
let pDrive=2.0,pZoom=1.1,baseGamma=1.0,targetGamma=1.0,pGamma=1.0,baseUpdate=1.0,targetUpdate=1.0,pUpdate=1.0;
let lastMouse={x:window.innerWidth/2,y:window.innerHeight/2};
window.addEventListener('mousemove',e=>{const dx=e.clientX-lastMouse.x;const dy=e.clientY-lastMouse.y;const dist=Math.sqrt(dx*dx+dy*dy);targetUpdate=baseUpdate+Math.min(dist*0.05,6.0);targetGamma=baseGamma+Math.min(dist*0.005,0.4);lastMouse.x=e.clientX;lastMouse.y=e.clientY});
window.addEventListener('keydown',()=>{targetGamma=Math.min(targetGamma+0.15,1.6);targetUpdate=Math.min(targetUpdate+3.0,10.0)});
const POINTS_COUNT=6000,NODE_COUNT=3,GOLDEN_ANGLE=2.39996;
const baseR=new Float32Array(POINTS_COUNT),baseX=new Float32Array(POINTS_COUNT),baseY=new Float32Array(POINTS_COUNT);
const nodeX=new Float32Array(NODE_COUNT),nodeY=new Float32Array(NODE_COUNT);
for(let i=0;i<POINTS_COUNT;i++){const theta=i*GOLDEN_ANGLE;const rNorm=Math.sqrt(i)/Math.sqrt(POINTS_COUNT);baseR[i]=rNorm;baseX[i]=Math.cos(theta)*rNorm;baseY[i]=Math.sin(theta)*rNorm}
let localStep=0;
function renderLogo(){requestAnimationFrame(renderLogo);
pGamma+=(targetGamma-pGamma)*0.05;pUpdate+=(targetUpdate-pUpdate)*0.05;
targetGamma+=(baseGamma-targetGamma)*0.02;targetUpdate+=(baseUpdate-targetUpdate)*0.02;
localStep+=pUpdate*speed;
const t=localStep*pDrive;
if(mono){ctx.clearRect(0,0,width,height)}else{ctx.fillStyle='rgba(1,1,2,0.15)';ctx.fillRect(0,0,width,height)}
const maxRadius=(width/2)*pZoom;const angleOffset=t*0.003;
for(let n=0;n<NODE_COUNT;n++){const angle=angleOffset+(n*Math.PI*2)/NODE_COUNT;const nodeR=maxRadius*0.45*Math.sin(t*0.0006+n);nodeX[n]=Math.cos(angle)*nodeR;nodeY[n]=Math.sin(angle)*nodeR}
const driveFactor=0.05*pDrive;const tOffsetBase=t*0.03;const nodeDriveFactor=0.12*pDrive;const nodeTOffset=t*0.06;
const gammaScale=pGamma*2.5;const normBase=4+2*NODE_COUNT*pGamma;const normOffset=2+NODE_COUNT*pGamma;
for(let i=0;i<POINTS_COUNT;i++){
const pxRel=baseX[i]*maxRadius,pyRel=baseY[i]*maxRadius,r=baseR[i]*maxRadius;
let totalPhase=Math.sin(r*driveFactor-tOffsetBase);
for(let n=0;n<NODE_COUNT;n++){const dx=pxRel-nodeX[n],dy=pyRel-nodeY[n];totalPhase+=gammaScale*Math.sin(Math.sqrt(dx*dx+dy*dy)*nodeDriveFactor-nodeTOffset)}
if(Math.sin(totalPhase*2.0)>0.15){
const norm=(totalPhase+normOffset)/normBase;const rawAlpha=0.6+norm*0.4;
const alpha=rawAlpha>1?1:rawAlpha<0?0:rawAlpha.toFixed(2);
let paint=false;
if(mono){if(norm>0.90){ctx.fillStyle='hsla(290,100%,75%,0.16)';paint=true}}
else{const hue=(265+norm*55)|0,lit=(42+norm*35)|0;ctx.fillStyle='hsla('+hue+',88%,'+lit+'%,'+alpha+')';paint=true}
if(paint)ctx.fillRect(cx+pxRel,cy+pyRel,dotSize,dotSize)}}}
renderLogo();}
initLogo(document.getElementById('logo'),75,1.0,false);
})();`;

function json(o, s) { return new Response(JSON.stringify(o), { status: s || 200, headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' } }); }

export default {
  async fetch(request) {
    const url = new URL(request.url); const p = url.pathname;
    if (p === '/logo.js') return new Response(LOGO_JS, { headers: { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
    if (p === '/shared-bg-client.js') return new Response(CLIENT_JS, { headers: { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
    if (p === '/' || p === '/index.html') return new Response(PAGE, { headers: { 'content-type': 'text/html; charset=utf-8' } });
    if (p === '/api/status') return json({ ok: true, service: 'chode-hq', ts: Date.now(), providers: 16, freeTiers: 10 });
    return json({ ok: false, error: 'not found' }, 404);
  }
};
