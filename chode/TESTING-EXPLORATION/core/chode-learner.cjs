class Learner {
  constructor(grammar) {
    this.grammar = grammar;
    this.rewards = [];
  }

  reinforce(input, result, feedback) {
    const rules = this.grammar.getRules();
    const delta = feedback === 'success' ? 0.05 : -0.03;
    for (const rule of rules) {
      if (result.reasons && result.reasons.find(r => r.rule === rule.id)) {
        rule.weight = Math.max(0.01, rule.weight + delta);
        if (feedback === 'success') rule.hits++;
        this.rewards.push({ ruleId: rule.id, delta, feedback, ts: Date.now() });
      }
    }
    return { updated: rules.filter(r => result.reasons && result.reasons.find(x => x.rule === r.id)).length, delta };
  }

  getRewards() {
    return this.rewards;
  }
}

module.exports = { Learner };
