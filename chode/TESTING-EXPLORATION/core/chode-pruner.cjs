class Pruner {
  constructor(grammar) {
    this.grammar = grammar;
  }

  prune(threshold = 0.15) {
    const before = this.grammar.getRules().length;
    for (const rule of this.grammar.getRules()) {
      if (rule.weight < threshold && rule.hits === 0 && rule.uses > 3) {
        rule.active = false;
      }
    }
    const after = this.grammar.getRules().filter(r => r.active !== false).length;
    return { before, after, pruned: before - after, threshold };
  }
}

module.exports = { Pruner };
