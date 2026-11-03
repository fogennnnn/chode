"use strict";
const fs = require("fs"),
  path = require("path"),
  crypto = require("crypto"),
  { parentPort, workerData } = require("worker_threads");
let modulePromise;
async function load() {
  const bytes = {};
  for (const [name, expected] of Object.entries(workerData.pinned)) {
    const file = path.join(workerData.directory, name),
      st = fs.lstatSync(file);
    if (
      !st.isFile() ||
      st.isSymbolicLink() ||
      st.nlink > 1 ||
      st.size > 1024 * 1024
    )
      throw Error("Unsafe Debtaur runtime");
    bytes[name] = fs.readFileSync(file);
    if (
      crypto.createHash("sha256").update(bytes[name]).digest("hex") !== expected
    )
      throw Error("Debtaur runtime changed before loading");
  }
  const { default: create } = await import(
    "data:text/javascript;base64," + bytes["judge_wasm.js"].toString("base64")
  );
  const wasm = new WebAssembly.Module(bytes["judge_wasm.wasm"]);
  return create({
    print() {},
    printErr() {},
    instantiateWasm(imports, callback) {
      const instance = new WebAssembly.Instance(wasm, imports);
      callback(instance);
      return instance.exports;
    },
  });
}
// Serialize calls: the module-persistent native engine resets its high-water
// state per batch. Concurrent calls into one instance must never interleave.
let tail = Promise.resolve();
parentPort.on("message", (message) => {
  tail = tail
    .then(async () => {
      try {
        const mod = await (modulePromise || (modulePromise = load())),
          bytes = new TextEncoder().encode(message.wire),
          cap = 524288;
        let input = 0,
          output = 0;
        try {
          input = mod._malloc(bytes.length + 1);
          output = mod._malloc(cap);
          if (!input || !output) throw Error("Debtaur allocation failed");
          mod.HEAPU8.set(bytes, input);
          mod.HEAPU8[input + bytes.length] = 0;
          const n = mod._judge_run(input, output, cap);
          if (n <= 0 || n >= cap - 1)
            throw Error("Debtaur output limit reached");
          const raw = new TextDecoder("utf-8", { fatal: true }).decode(
            mod.HEAPU8.subarray(output, output + n),
          );
          parentPort.postMessage({ id: message.id, raw });
        } finally {
          if (input) mod._free(input);
          if (output) mod._free(output);
        }
      } catch (error) {
        parentPort.postMessage({
          id: message.id,
          error: String(error.message).slice(0, 160),
        });
      }
    })
    .catch(() => {});
});
