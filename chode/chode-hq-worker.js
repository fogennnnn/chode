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
<meta property="og:url" content="https://chode.borken.app/">
<meta property="og:title" content="chode — Never stops coding">
<meta property="og:description" content="17 configured providers. Auto-fallback. Production output. The last coding harness you'll ever need.">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="chode — Never stops coding">
<meta name="twitter:description" content="17 configured providers. Auto-fallback. Production output.">
<link rel="icon" href="data:,">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{--g:#22dd55;--g2:#3dffa0;--g3:#1aaf44;--bg:#0a0a0a;--surface:rgba(13,26,18,.6);--border:rgba(34,221,85,.12);--border-hover:rgba(34,221,85,.3);--text:#e8f5e9;--text-dim:#a5d6a7;--muted:#6cb87e;--radius:16px;--radius-sm:10px;--fm:'IBM Plex Mono',ui-monospace,SFMono-Regular,Menlo,monospace;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth;background:#000}
body{background:#000;color:var(--text);font-family:var(--fm);overflow-x:hidden;-webkit-font-smoothing:antialiased;position:relative;min-height:100vh}

/* ── Background: local procedural horizon (reflective lake under hero) ── */
.bg-canvas{position:fixed;top:-2%;left:-2%;width:104%;height:104%;z-index:0;pointer-events:none;background:#000}
/* ── Viewport frame: 3px live-reflection edge, driven by the shared lake loop/palette/fade ── */
.viewport-frame{position:fixed;top:env(safe-area-inset-top,0px);right:env(safe-area-inset-right,0px);bottom:env(safe-area-inset-bottom,0px);left:env(safe-area-inset-left,0px);z-index:200;pointer-events:none;border:3px solid rgba(168,85,247,.28);box-sizing:border-box;opacity:.85}
/* prefers-reduced-motion: horizon paints a single static frame and stays visible (no loop, no hiding) */

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
  .viewport-frame{border-width:3px;opacity:.9}
  .site-header{padding:0 16px;height:64px;gap:12px}
  .header-nav{display:flex;gap:14px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}
  .header-nav::-webkit-scrollbar{display:none}
  .header-nav a{font-size:12px;white-space:nowrap}
  .header-title{display:none}
  .header-cta .btn{padding:8px 14px;font-size:12px}
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
<div class="viewport-frame" id="viewport-frame" aria-hidden="true"></div>
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
  <div class="hero-badge reveal"><span class="dot" aria-hidden="true"></span> v1.6.0 · saved sessions · lossless retries · source-aware research</div>
  <h1 class="hero-title reveal reveal-delay-1"><span class="chode-wrap">ch<span class="o-slot">o<span id="logo-wrapper" aria-hidden="true"><canvas id="logo" aria-hidden="true"></canvas></span></span>de</span></h1>
  <p class="hero-sub reveal reveal-delay-2">Build apps and explore questions in a <span class="accent">focused terminal workspace</span>. A responsive composer, restored conversations, discoverable tools, and explicit verification keep the work clear.</p>
  <div class="hero-actions reveal reveal-delay-3">
    <a href="#install" class="btn btn-primary btn-lg">Install chode &rarr;</a>
    <a href="https://github.com/fogennnnn/chode" target="_blank" class="btn btn-ghost btn-lg">View on GitHub</a>
  </div>
  <div class="hero-stats reveal reveal-delay-3">
    <div class="stat"><span class="stat-value">17</span><span class="stat-label">Providers</span></div>
    <div class="stat"><span class="stat-value">Local</span><span class="stat-label">Session history</span></div>
    <div class="stat"><span class="stat-value">Source</span><span class="stat-label">Provenance</span></div>
    <div class="stat"><span class="stat-value">Zero</span><span class="stat-label">Runtime dependencies</span></div>
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
    <div class="term-step out">&#9733; Probing configured providers...</div>
    <div class="term-step out">&#9733; OVHcloud — score 88, 441ms</div>
    <div class="term-step routed">&#9733; Routed to: OVHcloud</div>
    <div class="term-step success">✓ Answer streamed · 1 tok · $0.0000</div>
    <div class="term-step success">✓ Session saved — resume with chode ai --resume</div>
    <div class="term-step out">Scaffold it: chode new my-worker && npx wrangler dev</div>
    <noscript><div class="out">$ chode ai "build me a Cloudflare Worker that caches API responses"<br>&#9733; Probing configured providers...<br>&#9733; OVHcloud — score 88, 441ms<br>&#9733; Routed to: OVHcloud<br>✓ Answer streamed · 1 tok · $0.0000<br>✓ Session saved — resume with chode ai --resume<br>Scaffold it: chode new my-worker && npx wrangler dev</div></noscript>
  </div>
</div>

<section class="providers-section" id="providers">
  <div class="providers-header">
    <h2 class="reveal">17 configured providers.<br>One command.</h2>
    <p class="reveal">Auto-routes to the best available. 10 free tiers, local Ollama, and paid keys when you need them.</p>
  </div>
  <div class="providers-grid reveal">
    <div class="provider-chip">Kilo<span class="count">keyless</span></div>
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
    <div class="provider-chip">OVHcloud<span class="count">keyless</span></div>
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
      <h3>Prompts kept</h3>
      <p>Failed interactive requests keep their full prompt and session. Open /queue and use /retry to continue; successful retries acknowledge the original task.</p>
    </div>
    <div class="feature-card reveal reveal-delay-1">
      <div class="feature-icon">&#9733;</div>
      <h3>Provider health</h3>
      <p>Use /status to inspect the saved provider ranking and queued work, or run chode scan for a fresh network check. Availability is measured, not promised.</p>
    </div>
    <div class="feature-card reveal reveal-delay-2">
      <div class="feature-icon">&#9830;</div>
      <h3>Checkpoint recovery</h3>
      <p>Crash your terminal? Use /sessions to reopen the saved conversation, chode ai --resume to resume a task, and /rewind to inspect file checkpoints.</p>
    </div>
    <div class="feature-card reveal reveal-delay-1">
      <div class="feature-icon">&#9776;</div>
      <h3>Scaffold anything</h3>
      <p>One command creates a tested Cloudflare Worker: static landing page, JSON status endpoint, and five offline route tests. Run <code>npm test</code> in the scaffold before you deploy.</p>
    </div>
    <div class="feature-card reveal reveal-delay-2">
      <div class="feature-icon">&#9881;</div>
      <h3>Agent workforce</h3>
      <p>Read, write, edit, test, fetch, and install — the model uses workspace tools itself, asks you when it needs a decision, and delegates chunks to isolated subagents.</p>
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
    <p class="reveal">The request pipeline, stage by stage. 16 on the roster: 10 free-tier keyed, Ollama local, OVHcloud + LLM7 + uncloseai keyless and auto-routed, Anthropic + OpenAI paid.</p>
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
      <p>Zero keys? chode runs local Ollama when it's up, else shows a ranked free-key guidance wall. OVHcloud + LLM7 + uncloseai answer keyless with no signup and auto-route in rank order.</p>
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
      <h3>Small core, zero deps</h3>
      <p>Node 18+, built-in modules, and no runtime packages to install. Run chode doctor to check the installation.</p>
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
cd chode/chode
node chode.js ai "hello"</div>
    </div>
  </div>
</section>

<section class="install-section" id="compare">
  <div class="providers-header">
    <h2 class="reveal">Public benchmark targets</h2>
    <p class="reveal">Published competitor results are targets, not scores assigned to chode. Different benchmark versions remain separate.</p>
  </div>
  <div class="install-cards">
    <div class="install-card reveal">
      <h3>Claude Code</h3>
      <p>Terminal-Bench 4.0 with Opus 5.5 (max): 64.8% &plusmn; 3.1. The older 2.0 result with Opus 4.5 is 52.1% &plusmn; 2.5.</p>
      <a href="https://www.tbench.ai/" target="_blank" rel="noopener noreferrer">Official leaderboard</a>
    </div>
    <div class="install-card reveal reveal-delay-1">
      <h3>OpenCode</h3>
      <p>Terminal-Bench 2.0 with Opus 4.5: 51.7%. The published row supplies no uncertainty interval; the small gap does not establish a meaningful difference.</p>
      <a href="https://www.tbench.ai/?version=2.0" target="_blank" rel="noopener noreferrer">Official 2.0 leaderboard</a>
    </div>
    <div class="install-card reveal reveal-delay-2">
      <h3>chode 1.4</h3>
      <p>A terminal workspace, multi-file app workflow, source records, and explicit verification. No published harness benchmark score yet; superiority is not established.</p>
      <a href="https://github.com/fogennnnn/chode/blob/master/chode/UX-1.6.md">Release notes</a>
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
      <a href="https://github.com/fogennnnn/chode/blob/master/chode/UX-1.6.md">Docs</a>
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
// Every command snippet gets a copy button, not just the install cards.
document.querySelectorAll('.code-block').forEach(function(block, i){
  if(block.querySelector('.copy-btn'))return;
  var btn=document.createElement('button');
  btn.className='copy-btn';btn.type='button';btn.setAttribute('data-copy','');
  btn.setAttribute('aria-label','Copy command '+(i+1));
  btn.textContent='copy';block.insertBefore(btn,block.firstChild);
});
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
  var canvas = document.getElementById("space");
  if (!canvas) return;
  var ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;
  var reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  var W = 0, H = 0, DPR = 1, horizonY = 0, horizonArch = 0, glowX = 0, glowY = 0;
  var logoW = 0, logoH = 0, logoOnScreen = false, reflFade = 0;
  var frameEl = null;
  var reflectionRestDistanceRatio = null;
  var refl = null, rctx = null;
  var t0 = (window.performance && performance.now) ? performance.now() : Date.now();
  var frame = 0;
  var scrollQueued = false;

  // Brand fallback palette (Z6 violet / magenta / cool blue). Live values sampled from #logo.
  var pal  = { r: 168, g: 85, b: 247 };
  var pal2 = { r: 255, g: 79, b: 216 };
  var pal3 = { r: 96, g: 140, b: 255 };
  var tgt  = { r: 168, g: 85, b: 247 };
  var tgt2 = { r: 255, g: 79, b: 216 };
  var tgt3 = { r: 96, g: 140, b: 255 };

  function rgba(c, a) { return "rgba(" + (c.r | 0) + "," + (c.g | 0) + "," + (c.b | 0) + "," + a + ")"; }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function horizonAt(x) {
    var p = clamp(x / Math.max(1, W), 0, 1);
    return horizonY + horizonArch * (1 - 4 * p * (1 - p));
  }
  function traceWaterPath() {
    ctx.beginPath();
    ctx.moveTo(0, horizonY + horizonArch);
    ctx.quadraticCurveTo(W * 0.5, horizonY - horizonArch, W, horizonY + horizonArch);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
  }
  function traceSkyPath() {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(W, 0);
    ctx.lineTo(W, horizonY + horizonArch);
    ctx.quadraticCurveTo(W * 0.5, horizonY - horizonArch, 0, horizonY + horizonArch);
    ctx.closePath();
  }
  function clipWater() { traceWaterPath(); ctx.clip(); }

  var grainTile = null, grainPat = null;
  (function makeGrain() {
    try {
      grainTile = document.createElement("canvas");
      grainTile.width = 128; grainTile.height = 128;
      var g = grainTile.getContext("2d");
      var img = g.createImageData(128, 128);
      for (var i = 0; i < img.data.length; i += 4) {
        var v = (Math.random() * 255) | 0;
        img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v;
        img.data[i + 3] = 10 + ((Math.random() * 22) | 0);
      }
      g.putImageData(img, 0, 0);
    } catch (e) { grainTile = null; }
  })();

  function sampleLogo() {
    try {
      var logo = document.getElementById("logo");
      if (!logo || !logo.width || logo.width < 16) return;
      var lctx = null;
      try { lctx = logo.getContext("2d"); } catch (e) { return; }
      if (!lctx) return;
      var sw = Math.min(48, logo.width), sh = Math.min(48, logo.height);
      var sx = ((logo.width - sw) / 2) | 0, sy = ((logo.height - sh) / 2) | 0;
      var d = null;
      try { d = lctx.getImageData(sx, sy, sw, sh).data; } catch (e) { return; }
      var r = 0, g = 0, b = 0, n = 0, r2 = 0, g2 = 0, b2 = 0, n2 = 0;
      for (var i = 0; i < d.length; i += 16) {
        var rr = d[i], gg = d[i + 1], bb = d[i + 2];
        var br = rr + gg + bb;
        if (br > 60) { r += rr; g += gg; b += bb; n++; if (br > 300) { r2 += rr; g2 += gg; b2 += bb; n2++; } }
      }
      if (n > 8) { tgt.r = r / n; tgt.g = g / n; tgt.b = b / n; }
      if (n2 > 4) { tgt2.r = r2 / n2; tgt2.g = g2 / n2; tgt2.b = b2 / n2; }
      else { tgt2.r = Math.min(255, tgt.r + 60); tgt2.g = Math.min(255, tgt.g * 0.6 + 40); tgt2.b = Math.min(255, tgt.b); }
      tgt3.r = clamp(tgt.r * 0.55 + 30, 60, 255);
      tgt3.g = clamp(tgt.g * 0.75 + 60, 90, 255);
      tgt3.b = clamp(tgt.b * 0.6 + 110, 120, 255);
    } catch (e) {}
  }

  function updateGlow() {
    try {
      var el = document.getElementById("logo-wrapper");
      var cr = canvas.getBoundingClientRect();
      logoOnScreen = false;
      reflFade = 0;
      if (el) {
        var lr = el.getBoundingClientRect();
        logoW = lr.width;
        logoH = lr.height;
        if (logoW > 4) {
          glowX = (lr.left - cr.left) + logoW * 0.5;
          glowY = (lr.top - cr.top) + logoH * 0.5;
          var onX = lr.right > 0 && lr.left < window.innerWidth;
          var onY = lr.bottom > 0 && lr.top < window.innerHeight;
          logoOnScreen = onX && onY;
          if (logoOnScreen && reflectionRestDistanceRatio === null && H > 0) {
            reflectionRestDistanceRatio = Math.max(0, horizonY - glowY) / H;
          }
          if (logoOnScreen && glowY < horizonY - 2) {
            var d = horizonY - glowY;
            // Plateau near the water, then a smoothstep falloff as the O lifts away.
            // Full at d <= 0.14H; fade gently to 0 by d >= 0.68H.
            // The longer falloff keeps the water image visible deeper into scroll.
            var u = (d - H * 0.14) / (H * 0.54);
            if (u < 0) u = 0;
            if (u > 1) u = 1;
            var s = 1 - u;
            reflFade = s * s * (3 - 2 * s);
            if (lr.top < 0) reflFade *= clamp(lr.bottom / Math.max(1, logoH), 0, 1);
            if (lr.bottom > window.innerHeight) reflFade *= clamp((window.innerHeight - lr.top) / Math.max(1, logoH), 0, 1);
          }
        }
      }
      if (!glowX && W) glowX = W * 0.5;
      if (!glowY && H) glowY = horizonY - H * 0.14;
    } catch (e) {
      glowX = W * 0.5;
      glowY = horizonY - H * 0.14;
      reflFade = 0;
    }
  }

  function resize() {
    var r = canvas.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    DPR = Math.min(window.devicePixelRatio || 1, 1.75);
    try {
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
    } catch (e) {}
    horizonY = Math.round(H * 0.62);
    horizonArch = Math.min(14, H * 0.018);
    if (!glowX) glowX = W * 0.5;
    updateGlow();
  }

  function drawLogoReflection(t) {
    var fade = reflFade;
    if (fade < 0.012 || logoW < 8 || logoH < 8) return;
    var logo = document.getElementById("logo");
    if (!logo || logo.width < 8 || logo.height < 8) return;
    var sourceDistance = Math.max(0, horizonY - glowY);
    var restDistance = reflectionRestDistanceRatio === null ? sourceDistance : H * reflectionRestDistanceRatio;
    var scrollDistance = Math.max(0, sourceDistance - restDistance);
    var scrollProgress = clamp(scrollDistance / Math.max(1, H * 0.54), 0, 1);
    var baseScaleX = 1.55, baseScaleY = 1.5;
    var reflectionScaleX = baseScaleX + scrollProgress * 1.35;
    var reflectionScaleY = baseScaleY + scrollProgress * 1.10;
    // As the reflected image spreads over more water, conserve light by
    // reducing its intensity in proportion to the increased footprint area.
    var areaAttenuation = (baseScaleX * baseScaleY) / (reflectionScaleX * reflectionScaleY);
    var reflectedLight = fade * areaAttenuation;
    var dw = logoW * reflectionScaleX;
    var dh = logoH * reflectionScaleY;
    var pad = 14;
    var rw = Math.max(4, Math.ceil(dw + pad * 2));
    var rh = Math.max(4, Math.ceil(dh + 2));
    try {
      if (!refl) { refl = document.createElement("canvas"); rctx = refl.getContext("2d"); }
      if (!rctx) return;
      if (refl.width !== rw || refl.height !== rh) { refl.width = rw; refl.height = rh; }
      else { rctx.setTransform(1, 0, 0, 1, 0, 0); rctx.globalCompositeOperation = "source-over"; rctx.globalAlpha = 1; rctx.clearRect(0, 0, rw, rh); }
      rctx.imageSmoothingEnabled = true;
      var srcW = logo.width, srcH = logo.height;
      if (reduced) {
        rctx.save();
        rctx.translate(pad, dh);
        rctx.scale(1, -1);
        rctx.drawImage(logo, 0, 0, srcW, srcH, 0, 0, dw, dh);
        rctx.restore();
      } else {
        var slices = Math.max(14, Math.min(28, dh | 0));
        var i, srcY, sH, dy, dsh, wave;
        for (i = 0; i < slices; i++) {
          srcY = (i / slices) * srcH;
          sH = srcH / slices + 0.75;
          dy = (1 - (i + 1) / slices) * dh;
          dsh = dh / slices + 0.85;
          wave = Math.sin(t * 1.55 + i * 0.46) * (1.1 + (i / slices) * 5.2);
          rctx.drawImage(logo, 0, srcY, srcW, sH, pad + wave, dy, dw, dsh);
        }
      }
      rctx.globalCompositeOperation = "multiply";
      rctx.fillStyle = "rgba(118,108,148,0.9)";
      rctx.fillRect(0, 0, rw, rh);
      rctx.globalCompositeOperation = "destination-in";
      var eg = rctx.createRadialGradient(pad + dw * 0.5, dh * 0.38, dw * 0.06, pad + dw * 0.5, dh * 0.42, Math.max(dw, dh) * 0.58);
      eg.addColorStop(0, "rgba(255,255,255,0.9)");
      eg.addColorStop(0.4, "rgba(255,255,255,0.5)");
      eg.addColorStop(0.72, "rgba(255,255,255,0.14)");
      eg.addColorStop(1, "rgba(255,255,255,0)");
      rctx.fillStyle = eg;
      rctx.fillRect(0, 0, rw, rh);
      rctx.globalCompositeOperation = "source-over";
    } catch (e) { return; }

    var rx = glowX;
    var dx = rx - dw * 0.5 - pad;
    // Touch the horizon at rest; drift downward at quarter the O's scroll speed so
    // the reflection lingers in view while remaining connected to its source.
    var reflectionScrollFactor = 0.25;
    var reflectionHorizon = horizonAt(rx);
    var dy0 = reflectionHorizon + 1 + scrollDistance * reflectionScrollFactor;
    var reflectionCenterY = dy0 + dh * 0.42;
    ctx.save();
    clipWater();
    var bloomR = Math.max(logoW, logoH) * 1.2;
    // Leave a soft liquid smear at the source horizon while the larger image
    // drifts down. It tracks the O horizontally, but its vertical anchor stays put.
    var smearWidth = logoW * 2.6;
    var smearDepth = Math.max(16, logoH * 0.45);
    var shimmer = 0.9 + 0.1 * Math.sin(t * 1.1);
    var horizonSmear = ctx.createRadialGradient(rx, reflectionHorizon + 3, 0, rx, reflectionHorizon + 4, smearWidth * 0.58);
    horizonSmear.addColorStop(0, rgba({ r: 210, g: 219, b: 238 }, 0.12 * reflectedLight * shimmer));
    horizonSmear.addColorStop(0.45, rgba({ r: 174, g: 190, b: 218 }, 0.045 * reflectedLight * shimmer));
    horizonSmear.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = horizonSmear;
    ctx.fillRect(rx - smearWidth * 0.5, reflectionHorizon, smearWidth, smearDepth);

    var bg = ctx.createRadialGradient(rx, Math.max(horizonY + 6, reflectionCenterY - dh * 0.15), 0, rx, reflectionCenterY, bloomR);
    bg.addColorStop(0, rgba(pal2, 0.20 * reflectedLight));
    bg.addColorStop(0.45, rgba(pal, 0.07 * reflectedLight));
    bg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = bg;
    ctx.fillRect(rx - bloomR, horizonY, bloomR * 2, Math.min(H - horizonY, bloomR * 1.7));
    ctx.globalAlpha = reflectedLight * 0.72;
    try { ctx.drawImage(refl, dx, dy0); } catch (e2) {}
    ctx.globalAlpha = reflectedLight * 0.18;
    try { ctx.drawImage(refl, dx + 0.7, dy0 + 0.5); } catch (e3) {}
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // Render order: clear -> sky glow -> lake -> mirrored logo reflection -> grain.
  function paint(t) {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    if (H < 4 || W < 4) return;
    var skyY = horizonY - H * 0.14;
    var spread = W * 0.28;
    var R = Math.min(W, H) * 0.62;
    // Every logo-linked glow must reach zero when the O leaves the viewport.
    // Keep the dark lake itself, but don't leave a ghost reflection behind.
    var waterGlow = clamp(reflFade, 0, 1);
    // Viewport frame shares the same loop, palette, and horizon fade: no new
    // animation loop, no extra canvas. Four 1px DOM edges tinted from the
    // live logo palette; opacity follows the shared waterGlow fade.
    try {
      if (!frameEl) frameEl = document.getElementById("viewport-frame");
      if (frameEl && frameEl.style) {
        frameEl.style.borderColor = rgba(pal2, 0.08 + 0.30 * waterGlow);
        frameEl.style.opacity = (0.35 + 0.65 * waterGlow).toFixed(3);
      }
    } catch (e) {}

    // - sky glow -
    var sky = ctx.createLinearGradient(0, 0, 0, horizonY);
    sky.addColorStop(0, "#000000");
    sky.addColorStop(0.55, "#050309");
    sky.addColorStop(0.82, rgba({ r: pal.r * 0.14, g: pal.g * 0.10, b: pal.b * 0.22 }, waterGlow));
    sky.addColorStop(1, rgba(pal, 0.30 * waterGlow));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, Math.max(1, horizonY + horizonArch + 1));

    var g1 = ctx.createRadialGradient(glowX, skyY, 0, glowX, skyY, R);
    g1.addColorStop(0, rgba(pal2, 0.30 * waterGlow));
    g1.addColorStop(0.35, rgba(pal, 0.13 * waterGlow));
    g1.addColorStop(0.65, rgba(pal3, 0.05 * waterGlow));
    g1.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, W, Math.max(1, horizonY + 2));

    var g2 = ctx.createRadialGradient(glowX, skyY, 0, glowX, skyY, R * 0.34);
    g2.addColorStop(0, rgba(pal2, 0.34 * waterGlow));
    g2.addColorStop(0.55, rgba(pal, 0.12 * waterGlow));
    g2.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g2;
    ctx.fillRect(glowX - R * 0.4, skyY - R * 0.4, R * 0.8, R * 0.8);

    // Soft atmosphere hugs the arched horizon and fades upward into the sky.
    ctx.save();
    traceSkyPath();
    ctx.clip();
    var atmosphere = ctx.createLinearGradient(0, horizonY - H * 0.24, 0, horizonY + horizonArch);
    atmosphere.addColorStop(0, "rgba(180,196,220,0)");
    atmosphere.addColorStop(0.68, rgba({ r: 180, g: 196, b: 220 }, 0.025 * waterGlow));
    atmosphere.addColorStop(1, rgba({ r: 194, g: 204, b: 224 }, 0.10 * waterGlow));
    ctx.fillStyle = atmosphere;
    ctx.fillRect(0, horizonY - H * 0.24, W, H * 0.24 + horizonArch * 2);
    ctx.restore();

    // - horizon surface (reflective band, lower ~38% of viewport) -
    var surfH = H - horizonY;
    if (surfH < 1) surfH = 1;
    var surf = ctx.createLinearGradient(0, horizonY, 0, H);
    surf.addColorStop(0, rgba(pal2, 0.40 * waterGlow));
    surf.addColorStop(0.12, rgba(pal, 0.26 * waterGlow));
    surf.addColorStop(0.34, rgba(pal, 0.12 * waterGlow));
    surf.addColorStop(0.62, "rgba(8,5,16,0.72)");
    surf.addColorStop(1, "#000000");
    ctx.fillStyle = surf;
    ctx.save();
    clipWater();
    ctx.fillRect(0, horizonY - horizonArch, W, surfH + horizonArch);
    ctx.restore();

    // Soft side falloff so the lake reads ~50% width, centred on the O logo light.
    var cxN = glowX / W;
    var lN = clamp((glowX - spread) / W, 0, 1);
    var rN = clamp((glowX + spread) / W, 0, 1);
    var shade = ctx.createLinearGradient(0, 0, W, 0);
    shade.addColorStop(0, "rgba(0,0,0,0.92)");
    shade.addColorStop(clamp(lN * 0.55, 0, 1), "rgba(0,0,0,0.55)");
    shade.addColorStop(clamp(cxN, 0, 1), "rgba(0,0,0," + (0.92 * (1 - waterGlow)) + ")");
    shade.addColorStop(clamp(rN + (1 - rN) * 0.45, 0, 1), "rgba(0,0,0,0.55)");
    shade.addColorStop(1, "rgba(0,0,0,0.92)");
    ctx.fillStyle = shade;
    ctx.save();
    clipWater();
    ctx.fillRect(0, horizonY - horizonArch, W, surfH + horizonArch);
    ctx.restore();

    // Subtle neutral horizon arc; reflection coloration stays below the line.
    ctx.beginPath();
    ctx.moveTo(0, horizonY + horizonArch);
    ctx.quadraticCurveTo(W * 0.5, horizonY - horizonArch, W, horizonY + horizonArch);
    ctx.strokeStyle = "rgba(205,214,228,0.12)";
    ctx.lineWidth = 1;
    ctx.stroke();

    drawLogoReflection(t);

    // Depth falloff toward the bottom edge.
    var tail = ctx.createLinearGradient(0, H * 0.72, 0, H);
    tail.addColorStop(0, "rgba(0,0,0,0)");
    tail.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = tail;
    ctx.fillRect(0, H * 0.72, W, H * 0.28);

    // - grain (fine, cheap, pre-generated tile) -
    try {
      if (grainTile) {
        if (!grainPat) grainPat = ctx.createPattern(grainTile, "repeat");
        if (grainPat) {
          ctx.save();
          ctx.globalAlpha = 0.055;
          var gx = reduced ? 0 : ((Math.random() * 128) | 0);
          var gy = reduced ? 0 : ((Math.random() * 128) | 0);
          ctx.translate(gx, gy);
          ctx.fillStyle = grainPat;
          ctx.fillRect(-gx, -gy, W + 1, H + 1);
          ctx.restore();
        }
      }
    } catch (e) {}
    ctx.globalAlpha = 1;
  }

  function loop(nowMs) {
    frame++;
    if (frame % 45 === 0) sampleLogo();
    updateGlow();
    var k = 0.06;
    pal.r += (tgt.r - pal.r) * k; pal.g += (tgt.g - pal.g) * k; pal.b += (tgt.b - pal.b) * k;
    pal2.r += (tgt2.r - pal2.r) * k; pal2.g += (tgt2.g - pal2.g) * k; pal2.b += (tgt2.b - pal2.b) * k;
    pal3.r += (tgt3.r - pal3.r) * k; pal3.g += (tgt3.g - pal3.g) * k; pal3.b += (tgt3.b - pal3.b) * k;
    var t = (nowMs - t0) / 1000;
    paint(t);
    requestAnimationFrame(loop);
  }

  function paintReduced() {
    sampleLogo();
    pal.r = tgt.r; pal.g = tgt.g; pal.b = tgt.b;
    pal2.r = tgt2.r; pal2.g = tgt2.g; pal2.b = tgt2.b;
    pal3.r = tgt3.r; pal3.g = tgt3.g; pal3.b = tgt3.b;
    updateGlow();
    paint(1.4);
  }

  var onResize = function () { resize(); if (reduced) paintReduced(); };
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("orientationchange", onResize, { passive: true });
  document.addEventListener("visibilitychange", function () { if (!document.hidden && !reduced) resize(); });
  window.addEventListener("scroll", function () {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(function () {
      scrollQueued = false;
      updateGlow();
      if (reduced) paintReduced();
    });
  }, { passive: true });

  resize();
  sampleLogo();
  updateGlow();
  // Fully local procedural horizon - no WebSocket / shared-bg-v2 dependency.
  if (reduced) {
    paintReduced();
  } else {
    setTimeout(sampleLogo, 600);
    setTimeout(sampleLogo, 1400);
    requestAnimationFrame(loop);
  }
})();
`;

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
    var jsSec = { 'content-type': 'application/javascript; charset=utf-8', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer' };
    if (p === '/logo.js') return new Response(LOGO_JS, { headers: Object.assign({ 'cache-control': 'public, max-age=3600' }, jsSec) });
    if (p === '/shared-bg-client.js') return new Response(CLIENT_JS, { headers: Object.assign({ 'cache-control': 'public, max-age=60, must-revalidate' }, jsSec) });
    if (p === '/' || p === '/index.html') return new Response(PAGE, { headers: { 'content-type': 'text/html; charset=utf-8', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'cache-control': 'public, max-age=60' } });
    if (p === '/api/status') return json({ ok: true, service: 'chode-hq', version: '1.6.0', ts: Date.now(), providers: 17, freeTiers: 10 });
    return json({ ok: false, error: 'not found' }, 404);
  }
};
