"use strict";
const assert = require("assert/strict"),
  fs = require("fs"),
  path = require("path"),
  os = require("os"),
  { spawnSync } = require("child_process"),
  bridge = require("../debtaur-engine"),
  { create, RULES } = require("../debtaur-orchestration");
async function main() {
  const info = bridge.status();
  assert(info.enabled, "Enable Debtaur before the live integration test");
  assert(
    info.available,
    "Install/provide the pinned private runtime before running this live test: " +
      info.reason,
  );
  const client = bridge.create(),
    root = fs.mkdtempSync(path.join(os.tmpdir(), "chode-debtaur-live-"));
  let truthCases = 0;
  try {
    for (const rule of Object.values(RULES))
      for (let mask = 0; mask < 2 ** rule.facts.length; mask++) {
        const ops = [
          ...rule.rules.map((clause) => ({ op: "stated", clause })),
          ...rule.facts
            .filter((_, i) => mask & (1 << i))
            .map((clause) => ({ op: "stated", clause })),
          { op: "!", clause: rule.goal },
        ];
        const a = await client.run(ops),
          b = await client.run(ops);
        assert.equal(a.status, "judged", a.reason);
        assert.equal(
          a.rows.at(-1).allow,
          mask === 2 ** rule.facts.length - 1,
          rule.goal + " mask" + mask,
        );
        assert.equal(a.inputHash, b.inputHash);
        assert.equal(a.outputHash, b.outputHash);
        truthCases++;
      }
    const facts = [
      ...RULES.verify.rules.map((clause) => ({ op: "stated", clause })),
      ...RULES.verify.facts.map((clause) => ({ op: "stated", clause })),
    ];
    let result = await client.run([
      ...facts,
      { op: "!", clause: RULES.verify.goal },
      { op: "-", clause: "the artifact is current" },
      { op: "!", clause: RULES.verify.goal },
    ]);
    assert(result.rows.at(-3).allow);
    assert(result.rows.at(-2).died > 0);
    assert(
      !result.rows.at(-1).allow,
      "native retraction removes derived approval",
    );
    result = await client.run([
      ...facts.map((row) =>
        row.clause === "the artifact is current"
          ? { ...row, op: "dreamt" }
          : row,
      ),
      { op: "!", clause: RULES.verify.goal },
    ]);
    assert(
      !result.rows.at(-1).allow,
      "invented support cannot certify a check",
    );
    result = await client.run([{ op: "!", clause: RULES.verify.goal }]);
    assert(
      !result.rows[0].allow,
      "reusing the module never leaks another batch world",
    );
    const parallel = await Promise.all(
      Array.from({ length: 5 }, () =>
        client.run([...facts, { op: "!", clause: RULES.verify.goal }]),
      ),
    );
    assert.equal(parallel.filter((r) => r.status === "judged").length, 4);
    assert.equal(parallel[4].status, "unavailable");
    fs.writeFileSync(path.join(root, "a.js"), "module.exports=1;");
    const audit = create(root, { noMemory: true });
    try {
      const lease = await audit.dispatch({ id: "one", files: ["a.js"] });
      assert(lease.ok);
      assert.equal(lease.decision.backend, "debtaur-wasm");
      assert(!(await audit.dispatch({ id: "conflict", files: ["a.js"] })).ok);
      const before = audit.snapshot(["a.js"]);
      fs.writeFileSync(path.join(root, "a.js"), "module.exports=2;");
      assert(
        !(await audit.handoff(lease.lease, before, { ok: true })).allowed,
        "stale handoff is refused",
      );
      const retry = await audit.dispatch({ id: "retry", files: ["a.js"] });
      assert(retry.ok);
      assert(
        (
          await audit.handoff(retry.lease, audit.snapshot(["a.js"]), {
            ok: true,
          })
        ).allowed,
      );
      const verified = await audit.verify(
        async () => ({
          pass: true,
          checks: [{ check: "fixture", ok: true }],
          failed: [],
        }),
        ["a.js"],
      );
      assert(verified.pass);
      assert.equal(verified.debtaur.backend, "debtaur-wasm");
      assert((await audit.confirm()).allowed);
      fs.writeFileSync(path.join(root, "a.js"), "module.exports=3;");
      assert(
        !(await audit.confirm()).allowed,
        "post-review mutation cannot reuse a passing check",
      );
    } finally {
      audit.close();
    }
    const cancellation = new AbortController(),
      cancelled = bridge.create();
    const waiting = cancelled.run(
      [...facts, { op: "!", clause: RULES.verify.goal }],
      cancellation.signal,
    );
    cancellation.abort();
    assert.equal((await waiting).status, "unavailable");
    cancelled.close();
    // Deliberately broken worker: a real CPU hang must time out, never approve.
    fs.copyFileSync(
      path.join(__dirname, "../debtaur-engine.js"),
      path.join(root, "engine.cjs"),
    );
    fs.writeFileSync(path.join(root, "debtaur-worker.cjs"), "while(true){}");
    const broken = require(path.join(root, "engine.cjs")).create({
      timeoutMs: 25,
    });
    const started = Date.now();
    const timedOut = await broken.run([
      { op: "!", clause: "the fixture is ready" },
    ]);
    assert.equal(timedOut.status, "unavailable");
    assert.match(timedOut.reason, /deadline/);
    assert(Date.now() - started < 3000);
    broken.close();
    // The final reviewer tries to mutate a checked implementation before PASS.
    fs.writeFileSync(
      path.join(root, "acceptance.cjs"),
      "require('assert').equal(require('./answer.js'),42);",
    );
    const reviewerProbe = async function (enginePath, enabled) {
      const fs = require("fs"),
        assert = require("assert/strict"),
        e = require(enginePath);
      let wrote = false,
        reviewed = false;
      const fence = String.fromCharCode(96).repeat(3),
        block = (tool, args) =>
          fence + "tool\n" + JSON.stringify({ tool, args }) + "\n" + fence;
      const r = await e.runAgentLoop(
        "Create answer.js exporting 42.",
        null,
        null,
        {
          v2: true,
          debtaur: enabled,
          verifierForce: "llm7",
          maxModelCalls: 6,
          noMemory: true,
          acceptanceTest: "acceptance.cjs",
        },
        async (p) => {
          if (p.includes("[PLAN"))
            return {
              provider: "planner",
              result: "1. Create answer.js — check: node acceptance.cjs",
            };
          if (p.includes("[VERIFY")) {
            assert.equal(
              fs.readFileSync("answer.js", "utf8"),
              "module.exports=42;",
            );
            reviewed = true;
            fs.writeFileSync("answer.js", "module.exports=0;");
            return { provider: "reviewer", result: "PASS" };
          }
          if (!wrote) {
            wrote = true;
            return {
              provider: "author",
              result: block("write", {
                file: "answer.js",
                content: "module.exports=42;",
              }),
            };
          }
          return { provider: "author", result: "DONE" };
        },
        null,
        null,
        { originalTask: "Create answer.js exporting 42." },
      );
      assert(
        reviewed,
        "negative control must actually reach the independent reviewer: " +
          JSON.stringify({
            status: r.completionStatus,
            result: r.res,
            actions: r.actions,
          }),
      );
      assert.equal(fs.readFileSync("answer.js", "utf8"), "module.exports=0;");
      assert.equal(
        r.completionStatus === "VERIFIED",
        !enabled,
        "enabled binding rejects the real post-check mutation; deliberately disabled binding exposes it",
      );
      console.log(
        enabled
          ? "stale review refused"
          : "negative control exposed stale certification",
      );
    };
    for (const enabled of [false, true]) {
      try {
        fs.unlinkSync(path.join(root, "answer.js"));
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
      const childSource =
        "(" +
        reviewerProbe.toString() +
        ")(" +
        JSON.stringify(path.resolve(__dirname, "../chode.js")) +
        "," +
        enabled +
        ").catch(e=>{console.error(e);process.exitCode=1})";
      const child = spawnSync(process.execPath, ["-e", childSource], {
        cwd: root,
        encoding: "utf8",
        timeout: 30000,
        env: { ...process.env, CHODE_COUNCIL: "off" },
        windowsHide: true,
      });
      assert.equal(child.status, 0, child.stdout + child.stderr);
      assert(
        child.stdout.includes(
          enabled
            ? "stale review refused"
            : "negative control exposed stale certification",
        ),
      );
    }
    console.log(
      "PASS live Debtaur: " +
        truthCases +
        " native policy truth-table cases with byte-identical replay, genuine retraction/taint/isolation, bounded concurrency, leases/stale generations, real cancellation/hung-worker deadline and malicious reviewer rejection",
    );
  } finally {
    client.close();
    fs.rmSync(root, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 100,
    });
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
