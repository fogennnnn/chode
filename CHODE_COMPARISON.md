# Comparison: chode\ vs chode\chode\

Generated: 2025-10-31T13:15:00Z

## Root level (C:\Users\fogen\chode)
- chode/ (directory)
- core/ (directory)
- PROMPT_SNIPPETS/ (directory)
- LOOP_RECOVERY.md (file, 308 bytes)
- CHODE_COMPARISON.md (file, this report)

## Nested (C:\Users\fogen\chode\chode)
- core/ (directory)
- PROMPT_SNIPPETS/ (directory)

## Comparison
- Parent (chode/) contains project scaffolding/docs at root (LOOP_RECOVERY.md, CHODE_COMPARISON.md) plus core/ and PROMPT_SNIPPETS/
- Nested (chode/chode/) appears to mirror the inner structure (core/ and PROMPT_SNIPPETS/) with no top-level docs observed
- Relative layout suggests chode/chode/ is a nested copy/subtree of the chode project contents

## Notes
- Both directories exist and are readable via node filesystem
- Comparison done via portable Node (fs.readdirSync) without destructive shell commands
- No files were deleted or renamed
