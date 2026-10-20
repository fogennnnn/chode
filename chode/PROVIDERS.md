# Provider and model setup

Run `chode connect` or `/connect` to choose a built-in provider, or add a custom OpenAI-compatible endpoint. Credentials stay in local configuration and masked input is excluded from chat/history/export. Account providers still need their own authorized key; OpenRouter's existing browser authorization flow remains available.

The model picker supports `next`, `previous`, `search <text>`, an on-page number or an exact model ID. Enter `current` to retain the saved model. Only the chosen ID is saved: display labels never become request model names. Discovery failure still permits manual entry. An optional connection test validates access before saving.

Models with explicitly zero prompt/completion prices and no other listed charge sort first, followed by advertised tool support. Missing, malformed, negative or partial price metadata never establishes a zero price. Labels describe the provider's catalog response, not measured coding ability. Quotas, eligibility, availability and prices can change. Unknown models remain selectable; verify provider terms before use.

Tool/structured-output support and context size appear only when reported in recognized metadata fields. They are informative; selecting a model does not enable an unsupported protocol or change the harness's established tool handling. Discovery is bounded to 500 distinct valid IDs and 5,000 input entries, with 20 models per page.

Changing models does not reset provider cooldowns, shared account/IP quotas or circuit breakers. Strict free mode continues to allow only keyless/local providers without credentials; a zero-price listing on an account provider does not make that provider eligible. No paid fallback or automatic account provisioning is introduced.

For local inference, see LOCAL-MODELS.md. No model downloads happen automatically.
