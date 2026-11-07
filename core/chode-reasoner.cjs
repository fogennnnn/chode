// Chode Reasoner — Dependency logic & tree evaluation
// Evaluates step-by-step logic dependencies and constructs execution graphs.
'use strict';

function buildDependencyGraph(steps) {
    if (!Array.isArray(steps)) {
        return { valid: false, graph: {}, error: 'steps must be an array' };
    }
    const graph = {};
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const deps = Array.isArray(step.dependsOn) ? step.dependsOn : [];
        graph[step.id || `step_${i}`] = deps;
    }
    return { valid: true, graph, error: null };
}

function evaluateOrder(steps) {
    const result = buildDependencyGraph(steps);
    if (!result.valid) return result;
    const visited = new Set();
    const order = [];
    function visit(id) {
        if (visited.has(id)) return;
        visited.add(id);
        (result.graph[id] || []).forEach(visit);
        order.push(id);
    }
    Object.keys(result.graph).forEach(visit);
    return { valid: true, order, error: null };
}

module.exports = { buildDependencyGraph, evaluateOrder };
