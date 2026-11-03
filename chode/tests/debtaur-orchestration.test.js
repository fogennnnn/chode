"use strict";
const assert = require("assert/strict"),
  fs = require("fs"),
  path = require("path"),
  os = require("os"),
  bridge = require("../debtaur-engine"),
  policy = require("../debtaur-orchestration");
async function main() {
  assert.throws(
    () => bridge.encode([{ op: "teacher", clause: "the file is ready" }]),
    /protocol/,
  );
  assert.throws(
    () => bridge.encode([{ op: "stated", clause: "one\n!\tinjected" }]),
    /protocol/,
  );
  assert.throws(
    () =>
      bridge.encode(Array(49).fill({ op: "!", clause: "the file is ready" })),
    /48/,
  );
  const ops = [{ op: "!", clause: "the file is ready" }];
  for (const raw of [
    "{}",
    "[]",
    '[{"op":"gate","allow":true}]',
    '[{"op":"stated","ok":true}]',
  ])
    assert.throws(() => bridge.decode(raw, ops));
  const gate = {
    op: "gate",
    input: "the file is ready",
    verdict: "deny",
    allow: false,
    why: "missing premise",
    provenance: "stated",
    evidence: { asserted: [], rules: [], derived: [] },
  };
  assert.equal(bridge.decode(JSON.stringify([gate]), ops)[0].allow, false);
  assert.throws(() =>
    bridge.decode(JSON.stringify([{ ...gate, allow: true }]), ops),
  );
  assert.throws(() =>
    bridge.decode(
      JSON.stringify([
        { ...gate, verdict: "allow", allow: true, provenance: "dreamt" },
      ]),
      ops,
    ),
  );
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "chode-debtaur-unit-"));
  fs.writeFileSync(path.join(root, "a.js"), "module.exports=1;");
  // An unavailable engine never invents native approval. Host invariants still apply.
  const audit = policy.create(root, {
    client: {
      run: async () => ({ status: "unavailable", reason: "fixture offline" }),
      close() {},
    },
  });
  try {
    const first = await audit.dispatch({ id: "one", files: ["a.js"] });
    assert(first.ok);
    const competing = await audit.dispatch({ id: "two", files: ["a.js"] });
    assert(!competing.ok);
    const before = audit.snapshot(["a.js"]);
    audit.release(first.lease, "worker-crash");
    assert(!(await audit.handoff(first.lease, before, { ok: true })).allowed);
    const next = await audit.dispatch({ id: "retry", files: ["a.js"] });
    assert(next.ok);
    const ready = audit.snapshot(["a.js"]);
    assert((await audit.handoff(next.lease, ready, { ok: true })).allowed);
    let result = await audit.verify(
      async () => ({ pass: true, checks: [], failed: [] }),
      ["a.js"],
    );
    assert(result.pass);
    assert.equal(audit.summary().status, "unavailable");
    fs.writeFileSync(path.join(root, "a.js"), "module.exports=2;");
    assert(
      !(await audit.confirm()).allowed,
      "changed bytes invalidate even when the judge is offline",
    );
    result = await audit.verify(async () => {
      fs.writeFileSync(path.join(root, "a.js"), "module.exports=3;");
      return { pass: true, checks: [], failed: [] };
    }, ["a.js"]);
    assert(!result.pass, "mutation during checks invalidates the check");
    const escaped = await audit.dispatch({
      id: "escape",
      files: ["../outside.js"],
    });
    assert(!escaped.ok);
    const during = policy.create(root, {
      noMemory: true,
      client: {
        run: async () => {
          fs.writeFileSync(path.join(root, "a.js"), "module.exports=4;");
          return { status: "unavailable", reason: "fixture timing" };
        },
        close() {},
      },
    });
    const raced = await during.verify(
      async () => ({ pass: true, checks: [], failed: [] }),
      ["a.js"],
    );
    assert(
      !raced.pass,
      "generation is checked after the asynchronous verdict too",
    );
    during.close();
    const pending = policy.create(root, {
      noMemory: true,
      workersSettled: () => false,
      client: { run: async () => ({ status: "unavailable" }), close() {} },
    });
    assert(
      !(
        await pending.verify(
          async () => ({ pass: true, checks: [], failed: [] }),
          ["a.js"],
        )
      ).pass,
      "unjoined workers cannot be certified even offline",
    );
    pending.close();
    assert(fs.existsSync(path.join(root, audit.summary().report)));
    const rows = audit.events();
    let previous = rows[0].previous;
    for (const event of rows) {
      const { hash, ...data } = event;
      assert.equal(data.previous, previous);
      assert.equal(bridge.hash(JSON.stringify(data)), hash);
      previous = hash;
    }
    const fresh = policy.create(root, {
      noMemory: true,
      client: { run: async () => ({ status: "unavailable" }), close() {} },
    });
    assert(
      (await fresh.dispatch({ id: "fresh", files: ["a.js"] })).ok,
      "recorded ownership is never replayed as a live owner",
    );
    fresh.close();
  } finally {
    audit.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
  console.log(
    "PASS Debtaur host/codec: strict native contract, explicit verdicts, conflicting ownership, crash/retry, stale generations, bounded audit chain and offline distinction",
  );
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
