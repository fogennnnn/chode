# Native integrations

Chode reads installed Agent Skills and connects to compatible Streamable HTTP or stdio MCP servers. These are Chode-owned integrations; setup does not modify another coding agent's configuration.

## Quick start

```sh
chode integrations list
chode integrations setup cloudflare --global
chode mcp auth cloudflare
chode mcp test cloudflare
chode mcp tools cloudflare
chode skills list
chode skills read cloudflare
```

The Cloudflare skills already installed under `~/.agents/skills` are discovered automatically. OAuth opens the account provider's login page only when you run `mcp auth` in an interactive terminal. Complete browser consent yourself. A saved configuration is **configured**, a 401 is **needs_auth**, and **ready** requires an actual MCP handshake and tool listing. No agent restart is required: configuration is loaded for each operation. A live test describes that moment, not a perpetual availability guarantee.

Other presets:

```sh
chode integrations setup openai-docs --global
chode integrations setup context7 --global
chode integrations setup github --global
```

OpenAI docs is public documentation, not free ChatGPT inference. Context7 currently supports unauthenticated discovery; service limits apply. To use its own bearer key, add `--token-env CONTEXT7_API_KEY` on initial setup. GitHub uses the `GITHUB_MCP_TOKEN` environment variable; use a token scoped to the repositories and actions you intend. Existing configurations are preserved; inspect and explicitly remove/re-add a server to change authentication settings. Never paste tokens into prompts or server URLs.

## Other compatible servers

```sh
chode mcp add docs --url https://example.org/mcp --global
chode mcp add local -- node /absolute/path/server.cjs
chode mcp list
chode mcp trust local
chode mcp test local
chode mcp tools local
chode mcp schema local TOOL_NAME
chode mcp call local TOOL_NAME '{"query":"example"}'
chode mcp logout local
chode mcp remove local
```

PowerShell and other shells have different JSON quoting rules. `mcp call` executes the requested tool and may change remote resources. Model-driven `mcp_call` requests require approval; headless runs deny them without an approval callback. Plan and read-only subagent modes disable this tool. Discovery starts only explicitly trusted configurations. Local servers execute code: inspect the executable and arguments before trusting them. Configurations found in repositories are not automatically trusted.

Project configuration is `.chode/mcp.json`; user configuration is `~/.chode/mcp.json`. Project names override user names. An explicitly added configuration is trusted; manual changes invalidate that trust. OAuth tokens and client secrets stay in `~/.chode/mcp-auth` (including project connections), separate from the repository, bound to project and endpoint. Local credential files are created with private POSIX permissions; Windows inherits its directory ACLs. Logout clears local credentials; revoke remote grants at the account provider if necessary. Keep `.chode` state out of source control.

Tools are discovered on demand rather than injecting every server schema into every model turn. Each operation opens and closes its own client. Stateful browser sessions spanning several calls are **not supported by this lifecycle yet**; Playwright's CLI plus skills is a better initial browser route. Legacy SSE-only servers, non-dynamic/pre-registered OAuth clients, cross-process session persistence, an interactive TUI integration picker, MCP resources/prompts, and exposing Chode as a server for other apps remain follow-up work. HTTP redirects are rejected; configure the canonical endpoint.

## Agent Skills

Chode discovers project `skills`, `.agents/skills`, `.chode/skills`, `.claude/skills`, then user `.chode/skills`, `.agents/skills`, `.claude/skills` and `.codex/skills`. Project slugs take precedence. Valid `SKILL.md` frontmatter needs a name and description. Relevant metadata is added to build context; the model reads instructions and relative text references through the paged `skill` tool. `--no-memory` suppresses automatic metadata selection. Loading skills never runs their scripts or grants account access. Secret references and paths escaping a skill's real directory are denied.

## Research and next candidates (28 October 2026)

- [Cloudflare agent setup](https://developers.cloudflare.com/agent-setup/prompt.md): shared skills and the OAuth account MCP endpoint. Chode uses its own configuration instead of copying OpenCode examples.
- [OpenAI documentation MCP](https://learn.chatgpt.com/learn/docs-mcp): usable now through the preset. [Codex SDK](https://learn.chatgpt.com/docs/codex-sdk) is a separate optional agent integration candidate with its own authentication and costs. It is not enabled as a free fallback.
- [Claude Agent SDK](https://code.claude.com/docs/en/agent-sdk/overview): API-key based optional agent candidate. Anthropic says third parties need prior approval to offer claude.ai login or subscription rate limits. Chode does not reuse another app's sessions or promise subscription access.
- [Context7](https://github.com/upstash/context7): current library documentation, available through the preset.
- [GitHub MCP](https://github.com/github/github-mcp-server): repository, review and CI context, available through the preset with your token.
- [Playwright MCP](https://github.com/microsoft/playwright-mcp) and [CLI](https://github.com/microsoft/playwright-cli): browser verification candidate. The official MCP README recommends considering CLI plus skills for coding workflows. Add persistent, cancellable sessions before enabling a browser MCP preset.

Connecting ChatGPT or Claude **to Chode** requires a separately designed server with explicit exported tools and account permissions. This release makes Chode a client; it does not claim those products are connected. No paid service is an automatic fallback for free mode.
