# Coding Harness Research: Landscape vs. chode

**Research date:** November 2026
**Scope:** Cursor, Aider, Cline, Devin, Replit Agent, Zed, GitHub Copilot, Continue
**Purpose:** Research each harness's functionality & infrastructure; compare to chode; identify lessons and high-value additions.

---

## 1. Individual Harness Profiles

### Cursor — Fork of VS Code, desktop IDE with embedded AI

**Form:** Desktop IDE (fork of VS Code), AI embedded in the editor experience.

**Core features (2026):**
- **Composer 2.5:** Multi-file edits, terminal command generation, shell command execution. Trained with 25x more synthetic tasks; uses feature deletion as a training technique to avoid over-reliance on any single capability.
- **Cursor 2.0 multi-agent interface:** Up to 8 parallel agents running on git worktrees or remote machines.
- **Browser (GA):** Embedded in-editor browser — the agent can open pages, click, read DOM, and capture console errors directly in Cursor.
- **Sandboxed Terminals (GA):** macOS default — shell commands run in a secure sandbox, isolated from the host filesystem.
- **Checkpoints:** Automatic snapshots before significant changes; restore from a chat timeline (like git, but invisible to the user).
- **Agent modes:** Agent, Ask, Plan, Debug — different modes for different tasks.
- **Cloud Agents:** Hand off work to the cloud; continues after you close your laptop.
- **Voice Mode:** Speak prompts; agent transcribes and acts.
- **CursorBench:** Real agent-request benchmark for evaluating coding agents.
- **Own model:** Composer model trained on real coding tasks.

**Infrastructure:** Client runs locally; model calls go to Cursor's hosted backend (or user's own API key for some providers). Codebase indexed locally with embeddings for `@`-mention retrieval. Composer can spawn shell commands (now sandboxed on macOS).

**Business model:** Subscription (Pro/Business); free tier with limits.

---

### Aider — Terminal CLI, local-first, BYOK

**Form:** Pure terminal CLI (`aider`). Runs in your shell.

**Core features (2026):**
- **Tree-sitter repository map:** PageRank-style graph ranking over the codebase to select the most relevant files for context (not just keyword search).
- **Auto-commits every change:** Every model edit is committed to git with a descriptive message. `/undo` reverts instantly; `/diff`, `/commit`, `/git` for git workflows.
- **Watch mode:** Monitor files for `# ai:` comments; agent acts on them.
- **Architect mode:** Splits planning from editing — model first produces a plan, then a separate edit pass executes it.
- **100+ LLM providers via LiteLLM:** Model-agnostic; user brings their own API keys.
- **Voice input** supported.

**Infrastructure:** Pure CLI, local execution. Model calls go directly to provider APIs using user keys — no middleman, no hosted backend. No sandbox; operates directly on the host filesystem. Git is the safety net — every change is a commit.

**Business model:** Open source (MIT), free; user brings their own API keys.

---

### Cline — VS Code extension + CLI + desktop app + SDK

**Form:** VS Code extension (primary), JetBrains plugin, CLI (`npm i -g cline`), desktop app (Tauri + Bun + Next.js), SDK (`@cline/sdk`).

**Core features (2026):**
- **Plan & Act Mode:** Model plans first, then executes tool calls in an act phase.
- **Checkpoints:** Shadow git repository separate from user history — automatic snapshots that don't pollute the user's git log.
- **MCP marketplace:** Built-in marketplace for Model Context Protocol servers; connect to databases, filesystems, etc.
- **Browser automation:** Can drive a real browser (click, type, read) to test apps.
- **Auto-approve by category + YOLO mode:** Approve certain tool categories without prompting; YOLO mode runs everything autonomously.
- **Rules:** `.clinerules` + `AGENTS.md` for project-specific instructions.
- **Skills:** `.agents/skills/` or `.cline/skills/` — reusable agent skill packs.
- **Human-in-the-loop GUI:** Per-change approval dialogs in the editor.

**Infrastructure:** Extension runs locally (VS Code). Can use user's own API keys or Cline's hosted proxy. Browser control via Puppeteer/Playwright-style automation. MCP servers over stdio/HTTP. Operates on host filesystem by default (user must approve destructive commands).

**Business model:** Open source (Cline), free; Roo Cline (fork) shut down May 15, 2026.

---

### Devin — Cloud-based autonomous software engineer

**Form:** SaaS web app + Slack/GitHub integration + CLI + Desktop app.

**Core features (2026):**
- **Devin CLI:** Local agent that can hand off to cloud when work outgrows the laptop.
- **Devin Desktop:** Agent Command Center + Spaces for shared context between agents.
- **Devin 2.2:** Computer use testing, self-verify, autofix — agent tests its own work and fixes failures.
- **Cloud VM per task:** Each task runs in an isolated sandboxed VM with its own browser, shell, and editor.
- **10-20 parallel agents:** Multiple agents working in parallel on different aspects of a task.
- **SWE-1.6 / SWE-2 models:** Devin's own coding models.
- **Agent Client Protocol (ACP):** Standard for connecting clients to agent backends.

**Infrastructure:** Fully cloud. Each task runs in an isolated sandboxed VM/container. Devin's backend orchestrates model calls and tool loops. Private instances for enterprise.

**Business model:** Enterprise SaaS; per-seat / per-task pricing. $3.5B raised.

---

### Replit Agent — Browser-based IDE with AI agent

**Form:** Browser-based IDE (Replit) with AI agent built in.

**Core features (2026):**
- **Agent 4:** Full-stack app generation from natural language (frontend + backend + database + deployment).
- **Plan mode:** Review the plan before building; user approves the approach.
- **BYOC (Bring Your Own Cloud):** Enterprise option to deploy to your own cloud infrastructure.
- **Cloud Agents:** Build and test high-quality changes autonomously.
- **Built-in deployment:** Deploy to `.replit.app` with one click.

**Infrastructure:** Cloud IDE + sandboxed containers. Replit's own infrastructure (Nix-based packaging, distributed filesystem). Model calls via Replit backend.

**Business model:** Freemium; Agent on paid plans (Core/Teams).

---

### Zed — Native Rust editor, GPU-accelerated

**Form:** Native code editor (Rust), multiplayer by default.

**Core features (2026):**
- **Agent Panel + Inline Assistant + Edit Prediction:** AI in multiple surfaces — sidebar chat, inline edits, predictive next-edit.
- **Parallel Agents:** Multiple agent threads operating in the same window simultaneously.
- **Delta:** Multiplayer environment for coding with agents (private beta) — real-time shared workspaces.
- **DeltaDB:** Replicates conversation + worktree state in real time across collaborators.
- **ACP (Agent Client Protocol):** Bring any agent backend to Zed.
- **Review Changes:** Accept/reject per-hunk before applying edits.

**Infrastructure:** Native desktop (macOS/Linux, Windows beta). Model calls direct to provider (Anthropic primarily) via API key — no hosted middleman. Local-first.

**Business model:** Free; Pro ($30/seat business).

---

### GitHub Copilot — IDE extension + cloud backend

**Form:** Extension for VS Code, VS, JetBrains, Neovim + CLI (`gh copilot`).

**Core features (2026):**
- **Agents window in VS Code:** Agentic chat directly in the editor.
- **Copilot Workspace:** Agentic PR flow — spec → plan → code → PR, in github.dev.
- **Copilot app with desktop control:** Can read app content, click controls, interact with desktop apps.
- **Local sandboxes for agentic workflows:** Agent runs in a local sandbox for safety.
- **Next Edit Suggestions (NES):** Predictive next-edit, GA.
- **Automations / Scheduling:** Scheduled agent tasks.

**Infrastructure:** Microsoft/GitHub-hosted backend. Model calls routed through GitHub's service. IDE extensions are thin clients. Workspace is cloud-based (github.dev) for the agentic path.

**Business model:** Subscription (Individual/Business/Enterprise); free tier available.

---

### Continue.dev — Open source VS Code/JetBrains extension

**Form:** Open source extension for VS Code / JetBrains + CLI (`cn`).

**Core features (2026):**
- **Agent / Chat / Edit / Autocomplete modes:** Multiple interaction surfaces.
- **MCP servers:** Connect to external tools and data sources.
- **Local models (Ollama):** Route to local models — fully offline capable.
- **XML tool format:** Universal model-compatible tool calling format.
- **FastApply / Relace Instant Apply / Morph Fast Apply:** Multiple strategies for applying model edits to files quickly.

**Infrastructure:** Extension runs locally; can route to local models (Ollama, LM Studio) or remote APIs. Bring-your-own-key. Open core.

**Business model:** Open source; hosted optional.

---

## 2. What Separates Them — Functionality & Infrastructure

### Functionality differentiators

| Differentiator | Leaders who have it | chode |
|---|---|---|
| In-editor AI (invoke from cursor position) | Cursor, Cline, Zed, Copilot, Continue | Partial (TUI only) |
| Auto git-commit every turn | Aider | Partial (undoEdit/rewind, no auto-commit) |
| Checkpoints / shadow git | Cursor, Cline | Partial (rewind, no automatic per-turn checkpoints) |
| Diff review before apply | Cursor, Zed, Cline | No rich pre-apply review UI |
| Browser / computer control | Cline, Devin, Cursor | Limited (browser-check for HTML artifacts only) |
| Sandboxed shell/VM | Cursor (sandboxed terminals), Devin (cloud VM) | No (host filesystem) |
| Built-in deploy | Replit Agent, Devin | No |
| Multi-agent parallelism | Cursor (8 agents), Zed, Devin (10-20) | No |
| Cloud handoff | Devin | No |
| Codebase semantic index | Cursor (embeddings), Aider (repo-map) | No (project memory only) |
| Local models / offline | Aider (BYOK), Cline, Continue (Ollama), Zed | Yes (free/keyless routing) |
| CLI-first | Aider, chode | Yes |
| Self-hostable | Aider, Continue, chode | Yes |

### Infrastructure differentiators

| Infrastructure aspect | Leaders | chode |
|---|---|---|
| Host filesystem vs sandbox | Most operate on host; Cursor/Devin sandbox | Host filesystem |
| Model routing | Hosted backend (Cursor/Copilot/Devin/Replit) or BYOK (Aider/Cline/Continue/Zed) | Free/keyless routing + BYOK |
| Codebase context | Embeddings index or repo-map | Project memory + session messages |
| Safety net | Auto-commit (Aider), checkpoints (Cursor/Cline), shadow git (Cline) | undoEdit/rewind (manual) |
| Extensibility | MCP (Cline/Continue), SDK (Cline), ACP (Zed/Devin) | MCP via integrations, provider-connect |
| Cross-platform | Desktop (Cursor/Zed/Cline), Web (Replit/Devin), CLI (Aider/chode) | CLI + serve HTTP API |

---

## 3. Deep Comparison to chode

### What chode already has that is distinctive

1. **Free, keyless routing:** chode routes to free/keyless LLM endpoints by default. No account, no API key required. This is chode's strongest differentiator — none of the leaders offer zero-cost, zero-account coding.

2. **CLI-first + TUI:** Works entirely in the terminal (`chode ai`, interactive `node chode.js`, workspace TUI). No IDE required, no Electron overhead.

3. **Multi-provider orchestration:** Provider catalog, capacity awareness, free-mode gating, fallback chains, leaderboard/ranking, retry/backoff logic.

4. **Session + queue persistence:** Sessions saved to `.chode/sessions/`; pending task queue survives restarts; `--resume` works across runs.

5. **Reliability memory / debtaur:** Captures verified results, project memory, local orchestration gate, WASM evidence snapshots.

6. **HTML artifact mode:** Builds self-contained HTML apps with validation and browser verification.

7. **Provider connect:** `chode connect` for adding API-key providers.

8. **Serve (new):** HTTP API + web frontend for remote/conversational access. Sessions, settings, providers all configurable via the web UI.

9. **No sandbox (by design):** Operates on host filesystem like Aider/Cline — no cloud VM, no container overhead.

### Where chode lags the leaders

**1. No IDE integration.** Cursor, Cline, Zed, Copilot, Continue all live inside the editor where the user already is. chode is terminal-only. A user must context-switch out of their editor to use chode.
- *Lesson:* A VS Code / JetBrains / Neovim extension would massively increase adoption. The agent should be invocable from the cursor position, with inline diff preview and apply-from-editor.

**2. No in-editor diff/preview.** Cursor's Composer and Cline show diffs before applying. Zed has accept/reject per-hunk. chode's agent writes files via tools but there's no rich pre-apply review UI in the terminal.
- *Lesson:* Add a TUI diff reviewer: `chode review` showing side-by-side diffs with accept/reject per hunk, before the agent commits changes.

**3. No automatic per-turn git checkpoints.** Aider commits every turn with descriptive messages; `git undo` is instant. Cursor creates automatic snapshots before significant changes. Cline uses a shadow git repo. chode has `undoEdit`/`rewind` but not automatic per-turn commits. If the agent breaks something, recovery is manual.
- *Lesson:* Auto-commit before each agent turn (`git commit --allow-empty -m "chode: <turn>"`), exposed as `chode checkpoints list` + `chode checkpoint rollback <id>`.

**4. No browser / computer control.** Cline and Devin can drive a real browser to test the app they built, click UI, read runtime errors from the page. Cursor has an embedded in-editor browser. chode has `browser-check` but it's limited to HTML artifact validation.
- *Lesson:* Integrate a headless browser (Playwright/Puppeteer via MCP or built-in) so the agent can open `localhost`, click buttons, capture console errors, and self-correct — closing the build → test → fix loop without human intervention.

**5. No built-in deploy.** Replit Agent deploys to `.replit.app`; Devin deploys from cloud VM; Copilot Workspace makes PRs. chode builds locally but doesn't deploy.
- *Lesson:* Add `chode deploy` targeting common targets (Cloudflare Pages/Workers, Vercel, Netlify, Docker) — especially valuable since chode already publishes to chode.borken.app and has release/install infra.

**6. Context retrieval is weaker.** Cursor indexes the whole codebase with embeddings for `@`-references and Composer context. Aider builds a tree-sitter repo-map with PageRank ranking. chode has project memory and session messages, but no persistent vector index of the codebase for semantic retrieval across a large repo.
- *Lesson:* Add a local embedding index (`chode index <path>`) using a small embedding model via ONNX runtime or a local Ollama embedding endpoint — no API key needed, consistent with chode's free/keyless philosophy.

**7. No multi-agent parallelism.** Cursor runs up to 8 parallel agents on git worktrees; Zed runs multiple agent threads; Devin runs 10-20 in parallel. chode runs a single agent loop.
- *Lesson:* For large tasks, spawn multiple sub-agents on git worktrees, each handling a sub-task, then merge.

**8. No multiplayer / collaboration.** Zed and Replit are multiplayer by default. chode is single-user local. The `serve` HTTP API is a step toward remote access but lacks session sharing.
- *Lesson:* Lower priority for a CLI tool, but session sharing (serve a session URL) could be added later.

---

## 4. Lessons chode Should Take

| Lesson | Source | Why it matters for chode |
|---|---|---|
| **Auto-commit every turn** | Aider, Cursor, Cline | Instant undo safety net; prevents silent breakage |
| **Checkpoints / shadow git** | Cursor, Cline | Non-destructive snapshots; restore from timeline |
| **Diff review before apply** | Zed, Cursor, Cline | Human-in-the-loop; review what the agent will change |
| **Browser control for self-test** | Cline, Devin, Cursor | Close the build→test→fix loop autonomously |
| **Codebase semantic index** | Cursor, Aider | Retrieve relevant code from large repos without pasting files |
| **In-editor entrypoint** | Cursor, Cline, Zed, Copilot, Continue | Meet the user where they already are |
| **Cloud handoff** | Devin | Start local, hand off when work outgrows laptop |
| **Built-in deploy** | Replit Agent, Devin | Deploy from the tool itself |
| **Multi-agent parallelism** | Cursor, Zed, Devin | Handle large tasks by splitting across sub-agents |
| **Local/offline models** | Continue, Cline, Zed | Consistent with chode's free/keyless philosophy |

---

## 5. High-Value Additions for chode (ranked)

### Tier 1 — Highest impact, leverages existing infra

**1. VS Code / Neovim extension (`chode-ai` in-editor)**
- Invoke chode from the editor, stream results into the buffer, inline diff accept/reject.
- Reuses existing `cmdAI` + provider routing + session infra.
- Biggest adoption lever — removes context-switching friction.

**2. Automatic per-turn git checkpoints**
- Before each agent turn: `git commit --allow-empty -m "chode: <turn description>"`.
- Expose `chode checkpoints list`, `chode checkpoint rollback <id>`.
- Uses existing git integration patterns (`undoEdit`, `rewind`).

**3. Local codebase index (semantic retrieval)**
- `chode index <path>` builds a local vector index of the repo.
- `chode ai` automatically injects top-k relevant snippets into the prompt.
- Uses local embedding (ONNX + tiny model, or Ollama embedding endpoint) — no API key needed, consistent with chode's free/keyless philosophy.

### Tier 2 — Medium impact

**4. Headless browser self-test loop**
- Agent builds app → opens `http://localhost:PORT` via Playwright → clicks/interacts → captures console errors → feeds back into next turn.
- Builds on existing `browser-check.js`.

**5. `chode review` TUI diff viewer**
- Side-by-side diffs, per-hunk accept/reject, apply to workspace.
- Prevents silent breakage from agent edits.

**6. `chode deploy` to Cloudflare / Vercel / Docker**
- Natural extension of existing release/install infra + chode.borken.app hosting.
- `chode deploy <target>` builds, packages, and publishes.

### Tier 3 — Lower impact / later

**7. Session sharing via `chode serve`** (multi-user remote access)
**8. Computer-use / desktop control** (like Cline's browser control)
**9. Multiplayer collaboration** (shared sessions, DeltaDB-style replication)

---

## 6. Strategic Positioning for chode

chode's winning niche is **"free, local, CLI-first, self-hostable AI coding harness"** — no account, no API key required, works entirely offline after install, runs on your own machine. None of the leaders own this exact combination:

- **Cursor/Copilot/Devin/Replit** = cloud accounts, paid tiers, no self-host.
- **Aider** = CLI + BYOK, but requires API keys (not free/keyless).
- **Cline/Continue** = IDE extensions + BYOK.
- **Zed** = IDE + BYOK, free but not CLI-first.

chode should double down on **zero-cost, zero-account, local-first** while selectively adopting the leaders' UX patterns:

1. **In-editor entrypoint** (extension) — meet users in their editor
2. **Auto-commit checkpoints** — safety net that Aider pioneered
3. **Diff review before apply** — human-in-the-loop from Zed/Cursor
4. **Browser self-test** — autonomous build→test→fix from Cline/Devin
5. **Codebase index** — semantic retrieval from Cursor/Aider

The `serve` HTTP API already puts chode ahead in one area: remote conversational access without an IDE. Adding Tier 1 additions (extension, auto-commit, index) would make chode competitive with the leaders while keeping its unique zero-cost, zero-account position.

---

## 7. Current State

- **chode serve:** HTTP API + web frontend deployed at chode.borken.app (v1.9.56). Sessions, settings, providers all configurable via web UI matching chode.borken.app style.
- **Installer:** Fixed EEXIST (`--force` on npm install), scoped package name (`@oooooooooo/ch0de`), dynamic install path. Deployed to chode.borken.app/install.cjs.
- **Tests:** units, cli, dogfood, rea, frontend-copy PASS. acceptance-summary fails only due to missing Python (environment, not code).
- **npm publish:** Blocked by EOTP (2FA). Package `@oooooooooo/ch0de@1.9.56` built and ready. Needs `--otp <6-digit-totp>` to publish.
- **GIT:** origin/master at latest commit, all work pushed.