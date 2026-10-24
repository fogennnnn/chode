'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const browserCheck = require('../browser-check');

async function fixture() {
  if (!browserCheck.available() || process.env.CHODE_BROWSER_CHECK === '0') {
    console.log('SKIP browser-check: ' + (process.env.CHODE_BROWSER_CHECK === '0' ? 'disabled by CHODE_BROWSER_CHECK=0' : browserCheck.unavailableReason()));
    return;
  }
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-browser-check-'));
  try {
    const good = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Counter</title><style>body{font-family:system-ui;padding:2rem}</style></head><body><h1>Counter</h1><p id="count">0</p><button id="add">Add one</button><script>document.getElementById("add").addEventListener("click",function(){document.getElementById("count").textContent=Number(document.getElementById("count").textContent)+1});</script></body></html>';
    fs.writeFileSync(path.join(root, 'index.html'), good);
    const goodResult = await browserCheck.checkWorkspace(root, 'Build a website with a working add counter', ['index.html'], {});
    assert.equal(goodResult.skipped, false);
    assert.equal(goodResult.ok, true, 'working page passes: ' + goodResult.failures.join('; '));
    assert.equal(goodResult.screenshots.length, 2, 'desktop and mobile screenshots are written');
    assert.ok(goodResult.screenshots.every(function (file) { return fs.existsSync(file); }));

    const broken = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Broken</title></head><body><h1>Broken</h1><p>This page has visible content but the script fails and the button does nothing.</p><button id="act">Add item</button><script>document.getElementById("act").addEventListener("click",function(){console.log("clicked")});missingFunction();</script></body></html>';
    fs.writeFileSync(path.join(root, 'broken.html'), broken);
    const brokenResult = await browserCheck.checkWorkspace(root, 'Build a website with a working add button', ['broken.html'], {});
    assert.equal(brokenResult.ok, false);
    assert.ok(brokenResult.failures.some(function (failure) { return /runtime error: ReferenceError: missingFunction/.test(failure); }), 'runtime error is reported');
    assert.ok(brokenResult.failures.some(function (failure) { return /click produced no visible change/.test(failure); }), 'dead button is reported');

    const virtualResult = await browserCheck.checkHtml(good, { root: root, name: 'artifact.html', request: 'Build a website with a working add counter' });
    assert.equal(virtualResult.skipped, false);
    assert.equal(virtualResult.ok, true, 'virtual HTML artifact passes: ' + virtualResult.failures.join('; '));

    const blankCanvas = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Blank canvas</title><style>canvas{max-width:100%}</style></head><body><h1>Visual test</h1><canvas id="art" width="400" height="200"></canvas><script>const c=document.getElementById("art"),x=c.getContext("2d");x.fillStyle="#111";x.fillRect(0,0,400,200);</script></body></html>';
    const blankResult = await browserCheck.checkHtml(blankCanvas, { root: root, name: 'blank.html', request: 'Build a website with a visual canvas' });
    assert.equal(blankResult.ok, false, 'a uniform canvas must fail visual inspection');
    assert.ok(blankResult.failures.some(function (failure) { return /Browser visual: .*canvas appears blank or uniform/.test(failure); }), 'blank canvas is reported');

    const drawnCanvas = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Drawn canvas</title><style>canvas{max-width:100%}</style></head><body><h1>Visual test</h1><canvas id="art" width="400" height="200"></canvas><script>const c=document.getElementById("art"),x=c.getContext("2d"),g=x.createLinearGradient(0,0,400,200);g.addColorStop(0,"#f00");g.addColorStop(1,"#00f");x.fillStyle=g;x.fillRect(0,0,400,200);</script></body></html>';
    const drawnResult = await browserCheck.checkHtml(drawnCanvas, { root: root, name: 'drawn.html', request: 'Build a website with a visual canvas' });
    assert.equal(drawnResult.ok, true, 'a canvas with real pixels passes visual inspection: ' + drawnResult.failures.join('; '));

    const filters = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Filters</title></head><body><h1>Shop</h1><form id="f"><div id="list"><p class="item">apple</p><p class="item">berry</p></div><button type="button" class="on" id="all" aria-pressed="true">All</button><button type="button" id="north">North</button></form><script>var full=document.getElementById("list").innerHTML;document.getElementById("all").addEventListener("click",function(){document.getElementById("list").innerHTML=full;});document.getElementById("north").addEventListener("click",function(){document.getElementById("list").innerHTML="<p>north only</p>"});</script></body></html>';
    fs.writeFileSync(path.join(root, 'filters.html'), filters);
    const filterResult = await browserCheck.checkWorkspace(root, 'Build a storefront with category filter buttons', ['filters.html'], {});
    assert.equal(filterResult.ok, true, 'an already-active filter is skipped in favor of a control that changes the page: ' + filterResult.failures.join('; '));

    // The gate must feed the same failures into the repair loop, not merely
    // save screenshots that nobody inspects.
    const chodePath = path.resolve(__dirname, '../chode.js');
    const gateScript = 'const c=require(' + JSON.stringify(chodePath) + ');'
      + 'c.cheapVerifyGate([],{writes:["broken.html"]},{buildRequest:"Build a website with a working add button",browserCheck:true})'
      + '.then(function(g){var hit=g.failed.find(function(x){return /Browser interaction: broken.html/.test(x.check);});'
      + 'if(!hit){console.error(JSON.stringify(g.failed));process.exit(2);}console.log("BROWSER_FAIL "+hit.check);process.exit(0);})'
      + '.catch(function(e){console.error(e&&e.stack||e);process.exit(3);});';
    const gate = spawnSync(process.execPath, ['-e', gateScript], { cwd: root, encoding: 'utf8', timeout: 120000, windowsHide: true });
    assert.equal(gate.status, 0, 'gate child failed: ' + String(gate.stderr || gate.stdout).slice(0, 1000));
    assert.ok(String(gate.stdout).includes('BROWSER_FAIL'), 'cheap gate reports the browser failure');

    const loopScript = 'const c=require(' + JSON.stringify(chodePath) + ');'
      + 'const good=' + JSON.stringify(good) + ';const broken=' + JSON.stringify(broken) + ';'
      + 'const fence=function(html){return "```tool\\n"+JSON.stringify({tool:"write",args:{file:"index.html",content:html}})+"\\n```";};'
      + 'var wrote=false,repairs=0,reviews=0;'
      + 'var ai=async function(prompt){'
      + 'if(String(prompt).startsWith("[PLAN"))return {result:"1. Create/overwrite index.html with a working add counter — check: clicking Add one increments the counter.",provider:"drafter"};'
      + 'if(String(prompt).startsWith("[VERIFY")){reviews++;return {result:"PASS",provider:"reviewer"};}'
      + 'if(String(prompt).includes("[REPAIR")){repairs++;if(!prompt.includes("Browser interaction")&&!prompt.includes("Browser errors"))throw new Error("repair prompt lacked browser failures");wrote=true;return {result:fence(good),provider:"drafter"};}'
      + 'if(!wrote){wrote=true;return {result:fence(broken)+"\\nDONE: wrote index.html",provider:"drafter"};}'
      + 'return {result:"DONE: complete.",provider:"drafter"};};'
      + 'c.runAgentLoop("Build a website with a working add counter button.",null,null,{v2:true,browserCheck:true,noOrchestrator:true},ai,null,null,{originalTask:"Build a website with a working add counter button."})'
      + '.then(function(r){var b=r.res&&r.res.browserVerification;if(r.completionStatus!=="VERIFIED"||repairs<1||!b||!b.ok)throw new Error("not repaired: "+JSON.stringify({status:r.completionStatus,repairs:repairs,browser:b&&b.ok}));'
      + 'if(require("fs").readFileSync("index.html","utf8").includes("missingFunction"))throw new Error("broken file survived");console.log("BROWSER_REPAIR_OK");process.exit(0);})'
      + '.catch(function(e){console.error(e&&e.stack||e);process.exit(4);});';
    const loop = spawnSync(process.execPath, ['-e', loopScript], { cwd: root, encoding: 'utf8', timeout: 180000, windowsHide: true });
    assert.equal(loop.status, 0, 'browser repair loop failed: ' + String(loop.stderr || loop.stdout).slice(0, 1500));
    assert.ok(String(loop.stdout).includes('BROWSER_REPAIR_OK'), 'browser failure triggers a real repair');

    console.log('PASS: browser checks load pages, catch runtime errors, dead controls and blank canvases, feed the gate, and save desktop/mobile screenshots');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

fixture().catch(function (error) {
  console.error(error && error.stack || error);
  process.exit(1);
});
