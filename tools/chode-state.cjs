// Chode State Generator — Node deterministic state-ID generator
// State-ID = sha256(Parent_ID | Role | Payload)[0:12]
const crypto = require('crypto');

const args = process.argv.slice(2);

if (args.length < 3) {
    console.error('Usage: node tools/chode-state.cjs <parentId> <role> "<payload>"');
    process.exit(1);
}

const [parentId, role, ...payloadParts] = args;
const payload = payloadParts.join(' ');

const input = `${parentId}|${role}|${payload}`;
const stateId = crypto.createHash('sha256').update(input, 'utf8').digest('hex').slice(0, 12);

console.log(stateId);
