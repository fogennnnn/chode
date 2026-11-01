#!/usr/bin/env node
const crypto = require('crypto');

function computeStateId(parentId, senderRole, messagePayload) {
  if (!parentId) throw new Error('parentId required');
  if (!senderRole) throw new Error('senderRole required');
  const payload = typeof messagePayload === 'string' ? messagePayload : JSON.stringify(messagePayload);
  const hash = crypto.createHash('sha256');
  hash.update(parentId);
  hash.update('|');
  hash.update(senderRole);
  hash.update('|');
  hash.update(payload);
  return hash.digest('hex').substring(0, 12);
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.log('Usage: node tools/chode-state.cjs <parentId> <senderRole> <payloadJsonOrString>');
    console.log('Example: node tools/chode-state.cjs abc123 def g0 "test"');
    process.exit(1);
  }
  const parentId = args[0];
  const senderRole = args[1];
  const payload = args.slice(2).join(' ');
  try {
    const id = computeStateId(parentId, senderRole, payload);
    console.log(id);
  } catch (e) {
    console.error('ERR:', e.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { computeStateId };
