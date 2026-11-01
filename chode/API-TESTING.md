# API testing in Chode

Three optional engines provide complementary evidence:

| Engine | Purpose | Pinned managed release |
| --- | --- | --- |
| [Hurl](https://hurl.dev/docs/installation.html) | Plain-text HTTP journeys, captured IDs/tokens, JSON assertions | 8.1.0 |
| [Schemathesis](https://schemathesis.readthedocs.io/en/stable/) | Generated OpenAPI/GraphQL contract tests, including edge cases | 4.32.7 |
| [k6](https://grafana.com/docs/k6/latest/) | Explicit HTTP load tests, checks and performance thresholds | 2.3.0 |

Chode does not install these with its normal package. `list` and `doctor` work without them. Setup installs Hurl through its official npm package, Schemathesis into a Python virtual environment, and k6 from a release with a pinned SHA-256. Managed installations stay under the workspace's `.chode/api-tools`; global installations are also detected. `CHODE_API_TOOLS_HOME` optionally selects a shared directory. Setup requires network access; Schemathesis also requires a compatible Python installation. k6 managed setup supports Windows x64, Linux x64/arm64 and macOS x64/arm64; use a PATH installation on other platforms.

```text
chode api-test list
chode api-test doctor
chode api-test setup hurl
chode api-test setup schemathesis
chode api-test setup k6

chode api-test run hurl "tests/api journey.hurl" --base-url http://127.0.0.1:3000
chode api-test run schemathesis openapi.json --base-url http://127.0.0.1:3000 --examples 20
chode api-test run k6 tests/smoke.js --base-url http://127.0.0.1:3000 --iterations 5 --vus 1
```

The TUI uses the same interface: `/api-test list`, `/api-test setup hurl`, `/api-test run hurl "tests/api journey.hurl" --base-url http://127.0.0.1:3000`. It runs in a worker, stays responsive and can be stopped with Ctrl+C. Setup and execution are blocked in plan mode; discovery remains available. These commands make zero model calls. An API-test failure shows its evidence directly instead of queuing an unrelated provider retry. Builds can run these commands through the existing guarded `exec` tool, inspect the failed assertions, repair the application and rerun the unchanged test.

## Minimal tests

Hurl uses the `base_url` variable:

```hurl
GET {{base_url}}/health
HTTP 200
[Asserts]
jsonpath "$.ok" == true
```

Schemathesis takes the application's actual OpenAPI/GraphQL schema. Generated examples default to 10 per operation, one worker and seed 1. Schema coverage and negative testing remain enabled. Reported JUnit test counts refer to engine test cases/operations, not a coding benchmark score or exhaustive API coverage.

k6 uses `__ENV.BASE_URL`:

```js
import http from 'k6/http';
import {check} from 'k6';
export const options = {thresholds: {http_req_duration: ['p(95)<500']}};
export default function () {
  const response = http.get(__ENV.BASE_URL + '/health');
  check(response, {'healthy': r => r.status === 200});
}
```

k6 defaults to one virtual user and five iterations. Chode checks the summary for failed assertions and HTTP requests even when k6 itself exits zero. Native threshold failures also fail the run; an HTTP test that sends no requests cannot pass. A script's own scenarios can specify additional workload. Load testing is explicit, never an automatic probe of a public service.

## Evidence and limits

CLI output is JSON and failures exit nonzero. Reports under `.chode/api-tests/results` retain the actual native exit code, timeout/signal, timestamps, test SHA-256, bounded redacted diagnostics and available metrics. Human TUI output shows a concise result and report path. Raw native summaries/JUnit files are removed after extraction. A failed launch, missing tool, absent required report, zero schema tests, changed test file or timeout cannot count as a pass. Default execution timeout is 60 seconds; `--timeout 1..300` bounds a test process tree. This does not impose a time limit on the build workflow.

Only regular workspace test inputs with expected extensions are accepted; credential/internal-state paths, links and hardlinks are rejected. Test files are executable project input with the same authority as project test commands, not a sandbox. Keep credentials in environment variables rather than test files or base URLs. Known saved/environment credentials are redacted from retained diagnostics; arbitrary application-specific secrets are not automatically known.

Overlapping frameworks from the proposed list are not installed. Existing project suites can continue through `exec`; the three adapters above add distinct coverage without making every Chode user install Java, Python and multiple duplicate workflow runners.

## On-demand runn know-how

Chode recognizes [runn](https://github.com/k1LoW/runn) as an available-to-get capability for SSH, browser/CDP screenshots and DOM access, HTTP/gRPC and database workflows. Relevant tasks receive concise guidance to check availability and use `toolbox inspect {repo:"k1LoW/runn"}` to clone the official repository only when needed. Reuse the checkout, read relevant documentation, follow official setup and verify actual results. Nothing is installed or cloned merely by starting Chode. Unrelated tasks receive no runn-specific context; existing permissions still apply.

## Further integration direction

Keyless website-backed code generation remains an experimental candidate, not a working browser integration in this release. It needs per-site access/automation support, completion detection, code extraction and local verification. Prefer a documented public interface when one is available: [AI Horde](https://aihorde.net/) publishes a community text/image API, and [Gradio](https://www.gradio.app/guides/querying-gradio-apps-with-curl) documents API access to compatible public apps. Their coding quality and practical availability have not been qualified here. Never infer anonymous access from a model catalogue or treat a web session as an unlimited API.

A future component library should inspect layout/DOM/styles/interactions and collect reusable code with source/license, dependencies, comments, examples and tests. Public client-side assets do not supply a site's backend. Chode already has web fetching/research and browser verification; a searchable, provenance-aware reusable component store is not implemented by these API-test adapters.

## Tool use and implementation quality

Tools are chosen automatically from the user's task. `/tools` explains this; `/tools forex` shows capability guidance and an example message without pretending it executed the tool. Ask Chode to use a named tool in normal language. Actual tool activity/results show when it is used. Live forex, geocoding and weather calls passed on29October2026.

Requests for multiple core mechanisms (such as learning, reasoning, grammar, reinforcement and pruning) get an explicit behavior contract and use the test-capable workspace instead of the static HTML artifact shortcut. Certification needs observed successful runtime or protected acceptance tests; labels, sample data, screenshots, syntax checks and empty tests do not qualify. Independent review must distinguish the underlying system from its visualization and assess every original requirement. Tests still need to cover the requested behavior; this gate is a minimum evidence bar, not proof that an arbitrary implementation is flawless. The display-only brain supplied by the user is retained as a rejection regression.
