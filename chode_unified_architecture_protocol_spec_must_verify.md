# CHODE UNIFIED ARCHITECTURE & OPERATIONAL PROTOCOL

---

## 1. EXECUTIVE OVERVIEW & PHILOSOPHY

**Chode** is an autonomous, multi-agent local code generation, state mutation, and deterministic verification framework. It is designed to operate completely locally with zero external API costs, providing structured cognitive roles, deterministic execution tracing, and rigorous formal or test-driven promotion gates.

### Core Principles
1. **First-Principles over Textbook Dogma**: Let execution test runners and verification engines validate rigor while cognitive panels explore structural edge cases.
2. **Deterministic State Invariance**: Every state mutation, panel pass, and code candidate is permanently linked to an immutable $\text{sha256}$ derivation.
3. **No Unverified Promotion**: Claims of success are void without concrete tool-based verification logs (`node --check`, test runner outputs, Lean kernel pass).
4. **Context Preservation via Explicit Hashing**: Prevent context drift across high-velocity multi-agent iterations by maintaining explicit parent-child lineage.

---

## 2. DETERMINISTIC STATE MUTATION & TIME TRAVEL ENGINE

Every message, hypothesis, panel pass, or state transition MUST maintain absolute temporal and logical traceability across Node.js and Python runtimes.

### State-ID Formula
$$\text{State-ID} = \text{sha256}(\text{Parent\_ID} \mid \text{Role} \mid \text{Payload})[0:12]$$

- **Parent_ID**: The 12-character hex string of the preceding state turn.
- **Role**: The active panel archetype or system executor (`cross-pollinator`, `gunner`, `synthesizer`, `advocate-of-truth`, `refinery-gate`).
- **Payload**: The exact string content or code artifact being processed.
- **Output**: Exactly 12 lower-case hex characters.

### Cross-Runtime Standard
All state tool implementations (`tools/chode-state.cjs`, `tools/chode-state.py`) must yield identical outputs for identical input parameters:
```bash
node tools/chode-state.cjs <parentId> <role> "<payload>"
python tools/chode-state.py <parentId> <role> "<payload>"
```

---

## 3. TWO-ROOM WORKFLOW & PANEL ARCHETYPES

Execution alternates strictly between two execution environments:

```
+-------------------------------------------------------------------+
|                            CHAOS ROOM                             |
|  (Exploration, Analogy Mapping, High-Velocity Hypothesis Generation) |
+-------------------------------------------------------------------+
                                  |
                   [State Mutation & Tool Evidence]
                                  v
+-------------------------------------------------------------------+
|                           REFINERY ROOM                           |
|  (Formal Verification, Test Suite Gate, Code Synthesis & Promotion) |
+-------------------------------------------------------------------+
```

### Chaos Room Cognitive Archetypes

When executing multi-agent divergence passes, assign processes to these distinct archetypes:

1. **The Cross-Pollinator (Analogist)**
   - *Focus*: Maps structural invariants across disparate domains (e.g., discrete lattice physics, biological networks, cellular automata, protocol routing).
   - *Objective*: Identify structural patterns without academic or textbook boundaries.

2. **The Gunner (Rapid Iteration & Edge Testing)**
   - *Focus*: High-velocity implementation with the smallest possible diff. "Shoot first, reload fast."
   - *Objective*: Formulate immediate edge-case tests, fail fast, drop dead logic, and re-aim.

3. **The Synthesizer & Clarifier (Structural Architect)**
   - *Focus*: Integrates changes, resolves logic conflicts, and extracts core invariants from Chaos Room divergence.
   - *Objective*: Compress complex intuition into precise structural declarations and clean code contracts.

4. **The Advocate of Truth (Devil's Advocate & Verification Enforcer)**
   - *Focus*: Checks for circular logic, hidden assumptions, and missing test proof.
   - *Objective*: Demand tool evidence before allowing promotion to the Refinery Room.

---

## 4. CORE ENGINE & TOOLING ARCHITECTURE

All runtime modules in `core/` use explicit CommonJS (`.cjs`) imports and modular boundaries:

```
chode/
├── .chode/
│   ├── panels/                       # Logged state-ID panel passes
│   └── templates/
│       ├── panel-pass.md             # Verification artifact template
│       └── refinery-promotion.md     # Promotion state artifact
├── core/
│   ├── chode-engine.cjs              # Main orchestrator engine
│   ├── chode-grammar.cjs             # Token parsing & rule validation
│   ├── chode-reasoner.cjs            # Dependency logic & tree evaluation
│   ├── chode-learner.cjs             # Reinforcement weight adjuster
│   ├── chode-pruner.cjs              # Zero-weight context pruner
│   └── chode-behavior.test.cjs       # Core self-test suite
├── tools/
│   ├── chode-state.cjs               # Node deterministic state generator
│   ├── chode-state.py                # Python deterministic state generator
│   └── chode-router.cjs              # Chaos -> Refinery router
├── PROMPT_SNIPPETS/
│   └── chode-rapid-panel.md          # Multi-agent prompt template
├── theory/                           # Lean formal verification target
│   ├── Kernel.lean
│   ├── Mapping.lean
│   ├── RoleEmergence.lean
│   └── RoleReversal.lean
└── install.ps1                       # Environment bootstrap script
```

### Module Responsibilities

- **`core/chode-grammar.cjs`**: Enforces syntactic rules, token boundaries, and structural constraints on incoming payloads.
- **`core/chode-reasoner.cjs`**: Evaluates step-by-step logic dependencies and constructs execution graphs.
- **`core/chode-learner.cjs`**: Implements local reinforcement learning by adjusting execution branch weights based on pass/fail signals.
- **`core/chode-pruner.cjs`**: Strips context and prunes branch weights equal to or below zero.
- **`core/chode-engine.cjs`**: Imports all `.cjs` sub-modules into a unified pipeline.
- **`tools/chode-router.cjs`**: Evaluates state transitions and returns JSON status:
  ```json
  {
    "stateId": "a1b2c3d4e5f6",
    "phase": "CHAOS",
    "nextRoles": ["gunner", "synthesizer"],
    "checklist": ["syntax_check", "behavior_test", "prune_zero_weights"]
  }
  ```

---

## 5. LEAN4WEB VERIFICATION WORKFLOW

For mathematical or formal theoretical proof verification without local Lean toolchain overhead:

### Public Web Compiler Target
- **URL**: `https://live.lean-lang.org/`

### Multi-File Lean Compilation Order
Because Lean4Web compiles files independently per tab, dependencies must be loaded or inlined in strict logical order:

1. `theory/Kernel.lean` (Core definitions and base types)
2. `theory/Mapping.lean` (Charge/state mappings)
3. `theory/RoleEmergence.lean` (Role emergence logic)
4. `theory/RoleReversal.lean` (Reversal/mirror exploration)

### Operational Rules for Lean Validation
- **Inlining**: When validating dependent lemmas in Lean4Web, copy required core definitions from `Kernel.lean` directly into the working tab.
- **Evidence Collection**: Take exact Lean web compilation outputs (kernel pass or error diagnostic) and write them to `.chode/panels/<State-ID>.md` prior to claiming mathematical promotion.

---

## 6. PROMOTION GATES & SPEED RULES

### Pre-Promotion Verification Requirements
Before claiming any task or feature as "complete" or promoting code to the Refinery:

1. **Syntax Check**: `node --check core/*.cjs tools/*.cjs` MUST exit with code `0`.
2. **Deterministic Hash Parity**: `chode-state.cjs` and `chode-state.py` MUST yield identical hashes for sample inputs.
3. **Behavior Test Suite**: `node core/chode-behavior.test.cjs` MUST report `PASS` for reasoning, weight adjustment, and context pruning.
4. **Tool Evidence Rule**: Every file change claim MUST be accompanied by executed terminal logs or reader outputs.

### Operational Speed Constraints
- Read before write (`grep`/`glob`/`read` before applying edits).
- Execute batch file modifications using multi-edit tooling where available.
- Limit sequential tool execution cycles to maximum 6 calls per reasoning turn.
- Run checks in foreground with explicit non-zero exit codes on failure.
- Never re-read identical file prefixes unnecessarily.

---

## 7. AUTOMATED VERIFICATION & BUILD CHECKS

To verify that the workspace conforms fully to this architecture, Chode must execute and validate the following build command matrix:

```bash
# 1. Syntax Audit across all CJS modules
node --check core/chode-engine.cjs core/chode-grammar.cjs core/chode-reasoner.cjs core/chode-learner.cjs core/chode-pruner.cjs tools/chode-state.cjs tools/chode-router.cjs

# 2. State Generator Cross-Runtime Smoke Test
node tools/chode-state.cjs 000000000000 gunner "test-payload"
python tools/chode-state.py 000000000000 gunner "test-payload"

# 3. State Router Validation
node tools/chode-router.cjs

# 4. Core Engine Behavior & Learning Test Suite Execution
node core/chode-behavior.test.cjs

# 5. Git Synchronization Verification
git status
git ls-files
```

---

## 8. PROMPT SNIPPET INVOCATION TEMPLATE

Use this snippet structure when dispatching tasks within the harness CLI/TUI:

```text
[STATE-ID: <mutated_hash>] | [PARENT-ID: <previous_hash>]
[ROOM: CHAOS | REFINERY | STEP: EXPLICIT_EVALUATION]

TARGET GOAL: <Insert specific architectural, coding, or verification goal>

ACTIVE ROLE ASSIGNMENT:
- You are acting as [Cross-Pollinator / Gunner / Synthesizer / Advocate of Truth].
- Address the target directly without academic padding.
- Enforce tool evidence for all assertions.
- Calculate next State-ID via tools/chode-state.cjs prior to output.
```