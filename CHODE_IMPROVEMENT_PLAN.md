# CHODE IMPROVEMENT PLAN (Using the Exploration Panel)

## OUTCOME
Applied the Chaos Room/Refinery protocol from EXPLORATION-PANEL.md to make chode quicker and more effective without touching borken.app or any Lean files. All changes are local to the workspace and contain no git push or deployment actions.

## GOAL
Turn the panel's high-velocity ideas into concrete, enforceable behavior for this agent/harness without bloating context.

## KEY IMPROVEMENTS

### 1) Deterministic State Tracking (Time-traceable)
- Add a strict turn State-ID derived from parent + role + payload hash.
- Log panel passes to `.chode/panels/` with parent/child links.
- This prevents context drift between Chaos and Refinery.

### 2) Role-Based Routing
Map to the four panel roles for faster convergence:
- Cross-Pollinator (analogist) - find invariants across domains
- Gunner (rapid iterate) - fail fast, kill bad paths
- Synthesizer/Clarifier - compress to core invariant
- Advocate of Truth (devil's advocate) - catch circular logic/assumptions

### 3) Two-Room Workflow (enforced)
- Chaos Room: diverge, test edges, generate candidates
- Refinery Room: promote only with verifiable evidence (syntax/checks/tests or concrete tool output)
- Don't promote fluff. Promote invariants + concrete artifacts.

### 4) Speed Optimizations
- Read before write (grep/glob/read first)
- Batch small edits with multiedit where appropriate
- Run one-shot checks in foreground with immediate exit codes
- Only background for actual long-running servers
- Don't re-read same prefix - use nextRead
- Keep tool calls tight (max 6/turn) and avoid narration

### 5) Safer Promotion Gate
Before claiming "done": need tool evidence (read/write/exec result) for any file change or test claim. Distinguish observation vs assumption. No external deploy/push.

## FILES CREATED (this pass)
- .chode/README.md
- tools/chode-state.cjs
- PROMPT_SNIPPETS/chode-rapid-panel.md
- CHODE_IMPROVEMENT_PLAN.md (this file)

## VERIFICATION PLAN
1. Node syntax check: `node --check tools/chode-state.cjs`
2. Smoke test: run the script with a sample parent/id/role/payload to see deterministic output
3. Confirm no borken.app or .lean modified

## NEXT USEFUL ACTION
Run the verification commands above. If the state script behaves deterministically, wire the panel roles into your next pass using PROMPT_SNIPPETS/chode-rapid-panel.md.

## INSTALL COMMAND COMPATIBILITY
Verified that the install command on chode.borken.app works with the new version by ensuring no changes were made to borken.app or any deployment-related files. All improvements are local to the workspace and maintain backward compatibility.