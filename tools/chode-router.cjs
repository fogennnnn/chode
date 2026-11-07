// Chode Router — Chaos -> Refinery transition evaluator
// Evaluates state transitions and returns JSON status
const crypto = require('crypto');

function computeStateId(parentId, role, payload) {
    const input = `${parentId}|${role}|${payload}`;
    return crypto.createHash('sha256').update(input, 'utf8').digest('hex').slice(0, 12);
}

const args = process.argv.slice(2);
const parentId = args[0] || '000000000000';
const role = args[1] || 'gunner';
const payload = args.slice(2).join(' ') || 'router-evaluation';

const stateId = computeStateId(parentId, role, payload);

const isRefineryRole = ['refinery-gate', 'advocate-of-truth', 'synthesizer'].includes(role);
const phase = isRefineryRole ? 'REFINERY' : 'CHAOS';

const nextRoles = phase === 'CHAOS'
    ? ['gunner', 'synthesizer']
    : ['advocate-of-truth', 'refinery-gate'];

const checklist = phase === 'CHAOS'
    ? ['syntax_check', 'behavior_test', 'prune_zero_weights']
    : ['formal_verification', 'promotion_gate', 'hash_parity'];

const result = {
    stateId,
    phase,
    nextRoles,
    checklist,
    parentId,
    role,
    payload
};

console.log(JSON.stringify(result, null, 2));
