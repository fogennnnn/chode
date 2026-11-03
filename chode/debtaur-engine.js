"use strict";
// Private Debtaur runtime bridge. No engine source/binary is redistributed here.
const fs = require("fs"),
  path = require("path"),
  os = require("os"),
  crypto = require("crypto"),
  { Worker } = require("worker_threads");
const PINNED = Object.freeze({
  "judge_wasm.js":
    "4be9fa032c2780d545e6e499c2062089b8b904b0b7d1b4bf7fc8aeb22f3eab0c",
  "judge_wasm.wasm":
    "e58ee25dc0c2dad6a1c61c20dae398aab0086f2e7675fe90765d18099cc110ac",
});
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
function directory(options = {}) {
  return (
    options.runtimeDir ||
    process.env.CHODE_DEBTAUR_RUNTIME ||
    path.join(
      process.env.CHODE_PROVIDER_HOME || os.homedir(),
      ".chode",
      "runtimes",
      "debtaur",
    )
  );
}
function runtime(options = {}) {
  const dir = path.resolve(directory(options)),
    files = {};
  for (const [name, expected] of Object.entries(PINNED)) {
    const full = path.join(dir, name),
      st = fs.lstatSync(full);
    if (
      !st.isFile() ||
      st.isSymbolicLink() ||
      st.nlink > 1 ||
      st.size > 1024 * 1024
    )
      throw Error("Unsafe Debtaur runtime file");
    const bytes = fs.readFileSync(full);
    if (hash(bytes) !== expected)
      throw Error("Debtaur runtime integrity mismatch: " + name);
    files[name] = bytes;
  }
  return { directory: dir, files, id: hash(JSON.stringify(PINNED)) };
}
function status(options = {}) {
  try {
    const r = runtime(options);
    return {
      enabled: process.env.CHODE_DEBTAUR !== "off",
      available: true,
      backend: "debtaur-wasm",
      runtimeHash: r.id,
      directory: r.directory,
      privateRuntime: true,
    };
  } catch (error) {
    return {
      enabled: process.env.CHODE_DEBTAUR !== "off",
      available: false,
      backend: "unavailable",
      reason:
        error.code === "ENOENT"
          ? "Standalone Debtaur runtime is not installed"
          : error.message,
    };
  }
}
function encode(operations) {
  if (
    !Array.isArray(operations) ||
    !operations.length ||
    operations.length > 48
  )
    throw Error("Debtaur batch must contain1–48 operations");
  const wire =
    operations
      .map((row) => {
        if (
          !row ||
          !["stated", "dreamt", "!", "-"].includes(row.op) ||
          typeof row.clause !== "string" ||
          !row.clause.trim() ||
          Buffer.byteLength(row.clause) > 180 ||
          /[\x00-\x1f\x7f]/.test(row.clause)
        )
          throw Error("Invalid Debtaur protocol operation");
        return row.op + "\t" + row.clause;
      })
      .join("\n") + "\n";
  if (Buffer.byteLength(wire) > 24000)
    throw Error("Debtaur protocol batch too large");
  return wire;
}
function decode(raw, operations) {
  if (typeof raw !== "string" || Buffer.byteLength(raw) >= 524287)
    throw Error("Invalid Debtaur response");
  const rows = JSON.parse(raw);
  if (!Array.isArray(rows) || rows.length !== operations.length)
    throw Error("Debtaur protocol row count mismatch");
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i],
      op = operations[i].op,
      expected = op === "!" ? "gate" : op === "-" ? "retract" : op;
    if (!row || row.op !== expected)
      throw Error("Debtaur protocol operation mismatch");
    if (op === "!") {
      if (
        row.input !== operations[i].clause ||
        !["allow", "deny", "refuted", "contradiction"].includes(row.verdict) ||
        typeof row.allow !== "boolean" ||
        row.allow !== (row.verdict === "allow") ||
        typeof row.why !== "string" ||
        !row.why.trim() ||
        !["stated", "derived", "taught", "dreamt"].includes(row.provenance) ||
        !row.evidence ||
        !["asserted", "rules", "derived"].every(
          (k) =>
            Array.isArray(row.evidence[k]) &&
            row.evidence[k].every((x) => typeof x === "string"),
        ) ||
        (row.allow && row.provenance === "dreamt")
      )
        throw Error("Invalid Debtaur gate verdict");
    } else if (op === "-") {
      if (
        typeof row.found !== "boolean" ||
        !Number.isSafeInteger(row.died) ||
        row.died < 0
      )
        throw Error("Invalid Debtaur retraction");
    } else if (row.ok !== true) throw Error("Debtaur assertion refused");
  }
  return rows;
}
function create(options = {}) {
  let worker = null,
    next = 0,
    closed = false,
    failure = null;
  const pending = new Map();
  const info = status(options);
  function fail(error) {
    failure = String(error.message || error).slice(0, 180);
    for (const p of pending.values()) {
      clearTimeout(p.timer);
      p.detach?.();
      p.resolve({ status: "unavailable", reason: failure });
    }
    pending.clear();
    if (worker) {
      worker.terminate().catch(() => {});
      worker = null;
    }
  }
  function start() {
    if (worker) return;
    if (!info.available) throw Error(info.reason);
    worker = new Worker(path.join(__dirname, "debtaur-worker.cjs"), {
      workerData: { directory: directory(options), pinned: PINNED },
      resourceLimits: { maxOldGenerationSizeMb: 96 },
    });
    worker.on("error", fail);
    worker.on("exit", (code) => {
      if (pending.size) fail(Error("Debtaur worker stopped (" + code + ")"));
    });
    worker.on("message", (message) => {
      const p = pending.get(message.id);
      if (!p) return;
      clearTimeout(p.timer);
      p.detach?.();
      pending.delete(message.id);
      if (!pending.size) worker?.unref();
      try {
        if (message.error) throw Error(message.error);
        const rows = decode(message.raw, p.operations);
        p.resolve({
          status: "judged",
          backend: "debtaur-wasm",
          runtimeHash: info.runtimeHash,
          inputHash: hash(p.wire),
          outputHash: hash(message.raw),
          rows,
        });
      } catch (error) {
        p.resolve({
          status: "unavailable",
          reason: String(error.message).slice(0, 180),
        });
        fail(error);
      }
    });
  }
  async function run(operations, signal = options.signal) {
    const wire = encode(operations);
    if (signal?.aborted)
      return { status: "unavailable", reason: "Debtaur request cancelled" };
    if (closed || failure || !info.available)
      return {
        status: "unavailable",
        reason: failure || info.reason || "Debtaur bridge closed",
      };
    if (pending.size >= 4)
      return {
        status: "unavailable",
        reason: "Debtaur concurrency limit reached",
      };
    try {
      start();
    } catch (error) {
      return { status: "unavailable", reason: error.message };
    }
    return new Promise((resolve) => {
      const id = ++next,
        timeout = Math.max(10, Math.min(10000, options.timeoutMs || 5000)),
        timer = setTimeout(
          () => fail(Error("Debtaur deadline exceeded")),
          timeout,
        );
      const cancel = () => fail(Error("Debtaur request cancelled"));
      signal?.addEventListener("abort", cancel, { once: true });
      pending.set(id, {
        resolve,
        timer,
        operations,
        wire,
        detach: () => signal?.removeEventListener("abort", cancel),
      });
      worker.ref();
      worker.postMessage({ id, wire });
    });
  }
  function close() {
    closed = true;
    fail(Error("Debtaur bridge closed"));
  }
  return {
    run,
    close,
    status: () => ({
      ...info,
      available: info.available && !failure && !closed,
      reason: failure || info.reason,
    }),
  };
}
function install(source, options = {}) {
  // Explicit local setup only: no private repository download or network request.
  const candidate = runtime({ runtimeDir: source }),
    target = path.resolve(directory(options));
  if (path.resolve(source) === target) return status(options);
  let at = path.parse(target).root;
  for (const part of target.slice(at.length).split(path.sep).filter(Boolean)) {
    at = path.join(at, part);
    try {
      const st = fs.lstatSync(at);
      if (!st.isDirectory() || st.isSymbolicLink())
        throw Error("Unsafe Debtaur installation directory");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      fs.mkdirSync(at, { mode: 0o700 });
    }
  }
  // Preserve any different/partial installation for explicit diagnosis.
  for (const [name, bytes] of Object.entries(candidate.files)) {
    const file = path.join(target, name);
    if (fs.existsSync(file)) {
      const st = fs.lstatSync(file);
      if (
        st.isSymbolicLink() ||
        st.nlink > 1 ||
        hash(fs.readFileSync(file)) !== PINNED[name]
      )
        throw Error("Existing Debtaur runtime differs; preserved for review");
    } else fs.writeFileSync(file, bytes, { flag: "wx", mode: 0o600 });
  }
  return status(options);
}
module.exports = {
  create,
  status,
  install,
  encode,
  decode,
  runtime,
  hash,
  PINNED,
};
if (require.main === module) {
  try {
    const [verb, source] = process.argv.slice(2);
    if (verb === "setup" && source)
      console.log(JSON.stringify(install(source), null, 2));
    else if (!verb || verb === "status")
      console.log(JSON.stringify(status(), null, 2));
    else
      throw Error(
        "Use node debtaur-engine.js status | setup <local-wasm-directory>",
      );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
