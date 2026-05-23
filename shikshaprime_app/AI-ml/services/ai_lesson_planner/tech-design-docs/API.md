# AI Lesson Planner — API Reference

## Endpoint Summary

| Method | Path | Status | Description |
|--------|------|--------|-------------|
| `GET` | `/health` | ✅ Live | Liveness check |
| `POST` | `/generate` | ✅ Live | Full lesson plan — Mode A (topic only) OR Mode B text (topic + `chapterPdfText` string) |
| `POST` | `/generate-with-pdf` | ✅ Live (S2) | Full lesson plan — Mode B PDF (topic + chapter PDF file, Gemini native reading) |
| `POST` | `/regenerate` | ✅ Live (S3) | Regenerate a single section of an existing plan |

---

## GET /health

**Controller:** `app/main.py` → `health()`

**Response 200:**
```json
{"status": "ok", "version": "0.1.0"}
```

---

## POST /generate *(Mode A — topic only | Mode B text — topic + chapter text)*

**Controller:** `app/main.py` → `generate(req: GenerateRequest)`  
**Schema:** `app/schemas/inputs.py` → `GenerateRequest`  
**Content-Type:** `application/json`

This endpoint handles **both** modes defined in the boss's requirements document:

| Mode | `chapterPdfText` | Behaviour |
|------|-----------------|-----------|
| **Mode A** (topic-only) | omitted / `null` | AI uses general knowledge |
| **Mode B text** (chapter-grounded) | provided as string | AI extracts chapter structure via Gemini, then generates grounded lesson plan |

The Node.js backend extracts text from the PDF and sends it as `chapterPdfText`.
The AI service never receives the PDF file directly — text extraction is the Node.js layer's responsibility.

### Request Body — Mode A
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

### Request Body — Mode B text
```json
{
  "grade": "7",
  "subject": "Science",
  "topic": "Photosynthesis",
  "duration": 45,
  "board": "CBSE",
  "teachingStyle": "Activity-based",
  "depth": "Standard",
  "chapterPdfText": "<full chapter text extracted by Node.js from the PDF>"
}
```

**`chapterPdfText` constraints:** min 50 chars, max 50,000 chars.

### How Mode B text works internally
1. `run_pipeline()` detects `chapterPdfText` is present
2. Calls `extract_chapter_from_text()` → sends text to Gemini → returns `ChapterContext` dict
3. `ChapterContext` is stored in `state["chapterContext"]` before the main pipeline runs
4. All 9 generation nodes use `build_chapter_block(state["chapterContext"])` for grounding
5. Activities reference chapter examples, assessments use chapter exercises, homework uses chapter questions

### Response 200 — `LessonPlan`
```json
{
  "objectives": ["Define photosynthesis as ...", "..."],
  "prerequisites": ["Know that plants need sunlight ...", "..."],
  "materials": ["NCERT Grade 7 Science textbook Chapter 1 ...", "..."],
  "activities": {
    "intro": "...",
    "instruction": "...",
    "guidedPractice": "...",
    "independentPractice": "...",
    "closure": "..."
  },
  "assessment": {
    "formative": "...",
    "summative": "..."
  },
  "differentiation": {
    "slowLearners": "...",
    "advancedLearners": "..."
  },
  "homework": "...",
  "standards": ["CBSE Science Grade 7.Life Processes.LP-S1: ...", "..."],
  "timeBreakdown": {
    "intro": 5,
    "instruction": 15,
    "guidedPractice": 10,
    "independentPractice": 10,
    "closure": 5
  }
}
```

### Error Responses
| Code | Condition |
|------|-----------|
| 422 | Request validation failure (missing field, duration > MAX_LESSON_DURATION, etc.) |
| 502 | LLM generation failed after all retries |
| 503 | Gemini API unavailable or GEMINI_API_KEY not set |

---

## POST /generate-with-pdf *(Mode B — Gemini native PDF, S2)*

**Controller:** `app/main.py` → `generate_with_pdf(...)`  
**Content-Type:** `multipart/form-data`

Accepts a chapter PDF file alongside the standard lesson plan fields. The PDF is uploaded to Gemini Files API once, then the `chapter_extraction` node reads it natively (text, tables, diagrams, equations) and produces a compact `chapterContext` that all 9 generation nodes use for grounded output. The full PDF is **never** sent again after the extraction step.

### Form Fields

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `grade` | string | ✅ | max 100 chars | Grade level, e.g. `"7"`, `"10"` |
| `subject` | string | ✅ | max 200 chars | Subject name, e.g. `"Science"` |
| `topic` | string | ✅ | max 500 chars | Lesson topic, e.g. `"Photosynthesis"` |
| `duration` | integer | ✅ | 1–MAX_LESSON_DURATION | Lesson duration in minutes |
| `board` | string | ✅ | max 50 chars | Curriculum board: CBSE, ICSE, State, IB |
| `teachingStyle` | string | ✅ | max 200 chars | e.g. `"Activity-based"`, `"Lecture-based"` |
| `depth` | string | ✅ | `Basic` \| `Standard` \| `Advanced` | Depth level |
| `pdf_file` | file | ✅ | ≤ MAX_PDF_SIZE_MB MB, `application/pdf` | Chapter PDF |

### cURL Example
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

### Response 200 — `LessonPlan`
Same schema as `POST /generate`. All sections are grounded in the chapter content — objectives use chapter terms, activities follow the chapter's learning flow, summative assessment uses actual chapter exercises.

### Error Responses
| Code | Condition |
|------|-----------|
| 413 | PDF exceeds MAX_PDF_SIZE_MB |
| 422 | Invalid field value (depth not in allowed set, duration out of range) |
| 502 | LLM generation failed after all retries |
| 503 | Gemini API unavailable, GEMINI_API_KEY not set, or PDF upload failed |

---

## POST /regenerate *(S3 — regenerate one section)*

**Controller:** `app/main.py` → `regenerate(req: RegenerateRequest)`  
**Schema:** `app/schemas/inputs.py` → `RegenerateRequest`  
**Content-Type:** `application/json`

Regenerates a single section of an existing lesson plan. The `_regen_prefix` is
prepended to the target node's base prompt so the LLM produces a different version
that stays consistent with all other sections.

### Request Body
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
  "existingPlan": {
    "objectives": ["..."],
    "prerequisites": ["..."],
    "materials": ["..."],
    "activities": { "intro": "...", "instruction": "...", "guidedPractice": "...", "independentPractice": "...", "closure": "..." },
    "assessment": { "formative": "...", "summative": "..." },
    "differentiation": { "slowLearners": "...", "advancedLearners": "..." },
    "homework": "...",
    "standards": ["..."],
    "timeBreakdown": { "intro": 5, "instruction": 15, "guidedPractice": 9, "independentPractice": 11, "closure": 5 }
  },
  "chapterPdfText": null,
  "userInstruction": "Make the guided practice more student-led, not teacher-driven"
}
```

**`userInstruction`** (optional, max `USER_INSTRUCTION_MAX_LENGTH` chars): Free-text from the teacher
explaining *why* they want a different version and *what* they specifically want.
Examples:
- `"Use MCQ questions not written answers"`
- `"Make the guided practice student-led"`
- `"Objectives need to be simpler — this is a Basic depth lesson"`

When provided, it is injected as the **highest-priority constraint** in the `_regen_prefix` prompt.
When absent, the AI regenerates freely (different but consistent with existing sections).

**`regenerateSection` allow-list** (validated by Pydantic `field_validator`):

Top-level sections: `objectives` | `prerequisites` | `materials` | `activities` |
`assessment` | `differentiation` | `homework` | `standards` | `timeBreakdown`

Sub-field examples: `activities.intro` | `activities.guidedPractice` |
`activities.independentPractice` | `activities.closure` | `assessment.formative` |
`assessment.summative` | `differentiation.slowLearners` | `differentiation.advancedLearners` |
`timeBreakdown.intro` | `timeBreakdown.closure`

### Response 200
Returns **only** the regenerated field — not the full plan. The frontend patches its local copy:

```json
{"guidedPractice": "<new generated text>"}
```

For top-level sections:
```json
{"objectives": ["New objective using Bloom verb", "..."]}
```

### Error Responses
| Code | Condition |
|------|-----------|
| 422 | `regenerateSection` not in allow-list, missing required field, invalid depth/duration |
| 502 | LLM generation failed after all retries, or pipeline timeout |
| 503 | Gemini API unavailable or `GEMINI_API_KEY` not set |
