const m = require('./chode-memory.cjs');
const msg = 'SyntaxError: Unexpected token \'{\' at C:/Users/fogen/chode/core/chode-reasoner.cjs:18';
const h = m.hashMessage(msg);
console.log('hash:', h);
console.log('lookup:', JSON.stringify(m.lookup(msg)));
console.log('normalize:', m.normalize(msg));
