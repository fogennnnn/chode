/* SQUID Game of Life background — JET/REFILL + mantle-first cruise (proportional speed bump).
   LIVING: Conway B3/S23 on living field only (lime #27ff8e), sparse 0.01 + glider seedPulse far from squid. GoL cells don't drift — 5x cruise rule is worker-flyer specific (worker: flyers 20-45 → squid cruise 225 =5x).
   SQUID (LOGICALLY DEAD: never in Conway array, only CLEARs living it overlaps; mantle-first: heading = mantle-tip = velocity dir):
   - Cycle T=0.75s, phase 0..1: 0..0.4 JET contract (v+=heading*jetGain*sin(pi*phase/0.4), JET_GAIN 135 proportional bump), 0.4..1.0 REFILL coast (zero thrust, v*=exp(-1.0*dt) + slight reverse). Burst 7.5 BL/s cap (<0.5s jet window 0.3s), cruise ~1.0-1.5 BL/s emerges (proportional to worker 5x feel). Toroidal wrap x/y (matches indexAt wrap).
   - Per tick order: heading wander/steer FIRST (clamped maxOmega 50deg/s), then thrust along heading, then pos+=vel*dt. v lerps toward heading*speed 1.5/s. Weak home spring weaker than jet.
   - Mantle: CONSTANT length ~6 cells, width=baseW*(0.70+0.30*mantleFill) (1 refill expanded, 0.6 contracted jet); L:W ~4:1-6:1 teardrop taper both ends; EVERY interior cell filled (u/v test, no hole); single root embedded.
   - Arms x8: single shared root inside mantle (base=center-heading*L*0.35, start=base-heading*L*0.05); spreadTotal lerp by jetMix (1 JET tight 25deg torpedo, 0 REFILL glide 50deg splay; BRAKE/HUNT flare 105deg when slow; spreads unchanged); length 0.9-1.3*L, taper base->tip, small wave/sway; tip-eat->len++ cap 24 else decay floor 8; mantle+arms eat.
   Render: clear -> glow under mantle (squid-centered, no stroke) -> lime -> mantle solid -> arms tapered. */
(function () {
  const canvas = document.getElementById("space");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
  if (!ctx) return;

  const query = new URLSearchParams(window.location.search);
  const configuredRadius = Number(query.get("radius"));
  const reducedMotion = Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const UPDATE_MS = 160;
  const DEFAULT_SANCTUARY_RADIUS = 38;
  const CELL_SIZE = 12;
  const BACKGROUND_DENSITY = 0.01;
  const TENTACLE_COUNT = 8;
  const MIN_LEN = 8;
  const MAX_LEN = 24;
  const NORMAL_COLOR = "#27ff8e";
  const SPECIAL_COLORS = ["#ff4fd8", "#b56cff", "#55b8ff"];
  const JET_PERIOD_MS = 750;
  const JET_GAIN = 135; // proportional bump (3x): matches worker 5x feel; GoL has no drift
  const DRAG_K = 1.0;
  const REVERSE_GAIN = 6;
  const SPRING_K = 0.12;
  const SENSE_CELLS = 10;
  const MAX_OMEGA = 50 * Math.PI / 180;
  const ALIGN_RATE = 1.5;
  const MANTLE_LEN_CELLS = 6;
  const BASE_HALF_CELLS = 0.65;
  const JET_SPREAD_TOTAL = 25 * Math.PI / 180;
  const GLIDE_SPREAD_TOTAL = 50 * Math.PI / 180;
  const HUNT_SPREAD_TOTAL = 105 * Math.PI / 180;

  let width = 1;
  let height = 1;
  let dpr = 1;
  let cols = 1;
  let rows = 1;
  let generation = 0;
  let lastUpdate = 0;
  let reportClock = 0;
  let resizeFrame = 0;
  let currentAlive;
  let nextAlive;
  let tentacles = [];
  let tentacleCells = [];
  let mantleCells = [];
  let visualTime = 0;
  let squid = null;

  const sanctuaryRadius = Number.isFinite(configuredRadius) && configuredRadius > 0
    ? Math.max(18, Math.min(80, configuredRadius))
    : DEFAULT_SANCTUARY_RADIUS;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function wrapAngle(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a <= -Math.PI) a += Math.PI * 2;
    return a;
  }

  function indexAt(col, row) {
    col = (col + cols) % cols;
    row = (row + rows) % rows;
    return row * cols + col;
  }

  function bodyLength() {
    return MANTLE_LEN_CELLS * CELL_SIZE;
  }

  function sanctuary() {
    if (!squid) return { x: width * 0.5, y: height * 0.5, radius: sanctuaryRadius };
    return { x: squid.x, y: squid.y, radius: sanctuaryRadius };
  }

  function ensureSquid() {
    if (!squid) {
      squid = {
        x: width * 0.5,
        y: height * 0.5,
        vx: 0,
        vy: 0,
        heading: Math.random() * Math.PI * 2,
        pulsePhase: Math.random(),
        jetMix: 0,
        speed: 0,
        food: 0
      };
    } else {
      squid.x = ((squid.x % width) + width) % width;
      squid.y = ((squid.y % height) + height) % height;
    }
  }

  function createTentacles() {
    tentacles = [];
    for (let index = 0; index < TENTACLE_COUNT; index += 1) {
      const frac = TENTACLE_COUNT <= 1 ? 0 : (index / (TENTACLE_COUNT - 1) - 0.5);
      const jitter = (Math.random() - 0.5) * 0.08;
      tentacles.push({
        frac,
        jitter,
        phase: Math.random() * Math.PI * 2,
        waveSpeed: 0.4 + Math.random() * 0.7,
        swaySpeed: 0.5 + Math.random() * 0.4,
        swayLen: 4 + Math.random() * 5,
        colorIndex: index % SPECIAL_COLORS.length,
        len: MIN_LEN
      });
    }
  }

  function seed() {
    for (let index = 0; index < currentAlive.length; index += 1) {
      currentAlive[index] = Math.random() < BACKGROUND_DENSITY ? 1 : 0;
    }
  }

  function seedPulse() {
    // Inject glider at a distance from the squid so flyers approach and get eaten.
    let bestCol = 0;
    let bestRow = 0;
    let bestDist = -1;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const c = Math.floor(Math.random() * Math.max(1, cols - 3));
      const r = Math.floor(Math.random() * Math.max(1, rows - 3));
      let d = Infinity;
      if (squid) {
        let dx = (c + 1) * CELL_SIZE - squid.x;
        let dy = (r + 1) * CELL_SIZE - squid.y;
        if (dx > width / 2) dx -= width;
        else if (dx < -width / 2) dx += width;
        if (dy > height / 2) dy -= height;
        else if (dy < -height / 2) dy += height;
        d = dx * dx + dy * dy;
      } else {
        d = attempt;
      }
      if (d > bestDist) {
        bestDist = d;
        bestCol = c;
        bestRow = r;
      }
    }
    const glider = [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]];
    for (const point of glider) {
      currentAlive[indexAt(bestCol + point[0], bestRow + point[1])] = 1;
    }
  }

  function allocate(newCols, newRows, preserve) {
    const oldAlive = currentAlive;
    const oldCols = cols;
    const oldRows = rows;

    cols = newCols;
    rows = newRows;
    const length = cols * rows;
    currentAlive = new Uint8Array(length);
    nextAlive = new Uint8Array(length);

    if (preserve && oldAlive && oldCols > 20 && oldRows > 20) {
      for (let row = 0; row < oldRows; row += 1) {
        for (let col = 0; col < oldCols; col += 1) {
          const from = row * oldCols + col;
          if (!oldAlive[from]) continue;
          const mappedCol = clamp(Math.floor((col + 0.5) * cols / oldCols), 0, cols - 1);
          const mappedRow = clamp(Math.floor((row + 0.5) * rows / oldRows), 0, rows - 1);
          currentAlive[mappedRow * cols + mappedCol] = 1;
        }
      }
    } else {
      seed();
    }
  }

  function resize() {
    const oldWidth = width;
    const oldHeight = height;
    // Use bounding rect so rendered size (including CSS scale / browser zoom) is respected
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const newCols = Math.max(1, Math.ceil(width / CELL_SIZE));
    const newRows = Math.max(1, Math.ceil(height / CELL_SIZE));
    const preserve = Boolean(currentAlive) && oldWidth > 500 && oldHeight > 500;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (!currentAlive || newCols !== cols || newRows !== rows) {
      allocate(newCols, newRows, preserve);
    }
    ensureSquid();
    if (reducedMotion) {
      // Single static frame with solid mantle + short arms, no pulse.
      for (let i = 0; i < tentacles.length; i += 1) tentacles[i].len = MIN_LEN;
      squid.pulsePhase = 0.6;
      squid.jetMix = 0;
      const cruise = 0.4 * bodyLength();
      squid.vx = Math.cos(squid.heading) * cruise;
      squid.vy = Math.sin(squid.heading) * cruise;
      squid.speed = cruise;
      nextAlive.set(currentAlive);
      rebuildTentacles();
      const swap = currentAlive;
      currentAlive = nextAlive;
      nextAlive = swap;
    }
    draw();
  }

  // Bresenham: push every grid cell on the line into the dead-arm list.
  function pushLine(list, c0, r0, c1, r1, colorIndex, thick) {
    const dc = Math.abs(c1 - c0);
    const dr = Math.abs(r1 - r0);
    const sc = c0 < c1 ? 1 : -1;
    const sr = r0 < r1 ? 1 : -1;
    let err = dc - dr;
    let c = c0;
    let r = r0;
    for (;;) {
      if (c >= 0 && r >= 0 && c < cols && r < rows) {
        list.push({ col: c, row: r, color: colorIndex, thick: thick || 1 });
      }
      if (c === c1 && r === r1) break;
      const e2 = 2 * err;
      if (e2 > -dr) { err -= dr; c += sc; }
      if (e2 < dc) { err += dc; r += sr; }
    }
  }

  // Taper profile from the body outward: 3 cells thick at the base, 2 thick for
  // the next four steps, then 1 (thin) for the rest of the arm.
  function thickAt(k) {
    if (k < 3) return 3;
    if (k < 7) return 2;
    return 1;
  }

  function updateSquid() {
    if (!squid) ensureSquid();
    const dt = UPDATE_MS / 1000;
    const BL = bodyLength();
    const speedPrev = Math.hypot(squid.vx, squid.vy);
    const velAng = speedPrev > 1 ? Math.atan2(squid.vy, squid.vx) : squid.heading;

    // 1) Heading FIRST (mantle-first): wander + align-to-velocity + chemotaxis, clamped.
    const wander = (Math.random() - 0.5) * 0.12 + 0.05 * Math.sin(visualTime * 0.9);
    let chemo = 0;
    let bestCount = -1;
    let bestDir = squid.heading;
    if (currentAlive && cols > 0 && rows > 0 && width > 1 && height > 1) {
      const radius = SENSE_CELLS * CELL_SIZE;
      for (let d = 0; d < 8; d += 1) {
        const ang = (d / 8) * Math.PI * 2;
        let sx = squid.x + Math.cos(ang) * radius;
        let sy = squid.y + Math.sin(ang) * radius;
        sx = ((sx % width) + width) % width;
        sy = ((sy % height) + height) % height;
        const cc = clamp(Math.floor(sx / CELL_SIZE), 0, cols - 1);
        const rr = clamp(Math.floor(sy / CELL_SIZE), 0, rows - 1);
        let count = 0;
        for (let oy = -1; oy <= 1; oy += 1) {
          for (let ox = -1; ox <= 1; ox += 1) {
            const c = (cc + ox + cols) % cols;
            const r = (rr + oy + rows) % rows;
            count += currentAlive[r * cols + c];
          }
        }
        if (count > bestCount) {
          bestCount = count;
          bestDir = ang;
        }
      }
      if (bestCount > 0) {
        chemo = clamp(wrapAngle(bestDir - squid.heading), -0.4, 0.4) * 0.12;
      }
    }
    squid.food = bestCount;
    const align = speedPrev > 1 ? wrapAngle(velAng - squid.heading) * 0.3 : 0;
    const raw = align + wander + chemo;
    const maxTurn = MAX_OMEGA * dt;
    squid.heading += clamp(raw, -maxTurn, maxTurn);

    // 2) Thrust along heading: JET 0..0.4 contract, REFILL 0.4..1.0 coast.
    squid.pulsePhase += (UPDATE_MS / JET_PERIOD_MS);
    if (squid.pulsePhase >= 1) squid.pulsePhase -= Math.floor(squid.pulsePhase);
    const jetting = squid.pulsePhase < 0.4;
    squid.jetMix = jetting ? 1 : 0;
    const hx = Math.cos(squid.heading);
    const hy = Math.sin(squid.heading);
    if (jetting) {
      const jetProfile = Math.sin(Math.PI * squid.pulsePhase / 0.4);
      squid.vx += hx * JET_GAIN * jetProfile;
      squid.vy += hy * JET_GAIN * jetProfile;
    } else {
      const dragF = Math.exp(-DRAG_K * dt);
      squid.vx *= dragF;
      squid.vy *= dragF;
      squid.vx -= hx * REVERSE_GAIN * dt;
      squid.vy -= hy * REVERSE_GAIN * dt;
    }

    // v lerps toward heading*speed.
    const spd = Math.hypot(squid.vx, squid.vy);
    if (spd > 0.01) {
      const l = Math.min(1, ALIGN_RATE * dt);
      const tx = hx * spd;
      const ty = hy * spd;
      squid.vx += (tx - squid.vx) * l;
      squid.vy += (ty - squid.vy) * l;
    }

    // Weak home spring to center, weaker than jet thrust.
    let dxHome = width * 0.5 - squid.x;
    let dyHome = height * 0.5 - squid.y;
    if (dxHome > width / 2) dxHome -= width;
    else if (dxHome < -width / 2) dxHome += width;
    if (dyHome > height / 2) dyHome -= height;
    else if (dyHome < -height / 2) dyHome += height;
    squid.vx += dxHome * SPRING_K * dt;
    squid.vy += dyHome * SPRING_K * dt;

    // Clamp: burst 7.5 BL/s hard cap (<0.5s jet window 0.3s); cruise ~1.0-1.5 BL/s emerges via drag (proportional bump, spreads/drag unchanged).
    const BURST_MAX = 7.5 * BL;
    const sp2 = Math.hypot(squid.vx, squid.vy);
    if (sp2 > BURST_MAX) {
      squid.vx *= BURST_MAX / sp2;
      squid.vy *= BURST_MAX / sp2;
    }
    squid.speed = Math.hypot(squid.vx, squid.vy);

    // 3) Integrate then toroidal wrap (matches indexAt wrap).
    squid.x += squid.vx * dt;
    squid.y += squid.vy * dt;
    squid.x = ((squid.x % width) + width) % width;
    squid.y = ((squid.y % height) + height) % height;
  }

  // Rebuild the dead body + arms. Mantle is a filled teardrop along heading
  // (constant length, pulsing width); arms share one root embedded inside the
  // mantle. Both CONSUME living cells they cover (cleared from nextAlive) but
  // stay out of Conway; only the arm tip grows.
  function rebuildTentacles() {
    if (!squid) ensureSquid();
    const jetMix = squid.pulsePhase < 0.4 ? 1 : 0;
    squid.jetMix = jetMix;
    const mantleFill = 1 - 0.4 * jetMix;
    const L = MANTLE_LEN_CELLS * CELL_SIZE;
    const baseW = BASE_HALF_CELLS * CELL_SIZE;
    const Wmax = baseW * (0.70 + 0.30 * mantleFill);
    const colorTime = Math.floor(visualTime * 1.5);
    const hx = Math.cos(squid.heading);
    const hy = Math.sin(squid.heading);
    const uPeak = L * 0.15;
    const halfFwd = L / 2 - uPeak;
    const halfBack = L / 2 + uPeak;
    mantleCells = [];
    tentacleCells = [];

    // Mantle: fill EVERY interior cell (no hole).
    const radCells = Math.ceil((L / 2 + Wmax) / CELL_SIZE) + 1;
    const ccx = Math.floor(squid.x / CELL_SIZE);
    const ccy = Math.floor(squid.y / CELL_SIZE);
    for (let dr = -radCells; dr <= radCells; dr += 1) {
      for (let dc = -radCells; dc <= radCells; dc += 1) {
        const col = ((ccx + dc) % cols + cols) % cols;
        const row = ((ccy + dr) % rows + rows) % rows;
        const cx = (col + 0.5) * CELL_SIZE;
        const cy = (row + 0.5) * CELL_SIZE;
        let dx = cx - squid.x;
        let dy = cy - squid.y;
        if (dx > width / 2) dx -= width;
        else if (dx < -width / 2) dx += width;
        if (dy > height / 2) dy -= height;
        else if (dy < -height / 2) dy += height;
        const u = dx * hx + dy * hy;
        const v = dx * -hy + dy * hx;
        if (u < -L / 2 || u > L / 2) continue;
        let w;
        if (u >= uPeak) w = Wmax * (1 - ((u - uPeak) / halfFwd) * 0.9);
        else w = Wmax * (1 - (uPeak - u) / halfBack);
        if (w < 0) continue;
        if (Math.abs(v) <= w) {
          const idx = row * cols + col;
          if (nextAlive[idx]) nextAlive[idx] = 0;
          const color = ((col + row) % SPECIAL_COLORS.length + SPECIAL_COLORS.length) % SPECIAL_COLORS.length;
          mantleCells.push({ col, row, color });
        }
      }
    }

    // Arms: 8 arms from a single shared root embedded INSIDE the mantle.
    const BL = bodyLength();
    const spd = (squid.speed != null ? squid.speed : Math.hypot(squid.vx, squid.vy));
    const BRAKE_THRESH = 0.3 * BL;
    let spreadTotal;
    if (spd < BRAKE_THRESH) spreadTotal = HUNT_SPREAD_TOTAL;
    else spreadTotal = GLIDE_SPREAD_TOTAL + (JET_SPREAD_TOTAL - GLIDE_SPREAD_TOTAL) * jetMix;
    const baseX = squid.x - hx * L * 0.35;
    const baseY = squid.y - hy * L * 0.35;
    const startX = baseX - hx * L * 0.05;
    const startY = baseY - hy * L * 0.05;

    for (let ti = 0; ti < tentacles.length; ti += 1) {
      const t = tentacles[ti];
      const baseAngle = squid.heading + Math.PI + t.frac * spreadTotal + t.jitter;
      const targetReach = L * (0.9 + 0.4 * (t.len - MIN_LEN) / (MAX_LEN - MIN_LEN));

      const samples = [];
      for (let k = 0; k < t.len; k += 1) {
        const u = t.len <= 1 ? 0 : k / (t.len - 1);
        const r = u * targetReach;
        const bend = 0.28 * Math.sin(u * 3.0 - visualTime * t.waveSpeed + t.phase);
        const a = baseAngle + bend;
        const ca = Math.cos(a);
        const sa = Math.sin(a);
        const px = -sa;
        const py = ca;
        const sway = t.swayLen * u * Math.sin(t.phase + u * 4 - visualTime * t.swaySpeed);
        let x = startX + ca * r + px * sway;
        let y = startY + sa * r + py * sway;
        x = ((x % width) + width) % width;
        y = ((y % height) + height) % height;
        const col = clamp(Math.floor(x / CELL_SIZE), 0, cols - 1);
        const row = clamp(Math.floor(y / CELL_SIZE), 0, rows - 1);
        samples.push({ col, row });
      }

      // Consume living cells the body covers; grow only at the eating tip.
      let ateAtTip = false;
      for (let k = 0; k < samples.length; k += 1) {
        const idx = samples[k].row * cols + samples[k].col;
        if (nextAlive[idx]) {
          nextAlive[idx] = 0;
          if (k === samples.length - 1) ateAtTip = true;
        }
      }
      if (ateAtTip) t.len = Math.min(MAX_LEN, t.len + 1);
      else t.len = Math.max(MIN_LEN, t.len - 1);

      for (let k = 0; k < samples.length; k += 1) {
        const colorIndex = (t.colorIndex + k + colorTime) % SPECIAL_COLORS.length;
        const thick = thickAt(k);
        if (k === 0) {
          tentacleCells.push({ col: samples[k].col, row: samples[k].row, color: colorIndex, thick });
        } else {
          const pc = samples[k - 1];
          const cc = samples[k];
          const dcJump = Math.abs(cc.col - pc.col);
          const drJump = Math.abs(cc.row - pc.row);
          // Avoid streaking across the toroidal seam: push points, not a long line.
          if (dcJump > cols / 2 || drJump > rows / 2 || dcJump > 20 || drJump > 20) {
            tentacleCells.push({ col: cc.col, row: cc.row, color: colorIndex, thick });
          } else {
            pushLine(tentacleCells, pc.col, pc.row, cc.col, cc.row, colorIndex, thick);
          }
        }
      }
    }
  }

  function update() {
    if (!squid) ensureSquid();
    updateSquid();
    nextAlive.fill(0);

    // Conway pass for the living field.
    for (let index = 0; index < currentAlive.length; index += 1) {
      const neighbors = neighborCount(currentAlive, index);
      if (currentAlive[index]
        ? (neighbors === 2 || neighbors === 3)
        : neighbors === 3) {
        nextAlive[index] = 1;
      }
    }

    // The dead body/arms overwrite/feed on the grid but live outside Conway.
    rebuildTentacles();

    const swap = currentAlive;
    currentAlive = nextAlive;
    nextAlive = swap;
    generation += 1;

    let population = 0;
    for (let index = 0; index < currentAlive.length; index += 1) {
      population += currentAlive[index];
    }
    if (population < currentAlive.length * 0.003 || population === 0) {
      seedPulse();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    if (!squid) ensureSquid();
    const area = sanctuary();

    // Soft glow under mantle only.
    const glow = ctx.createRadialGradient(
      area.x, area.y, 2,
      area.x, area.y, CELL_SIZE * 8
    );
    glow.addColorStop(0, "rgba(255, 79, 216, 0.10)");
    glow.addColorStop(0.42, "rgba(181, 108, 255, 0.06)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(area.x, area.y, CELL_SIZE * 8, 0, Math.PI * 2);
    ctx.fill();

    // Living field — lime squares (cheap fillRect, no per-cell shadow).
    const inset = Math.max(1, Math.floor(CELL_SIZE * 0.16));
    const size = CELL_SIZE - inset * 2;
    ctx.fillStyle = NORMAL_COLOR;
    ctx.globalAlpha = 0.7;
    for (let index = 0; index < currentAlive.length; index += 1) {
      if (!currentAlive[index]) continue;
      const x = (index % cols) * CELL_SIZE + inset;
      const y = Math.floor(index / cols) * CELL_SIZE + inset;
      ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;

    // Mantle solid fill — every interior cell, no hole.
    for (let i = 0; i < mantleCells.length; i += 1) {
      const cell = mantleCells[i];
      ctx.fillStyle = SPECIAL_COLORS[cell.color % SPECIAL_COLORS.length];
      ctx.fillRect(cell.col * CELL_SIZE, cell.row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }

    // Dead arms — colored squares, tapered by cell-block coverage:
    // 3 cells thick at the base (2x2 block), 2 thick for four steps (2-wide),
    // 1 to the tip. Squares stay cheap (fillRect), just more of them.
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

  function reportDensity() {
    if (window.parent === window) return;
    const area = sanctuary();
    const radiusSquared = area.radius * area.radius;
    let count = 0;
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const dx = (col + 0.5) * CELL_SIZE - area.x;
        const dy = (row + 0.5) * CELL_SIZE - area.y;
        if (dx * dx + dy * dy <= radiusSquared) {
          count += currentAlive[row * cols + col];
        }
      }
    }
    try {
      window.parent.postMessage({ type: "boundaries-density", count }, "*");
    } catch (_) {
      // Decorative telemetry must never interrupt rendering.
    }
  }

  function loop(now) {
    requestAnimationFrame(loop);
    visualTime = now / 1000;
    if (document.hidden) {
      lastUpdate = now;
      return;
    }
    if (!lastUpdate) lastUpdate = now;
    const elapsed = now - lastUpdate;
    if (elapsed >= UPDATE_MS) {
      const steps = Math.min(4, Math.floor(elapsed / UPDATE_MS));
      lastUpdate += steps * UPDATE_MS;
      for (let step = 0; step < steps; step += 1) update();
      reportClock += steps * UPDATE_MS;
    }
    draw();
    if (reportClock >= 120) {
      reportClock = 0;
      reportDensity();
    }
  }

  createTentacles();
  resize();
  addEventListener("resize", function () {
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(function () {
      resizeFrame = 0;
      resize();
    });
  }, { passive: true });
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) lastUpdate = performance.now();
  });
  if (!reducedMotion) {
    requestAnimationFrame(loop);
  }
})();
