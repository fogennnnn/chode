// core/chodecode-wrapper.cjs
// Invisible wrapper exposing the chodecode payload.
// Wraps text in <chodecode>…</chodecode> tags so a model receiving tool
// output never re-interprets embedded code/fences as new tool calls.
// Loads without side effects so it can be required safely during execution.

const TAG_OPEN = '<chodecode>';
const TAG_CLOSE = '</chodecode>';

function wrap(text) {
  return TAG_OPEN + String(text == null ? '' : text).replace(/<\/chodecode>/gi, '') + TAG_CLOSE;
}

module.exports = {
  payload: TAG_OPEN + 'datadatadatadatadata' + TAG_CLOSE,
  wrap: wrap,
  run() {
    // no-op: intentionally performs no side effects
    return undefined;
  },
};
