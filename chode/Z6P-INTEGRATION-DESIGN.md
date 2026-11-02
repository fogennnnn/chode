# Z6P-Informed Chode Architecture

## Vision
Build chode on Z6P principles as the foundational architecture - "protocol as language components speak."

## Core Design Principles (from Z6P)

### 1. Discrete State Space (Z6 Encoding)
- All internal state represented as discrete values from a small, bounded set
- Z6 = {0, 1, 2, 3, 4, 5} with modular arithmetic
- Compact, verifiable, constraint-checkable

### 2. Hash-Bound Targets
- Every state transition anchored to a cryptographic hash
- Self-referential integrity (SHA-256 of state itself)
- Tamper-evident audit trail

### 3. Constraint Validation
- Pre/post conditions on every operation
- Topological checks ensure coherence
- Zero-divisor moat concept: invalid states are "far" from valid

### 4. Stateless Verification
- Each step carries its own proof
- No hidden server state
- Replay-able, auditable

## Architecture Components

### 1. Handoff State Protocol

**Problem:** Free mode switches providers mid-task. New provider needs exact context.

**Z6P Solution:** Encode handoff state as Z6 vector with hash-bound integrity.

```javascript
// z6-state.js
const Z6 = {
  add: (a, b) => (a + b) % 6,
  mul: (a, b) => (a * b) % 6,
  // ... operations
};

function encodeHandoff(task) {
  const state = {
    step: task.currentStep,        // Z6: 0-5
    status: task.status,           // Z6: 0=planning, 1=building, 2=verifying, 3=repairing, 4=done, 5=failed
    deps: task.dependencies.map(d => d.status), // Z6 vector
    constraints: task.constraints  // Z6-encoded pre/post conditions
  };
  const encoded = JSON.stringify(state);
  return {
    state,
    hash: crypto.createHash('sha256').update(encoded).digest('hex'),
    selfHash: crypto.createHash('sha256').update(encoded + hash).digest('hex')
  };
}
```

### 2. Plan Serialization

**Problem:** Plans exist only in prompts, not as traversable state.

**Z6P Solution:** Plans as Z6 state machines with explicit dependencies.

```javascript
// plan-z6.js
class Z6Plan {
  constructor(steps) {
    this.steps = steps.map((s, i) => ({
      id: i,
      description: s.description,
      files: s.files || [],
      status: 0,  // Z6: 0=pending, 1=in-progress, 2=blocked, 3=done, 4=skipped, 5=failed
      preConditions: s.pre || [],   // Z6 constraint IDs
      postConditions: s.post || [], // Z6 constraint IDs
      dependsOn: s.dependsOn || []  // step IDs
    }));
    this.hash = this.computeHash();
  }
  
  computeHash() {
    return crypto.createHash('sha256')
      .update(JSON.stringify(this.steps))
      .digest('hex');
  }
  
  canExecute(stepId) {
    const step = this.steps[stepId];
    // All dependencies must be done (status=3)
    const depsOk = step.dependsOn.every(id => this.steps[id].status === 3);
    // Pre-conditions must be satisfied
    const preOk = step.preConditions.every(c => this.checkConstraint(c));
    return depsOk && preOk;
  }
  
  checkConstraint(constraintId) {
    // Z6 constraint validation logic
    // Returns true if constraint is satisfied
  }
  
  serialize() {
    return {
      steps: this.steps,
      hash: this.hash,
      selfHash: crypto.createHash('sha256')
        .update(JSON.stringify(this.steps) + this.hash)
        .digest('hex')
    };
  }
}
```

### 3. Local Memory Format

**Problem:** HEMO vault is remote, not locally traversable.

**Z6P Solution:** Filesystem-based memory with Z6-encoded state vectors.

```
.chode/memory/
├── sessions/
│   └── <session-id>/
│       ├── meta.json       # Session metadata, Z6 state vector
│       ├── plan.json       # Z6Plan serialized
│       ├── handoff.json    # Last handoff state (hash-bound)
│       └── messages/       # Individual message files
│           ├── 0001.json
│           ├── 0002.json
│           └── ...
├── constraints/
│   └── registry.json       # Z6 constraint definitions
└── audit/
    └── <date>/
        └── transitions.log # Hash-bound state transitions
```

**meta.json:**
```json
{
  "sessionId": "abc123",
  "createdAt": 1730500000000,
  "stateVector": [3, 1, 0, 2, 4, 1],  // Z6: [step, status, provider_health, capacity, queue_depth, error_state]
  "hash": "sha256(...)",
  "selfHash": "sha256(stateVector + hash)"
}
```

### 4. Constraint Registry

**Problem:** No structured validation of step pre/post conditions.

**Z6P Solution:** Z6 constraint algebra with compositional rules.

```javascript
// constraints/z6-constraints.js
const ConstraintTypes = {
  FILE_EXISTS: 0,      // Pre: file must exist before step
  FILE_NOT_EXISTS: 1,  // Pre: file must not exist (fresh write)
  SYNTAX_VALID: 2,     // Post: produced file has valid syntax
  TESTS_PASS: 3,       // Post: unit tests pass
  DEPENDENCY_DONE: 4,  // Pre: dependent step completed
  CAPACITY_AVAILABLE: 5 // Pre: provider capacity available
};

class Z6Constraint {
  constructor(type, params) {
    this.type = type;  // Z6 value 0-5
    this.params = params;
    this.satisfied = null;  // null=unchecked, true/false
  }
  
  check(context) {
    switch(this.type) {
      case ConstraintTypes.FILE_EXISTS:
        this.satisfied = fs.existsSync(this.params.path);
        break;
      case ConstraintTypes.SYNTAX_VALID:
        this.satisfied = this.checkSyntax(this.params.file);
        break;
      // ... etc
    }
    return this.satisfied;
  }
  
  // Z6 algebra: combine constraints
  static AND(constraints) {
    return constraints.reduce((acc, c) => acc && c.satisfied, true);
  }
  
  static OR(constraints) {
    return constraints.reduce((acc, c) => acc || c.satisfied, false);
  }
}
```

### 5. Admission Control (Rate Limiting)

**Problem:** Free mode rate limits cause failures.

**Z6P Solution:** Z6 proof-of-work for rate-limit admission.

```javascript
// z6-admission.js
const Z6_DIFFICULTY = 8;  // 2^a × 3^b decomposition

function mintAdmissionToken(stepId, timestamp) {
  // Hash-bound target: SHA-256 of token itself
  const target = crypto.createHash('sha256')
    .update(`${stepId}:${timestamp}`)
    .digest('hex');
  
  // Find nonce that produces valid Z6 proof
  let nonce = 0;
  while (true) {
    const token = `${stepId}:${timestamp}:${nonce}`;
    const hash = crypto.createHash('sha256').update(token).digest();
    if (verifyZ6Proof(hash, Z6_DIFFICULTY)) {
      return { token, nonce, timestamp };
    }
    nonce++;
  }
}

function verifyZ6Proof(hash, difficulty) {
  // Z6 proof: hash must have certain zero-divisor properties
  // Difficulty ladder: 2^a × 3^b
  // Verified in ~1.5 µs
}
```

## Implementation Phases

### Phase 1: Local Memory (Week 1)
- [ ] Create `local-memory.js` module
- [ ] Replace HEMO vault calls with local filesystem
- [ ] Add CLI commands for memory inspection
- [ ] Migrate existing sessions

### Phase 2: Plan Serialization (Week 2)
- [ ] Create `plan-z6.js` module
- [ ] Modify orchestrator to use Z6Plan
- [ ] Add plan visualization to TUI
- [ ] Implement dependency tracking

### Phase 3: Handoff Protocol (Week 3)
- [ ] Create `z6-state.js` module
- [ ] Modify `callWithBestProvider` to serialize handoff
- [ ] Test provider switching with state preservation
- [ ] Add handoff inspection CLI

### Phase 4: Constraint System (Week 4)
- [ ] Create `z6-constraints.js` module
- [ ] Define constraint registry
- [ ] Integrate with verification gates
- [ ] Add constraint visualization

### Phase 5: Admission Control (Week 5)
- [ ] Create `z6-admission.js` module
- [ ] Integrate with rate-limit retry logic
- [ ] Benchmark proof mint/verify time
- [ ] Tune difficulty ladder

## Success Metrics

1. **Task Completion Rate:** 61.8% → 80%+ (beat Claude Code on Terminal-Bench)
2. **Provider Switch Success:** 100% handoff state preservation
3. **Memory Inspection:** <100ms to load any session
4. **Constraint Validation:** <1ms per constraint check
5. **Admission Overhead:** <10ms per AI call

## Risk Mitigation

1. **Complexity:** Start with local memory only, add Z6 encoding incrementally
2. **Performance:** Benchmark each phase, rollback if slowdown >10%
3. **Compatibility:** Maintain backward compatibility with existing sessions
4. **Testing:** Each phase has dedicated test suite before next phase

## Files to Create/Modify

| File | Action | Phase |
|------|--------|-------|
| `local-memory.js` | Create | 1 |
| `z6-state.js` | Create | 2 |
| `plan-z6.js` | Create | 2 |
| `z6-constraints.js` | Create | 4 |
| `z6-admission.js` | Create | 5 |
| `memory.js` | Modify (deprecate HEMO) | 1 |
| `orchestrator.js` | Modify (Z6Plan) | 2 |
| `chode.js` | Modify (handoff) | 3 |
| `workspace-tui.js` | Modify (plan viz) | 2 |
| `tests/local-memory.test.js` | Create | 1 |
