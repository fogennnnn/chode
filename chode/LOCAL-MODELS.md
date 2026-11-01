# Local models

Start Ollama and install a model appropriate for your hardware, then run `chode connect ollama` to select an installed model. Chode never downloads models implicitly. Local inference uses your hardware and remains eligible for strict free mode.

`chode models` lists installed model names; `chode status` distinguishes an unavailable server from a reachable server with no installed models. Set `OLLAMA_URL` to an HTTP(S) base URL to use another port or host. All discovery and inference paths honor it, including a trailing slash or reverse-proxy path prefix. URLs containing credentials, query parameters or fragments are refused. Discovery does not send prompts or API keys.

Health checks use Node's HTTP client, without curl or shell execution. They have a two-second total deadline, a 1 MB response limit and validated model-list responses. HTTP errors are failures, not evidence of a running model. Routing skips unreachable or empty Ollama installations. A healthy server still does not prove a selected model can generate useful code: choose the model with `chode connect ollama`, or set `OLLAMA_MODEL` when no saved model overrides it, and test an actual task.

Test: `node tests/local-models.test.js` exercises discovery and the real CLI against a disposable local HTTP server, including custom URL prefixes, errors, invalid responses, size limits and timeouts.
