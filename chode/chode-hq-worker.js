import INSTALL_ASSETS from './install-assets.js';
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
<title>chode — The self-healing coding harness</title>
<meta name="description" content="Parallel agents, browser and API tests, reverse engineering, exact math, native MCP and a 184-profile provider catalog. Free-first and open source.">
<meta name="robots" content="index,follow">
<meta property="og:type" content="website">
<meta property="og:url" content="https://chode.borken.app/">
<meta property="og:title" content="chode — Builds, tests, and verifies">
<meta property="og:description" content="Parallel agents, browser and API tests, reverse engineering, exact math, native MCP and a 184-profile provider catalog. Free-first and open source.">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="chode — Builds, tests, and verifies">
<meta name="twitter:description" content="Parallel agents, browser and API tests, reverse engineering, exact math, native MCP and a 184-profile provider catalog. Free-first and open source.">
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
.header-brand{display:flex;align-items:center;flex-shrink:0;text-decoration:none;color:var(--text)}
.header-title{font-size:24px;font-weight:700;letter-spacing:-.02em;white-space:nowrap}
.header-nav{display:flex;align-items:center;gap:28px}
.header-nav a{color:var(--muted);text-decoration:none;font-size:13px;font-weight:500;transition:color .2s}
.header-nav a:hover{color:var(--g)}
.header-cta{display:flex;align-items:center;gap:12px}
.btn{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:99px;font-size:13px;font-weight:600;text-decoration:none;transition:all .2s;font-family:inherit;cursor:pointer;border:none}
.btn-ghost{background:transparent;color:var(--text-dim);border:1px solid var(--border)}
.btn-ghost:hover{border-color:var(--border-hover);color:var(--text)}
.btn-github{background:linear-gradient(135deg,#a855f7,#ec4899);color:#fff;border:1px solid #000;font-weight:700;-webkit-text-stroke:1.5px #000;paint-order:stroke fill}
.btn-github:hover{background:linear-gradient(135deg,#c084fc,#f472b6);box-shadow:0 8px 28px rgba(168,85,247,.28);transform:translateY(-1px)}
.btn-primary{background:var(--g);color:#000;border:1px solid var(--g)}
.btn-primary:hover{background:var(--g2);transform:translateY(-1px);box-shadow:0 8px 32px rgba(34,221,85,.3)}
.btn-lg{padding:14px 28px;font-size:14px}

/* ── Hero ── */
.hero{min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:120px 0 80px;position:relative}
.hero-badge{display:inline-flex;align-items:center;gap:8px;background:var(--surface);border:1px solid var(--border);border-radius:99px;padding:6px 16px;font-size:12px;color:var(--text-dim);width:fit-content;margin-bottom:32px}
.hero-badge .dot{width:6px;height:6px;border-radius:50%;background:var(--g);animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
.hero-title{font-size:clamp(64px,12vw,160px);font-weight:700;line-height:1;letter-spacing:.02em;margin-bottom:24px}
/* Centered strokes paint beneath the fill: 6px leaves a visible 3px outer logo outline. */
.hero-title .chode-wrap{position:relative;display:inline-block;-webkit-text-stroke:6px #000;paint-order:stroke fill}
.hero-title .chode-wrap .o-slot{position:relative;display:inline-block;color:transparent;-webkit-text-stroke:0}
.hero-title .chode-wrap .o-slot #logo-wrapper{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:.82em;height:.82em;z-index:0;border-radius:50%;overflow:hidden;box-shadow:0 0 20px rgba(192,132,252,.15);border:3px solid #000;background:#010102;pointer-events:none}
.hero-title .chode-wrap .o-slot #logo-wrapper canvas#logo{width:100%;height:100%;display:block}
.hero .accent{color:var(--g)}

.hero-sub{font-size:clamp(16px,2vw,20px);color:var(--text-dim);line-height:1.6;max-width:600px;margin:0 auto 40px}
.hero-copy-gap{display:block;height:2.7em;font-size:clamp(20px,2.4vw,26px);line-height:1.35;margin-bottom:14px}
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
#commands .install-cards{grid-template-columns:repeat(auto-fit,minmax(420px,1fr))}
.code-block{position:relative;background:rgba(0,0,0,.5);border:1px solid var(--border);border-radius:var(--radius-sm);padding:16px 62px 16px 16px;font-size:13px;color:var(--g2);overflow-wrap:anywhere;word-break:break-word;line-height:1.7}
.code-block .copy-btn{position:absolute;top:8px;right:8px;background:none;border:none;color:var(--muted);cursor:pointer;font-size:12px;padding:4px 8px;border-radius:4px;font-family:inherit}
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
  #commands .install-cards{grid-template-columns:1fr}
  .viewport-frame{border-width:3px;opacity:.9}
  .site-header{padding:0 16px;height:64px;gap:12px}
  .header-nav{display:flex;gap:14px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}
  .header-nav::-webkit-scrollbar{display:none}
  .header-nav a{font-size:12px;white-space:nowrap}
  .header-title{font-size:22px}
  .header-cta{flex-shrink:0}
  .header-cta .btn{padding:8px 14px;font-size:12px;white-space:nowrap}
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

/* Compact overview, complete progressive reference. */
#features,#providers,#commands,#how,#install,#compare{padding-top:48px;padding-bottom:48px;scroll-margin-top:88px}
#features .providers-header,#providers .providers-header,#commands .providers-header,#how .providers-header,#install .providers-header,#compare .providers-header{margin-bottom:24px}
.capability-grid{margin-top:24px;gap:12px;grid-template-columns:repeat(3,minmax(0,1fr));align-items:start}
.capability{padding:18px;position:relative}.capability:hover,.command-group:hover{transform:none}
.capability summary{cursor:pointer;list-style:none;padding-right:20px}.capability summary::-webkit-details-marker,.command-group summary::-webkit-details-marker{display:none}
.capability summary:after{content:"+";position:absolute;right:18px;top:18px;color:var(--g)}.capability[open] summary:after{content:"−"}
.capability summary span{display:block;color:var(--text-dim);font-size:13px;line-height:1.6;min-height:4.8em}
.capability h3{font-size:16px;margin-bottom:6px}.capability-body{border-top:1px solid var(--border);margin-top:14px;padding-top:14px}.capability-body p{font-size:13px}.capability-tags{margin-top:12px;color:var(--g)!important;font-size:11px!important;overflow-wrap:anywhere}
.section-note{font-size:12px;color:var(--muted);line-height:1.7;text-align:center;margin:20px 0 0}
.provider-details,.workflow-details{border:1px solid var(--border);border-radius:12px;padding:16px 20px}.provider-details summary,.workflow-details summary,#compare details>summary{cursor:pointer;color:var(--text-dim);font-size:14px}.provider-details .providers-grid{margin-top:20px}
#commands .install-cards{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;align-items:start;margin-top:20px}
.command-group{padding:16px 18px}.command-group summary{display:flex;justify-content:space-between;gap:16px;cursor:pointer;list-style:none;font-size:15px;font-weight:600}.command-group summary:before{content:"+";color:var(--g)}.command-group[open] summary:before{content:"−"}.command-group summary>span:first-child{flex:1}.command-count{font-size:11px;font-weight:400;color:var(--muted);white-space:nowrap}.command-group[open] summary{margin-bottom:16px}
.command-search{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:20px;text-align:left}.command-search label{font-size:13px;color:var(--text-dim)}.command-search input{flex:1;min-width:180px;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px 12px;color:var(--text);font:inherit;font-size:13px}.command-search [role=status]{font-size:11px;color:var(--muted)}#commands [hidden]{display:none!important}
#how .install-cards{margin-top:20px}.benchmark-brief{display:grid;gap:10px;border:1px solid var(--border);border-radius:12px;padding:20px;font-size:14px;line-height:1.65}.benchmark-brief strong{font-size:22px;color:var(--text)}.benchmark-brief span,.benchmark-brief p{color:var(--text-dim)}.benchmark-brief a{font-size:12px}#compare details{margin-top:16px}#compare details>summary{padding:12px 0}
@media(max-width:900px){.capability-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:600px){.capability summary span{min-height:0}.capability-grid,#commands .install-cards{grid-template-columns:1fr}.command-search input{width:100%;flex-basis:100%}.command-count{font-size:10px}.providers-header h2{font-size:26px}}
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
    <span class="header-title">chOde</span>
  </a>
  <nav class="header-nav" aria-label="Primary">
    <a href="/metrics">Metrics</a>
    <a href="#features">Features</a>
    <a href="#providers">Providers</a>
    <a href="#commands">Commands</a>
    <a href="#install">Install</a>
    <a href="https://github.com/fogennnnn/chode" target="_blank">GitHub</a>
  </nav>
  <div class="header-cta">
    <a href="#install" class="btn btn-ghost">Get started</a>
  </div>
</header>

<main id="main">
<section class="hero">
  <div class="hero-badge reveal"><span class="dot" aria-hidden="true"></span> <span id="rel-ver">v1.9.39</span> · free-first · open source · build / test / repair</div>
  <h1 class="hero-title reveal reveal-delay-1"><span class="chode-wrap"><span class="logo-letters">ch</span><span class="o-slot">o<span id="logo-wrapper" aria-hidden="true"><canvas id="logo" aria-hidden="true"></canvas></span></span><span class="logo-letters">de</span></span></h1>
  <p class="hero-sub reveal reveal-delay-2"><span class="hero-copy-gap" aria-hidden="true"></span> Parallel agents, browser checks, API tests, reverse engineering and exact math. Build, test, repair and resume with <span class="accent">your models and your tools</span>.</p>
  <div class="hero-actions reveal reveal-delay-3">
    <a href="#install" class="btn btn-primary btn-lg">Install chode &rarr;</a>
    <a href="https://github.com/fogennnnn/chode" target="_blank" class="btn btn-github btn-lg">View on GitHub</a>
  </div>
  <div class="hero-stats reveal reveal-delay-3">
    <div class="stat"><span class="stat-value">184</span><span class="stat-label">Provider profiles</span></div>
    <div class="stat"><span class="stat-value">37</span><span class="stat-label">Workspace commands</span></div>
    <div class="stat"><span class="stat-value">3</span><span class="stat-label">API test engines</span></div>
    <div class="stat"><span class="stat-value">MCP</span><span class="stat-label">Native integrations</span></div>
  </div>
</section>

<div class="terminal reveal" id="demo-terminal">
  <div class="terminal-header">
    <span class="terminal-dot red" aria-hidden="true"></span>
    <span class="terminal-dot yellow" aria-hidden="true"></span>
    <span class="terminal-dot green" aria-hidden="true"></span>
    <span class="terminal-title">chode — terminal</span>
  </div>
  <div class="terminal-body" id="term-body" role="status" aria-label="chode terminal demo: plans, builds, and verifies a page">
    <div class="term-step show"><span class="prompt">$</span> <span class="cmd" id="typed-cmd"></span><span class="caret" id="term-caret" aria-hidden="true"></span></div>
    <div class="term-step out">&#9733; Plan split into 3 independent steps</div>
    <div class="term-step out">&#9733; Workers running: layout, copy, form</div>
    <div class="term-step routed">&#9733; Scoped writes enforced</div>
    <div class="term-step success">✓ Browser check · desktop + mobile</div>
    <div class="term-step success">✓ Form submitted · no console errors</div>
    <div class="term-step success">✓ VERIFIED · screenshots saved</div>
    <div class="term-step success">✓ Session saved · /resume available</div>
    <noscript><div class="out">$ chode ai "build a launch page with a working contact form"<br>&#9733; Plan split into 3 independent steps<br>&#9733; Workers running: layout, copy, form<br>&#9733; Scoped writes enforced<br>✓ Browser check · desktop + mobile<br>✓ Form submitted · no console errors<br>✓ VERIFIED · screenshots saved<br>✓ Session saved · /resume available</div></noscript>
  </div>
</div>

<section id="features" class="compact-section">
  <div class="providers-header"><h2>What you can do</h2><p>The core workflow up front. Tools, commands and requirements one click deeper.</p></div>
  <div class="features-grid capability-grid"><details class="feature-card capability"><summary><h3>Build &amp; orchestrate</h3><span>A native terminal workspace, planning and scoped parallel agents.</span></summary><div class="capability-body"><p>Use one-shot prompts, interactive sessions, projects or isolated tasks. Parallel workers own separate files; the parent integrates changes. Worktrees and grouped edits keep larger changes reviewable.</p><p class="capability-tags">plan · task · worktree · edits</p></div></details>
<details class="feature-card capability"><summary><h3>Check &amp; repair</h3><span>Acceptance tests, browser checks and automatic repair rounds.</span></summary><div class="capability-body"><p>Run protected checks with --check. Optional Chromium checks desktop/mobile pages, forms, controls, assets and console errors. Failed checks feed repair; independent AI review is used when reachable. Incomplete work stays labelled incomplete.</p><p class="capability-tags">verify · --check · /retry</p></div></details>
<details class="feature-card capability"><summary><h3>Connect &amp; compute</h3><span>Free-first routing, your API keys, local models and native MCP.</span></summary><div class="capability-body"><p>Interactive provider/model setup, 184 connection profiles and Ollama. Native HTTP/stdio MCP supports compatible OAuth, with Cloudflare, GitHub, Context7, OpenAI docs and Wolfram presets. Standalone Wolfram calculations use zero model calls; service access still applies.</p><p class="capability-tags">connect · models · /free · /reset</p></div></details>
<details class="feature-card capability"><summary><h3>Inspect &amp; research</h3><span>Web sources, dependency reconnaissance and reverse engineering.</span></summary><div class="capability-body"><p>Fetch sources and inspect repositories with dev-recon. Optional REA examines local binaries and packaged apps. Discover installable tools and read project/user skills when a task needs another capability. Sources and tool evidence stay inspectable.</p><p class="capability-tags">tools · skills · tool · audit</p></div></details>
<details class="feature-card capability"><summary><h3>Test APIs</h3><span>HTTP journeys, generated contract checks and load tests.</span></summary><div class="capability-body"><p>Three optional engines: Hurl for repeatable HTTP workflows, Schemathesis for OpenAPI/GraphQL contract checks and k6 for load testing. Native exit statuses and output are recorded as evidence; registration alone does not certify a tool works.</p><p class="capability-tags">Hurl · Schemathesis · k6</p></div></details>
<details class="feature-card capability"><summary><h3>Remember &amp; recover</h3><span>Saved prompts, sessions, checkpoints and bounded build context.</span></summary><div class="capability-body"><p>Resume sessions and queued work; inspect logs, jobs, checkpoints and undoable edits. Grounded project notes and retained observations carry context between turns. Optional reliability memory uses HELIOS hash anchors. Explicit approvals protect blocked actions.</p><p class="capability-tags">/sessions · /queue · /rewind · undo · memory</p></div></details></div>
  <p class="section-note">MIT licensed · Windows, macOS &amp; Linux · Browser, RE and API engines are optional additions.</p>
</section>


<section class="providers-section" id="providers">
  <div class="providers-header">
    <h2 class="reveal">184 provider profiles.<br>Your choice of models.</h2>
    <p class="reveal">Built-in free-first routing plus an expanded provider catalog. Connect your own key, choose a model, or run locally with Ollama. Catalog listings describe connection options; account access and quotas depend on the provider.</p>
  </div>
  <details class="provider-details"><summary>Explore the 17 built-in routes and access tiers</summary><div class="providers-grid">
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
  </div></details>
</section>

<section class="install-section" id="commands">
  <div class="providers-header">
    <h2>Command reference</h2>
    <p>All 72 CLI examples, grouped by task. Expand a group or search below.</p><div class="command-search" id="command-search-box" hidden><label for="command-search">Find a command</label><input id="command-search" type="search" placeholder="Try resume, model, API or undo" aria-controls="command-groups"><span id="command-matches" role="status" aria-live="polite">72 examples in 11 groups</span></div>
  </div>
  <div class="install-cards" id="command-groups">
    <details class="install-card command-group">
      <summary><span>AI</span><span class="command-count">9 examples</span></summary>
      <p>One-shot answers, interactive sessions, and multi-step projects.</p>
      <div class="code-block">chode ai "your prompt"</div>
      <p>One-shot: routes to the best live provider and keeps going when one fails.</p>
      <div class="code-block">chode</div>
      <p>Bare run: opens an interactive session and restores your checkpoint.</p>
      <div class="code-block">chode ai --force groq "prompt"</div>
      <p>--force: pin one provider instead of auto-routing.</p>
      <div class="code-block">chode ai --resume</div>
      <p>--resume: interrupts are forgiven — continue exactly where you stopped.</p>
      <div class="code-block">chode ai "fix @file worker.js"</div>
      <p>@file: point the prompt at repo files to give it context.</p>
      <div class="code-block">chode project "launch plan"</div>
      <p>project: breaks a spec into steps and works the queue. project --resume continues the same queue.</p>
      <div class="code-block">chode execute "prompt"</div>
      <p>execute: run once with tools and verification.</p>
      <div class="code-block">chode task "do X"</div>
      <p>task: isolated subagent with its own session, no nesting.</p>
      <div class="code-block">chode plan "goal"</div>
      <p>plan: read-only plan. Inspects, never modifies.</p>
    </details>
    <details class="install-card command-group">
      <summary><span>Verification</span><span class="command-count">3 examples</span></summary>
      <p>Completion has to survive contact with the output.</p>
      <div class="code-block">chode ai "build the site" --check test.cjs</div>
      <p>--check: repair until the acceptance test passes.</p>
      <div class="code-block">chode verify test.cjs</div>
      <p>verify: run and record an immutable acceptance check.</p>
      <div class="code-block">chode ai "build a landing page"</div>
      <p>Generated HTML gets a headless Chromium pass when available; browser failures feed the repair loop.</p>
    </details>
    <details class="install-card command-group">
      <summary><span>Discovery</span><span class="command-count">5 examples</span></summary>
      <p>See what is actually working right now.</p>
      <div class="code-block">chode status</div>
      <p>Full health dashboard, one line per provider.</p>
      <div class="code-block">chode scan</div>
      <p>Probe all 17 providers with per-provider result lines.</p>
      <div class="code-block">chode score</div>
      <p>Live leaderboard, ranked by composite score.</p>
      <div class="code-block">chode heal</div>
      <p>Force a full re-scan and clear tripped circuit breakers.</p>
      <div class="code-block">chode research</div>
      <p>research: re-probe keyless endpoints and grow the provider overlay.</p>
    </details>
    <details class="install-card command-group">
      <summary><span>Security</span><span class="command-count">2 examples</span></summary>
      <p>Audits that redact secrets before they reach the report.</p>
      <div class="code-block">chode audit</div>
      <p>Full audit — writes masked markdown reports.</p>
      <div class="code-block">chode audit --no-ai</div>
      <p>Static-only audit: no AI calls, no data leaves the machine.</p>
    </details>
    <details class="install-card command-group">
      <summary><span>Keys</span><span class="command-count">5 examples</span></summary>
      <p>Free-tier keys in, validated before they are saved.</p>
      <div class="code-block">chode auth groq [key]</div>
      <p>auth: validates the key, then saves it.</p>
      <div class="code-block">chode provision</div>
      <p>provision: guided setup for every free-tier key.</p>
      <div class="code-block">chode quickkey deepseek</div>
      <p>quickkey: signup link and instructions per provider.</p>
      <div class="code-block">chode models</div>
      <p>models: list all 17 registered providers.</p>
      <div class="code-block">chode connect [provider]</div>
      <p>connect: interactive provider, model and browser login setup.</p>
    </details>
    <details class="install-card command-group">
      <summary><span>Scaffolding</span><span class="command-count">3 examples</span></summary>
      <p>Generate workers, skills, and a healthy toolchain.</p>
      <div class="code-block">chode new my-worker</div>
      <p>new: scaffolds a production Cloudflare Worker.</p>
      <div class="code-block">chode new my-skill --skill</div>
      <p>--skill: scaffolds a reusable HEMO skill pack.</p>
      <div class="code-block">chode deps</div>
      <p>deps: checks tooling, installs what is missing.</p>
    </details>
    <details class="install-card command-group">
      <summary><span>Sessions &amp; agents</span><span class="command-count">6 examples</span></summary>
      <p>History you can inspect, agents you can dispatch.</p>
      <div class="code-block">chode session list</div>
      <p>session list / show / reset: inspect or wipe saved sessions.</p>
      <div class="code-block">chode agents run worker-1 "task"</div>
      <p>agents add / run / list / status: dispatch work to local, SSH, or HTTP agents.</p>
      <div class="code-block">chode skills</div>
      <p>skills: browse reusable skill packs for the agent workforce.</p>
      <div class="code-block">chode worktree list|create|remove</div>
      <p>worktree: isolated workspace copies per task.</p>
      <div class="code-block">chode rewind [id]</div>
      <p>rewind: restore files to a checkpoint.</p>
      <div class="code-block">chode jobs</div>
      <p>jobs: background shell jobs with log attach.</p>
    </details>
    <details class="install-card command-group">
      <summary><span>Ops</span><span class="command-count">10 examples</span></summary>
      <p>Run it like infrastructure, not a script.</p>
      <div class="code-block">chode monitor</div>
      <p>Background health monitor with auto-heal.</p>
      <div class="code-block">chode costs</div>
      <p>Cost report — free tiers track at $0.</p>
      <div class="code-block">chode metrics</div>
      <p>Export system metrics as JSON.</p>
      <div class="code-block">chode login [handle]</div>
      <p>login: optional local identity for metrics sync.</p>
      <div class="code-block">chode whoami</div>
      <p>whoami: show the local metrics identity.</p>
      <div class="code-block">chode logout</div>
      <p>logout: remove the local metrics identity.</p>
      <div class="code-block">chode queue</div>
      <p>Inspect the pending request queue.</p>
      <div class="code-block">chode nosignups</div>
      <p>No-signup AI tools and prompt engineering helpers.</p>
      <div class="code-block">chode update</div>
      <p>Check for harness updates.</p>
      <div class="code-block">chode init</div>
      <p>init: optional first-run setup.</p>
    </details>
    <details class="install-card command-group">
      <summary><span>Workspace &amp; safety</span><span class="command-count">14 examples</span></summary>
      <p>Hands-on tools with undo where it counts.</p>
      <div class="code-block">chode tui</div>
      <p>tui: open the terminal workspace.</p>
      <div class="code-block">chode tool &lt;name&gt; …</div>
      <p>tool: local grep, read, edit, exec, webfetch, websearch and more.</p>
      <div class="code-block">chode tools &lt;list|search|ensure&gt;</div>
      <p>tools: find and install free dev tools.</p>
      <div class="code-block">chode util &lt;subcommand&gt;</div>
      <p>util: offline helpers — hash, uuid, json, tokens and more.</p>
      <div class="code-block">chode memory show|clear</div>
      <p>memory: inspect or clear observed project memory.</p>
      <div class="code-block">chode edits preview|apply</div>
      <p>edits: inspect or apply an undoable batch.</p>
      <div class="code-block">chode undo [change-id]</div>
      <p>undo: undo the latest edit.</p>
      <div class="code-block">chode pending [retry|clear]</div>
      <p>pending: queued tasks that outlived provider outages.</p>
      <div class="code-block">chode reliability status|enable|disable</div>
      <p>reliability: grounded recall with hash-only Helios anchors.</p>
      <div class="code-block">chode helios-record --dry-run</div>
      <p>helios-record: record a work unit on the HELIOS ledger.</p>
    <div class="code-block">chode free on</div><p>Return to automatic free routing, including after selecting an account provider.</p>
<div class="code-block">chode reset --confirm</div><p>Reset settings while keeping project files and history.</p>
<div class="code-block">chode doctor</div><p>Check the installation and local state.</p>
<div class="code-block">chode doctor --fix</div><p>Repair supported configuration problems.</p></details><details class="install-card command-group"><summary><span>Integrations &amp; exact math</span><span class="command-count">7 examples</span></summary><div class="code-block">chode integrations list</div><p>Discover the supported native integration presets.</p>
<div class="code-block">chode integrations setup wolfram --global</div><p>Connect Wolfram for standalone exact calculations; service access still applies.</p>
<div class="code-block">chode integrations setup cloudflare --global</div><p>Configure the native Cloudflare MCP server.</p>
<div class="code-block">chode mcp auth cloudflare</div><p>Complete compatible OAuth sign-in in your browser.</p>
<div class="code-block">chode mcp test cloudflare</div><p>Check the actual MCP handshake and current readiness.</p>
<div class="code-block">chode mcp tools cloudflare</div><p>List the tools available from the connected server.</p>
<div class="code-block">chode mcp list</div><p>Inspect the configured MCP servers.</p></details><details class="install-card command-group"><summary><span>API tests &amp; binary analysis</span><span class="command-count">8 examples</span></summary><div class="code-block">chode api-test list</div><p>List API test engines and supported operations.</p>
<div class="code-block">chode api-test doctor</div><p>Check which optional engines are installed and usable.</p>
<div class="code-block">chode api-test setup hurl</div><p>Install the optional HTTP journey engine.</p>
<div class="code-block">chode api-test run hurl tests/journey.hurl --base-url http://127.0.0.1:3000</div><p>Run a repeatable HTTP workflow against your application.</p>
<div class="code-block">chode api-test run schemathesis openapi.json --base-url http://127.0.0.1:3000 --examples 20</div><p>Generate contract checks from an OpenAPI specification.</p>
<div class="code-block">chode api-test run k6 tests/smoke.js --base-url http://127.0.0.1:3000 --iterations 5 --vus 1</div><p>Run a small load test with the optional k6 engine.</p>
<div class="code-block">chode doctor --rea</div><p>Check the optional reverse-engineering toolchain.</p>
<div class="code-block">chode ai "inspect ./app.exe"</div><p>Bring a local binary into an analysis task using automatic RE routing.</p></details></div></section>

<section class="install-section compact-section" id="how"><div class="providers-header"><h2>One continuous workflow</h2><p>Plan → Build in parallel → Check → Repair → Save &amp; resume</p></div><details class="workflow-details"><summary>Routing, verification and recovery details</summary>  <div class="install-cards">
    <div class="install-card reveal">
      <h3>1 · Prompt in</h3>
      <p>chode loads your session and checkpoint, then turns the request into a plan.</p>
    </div>
    <div class="install-card reveal reveal-delay-1">
      <h3>2 · Leaderboard scoring</h3>
      <p>Providers are scored live: quality 35, reliability 30, latency 20, recency 15.</p>
    </div>
    <div class="install-card reveal reveal-delay-2">
      <h3>3 · Parallel providers</h3>
      <p>The top providers race three at a time. The first good answer wins.</p>
    </div>
    <div class="install-card reveal">
      <h3>4 · Per-provider failover</h3>
      <p>401 skips instantly, 429 gets one retry — then chode is already on the next provider.</p>
    </div>
    <div class="install-card reveal reveal-delay-1">
      <h3>5 · Circuit breaker</h3>
      <p>Three consecutive failures open the circuit. Idle providers heal back in automatically.</p>
    </div>
    <div class="install-card reveal reveal-delay-2">
      <h3>6 · Keyless bootstrap</h3>
      <p>No keys? chode uses local Ollama when it is available. Otherwise it shows ranked free-key guidance, while Kilo, OVHcloud, LLM7, and uncloseai answer keyless with no signup.</p>
    </div>
    <div class="install-card reveal">
      <h3>7 · Parallel plan workers</h3>
      <p>Independent plan steps run in scoped workers, up to three at once. Each worker may write only its assigned files, so edits cannot collide.</p>
    </div>
    <div class="install-card reveal reveal-delay-1">
      <h3>8 · Browser verification</h3>
      <p>HTML and site output is exercised in headless Chromium: console, assets, controls, forms, anchors, and desktop plus mobile layout. Failures trigger repair.</p>
    </div>
    <div class="install-card reveal reveal-delay-2">
      <h3>9 · Checkpoint + session</h3>
      <p>Every result is persisted. Resume continues the same queue, so a crash costs nothing.</p>
    </div>
    <div class="install-card reveal">
      <h3>10 · Cost footer</h3>
      <p>Tokens and spend are tracked per provider. Free tiers stay at $0.</p>
    </div>
    <div class="install-card reveal reveal-delay-1">
      <h3>State layer</h3>
      <p>All state is plain JSON under <code>.chode</code>, plus an append-only usage log. Restart-proof by design.</p>
    </div>
    <div class="install-card reveal reveal-delay-2">
      <h3>Your terminal. Your toolchain.</h3>
      <p>Node 18+, a native terminal workspace and compatible MCP servers. Browser, RE and API tooling can be added when needed. Run <code>chode doctor</code> to check the installation.</p>
    </div>
  </div>
</details></section>

<section class="install-section" id="install">
  <div class="providers-header">
    <h2 class="reveal">Install chode</h2>
    <p class="reveal">No accounts required. Start with the free tiers.</p>
    <p class="reveal">Requires Node.js 18+, npm, and Git. The installer puts the current release in npm’s global command directory and verifies it. Rerun the same command to update. Stale versions, checksum mismatches, and retired fallback code are refused. Confirm with <code>chode --version</code>.</p>
  </div>
  <div class="install-cards">
    <div class="install-card reveal reveal-delay-1">
      <h3>Windows · PowerShell</h3>
      <p>Downloads the latest source, installs the chode command, and verifies the installed version.</p>
      <div class="code-block"><button class="copy-btn" type="button" data-copy aria-label="Copy Windows install command">copy</button>irm https://chode.borken.app/install.ps1 | iex</div>
    </div>
    <div class="install-card reveal reveal-delay-2">
      <h3>macOS / Linux</h3>
      <p>Installs the verified latest release. Start with <code>chode</code> after installation. Uses your configured npm global prefix, which must be writable.</p>
      <div class="code-block"><button class="copy-btn" type="button" data-copy aria-label="Copy Unix install command">copy</button>curl -fsSL https://chode.borken.app/install.sh | sh</div>
    </div>
    <div class="install-card reveal">
      <h3>From source</h3>
      <p>For development only. Use an installer above to install or update. If the destination already exists, Git stops without running an older checkout.</p>
      <div class="code-block"><button class="copy-btn" type="button" data-copy aria-label="Copy clone commands">copy</button>git clone --depth 1 https://github.com/fogennnnn/chode.git</div>
    </div>
  </div>
</section>

<section class="install-section compact-section" id="compare"><div class="providers-header"><h2>Public Python evaluation: 20 of 34 solved</h2><p>Latest measured release: 1.9.28 · strict free mode · all 34 tasks counted</p></div><div class="benchmark-brief"><strong>20 solved · 14 failed</strong><span>30 model calls and up to 1 hour per task</span><span>Original protected tests · independent grading · no manual repairs</span><p>Complete Python track, not the full six-language Aider leaderboard. Newer releases are not yet scored on this protocol.</p><a href="https://github.com/fogennnnn/chode/blob/master/chode/benchmarks/results/full-python-production-1.9.28-2026-10-28.md">All task outcomes and evaluation protocol</a></div>  <details style="margin-top:24px"><summary>Scope, methodology and earlier runs</summary><p class="section-note">No directly comparable Chode leaderboard score yet. Different agents, task sets, models and budgets cannot be ranked as interchangeable results.</p>
  <div class="install-card reveal" style="margin-bottom:24px">
    <h3>Full public benchmark: not measured</h3>
    <p>We have not completed an official full-benchmark evaluation. Missing results mean unmeasured, not zero. A valid comparison needs the same benchmark version, complete task set, evaluator and attempt policy, with models, budgets and environments disclosed.</p>
    <p><a href="https://github.com/fogennnnn/chode/blob/master/chode/benchmarks/COMPARABILITY.md">Evaluation readiness and methodology</a> &middot; <a href="https://www.tbench.ai/" target="_blank" rel="noopener noreferrer">Official Terminal-Bench results</a> &middot; <a href="https://aider.chat/docs/leaderboards/" target="_blank" rel="noopener noreferrer">Official Aider results</a></p>
  </div>
  <div class="providers-header">
    <h3 class="reveal">Five-task development pilots</h3>
    <p class="reveal">Five fixed public Python exercises, used during development. Original tests unchanged; strict free routing; no manual repair. Compare Chode versions only within the same pilot protocol. These are not held-out or full-leaderboard results.</p>
  </div>
  <div class="install-cards" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))">
    <div class="install-card reveal">
      <h3>With protected test feedback</h3>
      <p>Chode 1.9.19: <strong>4 of 5 tasks solved</strong>.<br>Chode 1.9.24: <strong>4 of 5 tasks solved</strong>.</p>
      <p>12 model calls and 420 seconds per task; automatic repair with protected tests, followed by independent grading. The same four tasks pass; pov fails in both runs. Measured 28 October 2026 for 1.9.24.</p>
      <a href="https://github.com/fogennnnn/chode/blob/master/chode/benchmarks/results/polyglot-python-checked-1.9.24-2026-10-28.md">Task results and recorded protocol</a>
    </div>
    <div class="install-card reveal reveal-delay-1">
      <h3>Without test feedback</h3>
      <p>Chode 1.9.19: <strong>0 of 5 tasks solved</strong>.<br>Chode 1.9.24: <strong>1 of 5 tasks solved</strong>.</p>
      <p>6 model calls and 210 seconds per task; tests withheld until independent grading. Only zebra-puzzle passes on 1.9.24. This protocol differs from the protected-test pilot and is not an interchangeable score.</p>
      <a href="https://github.com/fogennnnn/chode/blob/master/chode/benchmarks/results/polyglot-python-pilot-1.9.24-2026-10-28.md">Task results and recorded protocol</a>
    </div>
  </div>
  <p class="reveal" style="margin:24px 0;line-height:1.7">Five tasks are a small sample. Free providers and models can vary between runs; changes do not isolate harness improvements. A task counts as solved only when all its original tests pass. These measurements used 1.9.24, not the latest release.</p>
  <div class="install-card reveal">
    <h3>Recent build check &mdash; not a leaderboard score</h3>
    <p>Chode 1.9.27 built one reservation application in free mode: <strong>35 of 35 acceptance checks passed</strong>, VERIFIED, exit 0, in 107 seconds. No manual code repairs; original checks unchanged. The README was also reviewed for usage, constraints and error behaviour.</p>
    <p>Measured 28 October 2026. This is <strong>one private development task, not 35 benchmark tasks</strong>. It demonstrates this build, not general reliability or superiority over another agent.</p>
    <a href="https://github.com/fogennnnn/chode/blob/master/chode/benchmarks/results/reservations-1.9.27-2026-10-28.json">Build protocol and raw result</a>
  </div>
  </details>
</section>

<section class="cta-section">
  <h2 class="reveal">Ready to build something real?</h2>
  <p class="reveal">chode plans the work, runs independent steps in parallel, and verifies the output before handing it back.</p>
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
      <a href="https://github.com/fogennnnn/chode/issues" target="_blank">Issues</a>
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
// Badge version tracks the live release; static text above is the fallback.
try{fetch('/api/release',{cache:'no-store'}).then(function(r){return r.json()}).then(function(d){if(d&&d.version){var el=document.getElementById('rel-ver');if(el)el.textContent='v'+d.version}}).catch(function(){})}catch(e){}
// Every command snippet gets a copy button, not just the install cards.
document.querySelectorAll('.code-block').forEach(function(block, i){
  if(block.querySelector('.copy-btn'))return;
  var btn=document.createElement('button');
  btn.className='copy-btn';btn.type='button';btn.setAttribute('data-copy','');
  btn.setAttribute('aria-label','Copy command '+(i+1));
  btn.textContent='copy';block.insertBefore(btn,block.firstChild);
});
var commandSearch=document.getElementById('command-search');
if(commandSearch){document.getElementById('command-search-box').hidden=false;var commandGroups=Array.from(document.querySelectorAll('.command-group')),commandExampleCount=document.querySelectorAll('#command-groups .code-block').length;commandSearch.addEventListener('input',function(){var q=commandSearch.value.trim().toLowerCase(),visible=0;commandGroups.forEach(function(group){var match=!q||group.textContent.toLowerCase().includes(q);group.hidden=!match;group.open=!!q&&match;if(match)visible++});document.getElementById('command-matches').textContent=q?visible+(visible===1?' command group matches':' command groups match'):commandExampleCount+' examples in '+commandGroups.length+' groups';});}
var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var term=document.getElementById('demo-terminal');
var cmdText='chode ai "build a launch page with a working contact form"';
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
  var letterSource = null;
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

  // Stable distant points: no twinkle, additional animation loop or network assets.
  var stars = [], starSeed = 73421;
  function starRandom() {
    starSeed = (Math.imul(starSeed, 1664525) + 1013904223) >>> 0;
    return starSeed / 4294967296;
  }
  for (var si = 0; si < 240; si++) {
    stars.push({ x: starRandom(), y: starRandom(), size: 0.65 + starRandom() * 0.7, light: 0.18 + starRandom() * 0.38 });
  }
  function drawStars() {
    var count = Math.min(stars.length, Math.max(36, Math.round(W * H / 8500)));
    for (var i = 0; i < count; i++) {
      var star = stars[i], x = star.x * W, y = star.y * H;
      var altitude = horizonAt(x) - y;
      if (altitude <= 2) continue;
      ctx.fillStyle = rgba({ r: 190, g: 205, b: 235 }, star.light * clamp(altitude / 80, 0, 1));
      ctx.fillRect(x, y, star.size, star.size);
    }
  }

  var horizonHalo = null, haloContext = null, haloKey = "";
  function drawHorizonHalo(light) {
    if (light <= 0) return;
    var key = [W, H, horizonY, horizonArch, Math.round(glowX), pal.r >> 3, pal.g >> 3, pal.b >> 3, pal2.r >> 3, pal2.g >> 3, pal2.b >> 3].join(":");
    if (!horizonHalo) {
      horizonHalo = document.createElement("canvas");
      horizonHalo.id = "horizon-halo";
      haloContext = horizonHalo.getContext("2d");
    }
    if (!haloContext) return;
    if (key !== haloKey) {
      var width = Math.ceil(W), height = Math.ceil(H);
      if (horizonHalo.width !== width || horizonHalo.height !== height) { horizonHalo.width = width; horizonHalo.height = height; }
      else haloContext.clearRect(0, 0, width, height);
      var reach = W * 0.85, centreDepth = Math.max(24, Math.min(72, H * 0.075));
      // Every strip meets the actual curve; both depth and light taper sideways.
      for (var x = 0; x < W; x += 2) {
        var cx = Math.min(W, x + 1), weight = clamp(1 - Math.abs(cx - glowX) / reach, 0, 1);
        var depth = centreDepth * Math.pow(weight, 1.25), intensity = weight * weight;
        if (depth < 0.5) continue;
        var base = horizonAt(cx), band = haloContext.createLinearGradient(cx, base - depth, cx, base);
        band.addColorStop(0, "rgba(0,0,0,0)");
        band.addColorStop(0.45, rgba(pal, 0.16 * intensity));
        band.addColorStop(0.78, rgba(pal2, 0.40 * intensity));
        band.addColorStop(1, rgba(pal2, 0.72 * intensity));
        haloContext.fillStyle = band;
        haloContext.fillRect(x, base - depth, 2, depth + 0.5);
      }
      haloKey = key;
    }
    ctx.globalAlpha = light;
    ctx.drawImage(horizonHalo, 0, 0, W, H);
    ctx.globalAlpha = 1;
  }

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

  function anchorHorizon(canvasRect) {
    if (!document.querySelector) return;
    var title = document.querySelector(".hero-title");
    var copy = document.querySelector(".hero-sub");
    if (!title || !copy) return;
    var tr = title.getBoundingClientRect(), sr = copy.getBoundingClientRect();
    function documentTop(el, rect) {
      if (typeof el.offsetTop !== "number") return rect.top + (window.scrollY || 0);
      var y = 0;
      for (var node = el; node; node = node.offsetParent) y += node.offsetTop || 0;
      return y;
    }
    var titleBottom = documentTop(title, tr) + (title.offsetHeight || tr.height);
    var copyTop = documentTop(copy, sr);
    if (isFinite(titleBottom) && isFinite(copyTop) && copyTop >= titleBottom) {
      horizonY = Math.round((titleBottom + copyTop) * 0.5 - canvasRect.top);
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
    horizonArch = Math.min(64, W * 0.05, H * 0.08);
    anchorHorizon(r);
    reflectionRestDistanceRatio = null;
    letterSource = null;
    if (!glowX) glowX = W * 0.5;
    updateGlow();
  }

  function getLetterSource() {
    if (letterSource) return letterSource;
    if (!document.querySelectorAll || !window.getComputedStyle) return null;
    var wrap = document.querySelector(".chode-wrap");
    var spans = document.querySelectorAll(".hero-title .logo-letters");
    if (!wrap || !spans.length) return null;
    var bounds = wrap.getBoundingClientRect();
    if (bounds.width < 8 || bounds.height < 8) return null;
    var source = document.createElement("canvas");
    source.width = Math.ceil(bounds.width); source.height = Math.ceil(bounds.height);
    var sc = source.getContext("2d");
    if (!sc) return null;
    sc.fillStyle = "#d2b4ef";
    for (var i = 0; i < spans.length; i++) {
      var el = spans[i], rect = el.getBoundingClientRect(), style = window.getComputedStyle(el);
      sc.font = style.fontWeight + " " + style.fontSize + " " + style.fontFamily;
      if ("letterSpacing" in sc) sc.letterSpacing = style.letterSpacing;
      sc.textBaseline = "alphabetic";
      var metrics = sc.measureText(el.textContent);
      var ascent = metrics.fontBoundingBoxAscent || metrics.actualBoundingBoxAscent;
      var descent = metrics.fontBoundingBoxDescent || metrics.actualBoundingBoxDescent || 0;
      var baseline = rect.top - bounds.top + (rect.height - ascent - descent) * 0.5 + ascent;
      sc.fillText(el.textContent, rect.left - bounds.left, baseline);
    }
    var mirror = document.createElement("canvas");
    mirror.width = source.width; mirror.height = source.height;
    var mc = mirror.getContext("2d");
    if (!mc) return null;
    mc.translate(0, source.height); mc.scale(1, -1); mc.drawImage(source, 0, 0);
    var logoRect = document.getElementById("logo-wrapper").getBoundingClientRect();
    letterSource = {canvas:mirror,width:bounds.width,height:bounds.height,offset:logoRect.left + logoRect.width * 0.5 - bounds.left};
    return letterSource;
  }

  function drawLetterReflection(t, scaleY, scrollDistance, light) {
    var source;
    try { source = getLetterSource(); } catch (e) { return; }
    if (!source) return;
    var letterScaleX = 0.90;
    var dw = source.width * letterScaleX, dh = source.height * scaleY;
    var dx = glowX - source.offset * letterScaleX;
    var dy = horizonAt(glowX) + 1 + scrollDistance * 0.25;
    var slices = 28;
    ctx.save(); clipWater();
    ctx.globalCompositeOperation = "screen";
    ctx.filter = "blur(0.6px)";
    function verticalDepth(p) {
      var perspective = Math.pow(p, 0.90);
      return perspective + (reduced ? 0 : 0.012 * Math.sin(t * 1.55 + (slices - 1 - p * slices) * 0.46) * Math.sin(Math.PI * p));
    }
    for (var i = 0; i < slices; i++) {
      var phase = slices - i - 1;
      var wave = reduced ? 0 : Math.sin(t * 1.55 + phase * 0.46) * (1.1 + (phase / slices) * 5.2);
      ctx.globalAlpha = light * 0.045 * Math.pow(1 - i / slices, 1.8);
      ctx.drawImage(source.canvas, 0, i / slices * source.canvas.height, source.canvas.width, source.canvas.height / slices + 0.75,
        dx + wave, dy + verticalDepth(i / slices) * dh, dw, (verticalDepth((i + 1) / slices) - verticalDepth(i / slices)) * dh + 0.85);
    }
    ctx.restore();
  }

  // Shared footprint attenuation keeps atmosphere and reflected light in sync.
  function reflectionLighting() {
    var fade = clamp(reflFade, 0, 1);
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
    return { scrollDistance: scrollDistance, scaleX: reflectionScaleX, scaleY: reflectionScaleY, light: reflectedLight };
  }
  function drawLogoReflection(t) {
    var fade = reflFade;
    if (fade < 0.012 || logoW < 8 || logoH < 8) return;
    var logo = document.getElementById("logo");
    if (!logo || logo.width < 8 || logo.height < 8) return;
    var lighting = reflectionLighting();
    var scrollDistance = lighting.scrollDistance;
    var reflectionScaleX = lighting.scaleX, reflectionScaleY = lighting.scaleY;
    var reflectedLight = lighting.light;
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
    drawLetterReflection(t, reflectionScaleY, scrollDistance, reflectedLight);
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
    var spread = W * 0.28;
    // Every logo-linked glow must reach zero when the O leaves the viewport.
    // Keep the dark lake itself, but don't leave a ghost reflection behind.
    var waterGlow = reflectionLighting().light;
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

    // Clip all sky lighting to the curve so no rectangular glow leaks into the surface.
    ctx.save();
    traceSkyPath();
    ctx.clip();
    // Keep the upper sky neutral; colour belongs only to the shallow horizon halo.
    ctx.fillStyle = "#010102";
    ctx.fillRect(0, 0, W, Math.max(1, horizonY + horizonArch + 1));
    drawStars();
    ctx.restore();

    // A cached tapered light band follows the planet instead of a flat ellipse.
    ctx.save();
    traceSkyPath();
    ctx.clip();
    drawHorizonHalo(waterGlow);
    ctx.restore();

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
    surf.addColorStop(0, "rgba(9,9,14,0.6)");
    surf.addColorStop(0.12, "rgba(7,7,12,0.6)");
    surf.addColorStop(0.34, "rgba(5,5,9,0.65)");
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

    // Illuminated rim is strongest below the logo and disappears at both edges.
    var rim = ctx.createLinearGradient(0, 0, W, 0);
    var rimCenter = clamp(glowX / Math.max(1, W), 0.05, 0.95);
    rim.addColorStop(0, "rgba(0,0,0,0)");
    rim.addColorStop(rimCenter * 0.45, rgba(pal, 0.10 * waterGlow));
    rim.addColorStop(rimCenter, rgba(pal2, 0.88 * waterGlow));
    rim.addColorStop(rimCenter + (1 - rimCenter) * 0.55, rgba(pal, 0.10 * waterGlow));
    rim.addColorStop(1, "rgba(0,0,0,0)");
    ctx.beginPath();
    ctx.moveTo(0, horizonY + horizonArch);
    ctx.quadraticCurveTo(W * 0.5, horizonY - horizonArch, W, horizonY + horizonArch);
    ctx.strokeStyle = rim;
    ctx.lineWidth = 1.5;
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
  if (window.visualViewport) window.visualViewport.addEventListener("resize", onResize, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(onResize);
  if (window.ResizeObserver && document.querySelector) {
    var heroObserver = new window.ResizeObserver(onResize);
    [document.querySelector(".hero-title"), document.querySelector(".hero-sub")].forEach(function (el) { if (el) heroObserver.observe(el); });
  }
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

const METRICS_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#0a0a0a">
<title>chode — Usage metrics</title>
<meta name="description" content="Optional login. Sync local chode token usage and view per-day and per-provider graphs.">
<meta name="robots" content="index,follow">
<link rel="icon" href="data:,">
<style>
:root{--g:#22dd55;--g2:#3dffa0;--bg:#0a0a0a;--surface:rgba(13,26,18,.6);--border:rgba(34,221,85,.12);--text:#e8f5e9;--muted:#a5d6a7;--fm:ui-monospace,SFMono-Regular,Menlo,monospace}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:#000;color:var(--text);font-family:var(--fm);line-height:1.6;padding:0 0 80px}
.page{max-width:1000px;margin:0 auto;padding:0 24px}
.site-header{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 24px;border-bottom:1px solid var(--border);position:sticky;top:0;background:rgba(10,16,10,.85);backdrop-filter:blur(12px)}
.site-header a{color:var(--text);text-decoration:none;font-weight:600}
.site-header nav{display:flex;gap:18px}
.site-header nav a{color:var(--muted);font-weight:500;font-size:13px}
.site-header nav a:hover{color:var(--g)}
h1{font-size:clamp(30px,4vw,46px);margin:40px 0 8px}
.sub{color:var(--muted);margin-bottom:24px;max-width:720px}
.card{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:22px;margin:18px 0}
.card h2{font-size:17px;margin-bottom:10px}
label{display:block;font-size:12px;color:var(--muted);margin:10px 0 4px}
input{width:100%;padding:10px 12px;border-radius:8px;border:1px solid var(--border);background:#000;color:var(--text);font-family:var(--fm)}
.row{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}
.btn{display:inline-block;padding:10px 18px;border-radius:99px;border:1px solid var(--g);background:var(--g);color:#000;font-weight:700;font-size:13px;cursor:pointer;font-family:var(--fm);text-decoration:none}
.btn.ghost{background:transparent;color:var(--text)}
.btn.danger{border-color:#ff6b6b;color:#ff6b6b;background:transparent}
pre{background:rgba(0,0,0,.5);border:1px solid var(--border);border-radius:10px;padding:12px 14px;overflow-x:auto;font-size:13px;color:var(--g2);margin-top:12px}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-top:12px}
.stat{background:rgba(0,0,0,.4);border:1px solid var(--border);border-radius:10px;padding:12px}
.stat .v{font-size:22px;font-weight:700}
.stat .l{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em}
svg.chart{width:100%;height:auto;background:rgba(0,0,0,.4);border:1px solid var(--border);border-radius:10px;margin-top:12px}
.note{font-size:12.5px;color:var(--muted)}
.err{color:#ff8a8a}
.ok{color:var(--g2)}
:focus-visible{outline:2px solid var(--g);outline-offset:2px}
</style>
</head>
<body>
<div class="page">
<header class="site-header"><a href="/">chode</a><nav aria-label="Primary"><a href="/">Home</a><a href="/metrics">Metrics</a><a href="https://github.com/fogennnnn/chode" target="_blank" rel="noopener">GitHub</a></nav></header>
<main>
<h1>Usage metrics</h1>
<p class="sub">Login is optional and only links synced aggregates to a handle you choose. Nothing is tracked until you run <code>chode metrics --sync --yes</code>. Prompts, keys, and file contents are never uploaded — only per-day and per-provider request/token/error counts.</p>
<section class="card" aria-labelledby="login-h"><h2 id="login-h">Optional login</h2>
<p class="note" id="login-state">Not logged in on this browser.</p>
<label for="m-handle">Handle</label><input id="m-handle" autocomplete="off" maxlength="32" placeholder="e.g. workstation">
<label for="m-token">Token (from <code>chode login</code>)</label><input id="m-token" type="password" autocomplete="off" placeholder="paste once, stored only in this browser">
<div class="row"><button class="btn" id="m-save" type="button">Save login</button><button class="btn ghost" id="m-logout" type="button">Log out</button><button class="btn ghost" id="m-load" type="button">Load my graphs</button><button class="btn danger" id="m-delete" type="button">Delete synced data</button></div>
<p class="note">The token is saved only in this browser's local storage and sent only to <code>/api/metrics</code> as a Bearer credential.</p>
</section>
<section class="card" aria-labelledby="graphs-h"><h2 id="graphs-h">Token usage graphs</h2>
<p class="note" id="m-status">Log in, then choose “Load my graphs”.</p>
<div class="stats" id="m-stats"></div>
<h3 style="margin-top:16px;font-size:14px">Tokens per day</h3>
<div id="m-days"></div>
<h3 style="margin-top:16px;font-size:14px">Tokens by provider</h3>
<div id="m-providers"></div>
</section>
<section class="card" aria-labelledby="cli-h"><h2 id="cli-h">Send data from the CLI</h2>
<pre>chode login workstation
chode metrics --export --days 30 --out metrics.json
chode metrics --sync --yes</pre>
<p class="note">Sync is explicit and repeatable. Re-syncing replaces the stored window for that token.</p>
</section>
</main>
</div>
<script>
(function(){
var H=document.getElementById('m-handle'),T=document.getElementById('m-token'),S=document.getElementById('login-state'),M=document.getElementById('m-status'),ST=document.getElementById('m-stats'),D=document.getElementById('m-days'),P=document.getElementById('m-providers');
function id(){try{return JSON.parse(localStorage.getItem('chode.metrics')||'null')}catch(e){return null}}
function setId(v){try{if(v)localStorage.setItem('chode.metrics',JSON.stringify(v));else localStorage.removeItem('chode.metrics')}catch(e){}}
function paintLogin(){var v=id();if(v&&v.token){S.textContent='Logged in as '+v.handle+' on this browser.';H.value=v.handle||''}else{S.textContent='Not logged in on this browser.'}}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function bars(rows,value,label){if(!rows.length)return '<p class="note">No data in this window.</p>';var w=640,bh=22,pad=8,max=1,i;for(i=0;i<rows.length;i++)max=Math.max(max,Number(rows[i][value])||0);var h=pad*2+rows.length*(bh+6);var s='<svg class="chart" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+esc(label)+'">';for(i=0;i<rows.length;i++){var v=Number(rows[i][value])||0;var bw=max>0?Math.max(2,Math.round((w-220)*v/max)):2;var y=pad+i*(bh+6);s+='<text x="8" y="'+(y+15)+'" fill="#a5d6a7" font-size="12">'+esc(rows[i].name).slice(0,24)+'</text>';s+='<rect x="200" y="'+y+'" width="'+bw+'" height="'+bh+'" rx="4" fill="#22dd55" opacity="0.8"/>';s+='<text x="'+(206+bw)+'" y="'+(y+15)+'" fill="#e8f5e9" font-size="12">'+esc(String(v))+'</text>'}return s+'</svg>'}
function stats(t){ST.innerHTML=[['Requests',t.requests],['Tokens',t.tokens],['Errors',t.errors],['Cost USD',Number(t.cost||0).toFixed(4)]].map(function(r){return '<div class="stat"><div class="v">'+esc(String(r[1]))+'</div><div class="l">'+r[0]+'</div></div>'}).join('')}
document.getElementById('m-save').addEventListener('click',function(){var h=String(H.value||'').trim(),t=String(T.value||'').trim();if(!/^[A-Za-z0-9_-]{1,32}$/.test(h)){M.innerHTML='<span class="err">Enter the handle from chode login.</span>';return}if(!/^[a-f0-9]{32,128}$/i.test(t)){M.innerHTML='<span class="err">Enter the token printed once by chode login.</span>';return}setId({handle:h,token:t});T.value='';paintLogin();M.innerHTML='<span class="ok">Saved. Now load your graphs.</span>'});
document.getElementById('m-logout').addEventListener('click',function(){setId(null);paintLogin();ST.innerHTML='';D.innerHTML='';P.innerHTML='';M.textContent='Logged out on this browser. Synced server data is untouched; use Delete to remove it.'});
document.getElementById('m-load').addEventListener('click',function(){var v=id();if(!v){M.innerHTML='<span class="err">Save a login first.</span>';return}M.textContent='Loading…';fetch('/api/metrics',{headers:{authorization:'Bearer '+v.token}}).then(function(r){return r.json().then(function(j){return {status:r.status,body:j}})}).then(function(x){if(x.status!==200||!x.body||x.body.ok!==true){M.innerHTML='<span class="err">'+esc((x.body&&(x.body.error||x.body.reason))||('HTTP '+x.status))+'</span>';return}var b=x.body.record;M.innerHTML='<span class="ok">Updated '+esc(b.updatedAt||'')+' · window '+esc(String(b.days||''))+'d</span>';stats(b.totals||{requests:0,tokens:0,errors:0,cost:0});D.innerHTML=bars((b.byDay||[]).map(function(r){return {name:r.day,value:r.tokens}}),'value','Tokens per day');P.innerHTML=bars((b.byProvider||[]).map(function(r){return {name:r.id,value:r.tokens}}),'value','Tokens by provider')}).catch(function(){M.innerHTML='<span class="err">Could not reach the metrics API.</span>'})});
document.getElementById('m-delete').addEventListener('click',function(){var v=id();if(!v){M.innerHTML='<span class="err">Save a login first.</span>';return}if(!window.confirm('Delete synced metrics for this token?'))return;fetch('/api/metrics',{method:'DELETE',headers:{authorization:'Bearer '+v.token}}).then(function(r){return r.json()}).then(function(j){M.textContent=j&&j.ok?'Deleted synced data.':'Delete failed.';ST.innerHTML='';D.innerHTML='';P.innerHTML=''}).catch(function(){M.innerHTML='<span class="err">Could not reach the metrics API.</span>'})});
paintLogin();
})();
</script>
</body>
</html>`;

function json(o, s) { return new Response(JSON.stringify(o), { status: s || 200, headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' } }); }
function releaseVersion() { try { return JSON.parse(INSTALL_ASSETS['release.json']).version || 'unknown'; } catch (e) { return 'unknown'; } }

async function metricsKey(token) {
  var bytes = new TextEncoder().encode('chode-metrics:' + String(token || ''));
  var digest = await crypto.subtle.digest('SHA-256', bytes);
  return 'metrics:' + Array.prototype.map.call(new Uint8Array(digest), function (b) { return b.toString(16).padStart(2, '0'); }).join('');
}
function metricsBearer(request) {
  var h = '';
  try { h = request.headers.get('authorization') || ''; } catch (e) { h = ''; }
  var m = /^Bearer\s+(.+)$/i.exec(String(h || '').trim());
  return m ? m[1].trim() : '';
}
function metricsRecordValid(body) {
  if (!body || typeof body !== 'object') return 'invalid body';
  if (!/^[a-f0-9]{32,128}$/i.test(String(body.token || ''))) return 'invalid token';
  if (!/^[A-Za-z0-9_-]{1,32}$/.test(String(body.handle || ''))) return 'invalid handle';
  var e = body.exported;
  if (!e || e.schema !== 1 || !e.totals || !Array.isArray(e.byDay) || !Array.isArray(e.byProvider)) return 'invalid export';
  if (e.byDay.length > 92 || e.byProvider.length > 64) return 'export too large';
  for (var i = 0; i < e.byDay.length; i++) {
    var d = e.byDay[i];
    if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(String(d.day || ''))) return 'invalid day row';
    for (var k = 0; k < ['requests', 'tokens', 'errors', 'cost'].length; k++) {
      if (!Number.isFinite(Number(d[['requests', 'tokens', 'errors', 'cost'][k]]))) return 'invalid day row';
    }
  }
  for (var j = 0; j < e.byProvider.length; j++) {
    var p = e.byProvider[j];
    if (!p || typeof p.id !== 'string' || p.id.length > 64) return 'invalid provider row';
    for (var k2 = 0; k2 < ['requests', 'tokens', 'errors', 'cost'].length; k2++) {
      if (!Number.isFinite(Number(p[['requests', 'tokens', 'errors', 'cost'][k2]]))) return 'invalid provider row';
    }
  }
  return null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url); const p = url.pathname;
    var jsSec = { 'content-type': 'application/javascript; charset=utf-8', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer' };
    var kv = null;
    try { kv = (env && env.METRICS_KV) || null; } catch (e) { kv = null; }
    if (p === '/metrics' || p === '/metrics.html') return new Response(METRICS_PAGE, { headers: { 'content-type': 'text/html; charset=utf-8', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'cache-control': 'public, max-age=60' } });
    if (p === '/api/metrics' && request.method === 'POST') {
      if (!kv) return json({ ok: false, error: 'metrics_store_unavailable' }, 503);
      var raw = '';
      try { raw = await request.text(); } catch (e) { raw = ''; }
      if (!raw || raw.length > 262144) return json({ ok: false, error: 'export too large' }, 413);
      var body = null;
      try { body = JSON.parse(raw); } catch (e) { return json({ ok: false, error: 'invalid body' }, 400); }
      var problem = metricsRecordValid(body);
      if (problem) return json({ ok: false, error: problem }, 400);
      var key = await metricsKey(body.token);
      var record = { handle: String(body.handle), updatedAt: new Date().toISOString(), days: body.exported.days, totals: body.exported.totals, byDay: body.exported.byDay, byProvider: body.exported.byProvider };
      try { await kv.put(key, JSON.stringify(record)); }
      catch (e) { return json({ ok: false, error: 'metrics_store_unavailable' }, 503); }
      return json({ ok: true, stored: true, handle: record.handle, updatedAt: record.updatedAt });
    }
    if (p === '/api/metrics' && (request.method === 'GET' || request.method === 'DELETE')) {
      if (!kv) return json({ ok: false, error: 'metrics_store_unavailable' }, 503);
      var token = metricsBearer(request);
      if (!/^[a-f0-9]{32,128}$/i.test(token)) return json({ ok: false, error: 'login required' }, 401);
      var lookup = await metricsKey(token);
      if (request.method === 'DELETE') {
        try { await kv.delete(lookup); } catch (e) { return json({ ok: false, error: 'metrics_store_unavailable' }, 503); }
        return json({ ok: true, deleted: true });
      }
      var stored = null;
      try { stored = await kv.get(lookup); } catch (e) { return json({ ok: false, error: 'metrics_store_unavailable' }, 503); }
      if (!stored) return json({ ok: false, error: 'no synced metrics' }, 404);
      var recordOut = null;
      try { recordOut = JSON.parse(stored); } catch (e) { return json({ ok: false, error: 'invalid stored record' }, 500); }
      return json({ ok: true, record: recordOut });
    }
    if (Object.prototype.hasOwnProperty.call(INSTALL_ASSETS,p.slice(1))) return new Response(INSTALL_ASSETS[p.slice(1)],{headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store, max-age=0','x-content-type-options':'nosniff','referrer-policy':'no-referrer'}});
    if (p === '/logo.js') return new Response(LOGO_JS, { headers: Object.assign({ 'cache-control': 'public, max-age=3600' }, jsSec) });
    if (p === '/shared-bg-client.js') return new Response(CLIENT_JS, { headers: Object.assign({ 'cache-control': 'public, max-age=60, must-revalidate' }, jsSec) });
    if (p === '/' || p === '/index.html') return new Response(PAGE, { headers: { 'content-type': 'text/html; charset=utf-8', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'cache-control': 'public, max-age=60' } });
    if (p === '/api/release') return new Response(INSTALL_ASSETS['release.json'],{headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store, max-age=0','x-content-type-options':'nosniff'}});
    if (p === '/api/status') return json({ ok: true, service: 'chode-hq', version: releaseVersion(), ts: Date.now(), providers: 17, freeTiers: 10 });
    return json({ ok: false, error: 'not found' }, 404);
  }
};
