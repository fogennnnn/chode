# Chode 1.9.52 regression verification — 2 November 2026

Full npm test completed with exit 0: units, CLI, agent, dogfood, RE and robustness. The log contains 144 passing result lines (not 144 independent benchmark problems). Model/provider responses in regression fixtures are deterministic; this is not a live vendor or Aider accuracy score.

Fixed a real TUI session handoff defect: the parent owns the session lock, and its IPC worker previously refused that same session. Only the connected direct parent's recorded ownership can now be delegated; the parent lock remains unchanged across turns. Tests reject unrelated owners and a spoofed owner PID without IPC.

All 38 registered TUI commands pass with real input events and worker processes. The matrix now distinguishes keyless Agnes from a keyed Groq setup; quota handling and secret-free rendering/history/export are checked separately.

Live mobile browser checks passed: no JS errors or resize overflow, offscreen/hidden pause, resume and reduced-motion. A 4× CPU-throttled 5-second desktop-Chromium emulation recorded one long task; this is not a physical-phone guarantee.1000 mobile points/6000 desktop and visual dimensions remain unchanged.

Live native RE analysis of Windows where.exe passed with matching SHA-256 and nonempty procedure inventory, without executing or modifying the target. The first attempt exposed an incomplete npx dependency cache; the exact broken entry was backed up and replaced with a freshly installed pinned rea-agents 6.5.0 entry. Both isolated-cache and normal-cache live RE checks passed.

Installer/release integrity checks passed; runtime manifest and embedded installer metadata regenerated. Existing full 225-task evaluation remains paused at 6 completed tasks, with frozen 1.9.51 runtime untouched. No new benchmark accuracy claim.

[Full regression log](regression-1.9.52-2026-11-02.txt)

Log SHA-256: 201b570d5a63335b861c91e8106a5f89e8ffa7b0efe1da50d40a54b7486c88cc
