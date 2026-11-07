// Chode Learner — Reinforcement weight adjuster
// Implements local reinforcement learning by adjusting execution branch weights based on pass/fail signals.
'use strict';

const DEFAULT_WEIGHT = 1.0;
const LEARNING_RATE = 0.1;

function adjustWeight(currentWeight, signal) {
    if (typeof currentWeight !== 'number') currentWeight = DEFAULT_WEIGHT;
    if (signal === 'pass') return currentWeight + LEARNING_RATE;
    if (signal === 'fail') return Math.max(0, currentWeight - LEARNING_RATE);
    return currentWeight;
}

function updateBranchWeights(branchWeights, signals) {
    const updated = {};
    for (const [key, weight] of Object.entries(branchWeights)) {
        const signal = signals[key] || 'neutral';
        updated[key] = adjustWeight(weight, signal);
    }
    return updated;
}

module.exports = { adjustWeight, updateBranchWeights, DEFAULT_WEIGHT, LEARNING_RATE };
