'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const workerSource = fs.readFileSync(path.join(__dirname, '..', 'chode-hq-worker.js'), 'utf8');
const start = workerSource.indexOf('const CLIENT_JS = ');
const end = workerSource.indexOf('\nconst LOGO_JS =', start);
assert.ok(start >= 0 && end > start, 'CLIENT_JS should be embedded in the landing worker');
const clientDeclaration = workerSource.slice(start, end);
const capture = {};
vm.runInNewContext(clientDeclaration + '\nthis.__clientSource = CLIENT_JS;', capture);
const clientSource = capture.__clientSource;
assert.match(clientSource, /var waterGlow = clamp\(reflFade, 0, 1\)/, 'logo-linked water glow must have no non-zero floor');
assert.match(clientSource, /var reflectionScrollFactor = 0\.25/, 'reflection should drift down at one quarter of the logo scroll speed');
assert.match(clientSource, /var u = \(d - H \* 0\.14\) \/ \(H \* 0\.54\)/, 'reflection should use the extended fade distance');
assert.match(clientSource, /var areaAttenuation = \(baseScaleX \* baseScaleY\) \/ \(reflectionScaleX \* reflectionScaleY\)/, 'reflected light should dissipate as its footprint grows');
assert.match(clientSource, /horizonArch = Math\.min\(14, H \* 0\.018\)/, 'horizon should have a subtle responsive arch');
assert.match(clientSource, /var atmosphere = ctx\.createLinearGradient/, 'atmosphere should fade upward above the horizon');
assert.ok(!clientSource.includes('var STREAKS'), 'synthetic purple reflection streaks should be removed');

function makeContext(onDrawImage, onCurve, onRadialGradient) {
  return {
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    imageSmoothingEnabled: true,
    setTransform() {}, fillRect() {}, clearRect() {}, save() {}, restore() {},
    translate() {}, scale() {}, beginPath() {}, moveTo() {}, rect() {}, lineTo() {}, closePath() {}, clip() {}, stroke() {},
    quadraticCurveTo() { if (onCurve) onCurve(Array.from(arguments)); },
    putImageData() {},
    drawImage() { if (onDrawImage) onDrawImage(this.globalAlpha, Array.from(arguments)); },
    createImageData(w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; },
    createPattern() { return {}; },
    createLinearGradient() { return { addColorStop() {} }; },
    createRadialGradient() { if (onRadialGradient) onRadialGradient(Array.from(arguments)); return { addColorStop() {} }; },
    getImageData(w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; }
  };
}

let reflectionDraws = 0;
let sourceLogoDraws = 0;
const reflectionAlphas = [];
const screenImageArgs = [];
const sourceLogoSizes = [];
const horizonCurves = [];
const radialGradients = [];
const screenContext = makeContext(
  (alpha, args) => { reflectionDraws++; reflectionAlphas.push(alpha); screenImageArgs.push(args); },
  args => horizonCurves.push(args),
  args => radialGradients.push(args)
);
const genericContext = makeContext();
const wrapper = {
  rect: { left: 600, top: 300, width: 75, height: 75, right: 675, bottom: 375 },
  getBoundingClientRect() { return this.rect; }
};
const space = {
  width: 1,
  height: 1,
  getContext() { return screenContext; },
  getBoundingClientRect() { return { left: 0, top: -16, width: 1280, height: 832, right: 1280, bottom: 816 }; }
};
const logo = {
  width: 75,
  height: 75,
  getContext() { return genericContext; }
};
const listeners = {};
const animationFrames = [];
const document = {
  hidden: false,
  getElementById(id) { return id === 'space' ? space : id === 'logo-wrapper' ? wrapper : id === 'logo' ? logo : null; },
  createElement() {
    const ctx = makeContext((alpha, args) => { sourceLogoDraws++; if (args.length >= 9) sourceLogoSizes.push([args[7], args[8]]); });
    return { width: 0, height: 0, getContext() { return ctx; } };
  },
  addEventListener(name, handler) { listeners['document:' + name] = handler; }
};
const window = {
  innerWidth: 1280,
  innerHeight: 800,
  devicePixelRatio: 1,
  performance: { now: () => 0 },
  matchMedia: () => ({ matches: true }),
  addEventListener(name, handler) { listeners[name] = handler; }
};
const browser = {
  window,
  document,
  performance: window.performance,
  requestAnimationFrame(callback) { animationFrames.push(callback); }
};

const horizonY = Math.round(832 * 0.62);
vm.runInNewContext(clientSource, browser);
assert.ok(reflectionDraws > 0, 'visible O should draw the water reflection');
assert.ok(sourceLogoDraws > 0, 'reflection must be drawn from the live O logo canvas');
assert.ok(horizonCurves.some(args => args[1] < horizonY && args[3] > horizonY), 'water boundary should curve upward at its center');
const horizonSmearAtRest = radialGradients.find(args => args[5] > 50 && Math.abs(args[4] - (horizonY + 4)) < 2);
assert.ok(horizonSmearAtRest, 'soft smear should be anchored just below the horizon');
const reflectedSize = sourceLogoSizes[0];
assert.ok(reflectedSize[0] > logo.width * 1.4, 'reflection should be widened from the logo source');
assert.ok(reflectedSize[1] > logo.height * 1.4, 'reflection should be enlarged from the logo source');
assert.ok(reflectedSize[0] / reflectedSize[1] > 0.95 && reflectedSize[0] / reflectedSize[1] < 1.1, 'reflection image should remain nearly circular');
assert.ok(screenImageArgs.some(args => args.length === 3 && args[2] >= horizonY && args[2] <= horizonY + 2), 'reflection should meet the horizon');
const initialReflectionY = screenImageArgs[0][2];
const initialReflectionWidth = sourceLogoSizes[0][0];
const initialReflectionHeight = sourceLogoSizes[0][1];
const nearHeroAlpha = Math.max.apply(null, reflectionAlphas);
reflectionDraws = 0;
sourceLogoDraws = 0;
reflectionAlphas.length = 0;
screenImageArgs.length = 0;
sourceLogoSizes.length = 0;
radialGradients.length = 0;

wrapper.rect = { left: 600, top: 100, width: 75, height: 75, right: 675, bottom: 175 };
listeners.scroll();
while (animationFrames.length) animationFrames.shift()();
assert.ok(reflectionDraws > 0, 'reflection should update as the visible O scrolls upward');
assert.ok(Math.max.apply(null, reflectionAlphas) < nearHeroAlpha * 0.5, 'reflection should fade as the O moves farther from the horizon');
const reflectionScrollDelta = screenImageArgs[0][2] - initialReflectionY;
assert.ok(reflectionScrollDelta > 40 && reflectionScrollDelta < 60, 'reflection should drift down at one quarter speed as the O scrolls up');
assert.ok(Math.max.apply(null, sourceLogoSizes.map(size => size[0])) > initialReflectionWidth * 1.2, 'reflection width should grow while scrolling');
assert.ok(Math.max.apply(null, sourceLogoSizes.map(size => size[1])) > initialReflectionHeight * 1.2, 'reflection height should grow while scrolling');
const horizonSmearWhileScrolling = radialGradients.find(args => args[5] > 50 && Math.abs(args[4] - (horizonY + 4)) < 2);
assert.ok(horizonSmearWhileScrolling, 'horizon smear should remain visible while reflection moves');
assert.ok(Math.abs(horizonSmearWhileScrolling[4] - horizonSmearAtRest[4]) < 0.1, 'horizon smear should stay fixed as the reflection moves down');
reflectionDraws = 0;
sourceLogoDraws = 0;
reflectionAlphas.length = 0;
screenImageArgs.length = 0;
sourceLogoSizes.length = 0;

wrapper.rect = { left: 600, top: 50, width: 75, height: 75, right: 675, bottom: 125 };
listeners.scroll();
while (animationFrames.length) animationFrames.shift()();
assert.ok(reflectionDraws > 0, 'reflection should remain visible deeper into the upward scroll');
assert.ok(Math.max.apply(null, reflectionAlphas) < nearHeroAlpha * 0.4, 'reflection should be visibly faded deeper into scroll');
reflectionDraws = 0;
sourceLogoDraws = 0;
reflectionAlphas.length = 0;
screenImageArgs.length = 0;
sourceLogoSizes.length = 0;

wrapper.rect = { left: 600, top: -120, width: 75, height: 75, right: 675, bottom: -45 };
listeners.scroll();
while (animationFrames.length) animationFrames.shift()();
assert.strictEqual(reflectionDraws, 0, 'fully scrolled-out O should leave no reflection behind');
assert.strictEqual(sourceLogoDraws, 0, 'fully scrolled-out O should stop drawing its logo into the reflection');

// Viewport frame: fixed 3px edge sharing the live reflection loop/palette/fade.
assert.ok(workerSource.includes('viewport-frame'), 'viewport frame element should exist');
assert.ok(workerSource.includes('class="viewport-frame"'), 'viewport frame div should be rendered');
assert.ok(workerSource.includes('position:fixed'), 'viewport frame should be fixed positioned');
assert.ok(workerSource.includes('pointer-events:none'), 'viewport frame should never intercept clicks/scroll');
assert.ok(workerSource.includes('z-index:200'), 'viewport frame should sit above content without intercepting it');
assert.ok(workerSource.includes('border:3px solid'), 'viewport frame should be 3px on desktop');
assert.ok(workerSource.includes('@media(max-width:768px)'), 'viewport frame should declare a mobile width');
assert.ok(/@media\(max-width:768px\)[\s\S]*?\.viewport-frame\{[^}]*border-width:3px/.test(workerSource), 'viewport frame should declare 3px thickness for mobile');
assert.ok(!/\.viewport-frame\{[^}]*border(-width)?:([4-9]px|\d\d+px)/.test(workerSource), 'viewport frame should never exceed 3px');
assert.ok(workerSource.includes('env(safe-area-inset-top'), 'viewport frame should respect safe-area insets');
assert.ok(clientSource.includes('viewport-frame'), 'frame should be driven from the shared lake loop');
assert.ok(clientSource.includes('waterGlow'), 'frame should reuse the shared reflection fade');
assert.ok(/getElementById\("viewport-frame"\)/.test(clientSource), 'frame should reuse the live palette via the shared fade, not a new loop');
assert.ok(!/requestAnimationFrame\(frame/.test(clientSource), 'frame must not add its own animation loop');
console.log('✓ scroll reflection regression: reflection clears when O leaves the viewport');
console.log('✓ viewport frame: fixed 3px edge sharing the live reflection fade');
