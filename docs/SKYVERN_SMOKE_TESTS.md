# Skyvern Smoke Tests (manual / local)

This repo primarily uses Vitest + Playwright for automated testing.

Skyvern can be used as an additional **visual smoke-test runner** (LLM + browser automation) to quickly validate that:
- the landing page renders correctly on mobile
- key routes load (`/view`, `/pricing`, `/privacy`, etc.)
- critical CTAs still work

> This is not CI-wired today. Treat it as a developer tool.

## Prerequisites

- Skyvern installed (recommended via `pipx`) and runnable:

```bash
pipx install skyvern
skyvern --help
```

- A local Skyvern API server running on `http://localhost:8000`.

## Start Skyvern with a vision model (DashScope OpenAI-compatible)

Example configuration for Qwen vision model:

```bash
export SKYVERN_API_KEY="<your_skyvern_api_key>"
export SKYVERN_BASE_URL="http://localhost:8000"

export ENABLE_OPENAI_COMPATIBLE="true"
export LLM_KEY="OPENAI_COMPATIBLE"
export OPENAI_COMPATIBLE_API_BASE="https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
export OPENAI_COMPATIBLE_API_KEY="<your_dashscope_key>"
export OPENAI_COMPATIBLE_MODEL_NAME="qwen3-vl-flash"
export OPENAI_COMPATIBLE_SUPPORTS_VISION="true"

skyvern run server
```

## Run a smoke check (API)

Use the Skyvern REST endpoint:

```bash
curl -sS -X POST http://localhost:8000/v1/run/tasks \
  -H 'Content-Type: application/json' \
  -H "x-api-key: $SKYVERN_API_KEY" \
  -d '{
    "url": "https://decodocs.com",
    "prompt": "Open https://decodocs.com on a mobile viewport. Verify: header logo size normal, hero headline + CTAs render, pricing section renders on scroll. Return a pass/fail list.",
    "max_steps": 12,
    "max_screenshot_scrolls": 3
  }'
```

Then poll for results:

```bash
RUN_ID="<run_id_from_previous_output>"
curl -sS -H "x-api-key: $SKYVERN_API_KEY" "http://localhost:8000/v1/runs/$RUN_ID" | jq
```

## Suggested prompts

- Home page mobile render check
- `/view` loads and shows PDF viewer UI
- Footer links navigate to valid pages
- Pricing page cards render and CTA buttons visible

## Notes

- If you see `Invalid credentials`, ensure you are sending `x-api-key` header.
- If port 8000 is already in use, stop the old process first.
