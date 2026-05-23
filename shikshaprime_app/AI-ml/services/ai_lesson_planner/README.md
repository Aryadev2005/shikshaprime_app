# AI Lesson Planner — Python Backend

A Python service that generates structured classroom-ready lesson plans using Google Gemini and a LangGraph sequential pipeline. Supports topic-only generation, PDF-grounded generation, and per-section regeneration.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Running the Server](#running-the-server)
- [Testing the API](#testing-the-api)
- [All Endpoints](#all-endpoints)
- [Running Tests](#running-tests)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before running this project you need:

| Tool | Version | How to check |
|------|---------|-------------|
| Python | 3.11 or higher | `python --version` |
| uv | Latest | `uv --version` |
| Gemini API Key | — | Get from https://aistudio.google.com/apikey |

### Install uv (Python package manager)

**Windows (PowerShell):**
```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

**Mac / Linux:**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Verify:**
```bash
uv --version
```

---

## Installation

### Step 1 — Clone or navigate to the project folder

```powershell
cd C:\Retechprime\shilkshaprime\ShikshaPrime_new\AI-ml\services\ai_lesson_planner
```

### Step 2 — Install all dependencies

```bash
uv sync
```

This reads `pyproject.toml` and installs everything into a `.venv` folder automatically. No need to create a virtual environment manually.

---

## Environment Setup

### Step 3 — Create your .env file

```powershell
copy .env.example .env
```

### Step 4 — Add your Gemini API Key

Open `.env` in any text editor and set your key:

```
GEMINI_API_KEY=your_actual_key_here
```

Get your free API key from: https://aistudio.google.com/apikey

Your `.env` file should look like this after editing:

```
GEMINI_API_KEY=AIzaSy...your_key_here...

MODEL_NAME_HEAVY=gemini-2.5-flash
MODEL_NAME_LIGHT=gemini-2.5-flash

LOG_LEVEL=INFO
MAX_LESSON_DURATION=240
LLM_MAX_RETRIES=2
RATE_LIMIT_RETRY_DELAY_SECONDS=65
PIPELINE_TIMEOUT_SECONDS=600
MAX_PDF_SIZE_MB=20
USER_INSTRUCTION_MAX_LENGTH=500
```

---

## Running the Server

### Step 5 — Start the server

```bash
uv run uvicorn app.main:app --reload
```

You will see:

```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Application startup complete.
```

The server is now running at:
- **API:** http://localhost:8000
- **Swagger UI (interactive docs):** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### Verify the server is running

Open a new terminal and run:

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{"status": "ok", "version": "0.1.0"}
```

---

## Testing the API

There are three ways to test:

### Option 1 — Swagger UI (Easiest — browser based)

1. Open http://localhost:8000/docs
2. Click any endpoint
3. Click **Try it out**
4. Fill in the input
5. Click **Execute**

### Option 2 — PowerShell script (All tests at once)

```powershell
.\tests\manual\regeneration_tests.ps1
```

Or run a single test:

```powershell
.\tests\manual\regeneration_tests.ps1 -Test 2
```

### Option 3 — Curl in terminal

See examples below for each endpoint.

---

## All Endpoints

### GET /health — Server status check

```powershell
curl http://localhost:8000/health
```

Response:
```json
{"status": "ok", "version": "0.1.0"}
```

---

### POST /generate — Generate lesson plan

#### Mode A — Topic only (no PDF)

Paste this in Swagger `/generate` → Try it out:

```json
{
  "grade": "7",
  "subject": "Science",
  "topic": "Photosynthesis",
  "duration": 45,
  "board": "CBSE",
  "teachingStyle": "Activity-based",
  "depth": "Standard"
}
```

**Wait:** 60–120 seconds (9 Gemini calls)

**Response:** Full lesson plan with all 9 sections.

---

#### Mode B — With chapter PDF text (boss's spec)

Node.js extracts text from PDF and sends it here as `chapterPdfText`.

Paste this in Swagger `/generate` → Try it out:

```json
{
  "grade": "7",
  "subject": "Science",
  "topic": "Nutrition in Plants",
  "duration": 45,
  "board": "CBSE",
  "teachingStyle": "Activity-based",
  "depth": "Standard",
  "chapterPdfText": "Chapter 1: Nutrition in Plants\n\nAll living organisms require food. Plants can synthesise food for themselves but animals including humans cannot.\n\n1.1 MODE OF NUTRITION IN PLANTS\nPlants are the only organisms that can prepare food for themselves by using water, carbon dioxide and minerals. The mode of nutrition in which organisms make food themselves from simple substances is called autotrophic nutrition. Plants are called autotrophs.\n\n1.2 PHOTOSYNTHESIS\nLeaves are the food factories of plants. The leaves have a green pigment called chlorophyll. Chlorophyll, sunlight, carbon dioxide and water are necessary to carry out photosynthesis.\n\nEquation: Carbon dioxide + Water + Sunlight = Carbohydrate + Oxygen\n6CO2 + 6H2O + light energy = C6H12O6 + O2\n\nActivity 1.1: Take two potted plants. Keep one in the dark for 72 hours and the other in sunlight. Perform iodine test on both leaves.\n\nExercises:\nQ1: Why do organisms take food?\nQ2: Distinguish between a parasite and a saprotroph.\nQ3: How would you test the presence of starch in leaves?\nQ4: Give a brief description of the process of synthesis of food in green plants.\nQ6(a): Green plants are called _______ since they synthesise their own food.\nQ6(c): In photosynthesis solar energy is absorbed by the pigment called _______.\nQ7(i): Name a parasitic plant with yellow, slender and branched stem.\nQ7(iii): Name the pores through which leaves exchange gases.\nQ11: Which part of the plant takes in carbon dioxide from the air for photosynthesis? (i) Root hair (ii) Stomata (iii) Leaf veins (iv) Petals"
}
```

**Wait:** 90–120 seconds (1 text extraction call + 9 node calls)

**Response:** Lesson plan grounded in the chapter — assessment uses Q1, Q2, Q3 from above.

For full NCERT chapter text test, use the ready-made file:
```
tests/manual/swagger_mode_b_text_input.json
```
Open it, copy all content, paste into Swagger.

---

### POST /generate-with-pdf — Generate with PDF file upload

This endpoint accepts the actual PDF file. Gemini reads it natively.

In Swagger:
1. Click `POST /generate-with-pdf`
2. Click **Try it out**
3. Fill each form field:

```
grade         →  7
subject       →  Science
topic         →  Photosynthesis
duration      →  45
board         →  CBSE
teachingStyle →  Activity-based
depth         →  Standard
pdf_file      →  Click "Choose File" → select your PDF
```

4. Click **Execute**

**Wait:** 3–5 minutes (PDF upload + chapter extraction + 9 nodes)

**PDF to use for testing:**
Download free NCERT chapter PDF from https://ncert.nic.in/textbook.php
- Class 7 → Science → Chapter 1

---

### POST /regenerate — Regenerate one section

Paste this in Swagger `/regenerate` → Try it out:

```json
{
  "regenerateSection": "activities.guidedPractice",
  "grade": "7",
  "subject": "Science",
  "topic": "Photosynthesis",
  "duration": 45,
  "board": "CBSE",
  "teachingStyle": "Activity-based",
  "depth": "Standard",
  "userInstruction": "make it more student-led, not teacher-driven",
  "chapterContext": null,
  "existingPlan": {
    "objectives": ["Define photosynthesis", "Explain chlorophyll role"],
    "prerequisites": ["Know plant cell structure"],
    "materials": ["NCERT textbook Ch.1", "Whiteboard"],
    "activities": {
      "intro": "Show a wilting plant and ask what it needs.",
      "instruction": "Draw the photosynthesis equation on the board.",
      "guidedPractice": "Teacher reads steps while students copy.",
      "independentPractice": "Label a blank chloroplast diagram.",
      "closure": "Exit ticket: name one reactant and one product."
    },
    "assessment": {
      "formative": "Thumbs up/down on three statements.",
      "summative": "Q1: Write the equation. Q2: Why are leaves green?"
    },
    "differentiation": {
      "slowLearners": "Provide a partially filled diagram.",
      "advancedLearners": "Research how C4 plants differ."
    },
    "homework": "Task 1: Draw and label the photosynthesis process.",
    "standards": ["CBSE Science Grade 7.LP-S1"],
    "timeBreakdown": {
      "intro": 5,
      "instruction": 15,
      "guidedPractice": 9,
      "independentPractice": 11,
      "closure": 5
    }
  }
}
```

**Wait:** 15–40 seconds (1 Gemini call)

**Response:** Only the regenerated field:
```json
{"guidedPractice": "In pairs, students receive a blank flow diagram..."}
```

**Valid values for regenerateSection:**
```
objectives, prerequisites, materials, activities, assessment,
differentiation, homework, standards, timeBreakdown,
activities.intro, activities.instruction, activities.guidedPractice,
activities.independentPractice, activities.closure,
assessment.formative, assessment.summative,
differentiation.slowLearners, differentiation.advancedLearners,
timeBreakdown.intro, timeBreakdown.instruction,
timeBreakdown.guidedPractice, timeBreakdown.independentPractice,
timeBreakdown.closure
```

---

## Running Tests

### Unit tests — no Gemini API needed, runs in under 5 seconds

```bash
uv run pytest tests/unit -v
```

Expected: **304 passed**

### Run a specific test file

```bash
uv run pytest tests/unit/test_regeneration.py -v
uv run pytest tests/unit/test_schemas.py -v
uv run pytest tests/unit/test_pipeline.py -v
uv run pytest tests/unit/test_chapter_text_extraction.py -v
```

---

## Project Structure

```
ai_lesson_planner/
│
├── app/                          Main application code
│   ├── main.py                   FastAPI app — all 4 endpoints
│   ├── config.py                 All settings loaded from .env
│   │
│   ├── graph/
│   │   ├── pipeline.py           LangGraph pipeline — run_pipeline, run_regen_pipeline
│   │   └── state.py              LessonPlanState — shared state across all nodes
│   │
│   ├── nodes/                    One file per generation step
│   │   ├── chapter_extraction.py Extracts chapter content from PDF (Mode B PDF)
│   │   ├── objectives.py         Generates learning objectives
│   │   ├── prerequisites.py      Identifies prior knowledge
│   │   ├── materials.py          Lists required materials
│   │   ├── activities.py         Generates 5 lesson phases
│   │   ├── assessments.py        Formative + summative assessment
│   │   ├── differentiation.py    Slow + advanced learner strategies
│   │   ├── homework.py           Homework tasks
│   │   ├── time_breakdown.py     Allocates minutes across phases
│   │   ├── standards.py          Board-specific curriculum standards
│   │   └── assemble.py           Builds final LessonPlan from all sections
│   │
│   ├── prompts/                  One .txt file per node (12 total)
│   │   ├── objectives.txt
│   │   ├── prerequisites.txt
│   │   ├── materials.txt
│   │   ├── activities.txt
│   │   ├── assessments.txt
│   │   ├── differentiation.txt
│   │   ├── homework.txt
│   │   ├── time_breakdown.txt
│   │   ├── standards.txt
│   │   ├── chapter_extraction.txt       For PDF file reading (Mode B PDF)
│   │   ├── chapter_extraction_text.txt  For raw text reading (Mode B text)
│   │   └── _regen_prefix.txt            For regeneration context
│   │
│   ├── schemas/
│   │   ├── inputs.py             GenerateRequest, RegenerateRequest
│   │   ├── outputs.py            LessonPlan
│   │   └── sections.py           All 9 section models + ChapterContext
│   │
│   ├── llm/
│   │   ├── client.py             Gemini API calls (text + multimodal)
│   │   └── retry.py              Retry logic on validation failure
│   │
│   ├── utils/
│   │   ├── prompt_loader.py      Load + safely format .txt prompts
│   │   ├── chapter_context.py    Build chapter grounding block
│   │   ├── pdf_uploader.py       Upload PDF to Gemini Files API
│   │   ├── text_chapter_extractor.py  Extract ChapterContext from raw text
│   │   └── regen_context.py      Build regeneration prefix
│   │
│   └── observability/
│       └── logging.py            Structured JSON logging
│
├── tests/
│   └── unit/                     All unit tests (no real API calls)
│       ├── test_schemas.py
│       ├── test_pipeline.py
│       ├── test_nodes.py
│       ├── test_regeneration.py
│       ├── test_s2_pdf_upload.py
│       ├── test_chapter_text_extraction.py
│       ├── test_llm_retry.py
│       ├── test_prompts.py
│       └── test_scaffold.py
│
├── tests/manual/
│   ├── swagger_mode_b_text_input.json   Ready-to-paste Swagger input (NCERT Chapter 1)
│   ├── regeneration_curl_tests.md       All curl test commands
│   └── regeneration_tests.ps1           PowerShell test script
│
├── tech-design-docs/
│   ├── API.md                    Full API reference
│   ├── ARCH.md                   Architecture diagrams
│   └── INFRA.md                  Environment variables reference
│
├── .env.example                  Template — copy to .env and add your key
├── pyproject.toml                Dependencies
└── README.md                     This file
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | **YES** | — | Google AI Studio API key |
| `MODEL_NAME_HEAVY` | no | `gemini-2.5-flash` | Model for complex nodes |
| `MODEL_NAME_LIGHT` | no | `gemini-2.5-flash` | Model for simple nodes |
| `LOG_LEVEL` | no | `INFO` | `DEBUG` / `INFO` / `WARNING` / `ERROR` |
| `MAX_LESSON_DURATION` | no | `240` | Max allowed lesson duration in minutes |
| `CHAPTER_TEXT_MIN_LENGTH` | no | `50` | Min characters for chapterPdfText |
| `CHAPTER_TEXT_MAX_LENGTH` | no | `50000` | Max characters for chapterPdfText |
| `MAX_PDF_SIZE_MB` | no | `20` | Max PDF file size in MB |
| `LLM_MAX_RETRIES` | no | `2` | Retry count per node on Gemini failure |
| `RATE_LIMIT_RETRY_DELAY_SECONDS` | no | `65` | Seconds to wait after rate limit error |
| `PIPELINE_TIMEOUT_SECONDS` | no | `600` | Max seconds for full pipeline |
| `USER_INSTRUCTION_MAX_LENGTH` | no | `500` | Max chars for userInstruction in /regenerate |
| `REQUEST_ID_LENGTH` | no | `12` | Length of request ID in logs |

---

## Troubleshooting

### Server does not start

```
Error: Python 3.11+ required
```
Check your Python version:
```bash
python --version
uv python list
```

---

### GEMINI_API_KEY error

```
ValueError: GEMINI_API_KEY is not set
```
Make sure your `.env` file has the key:
```
GEMINI_API_KEY=AIzaSy...
```
The `.env` file must be in the same folder as `pyproject.toml`.

---

### 429 Rate Limit error

```
google.genai.errors.ClientError: 429 RESOURCE_EXHAUSTED
```
This is normal on the free tier. The service automatically waits 65 seconds and retries. If it keeps happening, the pipeline will complete — just slower (3–5 minutes instead of 1–2 minutes).

---

### Module not found error

```
ModuleNotFoundError: No module named 'langgraph'
```
Run again:
```bash
uv sync
```

---

### Port already in use

```
ERROR: Address already in use
```
Kill the process on port 8000:
```powershell
# Windows
netstat -ano | findstr :8000
taskkill /PID <pid_number> /F
```

Then restart:
```bash
uv run uvicorn app.main:app --reload
```

---

### Test PDF too large (413 error)

The PDF size limit is 20 MB. Check your PDF size and use a smaller chapter.

---

## Quick Start Summary

```
1. cd ai_lesson_planner
2. uv sync
3. copy .env.example .env  →  add GEMINI_API_KEY
4. uv run uvicorn app.main:app --reload
5. Open http://localhost:8000/docs
6. Test POST /generate with the JSON examples above
```
