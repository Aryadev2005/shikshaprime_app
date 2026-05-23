# AI Lesson Planner — Infrastructure & Environment

## Environment Variables

All configuration is loaded from `.env` via `python-dotenv` into `app/config.py → Settings`.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | **YES** | — | Google AI Studio API key — get from https://aistudio.google.com/apikey |
| `MODEL_NAME_HEAVY` | no | `gemini-2.5-flash` | Gemini model for heavy nodes: chapter_extraction, objectives, activities, assessments, standards |
| `MODEL_NAME_LIGHT` | no | `gemini-2.5-flash` | Gemini model for lightweight nodes: prerequisites, materials, differentiation, homework, time_breakdown |
| `LOG_LEVEL` | no | `INFO` | Logging verbosity: `DEBUG` \| `INFO` \| `WARNING` \| `ERROR` |
| `MAX_LESSON_DURATION` | no | `240` | Maximum allowed lesson duration in minutes (Pydantic `le=` constraint) |
| `CHAPTER_TEXT_MIN_LENGTH` | no | `50` | Minimum character length for `chapterPdfText` input (Mode A legacy field) |
| `CHAPTER_TEXT_MAX_LENGTH` | no | `50000` | Maximum character length for `chapterPdfText` input (Mode A legacy field) |
| `MAX_PDF_SIZE_MB` | no | `20` | Maximum PDF file size in MB accepted by `POST /generate-with-pdf` (Mode B) |
| `USER_INSTRUCTION_MAX_LENGTH` | no | `500` | Maximum characters for the teacher's free-text `userInstruction` field in `POST /regenerate` (S3) |
| `LLM_MAX_RETRIES` | no | `2` | Number of retries per node when Gemini returns invalid output |
| `RATE_LIMIT_RETRY_DELAY_SECONDS` | no | `65` | Seconds to wait after a 429 rate-limit response before retrying |
| `PIPELINE_TIMEOUT_SECONDS` | no | `600` | Max seconds for the full LangGraph pipeline before returning HTTP 502 |
| `REQUEST_ID_LENGTH` | no | `12` | Length of the hex suffix in the per-request correlation ID |

> **Secret:** Only `GEMINI_API_KEY` is sensitive. All other variables are non-sensitive and can be stored in `infra/config.yml` for CI/CD environments.

## Service Runtime Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| Python | 3.11+ | Runtime |
| FastAPI | ≥ 0.136.1 | HTTP API framework |
| python-multipart | ≥ 0.0.28 | Multipart/form-data file upload parsing (required by `POST /generate-with-pdf`) |
| LangGraph | ≥ 1.1.10 | Orchestration pipeline |
| Pydantic | ≥ 2.13.3 | Schema validation + Gemini structured output |
| google-genai | ≥ 1.75.0 | Gemini API client (text generation + Files API for PDF uploads) |
| python-dotenv | ≥ 1.2.2 | `.env` file loading |
| uvicorn[standard] | ≥ 0.46.0 | ASGI server |

## Prompt File Runtime Dependency

The service requires the `app/prompts/` directory with all 12 `.txt` files:

```
app/prompts/
├── _regen_prefix.txt              ← S3 only (prepended to any node's prompt in regen mode)
├── chapter_extraction.txt         ← Mode B PDF (multimodal: PDF file + text prompt)
├── chapter_extraction_text.txt    ← Mode B text (chapterPdfText string in POST /generate)
├── objectives.txt
├── prerequisites.txt
├── materials.txt
├── activities.txt
├── assessments.txt
├── differentiation.txt
├── homework.txt
├── time_breakdown.txt
└── standards.txt
```

Prompt files are loaded lazily on first use via `app/utils/prompt_loader.py` (`@lru_cache`). A missing file raises `FileNotFoundError` at the first request that requires it — not at startup.

## Gemini Files API (Mode B)

- Uploaded files are stored by Gemini for **48 hours** — sufficient for a single pipeline run
- File URIs returned are full HTTPS URLs, e.g. `https://generativelanguage.googleapis.com/v1beta/files/abc123`
- The URI is passed through `LessonPlanState.geminiFileUri` and read only by `chapter_extraction`
- No cleanup step is needed — Gemini expires files automatically

## Local Development

```bash
# Install uv (macOS/Linux)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install all dependencies (including python-multipart)
uv sync

# Configure environment
cp .env.example .env
# Edit .env — add your GEMINI_API_KEY

# Start the server
uv run uvicorn app.main:app --reload
```

Service: `http://localhost:8000` | Swagger: `http://localhost:8000/docs`

### Test Mode B locally

```bash
curl -X POST http://localhost:8000/generate-with-pdf \
  -F "grade=7" \
  -F "subject=Science" \
  -F "topic=Photosynthesis" \
  -F "duration=45" \
  -F "board=CBSE" \
  -F "teachingStyle=Activity-based" \
  -F "depth=Standard" \
  -F "pdf_file=@/path/to/chapter4.pdf"
```

## Docker

```bash
# Build (requires Dockerfile — planned in S1 task 1.4.1)
docker build -t ai-lesson-planner:dev .

# Run
docker run -p 8000:8000 -e GEMINI_API_KEY=$GEMINI_API_KEY ai-lesson-planner:dev
```

## Deployment (Planned)

| Environment | Trigger | Status |
|-------------|---------|--------|
| Staging | Push to `main` | Planned — S1 task 1.4.2 |
| Production | `workflow_dispatch` | Planned — S4 task 4.2.1 |

Deployment URL: `<FILL_IN after staging deploy>`

## infra/config.yml (Planned — S1 task 1.4.x)

Non-sensitive config for CI/CD workflows will be stored in `infra/config.yml`:

```yaml
staging:
  services:
    ai-lesson-planner:
      port: <FILL_IN>
      deploy_path: <FILL_IN>
      allowed_origins: <FILL_IN>
      model_name_heavy: gemini-2.5-flash
      model_name_light: gemini-2.5-flash
      log_level: INFO
      max_lesson_duration: 240
      max_pdf_size_mb: 20
      llm_max_retries: 2
      pipeline_timeout_seconds: 600

production:
  services:
    ai-lesson-planner:
      port: <FILL_IN>
      deploy_path: <FILL_IN>
      allowed_origins: <FILL_IN>
      max_pdf_size_mb: 20
      pipeline_timeout_seconds: 600
```

> Sensitive values (`GEMINI_API_KEY`, `SERVER_IP`, `SERVER_USER`, `SERVER_SSH_PASSWORD`) live in GitHub Secrets only — never in `infra/config.yml`.
