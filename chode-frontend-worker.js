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
// chode-frontend — Landing page for the self-healing coding harness.
const PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#0a0a0a">
<title>chode — The Self-Healing Coding Harness</title>
<meta name="description" content="chode is the world's first coding harness that never stops. Auto-routes to the best available AI provider, exponential backoff retry, checkpoint recovery. Free. Zero lock-in.">
<meta name="robots" content="index,follow">
<meta property="og:type" content="website">
<meta property="og:title" content="chode — Never stops coding">
<meta property="og:description" content="The self-healing coding harness. Free AI providers, live discovery, zero lock-in.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet">
<style>
:root{--g:#22dd55;--g2:#3dffa0;--bg:#0a0a0a;--border:rgba(34,221,85,.14);--text:#dff0e2;--muted:#7fa88a;--fm:'IBM Plex Mono',ui-monospace,SFMono-Regular,Menlo,monospace;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{background:#000}
body{background:#000;color:var(--text);font-family:var(--fm);overflow-x:hidden;-webkit-font-smoothing:antialiased;position:relative;min-height:100vh;padding-top:148px}
.bg-orb-holder{position:fixed;inset:0;z-index:0;pointer-events:none;background:#000;overflow:hidden}
#bgfx-frame{position:absolute;left:0;top:0;width:300vmin;height:300vmin;border:0;display:block;transform-origin:50% 50%;transform:translate(calc(var(--ox,50vw) - 150vmin),calc(var(--oy,40vh) - 150vmin)) scale(.67);filter:contrast(1.45) saturate(1.05);opacity:.85}
@media(prefers-reduced-motion:reduce){#bgfx-frame{display:none}}
.page{position:relative;z-index:2;padding-bottom:140px;max-width:1080px;margin:0 auto}
.site-header{position:fixed;top:0;left:0;right:0;z-index:50;height:97px;display:flex;align-items:center;justify-content:space-between;padding:0 28px;border:none;background:rgba(10,16,10,.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid rgba(34,221,85,.08)}
.header-nav{display:flex;align-items:center;gap:18px;flex-wrap:wrap}
.header-nav a{color:var(--muted);text-decoration:none;font-size:13.5px;font-weight:500;transition:color .2s;white-space:nowrap}
.header-nav a:hover{color:var(--g)}
.header-pill{background:rgba(34,221,85,.08);border:1px solid rgba(34,221,85,.25);color:var(--g)!important;font-size:13px;font-weight:600;padding:9px 18px;border-radius:99px;text-decoration:none;transition:all .2s;white-space:nowrap}
.header-pill:hover{background:rgba(34,221,85,.16)}
.hero{min-height:92vh;display:flex;flex-direction:column;justify-content:center;text-align:center;padding:120px 24px 40px;position:relative}
.hero-kicker{font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:rgba(61,255,160,.72);margin:0 0 16px;font-weight:600}
.hero-title{font-size:clamp(52px,8.5vw,120px);font-weight:700;line-height:1.02;letter-spacing:.03em;color:var(--text);margin:0 0 22px;text-shadow:0 0 60px rgba(34,221,85,.25)}
.hero-title .chode-wrap{position:relative;display:inline-block}
.hero-title .chode-wrap .o-slot{position:relative;display:inline-block;color:transparent}
.hero-title .chode-wrap .o-slot #logo-wrapper{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:.82em;height:.82em;z-index:0}
.hero-title .word{border-bottom:.05em solid rgba(34,221,85,.5);padding-bottom:.03em}
.hero-title .tm{font-size:.3em;vertical-align:super;margin-left:.14em;color:var(--text)}
.hero-sub{font-size:17px;font-weight:400;line-height:1.65;color:var(--muted);max-width:720px;margin:0 auto 30px;background:rgba(13,26,18,.55);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(34,221,85,.10);border-radius:20px;padding:22px 28px}
.hero-sub b{color:var(--text);font-weight:600}
.hero-actions{display:flex;align-items:center;gap:14px;justify-content:center;flex-wrap:wrap}
.btn-lg{font-size:14px;font-weight:600;padding:13px 28px;border-radius:99px;text-decoration:none;transition:all .2s;display:inline-flex;align-items:center;gap:8px;border:none;cursor:pointer;font-family:inherit;white-space:nowrap}
.btn-lg.primary{background:var(--g);color:#04130a}
.btn-lg.primary:hover{background:var(--g2);transform:translateY(-2px);box-shadow:0 8px 32px rgba(34,221,85,.35)}
.btn-lg.secondary{background:rgba(13,26,18,.5);color:var(--text);border:1px solid rgba(34,221,85,.3)}
.btn-lg.secondary:hover{background:rgba(34,221,85,.08);transform:translateY(-2px)}
.content-box{background:rgba(13,26,18,.42);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(34,221,85,.14);border-radius:20px;padding:38px 36px;margin:26px auto;max-width:860px}
.content-box h2{font-size:clamp(23px,3vw,32px);font-weight:600;letter-spacing:-.01em;line-height:1.2;margin:6px 0 16px;color:var(--g)}
.content-box .sub{font-size:15.5px;color:var(--muted);line-height:1.7;margin-bottom:14px}
.content-box .sub:last-child{margin-bottom:0}
.box-row{display:flex;gap:22px;max-width:1080px;width:100%;margin:26px auto;flex-wrap:wrap}
.box-row .content-box{flex:1 1 340px;min-width:0;margin:0}
.section-label{font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--g);margin-bottom:8px;display:inline-block}
.hl{color:var(--g)}
.checklist{list-style:none;display:flex;flex-direction:column;gap:10px;margin-top:4px}
.checklist li{display:flex;gap:12px;align-items:flex-start;font-size:14.5px;color:var(--text);line-height:1.6;background:rgba(10,20,14,.45);border:1px solid rgba(34,221,85,.14);border-radius:14px;padding:13px 16px}
.checklist li .tick{flex:none;width:22px;height:22px;border-radius:50%;background:rgba(34,221,85,.14);border:1px solid rgba(34,221,85,.35);color:var(--g2);display:flex;align-items:center;justify-content:center;font-size:12px;margin-top:2px}
code{background:rgba(34,221,85,.08);border:1px solid rgba(34,221,85,.18);border-radius:6px;padding:1px 7px;font-family:var(--fm);font-size:.92em;color:var(--g)}
code.block{display:block;padding:13px 14px;font-size:14px;white-space:pre;overflow-x:auto}
.install-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;margin-top:18px}
.install-card{background:rgba(10,20,14,.5);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(34,221,85,.14);border-radius:16px;padding:22px 20px;display:flex;flex-direction:column;gap:9px}
.install-card .ic-name{font-size:15px;font-weight:600;color:var(--g)}
.install-card .ic-desc{font-size:13px;line-height:1.6;color:var(--muted);flex:1}
.install-card pre{background:rgba(0,0,0,.4);border:1px solid rgba(34,221,85,.12);border-radius:10px;padding:12px 14px;font-size:13px;color:var(--g2);overflow-x:auto;line-height:1.5}
footer{position:fixed;left:0;right:0;bottom:0;z-index:50;min-height:64px;border-top:1px solid var(--border);background:rgba(10,16,10,.72);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);font-size:12px;color:var(--muted);display:flex;align-items:center}
footer .foot-inner{max-width:1080px;margin:0 auto;width:100%;padding:10px 28px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}
footer .foot-links{display:flex;gap:16px;flex-wrap:wrap}
footer .foot-links a{color:var(--muted);text-decoration:none;transition:color .2s}
footer .foot-links a:hover{color:var(--g)}
footer .mail{color:var(--g)}
.reveal{opacity:0;transform:translateY(24px);transition:opacity .6s cubic-bezier(.16,1,.3,1),transform .6s cubic-bezier(.16,1,.3,1)}
.reveal.in{opacity:1;transform:none}
@media(max-width:768px){
  body{padding-top:120px}
  .site-header{padding:0 16px;height:86px}
  .header-nav{display:none}
  .hero{padding-top:90px;min-height:80vh}
  .content-box{padding:28px 22px}
  footer .foot-inner{padding:10px 16px}
}
</style>
</head>
<body>
<style id="z6-logo-style">
  #logo-wrapper{position:fixed;top:1.5rem;left:1.5rem;width:75px;height:75px;border-radius:50%;overflow:hidden;z-index:9999;box-shadow:0 0 20px rgba(192,132,252,.15);border:1px solid rgba(168,85,247,.25);background:#010102;pointer-events:none}
  canvas#logo{width:100%;height:100%;display:block}
  @media(max-width:768px){#logo-wrapper{width:60px;height:60px;top:1rem;left:1rem}}
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
  var OVERSCAN=1,frame=null,sized=0;
  function frameSize(){return Math.ceil(1.5*Math.max(innerWidth,innerHeight))}
  function anchor(resized){
    var o=document.querySelector('.hero-title .chode-wrap .o-slot');
    var cx,cy;
    if(o){var r=o.getBoundingClientRect();cx=r.left+r.width/2;cy=r.top+r.height/2}
    else{cx=innerWidth/2;cy=innerHeight*0.4}
    cx=Math.max(0,Math.min(innerWidth,cx));cy=Math.max(0,Math.min(innerHeight,cy));
    holder.style.setProperty('--ox',cx+'px');holder.style.setProperty('--oy',cy+'px');
    if(resized||!sized){sized=frameSize();holder.style.setProperty('--bgsize',sized+'px');holder.style.setProperty('--bgzoom',String(1/OVERSCAN));if(frame){frame.width=sized;frame.height=sized}}
  }
  var pending=false;
  function onScroll(){if(pending)return;pending=true;requestAnimationFrame(function(){pending=false;anchor(false)})}
  function mount(){
    if(frame||document.hidden)return;anchor();frame=document.createElement('iframe');frame.id='bgfx-frame';
    frame.setAttribute('sandbox','allow-scripts allow-same-origin');
    frame.setAttribute('referrerpolicy','no-referrer');frame.setAttribute('loading','lazy');
    frame.setAttribute('tabindex','-1');frame.setAttribute('aria-hidden','true');frame.setAttribute('title','Decorative backdrop');
    frame.src='https://boundaries-bg.fogeboro.workers.dev/';holder.appendChild(frame);anchor();
  }
  var idle=window.requestIdleCallback||function(f){return setTimeout(f,1500)};
  idle(mount);addEventListener('scroll',onScroll,{passive:true});
  addEventListener('resize',function(){anchor(true)},false);
  if(document.fonts&&document.fonts.ready){document.fonts.ready.then(anchor).catch(function(){})}
  addEventListener('load',anchor);setTimeout(anchor,400);setTimeout(anchor,1200);
  document.addEventListener('visibilitychange',function(){if(!document.hidden)idle(mount)});
})();
</script>
<header class="site-header">
  <nav class="header-nav">
    <a href="https://github.com/fogennnnn/chode" target="_blank" rel="noopener">GitHub</a>
    <a href="https://github.com/fogennnnn/chode#readme">Docs</a>
    <a href="https://github.com/fogennnnn/hemo-skills">Skills</a>
  </nav>
  <a class="header-pill" href="https://github.com/fogennnnn/chode">Get chode &rarr;</a>
</header>
<main class="page">
<section class="hero">
  <div class="hero-kicker">Never stops</div>
<h1 class="hero-title"><span class="chode-wrap"><span class="word">ch<span class="o-slot">o</span>de</span><span class="tm">&trade;</span></span></h1>
<p class="hero-sub">The self-healing coding harness.<br>
<b>Free AI providers.</b> Live discovery. <b>Zero lock-in.</b><br>
Scaffold, dev, deploy Cloudflare Workers with exponential backoff retry, checkpoint recovery, and silent provider switching. When one provider dies, chode is already gone.</p>
<div class="hero-actions">
  <a class="btn-lg primary" href="https://github.com/fogennnnn/chode">Star on GitHub &rarr;</a>
  <button class="btn-lg secondary" id="btn-install">Install chode &darr;</button>
</div>
</section>
<div class="content-box reveal" id="install" style="scroll-margin-top:130px">
  <div class="section-label">Install</div>
   <h2>One command. Ready to code.</h2>
   <p class="sub">Clone the repo, run init, and go. No config needed — free models work out of the box.</p>
   <div class="install-grid">
     <div class="install-card">
       <div class="ic-name">Linux / macOS / Windows</div>
       <div class="ic-desc">Clone, init, scan, then AI</div>
       <pre>git clone https://github.com/fogennnnn/chode.git
cd chode
node chode.js init
node chode.js scan
node chode.js ai "build me a worker"</pre>
     </div>
     <div class="install-card">
       <div class="ic-name">Global install (optional)</div>
       <div class="ic-desc">After cloning, link it globally</div>
       <pre>npm install -g ./chode
chode ai "build me a worker"</pre>
     </div>
   </div>
</div>
<div class="content-box reveal">
  <div class="section-label">What it does</div>
  <h2>The self-healing coding harness</h2>
  <p class="sub">Every developer has been there: your free-tier quota just depleted, your AI tool hands you a dead end, and you stare at the cursor typing "continue" into the void.</p>
  <p class="sub">chode solves this by <b>never trusting a single provider</b>. It probes 14 free-tier AI endpoints every 30 seconds, builds a live reputation score, and routes your work to whatever is actually working <em>right now</em>. When one provider dies, it's already forgotten. Your session keeps moving.</p>
</div>
<div class="box-row">
  <div class="content-box reveal">
    <div class="section-label">Never stops</div>
    <h2>Exponential backoff retry</h2>
    <ul class="checklist">
      <li><span class="tick">1</span><div><b>5 retries per provider</b> with 1s&rarr;2s&rarr;4s&rarr;8s&rarr;16s backoff</div></li>
      <li><span class="tick">2</span><div><b>Silent provider switching</b> &mdash; context preserved across hops</div></li>
      <li><span class="tick">3</span><div><b>Checkpoint recovery</b> &mdash; resume after crashes with <code>chode ai --resume</code></div></li>
      <li><span class="tick">4</span><div><b>AFK fallback</b> &mdash; auto-switches to no-auth providers when you step away</div></li>
    </ul>
  </div>
  <div class="content-box reveal">
    <div class="section-label">Live intelligence</div>
    <h2>Provider leaderboard</h2>
    <ul class="checklist">
      <li><span class="tick">1</span><div><b>30s health scans</b> across 14 providers</div></li>
      <li><span class="tick">2</span><div><b>Composite scoring</b> &mdash; quality&times;35% + reliability&times;30% + speed&times;20% + recency&times;15%</div></li>
      <li><span class="tick">3</span><div><b>Endpoint drift detection</b> &mdash; auto-updates registry when APIs change</div></li>
      <li><span class="tick">4</span><div><b>Zero config free tiers</b> &mdash; works without API keys via LongCat, Qwen, Gemini</div></li>
    </ul>
  </div>
</div>
<div class="content-box reveal">
  <div class="section-label">The stack</div>
  <h2>Live infrastructure</h2>
  <p class="sub">Every service below runs today, speaks both HTTP and MCP, and seals what matters into HELIOS provenance.</p>
  <div class="install-grid">
    <a class="install-card" href="https://hemo-jobs.oooooooooo.se/" target="_blank" rel="noopener" style="text-decoration:none">
      <div class="ic-name">hemo-jobs</div>
      <div class="ic-desc">Paid labor exchange. Post work, claim work, deliver, settle directly on the ledger.</div>
      <div class="ic-link">Open &rarr;</div>
    </a>
    <a class="install-card" href="https://hemo-registry.oooooooooo.se/" target="_blank" rel="noopener" style="text-decoration:none">
      <div class="ic-name">hemo-registry</div>
      <div class="ic-desc">Verified agent directory. Counterparties check who they are dealing with.</div>
      <div class="ic-link">Open &rarr;</div>
    </a>
    <a class="install-card" href="https://hemo-court.oooooooooo.se/" target="_blank" rel="noopener" style="text-decoration:none">
      <div class="ic-name">hemo-court</div>
      <div class="ic-desc">Staked arbitration. Both sides stake, jurors vote, the loser pays.</div>
      <div class="ic-link">Open &rarr;</div>
    </a>
    <a class="install-card" href="https://mcp-hemo.oooooooooo.se/llms.txt" target="_blank" rel="noopener" style="text-decoration:none">
      <div class="ic-name">mcp-hemo</div>
      <div class="ic-desc">One URL, the whole economy. Connect Claude, Cursor, or any MCP client.</div>
      <div class="ic-link">Tool list &rarr;</div>
    </a>
  </div>
</div>
</main>
<footer>
  <div class="foot-inner">
    <div class="foot-links">
      <a href="https://github.com/fogennnnn/chode" target="_blank" rel="noopener">GitHub</a>
      <a href="https://github.com/fogennnnn/chode#readme">Docs</a>
      <a href="https://github.com/fogennnnn/hemo-skills">HEMO Skills</a>
      <a href="mailto:inf@oooooooooo.se" class="mail">inf@oooooooooo.se</a>
    </div>
    <span>chode &middot; self-healing harness &middot; 2026</span>
  </div>
</footer>
<script>
const io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:0.12});
document.querySelectorAll('.reveal').forEach(function(el){io.observe(el)});
document.getElementById('btn-install')&&document.getElementById('btn-install').addEventListener('click',function(){
  document.getElementById('install').scrollIntoView({behavior:'smooth'});
});
addEventListener('DOMContentLoaded',function(){
  var w=document.getElementById('logo-wrapper');
  var s=document.querySelector('.hero-title .chode-wrap .o-slot');
  if(w&&s&&w.parentElement!==s)s.appendChild(w);
});
</script>
</body>
</html>`;

function json(o, s) { return new Response(JSON.stringify(o), { status: s || 200, headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' } }); }

export default {
  async fetch(request) {
    const url = new URL(request.url); const p = url.pathname;
    if (p === '/' || p === '/index.html') return new Response(PAGE, { headers: { 'content-type': 'text/html; charset=utf-8' } });
    if (p === '/api/status') return json({ ok: true, service: 'chode', ts: Date.now() });
    return json({ ok: false, error: 'not found' }, 404);
  }
};
