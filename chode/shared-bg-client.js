/* Shared Background Client Renderer
   Connects to the shared background WebSocket and renders the streamed state.
   Usage: Include this script in your HTML and add <canvas id="space"></canvas> */
(function () {
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
  let sanctuaryRadius = Number.isFinite(configuredRadius) && configuredRadius > 0
    ? Math.max(18, Math.min(80, configuredRadius))
    : DEFAULT_SANCTUARY_RADIUS;
  // FIXED camera: oSlot lookup runs ONCE for first-frame placement; stored
  // world->screen fit is reused thereafter so squid.x/y roams freely.
  let viewFixed = null;
  let drewReducedFrame = false;

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

  function ensureView(cssWidth, cssHeight, rect, anchor) {
    if (viewFixed) return viewFixed;
    // First-frame placement only: align the initial anchor under .o-slot once.
    let targetX = cssWidth / 2;
    let targetY = cssHeight * 0.4;
    const oSlot = document.querySelector('.hero-title .o-slot') || document.querySelector('.hero-title .chode-wrap .o-slot') || document.querySelector('.hero h1 .accent');
    if (oSlot) {
      const oRect = oSlot.getBoundingClientRect();
      targetX = oRect.left + oRect.width / 2 - rect.left;
      targetY = oRect.top + oRect.height / 2 - rect.top;
    }
    const scale = Math.min(cssWidth / width, cssHeight / height) || 1;
    viewFixed = { scale, tx: targetX - anchor.x * scale, ty: targetY - anchor.y * scale };
    return viewFixed;
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

    // FIXED transform: anchor captured once, squid roams across canvas after.
    const anchor = squid ? { x: squid.x, y: squid.y } : (state.sanctuary || sanctuary());
    const view = ensureView(cssWidth, cssHeight, rect, anchor);
    ctx.setTransform(view.scale * dpr, 0, 0, view.scale * dpr,
      view.tx * dpr, view.ty * dpr);

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
          if (reducedMotion) {
            if (!drewReducedFrame) {
              drewReducedFrame = true;
              applyState(state);
            }
            try { ws.close(); } catch (e) {}
            return;
          }
          applyState(state);
        }
      } catch (e) {
      }
    };

    ws.onclose = () => {
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
})();