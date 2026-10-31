class Reasoner {
  constructor(grammar) {
    this.grammar = grammar;
    this.history = [];
  }

  reason(input, context = {}) {
    const matches = this.grammar.match(input);
    if (matches.length === 0) {
      const result = { action: 'unknown', confidence: 0, reasons: [], trace: 'no_grammar_match' };
      this.history.push({ input, result, ts: Date.now() });
      return result;
    }
    const top = matches[0];
    const result = {
      action: top.action,
      confidence: Math.min(1.0, top.weight / (matches.length || 1)),
      reasons: matches.map(m => ({ rule: m.id, weight: m.weight, pattern: String(m.pattern) })),
      trace: 'grammar_applied'
    };
    this.history.push({ input, result, ts: Date.now() });
    return result;
  }

  getHistory() {
    return this.history;
  }
}

module.exports = { Reasoner };
