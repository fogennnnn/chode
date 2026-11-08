// test/chodecode-smoke.cjs
// Smoke test for the chodecode wrapper module.
// Exits 0 silently when the payload constant is present.

'use strict';

const wrapper = require('../core/chodecode-wrapper.cjs');

const expected = '<chodecode>datadatadatadatadata</chodecode>';

if (wrapper.payload !== expected) {
  throw new Error('chodecode payload mismatch');
}

if (typeof wrapper.run !== 'function') {
  throw new Error('chodecode run is not a function');
}

process.exit(0);
