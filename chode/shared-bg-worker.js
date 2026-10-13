// Squid background sim — JET-PULSE locomotion + TIP-EAT growth.
// JET: 1.6s cycle per tick batch; the jet half-cycle accelerates FORWARD along
//   heading (small impulse), the glide half-cycle drags velocity *= 0.94;
//   speed is clamped to a slow readable drift across the viewport.
//   Heading wanders (small noise + gentle sine) and steers softly toward denser
//   living clusters in a short radius. Edges are TOROIDAL (matches the toroidal
//   indexAt wrap of the GoL grid), so the squid roams free and wraps around.
// EAT: Conway B3/S23 runs on the LIVING field only. Mantle + arm cells are
//   LOGICALLY DEAD: never written into the Conway array; any living cell they
//   cover is cleared. An arm grows (len++, cap MAX_LEN) ONLY when its tip cell
//   eats a living cell this tick; otherwise it decays toward MIN_LEN.
export class SharedBackgroundDO_v2 {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = new Map();
    this.simulationInterval = null;
    this.lastBroadcast = 0;
    this.broadcastInterval = 160;

    this.CELL_SIZE = 12;
    this.BACKGROUND_DENSITY = 0.01;
    this.TENTACLE_COUNT = 9;
    this.MIN_LEN = 10;
    this.MAX_LEN = 18;
    this.NORMAL_COLOR = "#27ff8e";
    this.SPECIAL_COLORS = ["#ff4fd8", "#b56cff", "#55b8ff"];
    this.DEFAULT_SANCTUARY_RADIUS = 38;
    this.JET_PERIOD_MS = 1600;
    this.JET_IMPULSE = 9;
    this.DRAG = 0.94;
    this.SQUID_MAX_SPEED = 75;
    this.SQUID_HOME_K = 0.12;
    this.SQUID_MAX_OMEGA = (50 * Math.PI) / 180; // ~50deg/s
    this.MANTLE_LEN_CELLS = 6;
    this.MANTLE_HALF_CELLS = 2.25;
    this.JET_CONE = (120 * Math.PI) / 180; // JET: rear cone narrowed ~120deg
    this.GLIDE_CONE = (155 * Math.PI) / 180; // GLIDE: rear cone opened ~155deg

    this.width = 8000;
    this.height = 8000;
    this.dpr = 1;
    this.cols = Math.max(1, Math.ceil(this.width / this.CELL_SIZE));
    this.rows = Math.max(1, Math.ceil(this.height / this.CELL_SIZE));
    this.generation = 0;
    this.visualTime = 0;
    this.sanctuaryRadius = this.DEFAULT_SANCTUARY_RADIUS;

    // Living field: sparse Conway B3/S23 (mantle + arms stay logically dead).
    this.currentAlive = new Uint8Array(this.cols * this.rows);
    this.nextAlive = new Uint8Array(this.cols * this.rows);
    this.eatCount = 0;

    // Squid agent: spawned near the hero negative space, then swims free with
    // only a very weak spring home (far weaker than jet thrust).
    this.home = { x: this.width / 2, y: this.height * 0.42 };
    this.squid = null;

    this.tentacles = [];
    this.tentacleCells = [];

    this.initSimulation();
  }

  initSimulation() {
    this.createTentacles();
    this.seed();
    this.startSimulationLoop();
  }

  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  cellIndex(x, y) {
    const col = this.clamp(Math.round(x / this.CELL_SIZE), 0, this.cols - 1);
    const row = this.clamp(Math.round(y / this.CELL_SIZE), 0, this.rows - 1);
    return row * this.cols + col;
  }

  wrapAngle(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a <= -Math.PI) a += Math.PI * 2;
    return a;
  }

  wrapX(x) {
    return ((x % this.width) + this.width) % this.width;
  }

  wrapY(y) {
    return ((y % this.height) + this.height) % this.height;
  }

  indexAt(col, row) {
    col = ((col % this.cols) + this.cols) % this.cols;
    row = ((row % this.rows) + this.rows) % this.rows;
    return row * this.cols + col;
  }

  neighborCount(state, index) {
    const col = index % this.cols;
    const row = Math.floor(index / this.cols);
    let count = 0;
    for (let y = -1; y <= 1; y += 1) {
      for (let x = -1; x <= 1; x += 1) {
        if (x || y) count += state[this.indexAt(col + x, row + y)];
      }
    }
    return count;
  }

  seed() {
    for (let i = 0; i < this.currentAlive.length; i += 1) {
      this.currentAlive[i] = Math.random() < this.BACKGROUND_DENSITY ? 1 : 0;
    }
  }

  seedPulse() {
    // One glider, injected far from the squid so it drifts in uneaten.
    const sx = this.squid ? this.squid.x : this.width / 2;
    const sy = this.squid ? this.squid.y : this.height / 2;
    const minDist = Math.min(this.width, this.height) * 0.25;
    let bestCol = 0;
    let bestRow = 0;
    let bestDist = -1;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const c = Math.floor(Math.random() * Math.max(1, this.cols - 3));
      const r = Math.floor(Math.random() * Math.max(1, this.rows - 3));
      const dx = (c + 1) * this.CELL_SIZE - sx;
      const dy = (r + 1) * this.CELL_SIZE - sy;
      const d = dx * dx + dy * dy;
      if (d > bestDist) { bestDist = d; bestCol = c; bestRow = r; }
      if (d >= minDist * minDist) break;
    }
    const glider = [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]];
    for (const point of glider) {
      this.currentAlive[this.indexAt(bestCol + point[0], bestRow + point[1])] = 1;
    }
  }

  allocate(newCols, newRows, preserve) {
    const oldAlive = this.currentAlive;
    const oldCols = this.cols;
    const oldRows = this.rows;
    this.cols = newCols;
    this.rows = newRows;
    const length = this.cols * this.rows;
    this.currentAlive = new Uint8Array(length);
    this.nextAlive = new Uint8Array(length);
    if (preserve && oldAlive && oldCols > 20 && oldRows > 20) {
      for (let row = 0; row < oldRows; row += 1) {
        for (let col = 0; col < oldCols; col += 1) {
          const from = row * oldCols + col;
          if (!oldAlive[from]) continue;
          const mappedCol = this.clamp(Math.floor((col + 0.5) * this.cols / oldCols), 0, this.cols - 1);
          const mappedRow = this.clamp(Math.floor((row + 0.5) * this.rows / oldRows), 0, this.rows - 1);
          this.currentAlive[mappedRow * this.cols + mappedCol] = 1;
        }
      }
    } else {
      this.seed();
    }
  }

  ensureSquid() {
    if (!this.squid) {
      this.squid = {
        x: this.home.x,
        y: this.home.y,
        vx: 0,
        vy: 0,
        heading: Math.random() * Math.PI * 2,
        pulsePhase: Math.random() * Math.PI * 2,
        mantleFill: 1,
        jetThrust: 0,
        jetting: false
      };
    } else {
      this.squid.x = ((this.squid.x % this.width) + this.width) % this.width;
      this.squid.y = ((this.squid.y % this.height) + this.height) % this.height;
    }
  }

  sanctuary() {
    return {
      x: this.squid ? this.squid.x : this.width * 0.5,
      y: this.squid ? this.squid.y : this.height * 0.5,
      radius: this.sanctuaryRadius
    };
  }

  createTentacles() {
    this.tentacles = [];
    for (let index = 0; index < this.TENTACLE_COUNT; index += 1) {
      const frac = this.TENTACLE_COUNT <= 1 ? 0
        : (index / (this.TENTACLE_COUNT - 1) - 0.5);
      const jitter = (Math.random() - 0.5) * 0.08;
      this.tentacles.push({
        frac: frac + jitter,
        spread: 0,
        phase: Math.random() * Math.PI * 2,
        waveSpeed: 0.4 + Math.random() * 0.7,
        swaySpeed: 0.5 + Math.random() * 0.4,
        swayLen: 4 + Math.random() * 5,
        colorIndex: index % this.SPECIAL_COLORS.length,
        len: this.MIN_LEN
      });
    }
  }

  tickSquid() {
    const dt = this.broadcastInterval / 1000;
    this.ensureSquid();
    const s = this.squid;
    s.pulsePhase += (Math.PI * 2 * this.broadcastInterval) / this.JET_PERIOD_MS;
    if (s.pulsePhase >= Math.PI * 2) {
      s.pulsePhase -= Math.PI * 2 * Math.floor(s.pulsePhase / (Math.PI * 2));
    }
    const duty = (s.pulsePhase / (Math.PI * 2)) % 1;
    const jetting = duty < 0.4;
    s.jetting = jetting;
    if (jetting) {
      const jetT = duty / 0.4;
      s.jetThrust = Math.sin(Math.PI * jetT);
      // Refill level: mantle squeezes during jet (1.0 -> 0.70).
      s.mantleFill = 1 - 0.3 * s.jetThrust;
    } else {
      const refillT = (duty - 0.4) / 0.6;
      // Refill: mantle re-inflates 0.70 -> ~1.0 with exp approach (k~1.0).
      s.mantleFill = 0.7 + 0.3 * (1 - Math.exp(-this.REFILL_K * refillT * 2.5));
      s.jetThrust = 0;
    }
    // Heading-first: wander + gentle sine + chemotaxis toward denser living
    // clusters in a short radius, clamped to maxOmega.
    const maxDelta = this.SQUID_MAX_OMEGA * dt;
    let dHeading = (Math.random() - 0.5) * 0.12 + 0.05 * Math.sin(this.visualTime * 0.9);
    let bestCount = 0;
    let bestDir = s.heading;
    if (this.currentAlive && this.cols > 0 && this.rows > 0) {
      const radius = 10 * this.CELL_SIZE;
      for (let d = 0; d < 8; d += 1) {
        const ang = (d / 8) * Math.PI * 2;
        let sx = s.x + Math.cos(ang) * radius;
        let sy = s.y + Math.sin(ang) * radius;
        sx = ((sx % this.width) + this.width) % this.width;
        sy = ((sy % this.height) + this.height) % this.height;
        const cc = this.clamp(Math.floor(sx / this.CELL_SIZE), 0, this.cols - 1);
        const rr = this.clamp(Math.floor(sy / this.CELL_SIZE), 0, this.rows - 1);
        let count = 0;
        for (let oy = -1; oy <= 1; oy += 1) {
          for (let ox = -1; ox <= 1; ox += 1) {
            const c = (cc + ox + this.cols) % this.cols;
            const r = (rr + oy + this.rows) % this.rows;
            count += this.currentAlive[r * this.cols + c];
          }
        }
        if (count > bestCount) { bestCount = count; bestDir = ang; }
      }
      if (bestCount > 0) {
        dHeading += this.clamp(this.wrapAngle(bestDir - s.heading), -0.4, 0.4) * 0.12;
      }
    }
    dHeading = this.clamp(dHeading, -maxDelta, maxDelta);
    s.heading = this.wrapAngle(s.heading + dHeading);
    // Thrust along (new) heading: JET sin profile; REFILL exp decay k~1.0.
    const cosH = Math.cos(s.heading);
    const sinH = Math.sin(s.heading);
    if (jetting) {
      s.vx += cosH * this.JET_IMPULSE * s.jetThrust;
      s.vy += sinH * this.JET_IMPULSE * s.jetThrust;
    } else {
      // Glide half-cycle: drag so it coasts like water.
      s.vx *= this.DRAG;
      s.vy *= this.DRAG;
    }
    // Very weak spring toward the soft home point (far weaker than jet thrust).
    let dxHome = this.home.x - s.x;
    let dyHome = this.home.y - s.y;
    if (dxHome > this.width / 2) dxHome -= this.width;
    else if (dxHome < -this.width / 2) dxHome += this.width;
    if (dyHome > this.height / 2) dyHome -= this.height;
    else if (dyHome < -this.height / 2) dyHome += this.height;
    s.vx += dxHome * this.SQUID_HOME_K * dt;
    s.vy += dyHome * this.SQUID_HOME_K * dt;
    // Clamp to slow drift.
    const sp = Math.hypot(s.vx, s.vy);
    if (sp > this.SQUID_MAX_SPEED) {
      s.vx = (s.vx / sp) * this.SQUID_MAX_SPEED;
      s.vy = (s.vy / sp) * this.SQUID_MAX_SPEED;
    }
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    // Toroidal wrap (matches local indexAt wrap).
    s.x = ((s.x % this.width) + this.width) % this.width;
    s.y = ((s.y % this.height) + this.height) % this.height;
  }

  resize(width, height, dpr) {
    const oldWidth = this.width;
    const oldHeight = this.height;
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.dpr = Math.min(dpr || 1, 2.5);
    this.home = { x: this.width / 2, y: this.height * 0.42 };
    const newCols = Math.max(1, Math.ceil(this.width / this.CELL_SIZE));
    const newRows = Math.max(1, Math.ceil(this.height / this.CELL_SIZE));
    const preserve = Boolean(this.currentAlive) && oldWidth > 500 && oldHeight > 500;
    if (!this.currentAlive || newCols !== this.cols || newRows !== this.rows) {
      this.allocate(newCols, newRows, preserve);
    }
    if (this.squid) {
      this.squid.x = this.clamp(this.squid.x, 0, this.width);
      this.squid.y = this.clamp(this.squid.y, 0, this.height);
    }
  }

  pushLine(list, c0, r0, c1, r1, colorIndex, thick) {
    const dc = Math.abs(c1 - c0);
    const dr = Math.abs(r1 - r0);
    const sc = c0 < c1 ? 1 : -1;
    const sr = r0 < r1 ? 1 : -1;
    let err = dc - dr;
    let c = c0;
    let r = r0;
    for (;;) {
      if (c >= 0 && r >= 0 && c < this.cols && r < this.rows) {
        list.push({ col: c, row: r, color: colorIndex, thick: thick || 1 });
      }
      if (c === c1 && r === r1) break;
      const e2 = 2 * err;
      if (e2 > -dr) { err -= dr; c += sc; }
      if (e2 < dc) { err += dc; r += sr; }
    }
  }

  thickAt(k) {
    if (k < 3) return 3;
    if (k < 7) return 2;
    return 1;
  }

  rebuildTentacles() {
    const s = this.squid;
    const cosH = Math.cos(s.heading);
    const sinH = Math.sin(s.heading);
    // Mantle-first: L constant ~6 cells (no length stretch); width breathes with refill.
    const L = this.MANTLE_LEN_CELLS * this.CELL_SIZE;
    const baseW = this.MANTLE_HALF_CELLS * this.CELL_SIZE;
    const fill = s.mantleFill !== undefined ? s.mantleFill : 1;
    const Wmax = baseW * (0.70 + 0.30 * fill);
    const uPeak = L * 0.15;
    const halfFwd = L / 2 - uPeak;
    const halfBack = L / 2 + uPeak;
    const colorTime = Math.floor(this.visualTime * 1.5);
    this.tentacleCells = [];

    // Mantle: fill EVERY interior cell (no hole); mantle cells also eat.
    {
      const coreColor = colorTime % this.SPECIAL_COLORS.length;
      const radCells = Math.ceil((L / 2 + baseW) / this.CELL_SIZE) + 1;
      const ccx = Math.floor(s.x / this.CELL_SIZE);
      const ccy = Math.floor(s.y / this.CELL_SIZE);
      for (let dr = -radCells; dr <= radCells; dr += 1) {
        for (let dc = -radCells; dc <= radCells; dc += 1) {
          const col = ((ccx + dc) % this.cols + this.cols) % this.cols;
          const row = ((ccy + dr) % this.rows + this.rows) % this.rows;
          const cx = (col + 0.5) * this.CELL_SIZE;
          const cy = (row + 0.5) * this.CELL_SIZE;
          let dx = cx - s.x;
          let dy = cy - s.y;
          if (dx > this.width / 2) dx -= this.width;
          else if (dx < -this.width / 2) dx += this.width;
          if (dy > this.height / 2) dy -= this.height;
          else if (dy < -this.height / 2) dy += this.height;
          const u = dx * cosH + dy * sinH;
          const v = dx * -sinH + dy * cosH;
          if (u < -L / 2 || u > L / 2) continue;
          let w;
          if (u >= uPeak) w = Wmax * (1 - ((u - uPeak) / halfFwd) * 0.9);
          else w = Wmax * (1 - (uPeak - u) / halfBack);
          if (w < 0) continue;
          if (Math.abs(v) <= w) {
            this.eatFlyersAt(cx, cy);
            this.tentacleCells.push({ col, row, color: coreColor, thick: 1 });
          }
        }
      }
    }

    // Arms: 8 rear-cone from a single shared root embedded in the mantle.
    // base = center - heading*L*0.35 (start 5-10% inside); spread by state
    // JET 20-30deg / GLIDE 40-60deg / HUNT flare 90-120deg; length 0.6-0.9*L
    // via len 10..18 over MAX_LEN (tip-eat grows, else decays).
    const reachMax = Math.min(this.width, this.height) * 0.22;
    const step = Math.max(3, reachMax / this.MAX_LEN);
    const cone = s.state === 'HUNT' ? this.HUNT_CONE : (s.jetting ? this.JET_CONE : this.GLIDE_CONE);
    const baseX = s.x - cosH * L * 0.35;
    const baseY = s.y - sinH * L * 0.35;

    for (let ti = 0; ti < this.tentacles.length; ti += 1) {
      const t = this.tentacles[ti];
      const frac = t.frac !== undefined ? t.frac : 0;
      const baseAngle = s.heading + Math.PI + frac * cone;

      const samples = [];
      for (let k = 0; k < t.len; k += 1) {
        const u = t.len <= 1 ? 0 : k / (t.len - 1);
        const r = u * (t.len - 1) * step;
        const bend = 0.28 * Math.sin(u * 3.0 - this.visualTime * t.waveSpeed + t.phase);
        const a = baseAngle + bend;
        const ca = Math.cos(a);
        const sa = Math.sin(a);
        const px = -sa;
        const py = ca;
        const sway = t.swayLen * u * Math.sin(t.phase + u * 4 - this.visualTime * t.swaySpeed);
        let x = baseX + ca * r + px * sway;
        let y = baseY + sa * r + py * sway;
        x = ((x % this.width) + this.width) % this.width;
        y = ((y % this.height) + this.height) % this.height;
        const col = ((Math.floor(x / this.CELL_SIZE) % this.cols) + this.cols) % this.cols;
        const row = ((Math.floor(y / this.CELL_SIZE) % this.rows) + this.rows) % this.rows;
        samples.push({ col, row, x, y });
      }

      // Eat: every sample clears flyers within CELL*1.2; tip eat grows, else decay.
      let tipAte = false;
      for (let k = 0; k < samples.length; k += 1) {
        const ate = this.eatFlyersAt(samples[k].x, samples[k].y);
        if (k === samples.length - 1 && ate) tipAte = true;
      }
      if (tipAte) t.len = Math.min(this.MAX_LEN, t.len + 1);
      else t.len = Math.max(this.MIN_LEN, t.len - 1);

      for (let k = 0; k < samples.length; k += 1) {
        const colorIndex = (t.colorIndex + k + colorTime) % this.SPECIAL_COLORS.length;
        const thick = this.thickAt(k);
        if (k === 0) {
          this.tentacleCells.push({ col: samples[k].col, row: samples[k].row, color: colorIndex, thick });
        } else {
          const pc = samples[k - 1];
          const cc = samples[k];
          const dcJump = Math.abs(cc.col - pc.col);
          const drJump = Math.abs(cc.row - pc.row);
          // Avoid streaking across the toroidal seam: push points, not a long line.
          if (dcJump > this.cols / 2 || drJump > this.rows / 2 || dcJump > 20 || drJump > 20) {
            this.tentacleCells.push({ col: cc.col, row: cc.row, color: colorIndex, thick });
          } else {
            this.pushLine(this.tentacleCells, pc.col, pc.row, cc.col, cc.row, colorIndex, thick);
          }
        }
      }
    }
  }

  update() {
    this.tickCount += 1;
    this.tickSquid();
    this.driftFlyers();
    this.tickFlashes();
    this.rebuildTentacles();
    this.generation += 1;
  }

  getState() {
    const aliveIndices = [];
    for (const f of this.flyers) {
      // Flyers render as 2x2 blocks: slightly larger/brighter than arm cells.
      const cc = this.clamp(Math.round(f.x / this.CELL_SIZE), 0, this.cols - 1);
      const cr = this.clamp(Math.round(f.y / this.CELL_SIZE), 0, this.rows - 1);
      for (let yy = 0; yy <= 1; yy += 1) {
        for (let xx = 0; xx <= 1; xx += 1) {
          const c = cc + xx;
          const r = cr + yy;
          if (c < this.cols && r < this.rows) aliveIndices.push(r * this.cols + c);
        }
      }
    }
    for (const fl of this.flashes) {
      for (const c of fl.cells) aliveIndices.push(c);
    }

    return {
      type: 'state',
      width: this.width,
      height: this.height,
      dpr: this.dpr,
      cols: this.cols,
      rows: this.rows,
      generation: this.generation,
      visualTime: this.visualTime,
      aliveIndices,
      tentacleCells: this.tentacleCells,
      sanctuary: this.sanctuary(),
      squid: { x: this.squid.x, y: this.squid.y, heading: this.squid.heading, pulsePhase: this.squid.pulsePhase, mantleFill: this.squid.mantleFill, state: this.squid.state },
      cellSize: this.CELL_SIZE,
      normalColor: this.NORMAL_COLOR,
      specialColors: this.SPECIAL_COLORS
    };
  }

  startSimulationLoop() {
    if (this.simulationInterval) return;
    this.simulationInterval = setInterval(() => {
      this.visualTime = Date.now() / 1000;
      this.update();
      this.broadcastState();
    }, this.broadcastInterval);
  }

  stopSimulationLoop() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  broadcastState() {
    const now = Date.now();
    if (now - this.lastBroadcast < this.broadcastInterval) return;
    this.lastBroadcast = now;

    const state = this.getState();
    const message = JSON.stringify(state);

    for (const [ws, session] of this.sessions) {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(message);
        } catch (e) {
          this.sessions.delete(ws);
        }
      } else {
        this.sessions.delete(ws);
      }
    }

    if (this.sessions.size === 0) {
      this.stopSimulationLoop();
    }
  }

  addSession(ws) {
    this.sessions.set(ws, { connectedAt: Date.now() });
    ws.send(JSON.stringify({ type: 'init', ...this.getState() }));
    this.startSimulationLoop();
  }

  removeSession(ws) {
    this.sessions.delete(ws);
    if (this.sessions.size === 0) {
      this.stopSimulationLoop();
    }
  }

  handleMessage(ws, message) {
    try {
      const data = JSON.parse(message);
      if (data.type === 'resize') {
        this.resize(data.width, data.height, data.dpr);
        ws.send(JSON.stringify({ type: 'resize_ack', ...this.getState() }));
      }
    } catch (e) {
    }
  }

  async fetch(request) {
    const url = new URL(request.url);
    
    if (url.pathname === '/websocket') {
      const upgradeHeader = request.headers.get('Upgrade');
      if (!upgradeHeader || upgradeHeader !== 'websocket') {
        return new Response('Expected Upgrade: websocket', { status: 426 });
      }

      const [client, server] = Object.values(new WebSocketPair());
      server.accept();
      this.addSession(server);

      server.addEventListener('message', (event) => {
        this.handleMessage(server, event.data);
      });

      server.addEventListener('close', () => {
        this.removeSession(server);
      });

      return new Response(null, { status: 101, webSocket: client });
    }

    return new Response('Shared Background DO', { status: 200 });
  }
}

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
  let homeTarget = null;
  let firstApplied = false;
  let sanctuaryRadius = Number.isFinite(configuredRadius) && configuredRadius > 0
    ? Math.max(18, Math.min(80, configuredRadius))
    : DEFAULT_SANCTUARY_RADIUS;

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
    ctx.clearRect(0, 0, width, height);
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

    // oSlot initial target only (not every frame): capture once, then keep fixed.
    if (!homeTarget) {
      const oSlot = document.querySelector('.hero-title .o-slot') || document.querySelector('.hero-title .chode-wrap .o-slot') || document.querySelector('.hero h1 .accent');
      let targetX = cssWidth / 2;
      let targetY = cssHeight * 0.4;
      if (oSlot) {
        const oRect = oSlot.getBoundingClientRect();
        targetX = oRect.left + oRect.width / 2 - rect.left;
        targetY = oRect.top + oRect.height / 2 - rect.top;
      }
      homeTarget = { x: targetX, y: targetY };
    }

    // FIXED transform: fixed world->screen scale anchored on world center.
    // Do not per-frame re-center on squid; let the squid roam across the viewport.
    const scaleX = cssWidth / width;
    const scaleY = cssHeight / height;
    const scale = Math.min(scaleX, scaleY);

    ctx.setTransform(scale * dpr, 0, 0, scale * dpr,
      homeTarget.x - (width / 2) * scale, homeTarget.y - (height / 2) * scale);

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
          // Reduced-motion: apply first state then close, no animation.
          if (reducedMotion) {
            if (!firstApplied) {
              firstApplied = true;
              applyState(state);
              try { ws.close(); } catch (e) {}
            }
            return;
          }
          applyState(state);
        }
      } catch (e) {
      }
    };

    ws.onclose = () => {
      if (reducedMotion) return;
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (url.pathname === '/websocket') {
      const id = env.SHARED_BG.idFromName('global');
      const stub = env.SHARED_BG.get(id);
      return stub.fetch(request);
    }

    if (url.pathname === '/client.js') {
      return new Response(CLIENT_JS, {
        headers: { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'public, max-age=3600' }
      });
    }

    return new Response('Shared Background Server', { status: 200 });
  }
};