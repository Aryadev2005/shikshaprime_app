# AI Lesson Planner — Project Memory

**Last updated:** 11 May 2026

---

## Project Overview

AI Lesson Planner is a Python/FastAPI service that generates structured lesson plans using Google Gemini via a LangGraph sequential pipeline. Supports Mode A (topic-only) and Mode B (Gemini native PDF reading via Files API). Per-section regeneration is planned for S3.

---

## Current Sprint Status

| Sprint | Theme | Status |
|--------|-------|--------|
| S0 | Mode A End-to-End | ✅ **Complete** — `/generate` working, end-to-end tested |
| S1 | Stabilize, Test, Stage Deploy | Pending |
| S2 | Mode B PDF Upload + Chapter Grounding | ✅ **Infrastructure complete** — 2.0.1–2.1.3 done, real PDF tested (49s, excellent grounding) |
| S3 | Regeneration | Pending |
| S4 | Hardening, Prod Deploy, Handover | Pending |

---

## Completed Tasks

### S0 — Mode A End-to-End

#### Task 0.1.1 — Initialize repo + uv + dependencies
- Python 3.11 project with `uv` package manager
- Dependencies: `langgraph`, `pydantic`, `fastapi`, `uvicorn[standard]`, `google-genai`, `python-dotenv`
- Dev deps: `pytest`, `pytest-asyncio`, `httpx`

#### Task 0.1.2 — Create folder structure + env files
- Folder structure with `__init__.py` files
- `.gitignore`, `.env.example`, `.env` with Gemini API key

#### Task 0.1.3 — Gemini API smoke test
- Gemini API key verified working with `gemini-2.5-flash`

#### Task 0.1.4 — Skeleton FastAPI with /health + config
- `app/config.py`: Settings loaded from env vars
- `app/main.py`: FastAPI app with `GET /health`, request ID middleware
- `app/observability/logging.py`: JSON structured logger
- `app/utils/prompt_loader.py`: Cached prompt file loader with path traversal protection

#### Task 0.2.1 — All Pydantic schemas
- `app/schemas/inputs.py`: `GenerateRequest` (7+1 fields), `RegenerateRequest`
- `app/schemas/sections.py`: 10 output models with `Field(description=...)` for Gemini, including `ChapterContext`
- `app/schemas/outputs.py`: `LessonPlan` composing all 9 section models

#### Task 0.3.1 — GeminiClient + retry helper
- `app/llm/client.py`: `generate_structured()` using `response_schema`
- `app/llm/retry.py`: `call_with_retry()` — max 2 retries on validation failure

#### Task 0.4 — All 9 Prompt Templates (+ Security Hardening)
- All 9 prompt files in `app/prompts/` with `{chapter_block}` + `{grounding_instruction}` placeholders
- SAFETY preamble on all prompts (prompt injection mitigation)
- `format_prompt()` helper (format-string injection prevention)
- `last_error` truncated to 300 chars in retry.py (error-reflection injection prevention)
- `depth` field on `GenerateRequest` changed to `Literal["Basic", "Standard", "Advanced"]`

#### Tasks 0.5.0–0.5.11 — All 11 nodes + LessonPlanState
- `app/graph/state.py`: `LessonPlanState` TypedDict
- All 9 generation nodes + `assemble` node built and individually validated
- `app/utils/chapter_context.py`: `build_chapter_block()` centralises Mode A/B switching

#### Tasks 0.6.1–0.6.2 — Pipeline + /generate endpoint
- `app/graph/pipeline.py`: `build_graph()` + `run_pipeline()`
- `POST /generate` endpoint live

#### Tasks 0.7.1–0.7.3 — End-to-End Mode A tested
- Full pipeline tested locally with Grade 7 Science Photosynthesis
- Second test with Grade 10 Math Quadratic Equations
- S0 milestone committed

---

### S2 — Mode B: PDF Upload + Chapter Grounding (Approach 3)

**Architecture decision:** Node.js sends raw PDF as `multipart/form-data`. AI backend uploads to Gemini Files API once, reads natively (text, tables, diagrams, equations), compresses into `chapterContext` (~2000 chars). All 9 generation nodes use that small context — PDF never sent again.

#### Task 2.0.1 — python-multipart + geminiFileUri
- Added `python-multipart==0.0.28` dependency
- Added `geminiFileUri: Optional[str]` to `LessonPlanState` in `app/graph/state.py`

#### Task 2.0.2 — PDF uploader utility
- `app/utils/pdf_uploader.py`: `upload_pdf_to_gemini(pdf_bytes: bytes) -> str`
- Uploads via `client.files.upload()` with `mime_type="application/pdf"`
- Returns full Gemini file URI (e.g. `https://generativelanguage.googleapis.com/v1beta/files/abc123`)
- Gemini stores uploaded files for 48 hours — sufficient for one pipeline run

#### Task 2.0.3 — generate_structured_with_file + call_with_retry_file
- `app/llm/client.py`: `generate_structured_with_file(prompt, file_uri, response_schema, model)`
  - Sends `[Part(file_data=FileData(file_uri, mime_type)), Part(text=prompt)]` to Gemini
  - Separate from `generate_structured()` — multimodal calls require list of Parts, not a plain string
  - Mirrors 429 retry logic from `generate_structured()`
- `app/llm/retry.py`: `call_with_retry_file(prompt, file_uri, response_schema, model, max_retries)`
  - Exact mirror of `call_with_retry()` but delegates to `generate_structured_with_file()`
  - On validation failure, error appended to text prompt (not the file reference)

#### Task 2.0.4 — POST /generate-with-pdf endpoint
- `app/main.py`: `POST /generate-with-pdf` — accepts `multipart/form-data`
- Validation: size gate (413 if > MAX_PDF_SIZE_MB), depth allowlist, duration range
- Uploads PDF → gets `file_uri` → builds initial state → calls `run_pipeline_with_pdf()`
- Error handling: 413 oversized, 422 invalid field, 503 upload failure, 502 pipeline failure
- `app/config.py`: `max_pdf_size_mb` from `MAX_PDF_SIZE_MB` env var (default 20)

#### Task 2.1.2 — chapter_extraction.txt prompt
- `app/prompts/chapter_extraction.txt`: Pure extraction instructions
- Has SAFETY preamble against PDF-embedded injection attacks
- Uses `{grade}`, `{subject}`, `{topic}`, `{board}` for targeted extraction
- No `{chapter_block}` placeholder — PDF is sent as a file reference, not embedded text
- Extracts: concepts, definitions, examples, exercises (verbatim), subtopics, learningFlow

#### Task 2.1.3 — chapter_extraction node + conditional pipeline routing
- `app/nodes/chapter_extraction.py`: reads `geminiFileUri` from state, calls `call_with_retry_file()`, returns `{"chapterContext": output.model_dump()}`
- `app/graph/pipeline.py` updated:
  - `_entry_route(state)` — module-level function: `geminiFileUri` present → `"chapter_extraction"`, else → `"objectives"`
  - `g.add_conditional_edges(START, _entry_route, {...})` replaces old `g.add_edge(START, "objectives")`
  - `chapter_extraction` → `objectives` edge added
  - `run_pipeline_with_pdf(initial_state: LessonPlanState)` added — takes pre-built state dict
  - `_invoke_with_timeout()` extracted as private shared helper (DRY — used by both `run_pipeline` and `run_pipeline_with_pdf`)

#### S2 Testing — 27 unit tests (all passing)
- `tests/unit/test_s2_pdf_upload.py` — covers:
  - `_entry_route` routing (4 tests)
  - `upload_pdf_to_gemini` (3 tests: URI returned, MIME type, BytesIO wrapping)
  - `generate_structured_with_file` (4 tests: success, None parsed, content parts, 429 retry)
  - `call_with_retry_file` (4 tests: success, retry on error, max retries exceeded, prompt augmentation)
  - `chapter_extraction.run` (4 tests: state output, prompt loading, file URI passing, model_dump)
  - `POST /generate-with-pdf` endpoint (8 tests: 413, 422 depth, 422 duration, 503 upload fail, 502 pipeline fail, 200 success, state passing, Swagger)

#### Real-World Acceptance Test Result (11 May 2026)
- **PDF:** NCERT Class 7 Science Chapter 1 — Nutrition in Plants (`gesc101.pdf`, 5.4 MB, image-based scanned PDF)
- **Total time:** 49 seconds (PDF upload ~9s + chapter_extraction ~14s + 9 nodes ~26s)
- **Grounding verified:** Output referenced Fig. 1.2, Fig. 1.4, Fig. 1.5, Fig. 1.6, Fig. 1.7, Fig. 1.8, Exercise 6, Exercise 13, "What you have learnt", "Did you know?" — all actual content from the chapter
- **Time breakdown:** sum = 45 ✅
- **Verdict:** EXCELLENT — Mode B grounding confirmed working with real NCERT image-based PDF

---

## Pending S2 Tasks

| Task | Description | Status |
|------|-------------|--------|
| 2.2.1 | Verify all 7 nodes fill chapter placeholders | ✅ Already done in S0 |
| 2.2.2 | Validate all 9 prompts in Mode B via AI Studio | Pending (manual) |
| 2.2.4 | Edge cases: short chapter, images-only PDF | Pending |

---

## Configuration

| Key | Value | Notes |
|-----|-------|-------|
| `GEMINI_API_KEY` | Set | Validated, working |
| `MODEL_NAME_HEAVY` | `gemini-2.5-flash` | Used for: chapter_extraction, objectives, activities, assessments, standards |
| `MODEL_NAME_LIGHT` | `gemini-2.5-flash` | Used for: prerequisites, materials, differentiation, homework, time_breakdown |
| `LOG_LEVEL` | `INFO` | |
| `MAX_LESSON_DURATION` | `240` | Max lesson minutes |
| `CHAPTER_TEXT_MIN_LENGTH` | `50` | Min chars for legacy chapterPdfText field |
| `CHAPTER_TEXT_MAX_LENGTH` | `50000` | Max chars for legacy chapterPdfText field |
| `MAX_PDF_SIZE_MB` | `20` | Max PDF size for /generate-with-pdf (Mode B) |
| `LLM_MAX_RETRIES` | `2` | Per-node retry count |
| `RATE_LIMIT_RETRY_DELAY_SECONDS` | `65` | Wait after 429 before retry |
| `PIPELINE_TIMEOUT_SECONDS` | `600` | Max pipeline execution time |
| `REQUEST_ID_LENGTH` | `12` | Hex chars in request correlation ID |

---

## Project Structure

```
ai-lesson-planner/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI — /health, /generate, /generate-with-pdf
│   ├── config.py            # All settings from env (zero-hardcoding)
│   ├── graph/
│   │   ├── state.py         # LessonPlanState TypedDict (incl. geminiFileUri)
│   │   └── pipeline.py      # build_graph(), _entry_route(), run_pipeline(), run_pipeline_with_pdf()
│   ├── llm/
│   │   ├── client.py        # generate_structured() + generate_structured_with_file()
│   │   └── retry.py         # call_with_retry() + call_with_retry_file()
│   ├── nodes/
│   │   ├── chapter_extraction.py   # Mode B only — reads PDF via file URI
│   │   ├── objectives.py
│   │   ├── prerequisites.py
│   │   ├── materials.py
│   │   ├── activities.py
│   │   ├── assessments.py
│   │   ├── differentiation.py
│   │   ├── homework.py
│   │   ├── time_breakdown.py
│   │   ├── standards.py
│   │   └── assemble.py
│   ├── observability/
│   │   └── logging.py       # JSON structured logger
│   ├── prompts/             # 10 .txt prompt templates
│   │   ├── chapter_extraction.txt  # Mode B only — multimodal (PDF file + text)
│   │   ├── objectives.txt
│   │   ├── prerequisites.txt
│   │   ├── materials.txt
│   │   ├── activities.txt
│   │   ├── assessments.txt
│   │   ├── differentiation.txt
│   │   ├── homework.txt
│   │   ├── time_breakdown.txt
│   │   └── standards.txt
│   ├── schemas/
│   │   ├── inputs.py        # GenerateRequest, RegenerateRequest
│   │   ├── sections.py      # 10 Pydantic output models incl. ChapterContext
│   │   └── outputs.py       # LessonPlan
│   └── utils/
│       ├── prompt_loader.py       # Cached loader + format_prompt() (injection safe)
│       ├── chapter_context.py     # build_chapter_block() — Mode A/B switching
│       └── pdf_uploader.py        # upload_pdf_to_gemini() — Gemini Files API
├── tests/
│   └── unit/
│       └── test_s2_pdf_upload.py  # 27 S2 unit tests (all passing)
├── tech-design-docs/
│   ├── API.md               # /health, /generate, /generate-with-pdf, /regenerate (planned)
│   ├── ARCH.md              # LangGraph diagrams Mode A + B, Approach 3 table
│   └── INFRA.md             # Env vars, dependencies, Gemini Files API notes
├── pyproject.toml
├── uv.lock
├── .env / .env.example
├── .gitignore
├── .python-version
├── README.md
├── CLAUDE.md
└── MEMORY.md
```

---

## Testing

- **Test runner:** pytest
- **Current tests:** 27 passing S2 unit tests (previous S0 tests not found on disk — may have been in a different session)
- **Coverage:** All new S2 components covered (routing, uploader, LLM client, retry, node, endpoint)

---

## Key Decisions

1. **gemini-2.5-flash** for both heavy and light nodes (free-tier compatible)
2. **LangGraph linear sequential pipeline** (Approach 2 per Solution Decision Document)
3. **One prompt file per node** with `{chapter_block}` + `{grounding_instruction}` placeholders — same file serves Mode A (empty) and Mode B (filled)
4. **All magic numbers externalized** to env vars via `config.py` (zero-hardcoding policy)
5. **Path traversal protection** on prompt loader (security audit requirement)
6. **`format_prompt()`** must be used by all nodes — never `load_prompt().format()` — to safely escape user-supplied brace characters
7. **`assessments` and `homework`** nodes must pass `{duration}` as a variable
8. **`standards` and `time_breakdown`** always pass empty strings for `chapter_block`/`grounding_instruction`
9. **`assessments`, `differentiation`, `homework`** nodes intentionally omit `teachingStyle` — prompt templates don't reference it
10. **`time_breakdown`** owns its own outer retry loop (`max_retries=0` inside `call_with_retry`) for sum validation
11. **`PIPELINE_TIMEOUT_SECONDS`** wraps `_graph.ainvoke` with `asyncio.wait_for`; timeout → RuntimeError → HTTP 502 (never leaks detail to client)
12. **Error responses are opaque:** 503 = "Upstream AI service unavailable", 502 = "Generation failed. Please retry." — full errors logged server-side only
13. **Mode B uses Approach 3 (Gemini native PDF):** Node.js sends raw PDF as `multipart/form-data`. AI backend uploads to Gemini Files API once via `upload_pdf_to_gemini()`. `chapter_extraction` node reads it natively and produces `chapterContext`. All 9 generation nodes use `chapterContext` — PDF never sent again. Confirmed working with real NCERT image-based PDF in 49 seconds.
14. **`generate_structured_with_file()` is separate from `generate_structured()`** — multimodal calls need a list of Parts; keeping them separate avoids confusing optional params and makes both independently testable
15. **`_entry_route(state)`** is a module-level function (not nested inside `build_graph()`) so it can be directly unit-tested
16. **`_invoke_with_timeout()`** is a private shared helper in `pipeline.py` — DRY, used by both `run_pipeline()` and `run_pipeline_with_pdf()`

---

## Documentation

- `tech-design-docs/API.md` — `/health`, `/generate`, `/generate-with-pdf` (with full field table + curl example), `/regenerate` (planned)
- `tech-design-docs/ARCH.md` — Mode A and Mode B Mermaid diagrams, Approach 3 breakdown table, `_entry_route` routing explanation, updated node reference table
- `tech-design-docs/INFRA.md` — All env vars (incl. `MAX_PDF_SIZE_MB`), `python-multipart` dependency, Gemini Files API 48-hour retention note, `infra/config.yml` template updated
