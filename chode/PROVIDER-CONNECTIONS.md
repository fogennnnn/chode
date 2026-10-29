# Provider connections and verification

Chode includes 17 built-in routes and a searchable catalog of **184 connection profiles**: 181 cloud profiles from the MIT-licensed Models.dev snapshot and three local server presets (LM Studio, llama.cpp, vLLM). Some catalog names overlap built-ins or represent gateways/regions. This is broader connection coverage, not 184 independently verified companies or a claim of 10x free capacity.

```sh
chode providers
chode providers huggingface
chode connect agnes
# In the TUI:
/providers lmstudio
/connect lmstudio
/connect sambanova
```

`/connect` supports provider IDs, display names, numbered pages, `next`, `previous` and `search <text>`. Catalog connections show their endpoint and documentation before asking for a key. They are activated only after you explicitly save them. Live model discovery takes precedence; catalog models remain labelled as metadata when discovery is unavailable. A local preset requires your running server and installed model; choose custom if its address or authentication differs. The llama.cpp preset uses the documented native port 9931, not Docker's example port 8080.

## Credentials and errors

Provider setup saves credentials for your user account in `~/.chode/providers.json` and keeps key-free references in project configuration. New workspaces can use those settings. Older keys saved in `~/.chode/config.json` are read for compatibility without copying them into projects. Project-specific settings take precedence. Shared credentials are bound to user-saved endpoint definitions. A different project URL or authentication mode cannot inherit them; reconnect to confirm it. Unconfirmed project definitions cannot map arbitrary environment keys or activate a remote guest route. Existing project-only setup remains available to callers through `scope: 'project'`. Global defaults do not automatically disable strict free mode in a new project. Set `CHODE_PROVIDER_HOME` to an existing private directory for an isolated credential root (useful for tests or portable setups); this avoids changing operating-system profile variables used by browsers.

Files use private POSIX permissions where supported and inherit the user's Windows directory ACLs. Keys remain unencrypted on disk. Secret paths and known credentials are excluded/redacted from tools and retained history; this is not an operating-system sandbox against arbitrary executable code. Do not commit `.chode` credentials.

Agnes supports the documented `AGNES_API_KEY`, the legacy `CHODE_KEY`, and saved credentials. Explicitly saved keys override stale environment values. A copied `Bearer KEY` prefix is normalized. Reconnecting clears stale authentication suppression without resetting provider rate-limit cooldowns.

Live diagnostic on 29 October 2026: the user's existing Agnes key successfully listed models (HTTP 200), but selected `agnes-2.5-pro-beta` returned HTTP 403 / `insufficient_user_quota`. This is an account/model quota condition, not proof of a malformed key. Setup now distinguishes authentication, quota, model access and missing-model errors. On access/quota failures you can choose another model, explicitly save an unverified connection, or cancel. Saving after a failed test is never labelled ready. No account quotas are bypassed.

## Free access: verified distinctions

- Strict free mode still uses keyless/local routes only. Catalog prices never automatically enable an account-key provider or paid fallback.
- 55 cloud profiles list at least one zero-token-price model in the snapshot. That is metadata, not verified free account access, independent free vendors, unlimited usage or a quality ranking.
- [OpenRouter's current free-model documentation](https://openrouter.ai/collections/free-models) provides free variants and a free-model router. Account/API-key requirements and rate limits still apply; its gateway is not dozens of separate Chode integrations.
- [Hugging Face](https://huggingface.co/docs/inference-providers/pricing) documents small monthly credits for free accounts, with paid usage beyond those credits. This is a useful low-budget gateway, not unlimited free inference.
- [SambaNova's plans page](https://cloud.sambanova.ai/plans) currently says to add a payment method and purchase credits for initial requests. Do not label it free based on older third-party lists.
- [LM Studio](https://lmstudio.ai/docs/developer/openai-compat), [llama.cpp](https://github.com/ggml-org/llama.cpp/tree/master/tools/server) and [vLLM](https://docs.vllm.ai/en/latest/serving/online_serving/openai_compatible_server/) provide local API routes that avoid cloud request quotas. Model licenses and your hardware/resource costs still apply. No models are downloaded automatically.

## Evidence and limits

The snapshot records its source URL, retrieval time and SHA-256, with its MIT license preserved in `MODELS-DEV-LICENSE`. Unsupported cloud authentication protocols, providers without compatible endpoints, and Copilot session-token routes are excluded. The public installer hashes the catalog as part of the release.

`tests/provider-directory.test.js` exercises every profile's setup and HTTP request format against a real local HTTP fixture, plus authentication precedence, shared credentials, corrupt-state preservation and free-mode isolation. These are protocol tests; they do not verify live credentials, billing or availability at every vendor.

`tests/tui-command-matrix.test.js` drives all 36 registered commands through the real TUI input handler and actual worker subprocesses. It checks direct Wolfram math, builds, plan/task, retry/resume, checkpoints, undo, verification, quota-aware Agnes setup, hidden credentials, exports and terminal restoration. Model/account responses are controlled fixtures. `tests/native-workflow.py` adds actual Linux pseudo-terminal journeys for an installed package, including a local HTTP quota response. Existing native-startup, provider, browser, RE and other regression suites remain in place.

No benchmark shows that all new providers are better than existing routes. Select and compare models under the same task/evaluator/budget before making a quality claim. Live authenticated vendor coverage remains limited to accounts that can be tested with authorized credentials.

## Recover or reset

Use `/free on` (or `chode free on`) to clear a forced account provider and save automatic keyless/local routing. Existing paid retries cannot override that explicit choice. Stop an active run with Ctrl+C first. `/reset` opens a menu for free-mode recovery, workspace settings reset, or workspace plus saved provider-key reset. CLI equivalents are `chode reset --confirm` and `chode reset --providers --confirm`. Project files, history, checkpoints and MCP connections are kept. Reset creates private backups, which can contain previous credentials; environment variables remain unchanged.
