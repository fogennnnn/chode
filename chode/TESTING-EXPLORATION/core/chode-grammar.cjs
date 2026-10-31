class Grammar {
  constructor(rules = []) {
    this.rules = rules.map(r => ({ ...r, weight: r.weight ?? 1.0, uses: 0, hits: 0 }));
  }

  addRule(rule) {
    this.rules.push({ ...rule, weight: rule.weight ?? 1.0, uses: 0, hits: 0 });
  }

  match(input) {
    const matches = [];
    for (const rule of this.rules) {
      if (rule.active === false) continue;
      if (typeof rule.pattern === 'string') {
        if (input.includes(rule.pattern)) {
          rule.uses++;
          matches.push(rule);
        }
      } else if (rule.pattern instanceof RegExp) {
        if (rule.pattern.test(input)) {
          rule.uses++;
          matches.push(rule);
        }
      }
    }
    return matches.sort((a,b) => (b.weight - a.weight));
  }

  getRules() {
    return this.rules;
  }
}

module.exports = { Grammar };
