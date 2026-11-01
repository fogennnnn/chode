/**
 * HEMO — daily discipline
 *   1. SCAN    world inefficiencies vs our capability stack
 *              (keyless data rails, agent workforce,
 *               sealed verifiable resolution, Stripe rails).
 *   2. CONVERT winners into HEMO real-world backing
 *              (buy-and-lock assets, work-burn services,
 *               treasury assets).
 *   3. RE-EVALUATE DAILY against the ranked opportunity backlog.
 * ============================================================
 */

// test-project — Scaffolded by chode
// Self-healing: auto-routes to best available AI provider

const PAGE = `<!DOCTYPE html>
<html lang="en"><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>test-project — chode</title>
  <meta name="description" content="test-project — self-healing Cloudflare Worker">
  <link rel="manifest" href="/manifest.json">
  <link rel="robots.txt" href="/robots.txt">
  <link rel="sitemap" href="/sitemap.xml">
  <link rel="icon" href="/favicon.ico">
  <style>
    :root{--g:#22dd55;--g2:#3dffa0;--bg:#0a0a0a;--border:rgba(34,221,85,.14);--text:#dff0e2;--muted:#7fa88a;--fm:"IBM Plex Mono",monospace;}
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html{background:#000}
    body{background:#000;color:var(--text);font-family:var(--fm);overflow-x:hidden;min-height:100vh;padding-top:148px}
    .bg-orb-holder{position:fixed;inset:0;z-index:0;pointer-events:none;background:#000;overflow:hidden}
    #bgfx-frame{position:absolute;left:0;top:0;width:300vmin;height:300vmin;border:0;display:block;transform-origin:50% 50%;transform:translate(calc(var(--ox,50vw) - 150vmin),calc(var(--oy,40vh) - 150vmin)) scale(.67);filter:contrast(1.45) saturate(1.05);opacity:.85}
    @media(prefers-reduced-motion:reduce){#bgfx-frame{display:none}}
    body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse 80% 200px at 50% -10px,rgba(34,221,85,.14),transparent 70%);pointer-events:none;z-index:1}
    .page{position:relative;z-index:2;padding-bottom:140px;max-width:1080px;margin:0 auto}
    .site-header{position:fixed;top:0;left:0;right:0;z-index:50;height:97px;display:flex;align-items:center;justify-content:space-between;padding:0 28px;background:rgba(10,16,10,.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid rgba(34,221,85,.08)}
    .header-nav{display:flex;align-items:center;gap:18px}
    .header-nav a{color:var(--muted);text-decoration:none;font-size:13.5px;font-weight:500;transition:color .2s}
    .header-nav a:hover{color:var(--g)}
    .header-pill{background:rgba(34,221,85,.08);border:1px solid rgba(34,221,85,.25);color:var(--g)!important;font-size:13px;font-weight:600;padding:9px 18px;border-radius:99px;text-decoration:none;transition:all .2s}
    .hero{min-height:92vh;display:flex;flex-direction:column;justify-content:center;text-align:center;padding:120px 24px 40px;position:relative}
    .hero-kicker{font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:rgba(61,255,160,.72);margin:0 0 16px;font-weight:600}
    .hero-title{font-size:clamp(52px,8.5vw,120px);font-weight:700;line-height:1.02;letter-spacing:.03em;color:var(--text);margin:0 0 22px;text-shadow:0 0 60px rgba(34,221,85,.25)}
    .hero-title .chode-wrap{position:relative;display:inline-block}
    .hero-title .chode-wrap .o-slot{position:relative;display:inline-block;color:transparent}
    .hero-title .chode-wrap .o-slot #logo-wrapper{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:.82em;height:.82em;z-index:0}
    .hero-sub{font-size:17px;font-weight:400;line-height:1.65;color:var(--muted);max-width:720px;margin:0 auto 30px;background:rgba(13,26,18,.55);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(34,221,85,.10);border-radius:20px;padding:22px 28px}
    .hero-sub b{color:var(--text);font-weight:600}
    .hero-actions{display:flex;align-items:center;gap:14px;justify-content:center;flex-wrap:wrap}
    .btn-lg{font-size:14px;font-weight:600;padding:13px 28px;border-radius:99px;text-decoration:none;transition:all .2s;display:inline-flex;align-items:center;gap:8px;border:none;cursor:pointer;font-family:inherit}
    .btn-lg.primary{background:var(--g);color:#04130a}
    .btn-lg.primary:hover{background:var(--g2);transform:translateY(-2px);box-shadow:0 8px 32px rgba(34,221,85,.35)}
    .btn-lg.secondary{background:rgba(13,26,18,.5);color:var(--text);border:1px solid rgba(34,221,85,.3)}
    .btn-lg.secondary:hover{background:rgba(34,221,85,.08);transform:translateY(-2px)}
    .content-box{background:rgba(13,26,18,.42);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(34,221,85,.14);border-radius:20px;padding:38px 36px;margin:26px auto;max-width:860px}
    .content-box h2{font-size:clamp(23px,3vw,32px);font-weight:600;letter-spacing:-.01em;line-height:1.2;margin:6px 0 16px;color:var(--g)}
    .content-box p{font-size:15.5px;color:var(--muted);line-height:1.7;margin-bottom:14px}
    .content-box p:last-child{margin-bottom:0}
    .checklist{list-style:none;display:flex;flex-direction:column;gap:10px;margin-top:4px}
    .checklist li{display:flex;gap:12px;align-items:flex-start;font-size:14.5px;color:var(--text);line-height:1.6;background:rgba(10,20,14,.45);border:1px solid rgba(34,221,85,.14);border-radius:14px;padding:13px 16px}
    .checklist li .tick{flex:none;width:22px;height:22px;border-radius:50%;background:rgba(34,221,85,.14);border:1px solid rgba(34,221,85,.35);color:var(--g2);display:flex;align-items:center;justify-content:center;font-size:12px;margin-top:2px}
    .inst-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px;margin-top:18px}
    .inst-card{background:rgba(10,20,14,.5);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(34,221,85,.14);border-radius:16px;padding:22px 20px;display:flex;flex-direction:column;gap:9px;text-decoration:none;transition:transform .2s,border-color .2s,box-shadow .2s}
    .inst-card:hover{transform:translateY(-3px);border-color:rgba(34,221,85,.4);box-shadow:0 10px 34px rgba(34,221,85,.10)}
    .inst-card .ic-name{font-size:15px;font-weight:600;color:var(--g)}
    .inst-card .ic-desc{font-size:13px;line-height:1.6;color:var(--muted);flex:1}
    .inst-card .ic-link{font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;color:rgba(61,255,160,.75)}
    .section-label{font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--g);margin-bottom:8px;display:inline-block}
    footer{position:fixed;left:0;right:0;bottom:0;z-index:50;min-height:64px;border-top:1px solid rgba(34,221,85,.12);background:rgba(10,16,10,.72);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);font-size:12px;color:var(--muted);display:flex;align-items:center}
    footer .foot-inner{max-width:1080px;margin:0 auto;width:100%;padding:10px 28px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}
    footer .foot-links{display:flex;gap:16px;flex-wrap:wrap}
    footer .foot-links a{color:var(--muted);text-decoration:none;transition:color .2s}
    footer .foot-links a:hover{color:var(--g)}
    .reveal{opacity:0;transform:translateY(24px);transition:opacity .6s cubic-bezier(.16,1,.3,1),transform .6s cubic-bezier(.16,1,.3,1)}
    .reveal.in{opacity:1;transform:none}
    @media(max-width:768px){body{padding-top:120px}.site-header{padding:0 16px;height:86px}.header-nav{display:none}.hero{padding-top:90px;min-height:80vh}.content-box{padding:28px 22px}footer .foot-inner{padding:10px 16px}}
  </style>
</head>
<body>
<div class="bg-orb-holder"><canvas id="bg-orb"></canvas></div>
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
<h1 class="hero-title"><span class="chode-wrap">ch<span class="o-slot">o</span>de</span></h1>
<p class="hero-sub">test-project — scaffolded by chode<br>
Self-healing Cloudflare Worker with <b>live provider routing</b>, <b>exponential backoff</b>, and <b>checkpoint recovery</b>.<br>
Routes to the best available AI provider. Switches silently when one fails. Resumes after crashes.</p>
<div class="hero-actions">
  <a class="btn-lg primary" href="https://github.com/fogennnnn/chode">Star on GitHub &rarr;</a>
  <a class="btn-lg secondary" href="#institutions">See the stack</a>
</div>
</section>
<div class="content-box reveal" id="institutions" style="scroll-margin-top:130px">
  <div class="section-label">What it does</div>
  <h2>The self-healing coding harness</h2>
  <p>Every developer has been there: your free-tier quota just depleted, your AI tool hands you a dead end, and you stare at the cursor typing "continue" into the void.</p>
  <p>chode solves this by <b>never trusting a single provider</b>. It probes 14 free-tier AI endpoints every 30 seconds, builds a live reputation score, and routes your work to whatever is actually working <em>right now</em>. When one provider dies, it's already forgotten. Your session keeps moving.</p>
</div>
<div class="box-row">
  <div class="content-box reveal">
    <div class="section-label">Never stops</div>
    <h2>Exponential backoff retry</h2>
    <ul class="checklist">
      <li><span class="tick">1</span><div><b>5 retries per provider</b> with 1s→2s→4s→8s→16s backoff</div></li>
      <li><span class="tick">2</span><div><b>Silent provider switching</b> — context preserved across hops</div></li>
      <li><span class="tick">3</span><div><b>Checkpoint recovery</b> — resume after crashes with <code>chode ai --resume</code></div></li>
      <li><span class="tick">4</span><div><b>AFK fallback</b> — auto-switches to no-auth providers when you step away</div></li>
    </ul>
  </div>
  <div class="content-box reveal">
    <div class="section-label">Live intelligence</div>
    <h2>Provider leaderboard</h2>
    <ul class="checklist">
      <li><span class="tick">1</span><div><b>30s health scans</b> across 14 providers</div></li>
      <li><span class="tick">2</span><div><b>Composite scoring</b> — quality×35% + reliability×30% + speed×20% + recency×15%</div></li>
      <li><span class="tick">3</span><div><b>Endpoint drift detection</b> — auto-updates registry when APIs change</div></li>
      <li><span class="tick">4</span><div><b>Zero config free tiers</b> — works without API keys via LongCat, Qwen, Gemini</div></li>
    </ul>
  </div>
</div>
<div class="content-box reveal" style="scroll-margin-top:130px">
  <div class="section-label">The stack</div>
  <h2>Live infrastructure</h2>
  <p>Every service below runs today, speaks both HTTP and MCP, and seals what matters into HELIOS provenance.</p>
  <div class="inst-grid">
    <a class="inst-card" href="https://hemo-jobs.oooooooooo.se/" target="_blank" rel="noopener">
      <div class="ic-name">hemo-jobs</div>
      <div class="ic-desc">Paid labor exchange. Post work, claim work, deliver, settle directly on the ledger.</div>
      <div class="ic-link">Open &rarr;</div>
    </a>
    <a class="inst-card" href="https://hemo-registry.oooooooooo.se/" target="_blank" rel="noopener">
      <div class="ic-name">hemo-registry</div>
      <div class="ic-desc">Verified agent directory. Counterparties check who they are dealing with.</div>
      <div class="ic-link">Open &rarr;</div>
    </a>
    <a class="inst-card" href="https://hemo-court.oooooooooo.se/" target="_blank" rel="noopener">
      <div class="ic-name">hemo-court</div>
      <div class="ic-desc">Staked arbitration. Both sides stake, jurors vote, the loser pays.</div>
      <div class="ic-link">Open &rarr;</div>
    </a>
    <a class="inst-card" href="https://mcp-hemo.oooooooooo.se/llms.txt" target="_blank" rel="noopener">
      <div class="ic-name">mcp-hemo</div>
      <div class="ic-desc">One URL, the whole economy. Connect Claude, Cursor, or any MCP client.</div>
      <div class="ic-link">Tool list &rarr;</div>
    </a>
  </div>
</div>
<div class="content-box reveal" style="scroll-margin-top:130px">
  <div class="section-label">Start building</div>
  <h2>One command</h2>
  <p>chode scaffolds production Cloudflare Workers with the HEMO doctrine banner, secz6 glass layout, and self-healing AI routing built in.</p>
  <div style="display:flex;flex-direction:column;gap:10px;margin-top:14px;max-width:520px">
    <code style="background:rgba(34,221,85,.08);border:1px solid rgba(34,221,85,.18);border-radius:6px;padding:13px 14px;font-family:var(--fm);font-size:14px;color:var(--g);width:100%">node chode.js new my-agent</code>
    <a class="btn-lg primary" href="https://github.com/fogennnnn/chode" target="_blank" rel="noopener" style="text-align:center">Clone &amp; get started &rarr;</a>
  </div>
</div>
</main>
<footer>
  <div class="foot-inner">
    <div class="foot-links">
      <a href="https://github.com/fogennnnn/chode" target="_blank" rel="noopener">GitHub</a>
      <a href="https://github.com/fogennnnn/chode#readme">Docs</a>
      <a href="https://github.com/fogennnnn/hemo-skills">HEMO Skills</a>
      <a href="mailto:inf@oooooooooo.se" style="color:var(--g)">inf@oooooooooo.se</a>
    </div>
    <span>chode · self-healing harness · 2026</span>
  </div>
</footer>
<script>
const io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:0.12});
document.querySelectorAll('.reveal').forEach(function(el){io.observe(el)});
addEventListener('DOMContentLoaded',function(){
  var w=document.getElementById('logo-wrapper');
  var s=document.querySelector('.hero-title .chode-wrap .o-slot');
  if(w&&s&&w.parentElement!==s)s.appendChild(w);
});
</script>

</body></html>`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname;
    const key = request.headers.get('x-api-key');
    const validKey = env.API_KEY || 'test-project-dev-key';

    if (p === '/' || p === '/index.html') return html(PAGE);

    if (p === '/api/status') return json({ ok: true, service: 'test-project', ts: Date.now() });

    if (p === '/api/ask' && request.method === 'POST') {
      if (key !== validKey) return json({ error: 'unauthorized' }, 401);
      const body = await request.json().catch(() => ({}));
      return json({ response: 'AI response for: ' + body.prompt + ' (connected via chode auto-router)' });
    }

    return new Response('Not found', { status: 404 });
  },
};

function html(body) { return new Response(body, { headers: { 'content-type': 'text/html; charset=utf-8' } }); }
function json(body, status) { return new Response(JSON.stringify(body), { status: status||200, headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' } }); }