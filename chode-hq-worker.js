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
<meta name="description" content="chode is the world's most resilient AI coding harness. 33 providers, automatic fallback, production output. Never stops.">
<meta name="robots" content="index,follow">
<meta property="og:type" content="website">
<meta property="og:title" content="chode — Never stops coding">
<meta property="og:description" content="33 AI providers. Auto-fallback. Production output. The last coding harness you'll ever need.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{--g:#22dd55;--g2:#3dffa0;--g3:#1aaf44;--bg:#0a0a0a;--surface:rgba(13,26,18,.6);--border:rgba(34,221,85,.12);--border-hover:rgba(34,221,85,.3);--text:#e8f5e9;--text-dim:#a5d6a7;--muted:#5c9e68;--radius:16px;--radius-sm:10px;--fm:'IBM Plex Mono',ui-monospace,SFMono-Regular,Menlo,monospace;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth;background:#000}
body{background:#000;color:var(--text);font-family:var(--fm);overflow-x:hidden;-webkit-font-smoothing:antialiased;position:relative;min-height:100vh}

/* ── Background ── */
.bg-orb-holder{position:fixed;inset:0;z-index:0;pointer-events:none;background:#000;overflow:hidden}
#bgfx-frame{position:absolute;left:0;top:0;width:300vmin;height:300vmin;border:0;display:block;transform-origin:50% 50%;transform:translate(calc(var(--ox,50vw) - 150vmin),calc(var(--oy,40vh) - 150vmin)) scale(.67);filter:contrast(1.45) saturate(1.05);opacity:.8}
@media(prefers-reduced-motion:reduce){#bgfx-frame{display:none}}

/* ── Layout ── */
.page{position:relative;z-index:2;max-width:1100px;margin:0 auto;padding:0 24px}
section{padding:100px 0}

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
.hero{min-height:100vh;display:flex;flex-direction:column;justify-content:center;padding:120px 0 80px;position:relative}
.hero-badge{display:inline-flex;align-items:center;gap:8px;background:var(--surface);border:1px solid var(--border);border-radius:99px;padding:6px 16px;font-size:12px;color:var(--text-dim);width:fit-content;margin-bottom:32px}
.hero-badge .dot{width:6px;height:6px;border-radius:50%;background:var(--g);animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
.hero h1{font-size:clamp(48px,8vw,96px);font-weight:700;line-height:.95;letter-spacing:-.04em;margin-bottom:24px}
.hero h1 .accent{color:var(--g)}
.hero-sub{font-size:clamp(16px,2vw,20px);color:var(--text-dim);line-height:1.6;max-width:600px;margin-bottom:40px}
.hero-actions{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:64px}
.hero-stats{display:flex;gap:48px;flex-wrap:wrap}
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
.install-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:28px}
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
</style>
</head>
<body>
<style id="z6-logo-style">
  #logo-wrapper{position:fixed;top:1.2rem;left:1.2rem;width:44px;height:44px;border-radius:50%;overflow:hidden;z-index:9999;box-shadow:0 0 20px rgba(192,132,252,.15);border:1px solid rgba(168,85,247,.25);background:#010102;pointer-events:none}
  canvas#logo{width:100%;height:100%;display:block}
  @media(max-width:768px){#logo-wrapper{width:36px;height:36px;top:.8rem;left:.8rem}}
</style>
<div id="logo-wrapper"><canvas id="logo"></canvas></div>
<script src="/logo.js"></script>
<div class="bg-orb-holder"></div>
<script>
(function(){
  var holder=document.querySelector('.bg-orb-holder');
  if(!holder||!window.matchMedia)return;
  var conn=navigator.connection||{};
  if(matchMedia('(prefers-reduced-motion: reduce)').matches||conn.saveData||!matchMedia('(hover: hover) and (pointer: fine)').matches)return;
  var frame=null;
  function mount(){
    if(frame||document.hidden)return;
    frame=document.createElement('iframe');frame.id='bgfx-frame';
    frame.setAttribute('sandbox','allow-scripts allow-same-origin');
    frame.setAttribute('referrerpolicy','no-referrer');
    frame.setAttribute('loading','lazy');
    frame.setAttribute('tabindex','-1');
    frame.setAttribute('aria-hidden','true');
    frame.setAttribute('title','Decorative backdrop');
    frame.src='https://boundaries-bg.fogeboro.workers.dev/';
    holder.appendChild(frame);
  }
  var idle=window.requestIdleCallback||function(f){return setTimeout(f,1500)};
  idle(mount);
  addEventListener('resize',function(){if(frame){frame.style.width=Math.ceil(2*Math.max(innerWidth,innerHeight))+'px';frame.style.height=frame.style.width}});
})();
</script>
<div class="page">
<header class="site-header">
  <a href="/" class="header-brand">
    <div class="header-logo">c</div>
    <span class="header-title">chode</span>
  </a>
  <nav class="header-nav">
    <a href="#features">Features</a>
    <a href="#providers">Providers</a>
    <a href="#install">Install</a>
    <a href="https://github.com/fogennnnn/chode" target="_blank">GitHub</a>
  </nav>
  <div class="header-cta">
    <a href="#install" class="btn btn-ghost">Get started</a>
  </div>
</header>

<section class="hero">
  <div class="hero-badge reveal"><span class="dot"></span> 33 providers · auto-fallback · zero lock-in</div>
  <h1 class="reveal reveal-delay-1">The coding<br>harness that<br><span class="accent">never stops</span></h1>
  <p class="hero-sub reveal reveal-delay-2">When one AI provider dies, chode is already gone. 33 endpoints. Exponential backoff. Checkpoint recovery. Your session keeps moving.</p>
  <div class="hero-actions reveal reveal-delay-3">
    <a href="#install" class="btn btn-primary btn-lg">Install chode &rarr;</a>
    <a href="https://github.com/fogennnnn/chode" target="_blank" class="btn btn-ghost btn-lg">View on GitHub</a>
  </div>
  <div class="hero-stats reveal reveal-delay-3">
    <div class="stat"><span class="stat-value">33</span><span class="stat-label">Providers</span></div>
    <div class="stat"><span class="stat-value">22</span><span class="stat-label">Free tiers</span></div>
    <div class="stat"><span class="stat-value">5</span><span class="stat-label">Retry attempts</span></div>
    <div class="stat"><span class="stat-value">∞</span><span class="stat-label">Uptime</span></div>
  </div>
</section>

<div class="terminal reveal" style="margin:0 24px">
  <div class="terminal-header">
    <span class="terminal-dot red"></span>
    <span class="terminal-dot yellow"></span>
    <span class="terminal-dot green"></span>
    <span class="terminal-title">chode — terminal</span>
  </div>
  <div class="terminal-body">
    <div><span class="prompt">$</span> <span class="cmd">chode ai "build me a Cloudflare Worker that caches API responses"</span></div>
    <div class="out">&#9733; Probing 33 providers...</div>
    <div class="out">&#9733; OmniRoute Best Free — score 93, 142ms</div>
    <div class="routed">&#9733; Routed to: OmniRoute Best Free</div>
    <div class="success">✓ Generated worker.js (864 bytes)</div>
    <div class="success">✓ Scaffolded wrangler.toml</div>
    <div class="out">Run: cd my-worker && npx wrangler dev</div>
  </div>
</div>

<section class="providers-section" id="providers">
  <div class="providers-header">
    <h2 class="reveal">33 AI providers.<br>One command.</h2>
    <p class="reveal">Auto-routes to the best available. Falls back silently when one fails.</p>
  </div>
  <div class="providers-grid reveal">
    <div class="provider-chip">OmniRoute Auto<span class="count">136 models</span></div>
    <div class="provider-chip">DeepSeek Free<span class="count">no key</span></div>
    <div class="provider-chip">OpenRouter Free<span class="count">no key</span></div>
    <div class="provider-chip">HuggingChat<span class="count">no key</span></div>
    <div class="provider-chip">AI Horde<span class="count">no key</span></div>
    <div class="provider-chip">Auggie AI<span class="count">no key</span></div>
    <div class="provider-chip">The Old LLM<span class="count">no key</span></div>
    <div class="provider-chip">OpenCode Free<span class="count">no key</span></div>
    <div class="provider-chip">AgentRouter<span class="count">no key</span></div>
    <div class="provider-chip">Felo AI<span class="count">no key</span></div>
    <div class="provider-chip">DuckDuckGo AI<span class="count">no key</span></div>
    <div class="provider-chip">Claude<span class="count">API key</span></div>
    <div class="provider-chip">GPT-4o mini<span class="count">API key</span></div>
    <div class="provider-chip">Groq<span class="count">API key</span></div>
    <div class="provider-chip">Gemini<span class="count">API key</span></div>
    <div class="provider-chip">Mistral<span class="count">API key</span></div>
    <div class="provider-chip">Perplexity<span class="count">API key</span></div>
    <div class="provider-chip">Cloudflare AI<span class="count">API key</span></div>
    <div class="provider-chip">Cerebras<span class="count">API key</span></div>
    <div class="provider-chip">NVIDIA NIM<span class="count">API key</span></div>
    <div class="provider-chip">Scaleway<span class="count">API key</span></div>
    <div class="provider-chip">Ollama<span class="count">local</span></div>
  </div>
</section>

<section id="features">
  <div class="features-grid">
    <div class="feature-card reveal">
      <div class="feature-icon">&#9889;</div>
      <h3>Never stops</h3>
      <p>5 retries with exponential backoff. When one provider rate-limits, chode switches to the next — silently. Your session continues as if nothing happened.</p>
    </div>
    <div class="feature-card reveal reveal-delay-1">
      <div class="feature-icon">&#9733;</div>
      <h3>Live intelligence</h3>
      <p>30-second health scans across all providers. Composite scoring weights quality, reliability, speed, and recency. The leaderboard updates continuously.</p>
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

<section class="install-section" id="install">
  <div class="providers-header">
    <h2 class="reveal">Get started in 30 seconds</h2>
    <p class="reveal">No accounts. No config. Just code.</p>
  </div>
  <div class="install-cards">
    <div class="install-card reveal">
      <h3>npm global</h3>
      <p>Install once, use anywhere. chode adds itself to your PATH.</p>
      <div class="code-block"><button class="copy-btn" onclick="navigator.clipboard.writeText(this.parentElement.textContent)">copy</button>npm install -g chode</div>
    </div>
    <div class="install-card reveal reveal-delay-1">
      <h3>Start coding</h3>
      <p>Run chode bare for interactive mode, or pass a prompt directly.</p>
      <div class="code-block"><button class="copy-btn" onclick="navigator.clipboard.writeText(this.parentElement.textContent)">copy</button>chode
chode ai "build me a worker"</div>
    </div>
    <div class="install-card reveal reveal-delay-2">
      <h3>From source</h3>
      <p>Clone and run directly. Good for contributing or development.</p>
      <div class="code-block"><button class="copy-btn" onclick="navigator.clipboard.writeText(this.parentElement.textContent)">copy</button>git clone https://github.com/fogennnnn/chode.git
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

<footer>
  <div class="footer-inner">
    <div class="footer-links">
      <a href="https://github.com/fogennnnn/chode" target="_blank">GitHub</a>
      <a href="https://github.com/fogennnnn/chode#readme">Docs</a>
      <a href="https://github.com/fogennnnn/hemo-skills">Skills</a>
      <a href="mailto:inf@oooooooooo.se">Contact</a>
    </div>
    <span class="footer-copy">chode &middot; MIT &middot; 2026</span>
  </div>
</footer>
</div>
<script>
const io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:0.1});
document.querySelectorAll('.reveal').forEach(function(el){io.observe(el)});
addEventListener('DOMContentLoaded',function(){
  var w=document.getElementById('logo-wrapper');
  var s=document.querySelector('.hero h1 .accent');
  if(w&&s&&w.parentElement!==s){s.style.position='relative';var span=document.createElement('span');span.style.cssText='position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:.8em;height:.8em;z-index:0';span.appendChild(w);s.appendChild(span)}
});
</script>
</body>
</html>`;

function json(o, s) { return new Response(JSON.stringify(o), { status: s || 200, headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' } }); }

export default {
  async fetch(request) {
    const url = new URL(request.url); const p = url.pathname;
    if (p === '/' || p === '/index.html') return new Response(PAGE, { headers: { 'content-type': 'text/html; charset=utf-8' } });
    if (p === '/api/status') return json({ ok: true, service: 'chode-hq', ts: Date.now(), providers: 33 });
    return json({ ok: false, error: 'not found' }, 404);
  }
};
