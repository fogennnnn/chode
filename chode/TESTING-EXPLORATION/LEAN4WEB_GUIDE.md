# Using Lean4Web for Theory Development

## Quick Start

Instead of installing Lean locally, use the web-based compiler at:
**[https://live.lean-lang.org/](https://live.lean-lang.org/)**

## Prerequisites

- A modern web browser (Chrome, Firefox, Edge, Safari)
- Local copies of the theory files you want to compile
- An understanding of Lean import/dependency order for multi-file projects

## Workflow

1. **Prepare files** - Have your `.lean` files ready locally (copy/paste friendly).
2. **Build in dependency order** - Lean4Web compiles files independently per tab; imports between local files won't resolve unless inlined or opened in the same session with shared context. Follow this order for this project:
   - `theory/Kernel.lean` (core definitions)
   - `theory/Mapping.lean` (charge mappings)
   - `theory/RoleEmergence.lean` (role emergence logic)
   - `theory/RoleReversal.lean` (reversal/mirror exploration)
3. **Open in Lean4Web** - Paste each file into a new tab in [live.lean-lang.org](https://live.lean-lang.org/).
4. **Handle imports** - If a file imports another local file, either inline the needed definitions or copy dependencies into the same tab. For quick iteration, inline minimal definitions to test in isolation.
5. **Iterate and save** - Save snippets locally (copy/paste) as you develop. Use multiple tabs to work on different files in parallel.

## Current Theory Files

| File | Purpose |
|------|---------|
| `theory/Kernel.lean` | Core definitions and base types |
| `theory/Mapping.lean` | Charge/state mappings |
| `theory/RoleEmergence.lean` | Role emergence logic |
| `theory/RoleReversal.lean` | Reversal/mirror exploration |

## Tips & Troubleshooting

- **Import errors**: If you see "unknown module" or missing declarations, inline the required definitions or paste dependencies into the same file/tab.
- **Long files**: Split large files or test smaller lemmas in isolation to get faster feedback.
- **State between tabs**: Tabs are separate sessions; there is no automatic cross-tab project build. Build in order and copy what's needed.
- **Save often**: Browser sessions can be lost; keep local copies of all working snippets.
- **Quick checks**: Test core definitions first (Kernel) before moving to dependent files.

## Notes

- No local disk space required for the compiler/toolchain
- No compilation time for toolchain setup
- Browser handles all computation
- Great for rapid iteration and experimentation

---

*As you iterate: sometimes you just have to believe and keep going — the web compiler lets you do that without local setup friction.*
