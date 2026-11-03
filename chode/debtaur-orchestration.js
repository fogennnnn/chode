"use strict";
// Host-owned evidence, not model-authored propositions. See DEBTAUR-INTEGRATION.md.
const fs = require("fs"),
  path = require("path"),
  crypto = require("crypto"),
  engine = require("./debtaur-engine");
const hash = engine.hash;
const RULES = Object.freeze({
  dispatch: {
    rules: [
      "if the scope is valid and the owner is current then the worker may start",
    ],
    goal: "the worker may start",
    facts: ["the scope is valid", "the owner is current"],
  },
  handoff: {
    rules: [
      "if the owner is current and the artifact is current then the handoff is checked",
      "if the handoff is checked and the check is passed then the handoff is ready",
    ],
    goal: "the handoff is ready",
    facts: [
      "the owner is current",
      "the artifact is current",
      "the check is passed",
    ],
  },
  verify: {
    rules: [
      "if the artifact is current and the check is passed then the evidence is checked",
      "if the evidence is checked and the workers are settled then the evidence is usable",
    ],
    goal: "the evidence is usable",
    facts: [
      "the artifact is current",
      "the check is passed",
      "the workers are settled",
    ],
  },
});
function create(root, options = {}) {
  root = fs.realpathSync(root);
  const client = options.client || engine.create(options),
    run = crypto.randomUUID(),
    taskHash = hash(
      JSON.stringify([
        options.goal || "",
        options.session || "default",
        options.acceptanceDigest || "",
      ]),
    );
  const owners = new Map(),
    leases = new Map(),
    events = [];
  let sequence = 0,
    decisionCount = 0,
    head = "0".repeat(64),
    lastProof = null,
    lastDecision = null,
    storageWarning = null;
  const relative = path.join(".chode", "orchestration", run + ".json");
  function fileName(file) {
    if (typeof file !== "string" || !file || /[\x00-\x1f]/.test(file))
      throw Error("Invalid artifact path");
    const full = path.resolve(root, file),
      rel = path.relative(root, full);
    if (
      !rel ||
      rel === ".." ||
      rel.startsWith(".." + path.sep) ||
      path.isAbsolute(rel) ||
      /(^|[/\\])(?:\.chode|\.git|node_modules|\.env(?:\.[^/\\]*)?|credentials?)(?:[/\\]|$)/i.test(
        rel,
      ) ||
      (options.allowed && !options.allowed(full))
    )
      throw Error("Artifact is outside the permitted source scope");
    let at = root;
    for (const segment of rel.split(path.sep)) {
      at = path.join(at, segment);
      try {
        if (fs.lstatSync(at).isSymbolicLink())
          throw Error("Linked artifact path");
      } catch (error) {
        if (error.code === "ENOENT") break;
        throw error;
      }
    }
    return {
      full,
      rel: rel.split(path.sep).join("/"),
      key: process.platform === "win32" ? full.toLowerCase() : full,
    };
  }
  function snapshot(files, allowMissing = false) {
    const rows = [];
    let total = 0;
    try {
      if (!Array.isArray(files) || files.length > 256)
        throw Error("Artifact set exceeds256 files");
      const names = [...new Set(files)]
        .map(fileName)
        .sort((a, b) => a.rel.localeCompare(b.rel, "en"));
      for (const item of names) {
        let fd;
        try {
          fd = fs.openSync(
            item.full,
            fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0),
          );
          const st = fs.fstatSync(fd);
          if (
            !st.isFile() ||
            st.nlink > 1 ||
            st.size > 16 * 1024 * 1024 ||
            (total += st.size) > 64 * 1024 * 1024
          )
            throw Error("Artifact cannot be bounded safely");
          // Read at most the observed size plus one byte. A concurrently
          // growing artifact must not turn a bounded hash into an unbounded read.
          const buffer = Buffer.alloc(st.size + 1);
          let length = 0;
          while (length < buffer.length) {
            const read = fs.readSync(
              fd,
              buffer,
              length,
              buffer.length - length,
              length,
            );
            if (!read) break;
            length += read;
          }
          const bytes = buffer.subarray(0, length);
          const after = fs.fstatSync(fd);
          if (
            bytes.length !== st.size ||
            after.mtimeMs !== st.mtimeMs ||
            after.size !== st.size
          )
            throw Error("Artifact changed while hashing");
          rows.push({ file: item.rel, hash: hash(bytes) });
        } catch (error) {
          if (error.code === "ENOENT" && allowMissing)
            rows.push({ file: item.rel, hash: null });
          else throw error;
        } finally {
          if (fd !== undefined) fs.closeSync(fd);
        }
      }
      return { ok: true, files: rows, hash: hash(JSON.stringify(rows)) };
    } catch (error) {
      return { ok: false, reason: error.message, files: [] };
    }
  }
  function persist() {
    if (options.noMemory) return;
    try {
      let at = root;
      for (const part of [".chode", "orchestration"]) {
        at = path.join(at, part);
        try {
          const st = fs.lstatSync(at);
          if (st.isSymbolicLink() || !st.isDirectory())
            throw Error("Unsafe orchestration storage");
        } catch (error) {
          if (error.code !== "ENOENT") throw error;
          fs.mkdirSync(at, { mode: 0o700 });
        }
      }
      const file = path.join(root, relative);
      try {
        const st = fs.lstatSync(file);
        if (st.isSymbolicLink() || st.nlink > 1 || !st.isFile())
          throw Error("Unsafe orchestration report");
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
      const temp = file + "." + crypto.randomBytes(6).toString("hex") + ".tmp";
      try {
        fs.writeFileSync(
          temp,
          JSON.stringify(
            {
              schema: 1,
              policy: "chode-evidence-v1",
              run,
              taskHash,
              head,
              sequence,
              events,
            },
            null,
            2,
          ) + "\n",
          { flag: "wx", mode: 0o600 },
        );
        fs.renameSync(temp, file);
      } finally {
        try {
          fs.unlinkSync(temp);
        } catch {}
      }
    } catch (error) {
      storageWarning = String(error.message).slice(0, 160);
    }
  }
  function record(kind, data) {
    const event = { sequence: ++sequence, kind, ...data, previous: head };
    head = hash(JSON.stringify(event));
    events.push({ ...event, hash: head });
    if (events.length > 128) events.shift();
    persist();
  }
  async function decide(stage, flags, detail = {}) {
    const policy = RULES[stage],
      local = flags.every(Boolean) && !options.signal?.aborted;
    const operations = [
      ...policy.rules.map((clause) => ({ op: "stated", clause })),
      ...policy.facts
        .filter((_, i) => flags[i])
        .map((clause) => ({ op: "stated", clause })),
      { op: "!", clause: policy.goal },
    ];
    let judged;
    try {
      judged = await client.run(operations, options.signal);
    } catch (error) {
      judged = { status: "unavailable", reason: error.message };
    }
    const gate = judged.status === "judged" ? judged.rows.at(-1) : null;
    const result = {
      allowed: local && (!gate || gate.allow === true),
      status: gate ? (gate.allow && local ? "allow" : "deny") : "unavailable",
      stage,
      localAllowed: local,
      missing: policy.facts.filter((_, i) => !flags[i]),
      backend: gate ? "debtaur-wasm" : "unavailable",
      runtimeHash: judged.runtimeHash,
      inputHash: judged.inputHash,
      outputHash: judged.outputHash,
      reason: gate?.why || judged.reason || "Judge unavailable",
      ...detail,
    };
    decisionCount++;
    lastDecision = result;
    record("decision", {
      ...result,
      proof: gate
        ? {
            verdict: gate.verdict,
            provenance: gate.provenance,
            evidence: gate.evidence,
          }
        : null,
    });
    return result;
  }
  function invalidate(decision, reason) {
    decision.allowed = false;
    decision.status = "deny";
    decision.localAllowed = false;
    decision.reason = reason;
    decision.missing = [
      ...new Set([...(decision.missing || []), "the artifact is current"]),
    ];
    record("invalidation", {
      stage: decision.stage,
      inputHash: decision.inputHash,
      reason,
    });
    return decision;
  }
  async function dispatch(unit) {
    const files = Array.isArray(unit?.files) ? unit.files : [],
      before = snapshot(files, true);
    let scope = before.ok && files.length > 0,
      available = true,
      keys = [];
    if (scope) {
      keys = files.map(fileName).map((x) => x.key);
      available = keys.every((key) => !owners.has(key));
    }
    const lease = {
      id: crypto.randomUUID(),
      unit: String(unit?.id || "worker").slice(0, 80),
      files: [...files],
      active: scope && available,
      before,
    };
    // Reserve before awaiting: concurrent dispatches cannot claim the same file.
    if (lease.active) {
      leases.set(lease.id, lease);
      keys.forEach((key) => owners.set(key, lease.id));
    }
    const verdict = await decide("dispatch", [scope, available], {
      unit: lease.unit,
      lease: lease.id,
    });
    if (!verdict.allowed) {
      release(lease, "dispatch-denied");
      return { ok: false, decision: verdict };
    }
    return { ok: true, lease, decision: verdict };
  }
  function release(lease, reason) {
    if (!lease || leases.get(lease.id) !== lease) return;
    lease.active = false;
    for (const [key, id] of owners) if (id === lease.id) owners.delete(key);
    leases.delete(lease.id);
    record("worker-release", { unit: lease.unit, lease: lease.id, reason });
  }
  async function handoff(lease, beforeChecks, verdict) {
    const owns = !!lease && leases.get(lease.id) === lease && lease.active,
      after = lease ? snapshot(lease.files) : { ok: false };
    const stable =
      !!beforeChecks?.ok && after.ok && beforeChecks.hash === after.hash;
    const decision = await decide(
      "handoff",
      [owns, stable, verdict?.ok === true],
      {
        unit: lease?.unit || "unknown",
        lease: lease?.id,
        snapshotHash: after.hash,
        artifacts: after.files,
      },
    );
    if (decision.allowed) {
      const final = snapshot(lease.files);
      if (!final.ok || final.hash !== after.hash)
        invalidate(
          decision,
          "Artifact changed while the handoff verdict was computed",
        );
    }
    release(lease, decision.allowed ? "handoff" : "handoff-rejected");
    return decision;
  }
  async function verify(check, files) {
    const before = snapshot(files);
    lastProof = null;
    const result = await check(),
      after = snapshot(files);
    const observable = before.ok && after.ok,
      stable = observable && before.hash === after.hash;
    // Unsupported/oversized sets do not invent a native approval; baseline checks
    // remain useful. Actual observed mutations always invalidate the check.
    if (!observable) {
      lastDecision = {
        stage: "verify",
        status: "unavailable",
        backend: "unavailable",
        reason: before.reason || after.reason,
        allowed: result.pass === true,
        localAllowed: result.pass === true,
      };
      record("unobservable-check", lastDecision);
      return result;
    }
    const decision = await decide(
      "verify",
      [
        stable,
        result.pass === true,
        leases.size === 0 &&
          (!options.workersSettled || options.workersSettled()),
      ],
      {
        snapshotHash: after.hash,
        artifacts: after.files,
        checkHash: hash(JSON.stringify(result.checks || [])),
      },
    );
    if (decision.allowed) {
      const final = snapshot(files);
      if (!final.ok || final.hash !== after.hash)
        invalidate(
          decision,
          "Artifact changed while the check verdict was computed",
        );
    }
    result.debtaur = decision;
    if (result.pass && !decision.allowed) {
      const failed = {
        check: "current orchestration evidence",
        ok: false,
        detail: decision.missing.join("; ") || decision.reason,
      };
      result.checks.push(failed);
      result.failed.push(failed);
      result.pass = false;
    }
    if (result.pass)
      lastProof = {
        ...after,
        checkHash: hash(JSON.stringify(result.checks || [])),
      };
    return result;
  }
  async function confirm() {
    if (!lastProof)
      return {
        allowed: !options.signal?.aborted,
        status: "unavailable",
        reason: "No bounded artifact snapshot was certified",
      };
    const now = snapshot(lastProof.files.map((x) => x.file));
    const decision = await decide(
      "verify",
      [
        now.ok && now.hash === lastProof.hash,
        true,
        leases.size === 0 &&
          (!options.workersSettled || options.workersSettled()),
      ],
      { snapshotHash: now.hash, checkHash: lastProof.checkHash },
    );
    if (decision.allowed) {
      const final = snapshot(lastProof.files.map((x) => x.file));
      if (!final.ok || final.hash !== lastProof.hash)
        invalidate(
          decision,
          "Artifact changed while final evidence was confirmed",
        );
    }
    return decision;
  }
  function summary() {
    return {
      policy: "chode-evidence-v1",
      status: lastDecision?.status || "not-used",
      backend: lastDecision?.backend || "unavailable",
      runtimeHash: lastDecision?.runtimeHash,
      stage: lastDecision?.stage,
      reason: lastDecision?.reason,
      decisions: decisionCount,
      report: options.noMemory ? null : relative.split(path.sep).join("/"),
      storageWarning,
    };
  }
  function close() {
    client.close();
  }
  return {
    dispatch,
    handoff,
    release,
    snapshot,
    verify,
    confirm,
    summary,
    close,
    events: () => JSON.parse(JSON.stringify(events)),
  };
}
module.exports = { create, RULES };
