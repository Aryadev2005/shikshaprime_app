## Sprint task
<!-- e.g. S1 / 1.4.3 activities node -->

## What changed and why
<!-- 1–3 bullet points focused on the WHY -->
-

## How to test
- [ ] `uv run pytest tests/unit -v` passes
- [ ] Manual smoke test: `curl POST /generate` with Photosynthesis payload
- [ ] No hardcoded values introduced (config keys in .env.example)

## Checklist
- [ ] Pydantic models updated if schema changed
- [ ] Prompt file committed (app/prompts/*.txt)
- [ ] uv.lock committed if dependencies changed
- [ ] No .env or secrets committed
