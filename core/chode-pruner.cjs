// Chode Pruner — Zero-weight context pruner
// Strips context and prunes branch weights equal to or below zero.
'use strict';

function pruneWeights(branchWeights) {
    if (typeof branchWeights !== 'object' || branchWeights === null || Array.isArray(branchWeights)) {
        return { valid: false, pruned: {}, removed: [], error: 'branchWeights must be a non-null object' };
    }
    const pruned = {};
    const removed = [];
    for (const [key, weight] of Object.entries(branchWeights)) {
        if (typeof weight !== 'number') {
            removed.push(key);
            continue;
        }
        if (weight <= 0) {
            removed.push(key);
            continue;
        }
        pruned[key] = weight;
    }
    return { valid: true, pruned, removed, error: null };
}

module.exports = { pruneWeights };
