/* HEMO Game of Life background.
   Two species share the grid, at war:
   - The LIVING field: sparse Conway B3/S23 cells, drawn lime.
   - The DEAD arms: tentacles rooted under the O. Their cells are LOGICALLY
     DEAD (kept out of the Conway array), drawn in the HEMO logo palette. They
     are short, and only grow by EATING a living cell at their tip. Starve and
     they retract toward the O. Rendered as squares — cheaper than circles. */
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
  const BACKGROUND_DENSITY = 0.02;
  const TENTACLE_COUNT = 9;
  const MIN_LEN = 8;
  const MAX_LEN = 14;
  const NORMAL_COLOR = "#27ff8e";
  const SPECIAL_COLORS = ["#ff4fd8", "#b56cff", "#55b8ff"];

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
  let visualTime = 0;

  const sanctuaryRadius = Number.isFinite(configuredRadius) && configuredRadius > 0
    ? Math.max(18, Math.min(80, configuredRadius))
    : DEFAULT_SANCTUARY_RADIUS;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function indexAt(col, row) {
    col = (col + cols) % cols;
    row = (row + rows) % rows;
    return row * cols + col;
  }

  function neighborCount(state, index) {
    const col = index % cols;
    const row = Math.floor(index / cols);
    let count = 0;
    for (let y = -1; y <= 1; y += 1) {
      for (let x = -1; x <= 1; x += 1) {
        if (x || y) count += state[indexAt(col + x, row + y)];
      }
    }
    return count;
  }

  function sanctuary() {
    return {
      x: width * 0.5,
      y: height * 0.5,
      radius: sanctuaryRadius
    };
  }

  function createTentacles() {
    tentacles = [];
    for (let index = 0; index < TENTACLE_COUNT; index += 1) {
      tentacles.push({
        angle: (index / TENTACLE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.16,
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
    const originCol = Math.floor(Math.random() * Math.max(1, cols - 3));
    const originRow = Math.floor(Math.random() * Math.max(1, rows - 3));
    const glider = [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]];
    for (const point of glider) {
      currentAlive[indexAt(originCol + point[0], originRow + point[1])] = 1;
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

  // Taper profile from the O outward: 3 cells thick at the logo, 2 thick for
  // the next four steps, then 1 (thin) for the rest of the arm.
  function thickAt(k) {
    if (k < 3) return 3;
    if (k < 7) return 2;
    return 1;
  }

  // Rebuild the dead arms. A tentacle is a short, slowly curling arm from the O
  // outward; it CONSUMES every living cell its body covers (the war), and only
  // its tip grows one segment when it finds food to eat. Starve and it retracts.
  function rebuildTentacles() {
    const area = sanctuary();
    const rootR = area.radius * 0.5;
    const reachMax = Math.min(width, height) * 0.22;
    const step = Math.max(3, (reachMax - rootR) / MAX_LEN);
    const colorTime = Math.floor(visualTime * 1.5);
    tentacleCells = [];

    for (let ti = 0; ti < tentacles.length; ti += 1) {
      const t = tentacles[ti];

      // Sample root -> tip along a slow lateral curl, so the arm waves like a
      // tentacle instead of snapping straight like a laser spoke.
      const samples = [];
      for (let k = 0; k < t.len; k += 1) {
        const u = t.len <= 1 ? 0 : k / (t.len - 1);
        const r = rootR + u * (t.len - 1) * step;
        const bend = 0.28 * Math.sin(u * 3.0 - visualTime * t.waveSpeed + t.phase);
        const a = t.angle + bend;
        const ca = Math.cos(a);
        const sa = Math.sin(a);
        const px = -sa;
        const py = ca;
        const sway = t.swayLen * u * Math.sin(t.phase + u * 4 - visualTime * t.swaySpeed);
        const x = area.x + ca * r + px * sway;
        const y = area.y + sa * r + py * sway;
        const col = clamp(Math.round(x / CELL_SIZE), 0, cols - 1);
        const row = clamp(Math.round(y / CELL_SIZE), 0, rows - 1);
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
        // Fixed taper: 3 cells thick at the logo, 2 thick for 4 steps, 1 beyond.
        const thick = thickAt(k);
        if (k === 0) {
          tentacleCells.push({ col: samples[k].col, row: samples[k].row, color: colorIndex, thick });
        } else {
          pushLine(tentacleCells, samples[k - 1].col, samples[k - 1].row,
            samples[k].col, samples[k].row, colorIndex, thick);
        }
      }
    }
  }

  function update() {
    const area = sanctuary();
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

    // The dead arms overwrite/feed on the grid but live outside Conway.
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
    const area = sanctuary();

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

    ctx.strokeStyle = "rgba(181, 108, 255, 0.14)";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 5]);
    ctx.beginPath();
    ctx.arc(area.x, area.y, area.radius + 1, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

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

    // Dead arms — colored squares, tapered by cell-block coverage:
    // 3 cells thick at the logo (2x2 block), 2 thick for four steps (2-wide),
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
