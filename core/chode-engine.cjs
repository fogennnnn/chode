// Chode Engine — Main orchestrator engine
// Imports all .cjs sub-modules into a unified pipeline.
'use strict';

const grammar = require('./chode-grammar.cjs');
const reasoner = require('./chode-reasoner.cjs');
const learner = require('./chode-learner.cjs');
const pruner = require('./chode-pruner.cjs');
const memory = require('./chode-memory.cjs');

function enrichError(stage, error) {
    const known = memory.lookup(error);
    if (known) return { ok: false, stage, error, cause: known.cause, solution: known.solution, hash: known.hash };
    if (memory.isSpecific(error)) memory.record(error, 'Unknown cause', 'No known solution recorded yet');
    return { ok: false, stage, error };
}

function runPipeline(payload, steps, branchWeights, signals) {
    const syntax = grammar.validateStructure(payload);
    if (!syntax.valid) return enrichError('grammar', syntax.error);

    const graph = reasoner.buildDependencyGraph(steps);
    if (!graph.valid) return enrichError('reasoner', graph.error);

    const order = reasoner.evaluateOrder(steps);
    if (!order.valid) return enrichError('reasoner-order', order.error);

    const updatedWeights = learner.updateBranchWeights(branchWeights, signals);
    const pruned = pruner.pruneWeights(updatedWeights.updated);
    if (!pruned.valid) return enrichError('pruner', pruned.error);

    return {
        ok: true,
        tokens: syntax.tokens,
        executionOrder: order.order,
        weights: pruned.pruned,
        prunedKeys: pruned.removed,
        error: null
    };
}

module.exports = { runPipeline, grammar, reasoner, learner, pruner };
