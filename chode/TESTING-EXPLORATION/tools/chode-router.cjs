#!/usr/bin/env node
const crypto = require('crypto');

function computeStateId(parentId, senderRole, messagePayload) {
  const s = String(parentId) + '|' + String(senderRole) + '|' + String(messagePayload);
  return crypto.createHash('sha256').update(s).digest('hex').slice(0, 12);
}

function route(task) {
  const parent = task.parent || 'root';
  const role = task.role || 'gunner';
  const goal = task.goal || '';
  const id = computeStateId(parent, role, goal);
  return {
    id,
    next: ['gunner', 'synthesizer'],
    checklist: ['read', 'grep', 'small diff', 'node --check', 'smoke test']
  };
}

if (require.main === module) {
  const t = { goal: process.argv[2] || '' };
  console.log(JSON.stringify(route(t)));
}

module.exports = { computeStateId, route };

// Error handling for missing dependencies
try {
  require('crypto');
} catch (e) {
  throw new Error('Missing required crypto module');
}
