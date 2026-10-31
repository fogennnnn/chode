# Chode Rapid Panel (Chaos → Refinery)

## Roles
- **Cross-Pollinator**: Find connections, reuse existing code, spot hidden dependencies.
- **Gunner**: Fast implementation with the smallest possible diff.
- **Synthesizer**: Integrate changes, resolve conflicts, and keep the system consistent.
- **Advocate of Truth**: Verify against requirements, demand tool evidence, block claims without proof.

## Workflow
1. **Chaos Room**: Spawn the panel with the task. Generate multiple approaches in parallel.
2. **Refinery**: Filter ideas by evidence. Only keep changes that can be verified with tools.

## Speed Rules
- Reuse existing files and helpers before creating new ones.
- Use `tools/chode-state.cjs` to generate a deterministic state ID for traceability.
- Run `node --check` on any modified JS/CJS files before claiming success.
- Write all outputs to clearly named files. No git push or deployment.
- Skip `borken.app/*` and `theory/*.lean` unless explicitly requested.
