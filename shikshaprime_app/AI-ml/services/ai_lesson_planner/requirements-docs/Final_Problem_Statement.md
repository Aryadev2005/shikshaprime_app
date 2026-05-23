# Final Problem Statement

**Project:** AI Lesson Planner — AI Generation Layer
**Date:** 5 May 2026
**Status:** Final — approved for development
**Audience:** AI Developer, Tech Lead, Product Owner, Backend Team
**Source:** AI Lesson Planner — AI Service Requirements Document (with PDF Mode)

---

## 1. Project Overview

The AI Lesson Planner is a system that generates structured, classroom-ready lesson plans for school teachers. Teachers provide a topic (and optionally an extracted chapter PDF text), and the system returns a complete, standards-aligned lesson plan in a strict JSON format.

This document scopes the **AI generation layer only** — the component responsible for producing lesson plan content from inputs. All other layers (frontend, backend orchestration, PDF parsing, authentication, persistence) are out of scope for this document.

---

## 2. Problem Statement

Teachers spend significant time preparing lesson plans that are aligned to curriculum boards, age-appropriate, pedagogically sound, and grounded in chapter content. Existing solutions either produce generic content disconnected from the actual chapter or require teachers to manually structure every section.

We need an AI generation service that:

1. Accepts either a topic specification or a topic plus extracted chapter text from a textbook PDF.
2. Produces a complete lesson plan in a strict, validated JSON schema.
3. When chapter text is provided, stays grounded in that content rather than inventing examples.
4. Supports per-section regeneration so teachers can iteratively refine a plan without rebuilding it from scratch.
5. Operates as a multi-step pipeline where each generation stage is aware of all previously generated content, ensuring internal consistency across the lesson plan.

---

## 3. Scope

### 3.1 In Scope

- Topic-based lesson plan generation (Mode A).
- Chapter-based lesson plan generation using extracted PDF text (Mode B).
- Section-wise prompt templates for 9 generation stages.
- Multi-step generation pipeline with context passing between stages.
- Per-section regeneration logic.
- Strict JSON-only outputs conforming to the defined schema.
- Chapter-aware content extraction for grounded generation.
- Board-specific standards generation.
- Time breakdown generation.

### 3.2 Out of Scope

- PDF parsing and text extraction (handled outside the AI layer; the service receives the extracted text as a string).
- Frontend UI and teacher-facing interactions.
- Authentication, authorization, and user management.
- Database persistence of lesson plans.
- Validation of generated standards against an authoritative curriculum database (the backend performs this validation).
- File uploads, storage, and retrieval.
- Billing, rate limiting, and quota management.

---

## 4. Functional Requirements

### 4.1 Input Modes

The AI service must support two distinct input modes:

**Mode A — Topic-Based (No PDF)**

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

**Mode B — Chapter-Based (PDF Included)**

Mode A inputs plus:

```json
{
  "chapterPdfText": "<extracted text from PDF>"
}
```

The AI service receives the extracted chapter text as a string. It does not handle the PDF file directly.

### 4.2 Output Schema

The AI service must always return strict JSON in the following exact structure:

```json
{
  "objectives": [],
  "prerequisites": [],
  "materials": [],
  "activities": {
    "intro": "",
    "instruction": "",
    "guidedPractice": "",
    "independentPractice": "",
    "closure": ""
  },
  "assessment": {
    "formative": "",
    "summative": ""
  },
  "differentiation": {
    "slowLearners": "",
    "advancedLearners": ""
  },
  "homework": "",
  "standards": [],
  "timeBreakdown": {}
}
```

**Output rules:**

- Must be valid JSON.
- Must follow the exact schema (no fields added or removed).
- Must not include explanations, prose, markdown, comments, or any natural language outside the JSON.

### 4.3 Generation Tasks

The AI must generate content for nine sections, each with mode-specific behavior:

| # | Section | Topic Mode Behavior | PDF Mode Additional Behavior |
|---|---|---|---|
| 1 | Learning Objectives | Use Bloom's measurable verbs; align with grade, subject, topic, board | Extract objectives from chapter content |
| 2 | Prerequisites | Define prior knowledge required | Infer prerequisites from chapter introduction |
| 3 | Materials Required | Teaching aids, digital resources, classroom materials | Extract materials mentioned in chapter |
| 4 | Activities (5 sub-sections) | `intro`, `instruction`, `guidedPractice`, `independentPractice`, `closure` | Activities follow chapter flow; use chapter examples, diagrams, explanations |
| 5 | Assessment | Formative + summative | Use chapter exercises, questions, examples |
| 6 | Differentiation | Strategies for `slowLearners` and `advancedLearners` | Adapt based on chapter difficulty |
| 7 | Homework | Reinforces topic | Use end-of-chapter exercises and practice questions |
| 8 | Standards | Board-specific learning outcomes; competency-based statements (backend validates) | Same |
| 9 | Time Breakdown | Sums to total `duration` from input | Same |

### 4.4 PDF-Based Generation Rules

When `chapterPdfText` is provided, the AI must:

**Extract from the chapter:**

- Key concepts
- Definitions
- Important explanations
- Examples
- Exercises
- Learning flow
- Subtopics
- Diagrams (text descriptions only)

**Use the extracted content to build:**

- Objectives
- Activities
- Assessments
- Homework
- Materials list
- Differentiation strategies

**Strict prohibitions in PDF mode:**

- Must NOT invent content not present in the chapter.
- Must NOT hallucinate facts.
- Must NOT add external examples unless absolutely necessary.

### 4.5 Multi-Step Pipeline with Context Passing

The AI must run as a 9-stage pipeline. Each stage is a separate prompt call but receives the original user inputs plus the accumulated outputs of all previous stages, ensuring internal consistency across the plan.

**Stage dependencies:**

| Stage | Receives |
|---|---|
| 1. Objectives | User inputs |
| 2. Prerequisites | User inputs + objectives |
| 3. Materials | User inputs + objectives + prerequisites |
| 4. Activities | User inputs + objectives + prerequisites + materials |
| 5. Assessments | User inputs + objectives + activities |
| 6. Differentiation | User inputs + objectives + activities + assessments |
| 7. Homework | User inputs + objectives + activities + assessments + differentiation |
| 8. Time Breakdown | User inputs + activities |
| 9. Standards | User inputs + objectives + activities + assessments |
| 10. Assemble | All outputs combined into the final JSON schema |

**Context object:**

The backend maintains a single growing context object that mirrors the final output schema plus the input fields. After each stage, the new output is merged into this context. Every stage receives the full context object as input.

```json
{
  "grade": "7",
  "subject": "Science",
  "topic": "Photosynthesis",
  "duration": 45,
  "board": "CBSE",
  "teachingStyle": "Activity-based",
  "depth": "Standard",
  "chapterPdfText": "...",
  "objectives": [...],
  "prerequisites": [...],
  "materials": [...],
  "activities": {...},
  "assessment": {...},
  "differentiation": {...},
  "homework": "...",
  "timeBreakdown": {...},
  "standards": [...]
}
```

### 4.6 Regeneration Requirements

When the input includes a `regenerateSection` field plus an `existingPlan`, the service must regenerate only that section.

**Input shape:**

```json
{
  "regenerateSection": "activities.guidedPractice",
  "existingPlan": { ... }
}
```

**Behavior:**

- Regenerate only the specified section.
- Use the existing plan as context for consistency.
- Use `chapterPdfText` if provided.
- Return JSON containing only the regenerated section.

**Example output:**

```json
{
  "guidedPractice": "..."
}
```

---

## 5. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Output format** | 100% strict JSON; no prose, markdown, comments, or extra fields permitted under any circumstances. |
| **Schema fidelity** | The output schema is fixed. No new fields. No removed fields. |
| **Internal consistency** | All sections within a single plan must be logically consistent (objectives ↔ activities ↔ assessments ↔ standards). |
| **Grounding (PDF mode)** | Generated content must be traceable to the provided chapter text; minimal external content. |
| **Time breakdown integrity** | The sum of `timeBreakdown` values must equal the `duration` from input. |
| **Language** | Grade-appropriate language for the specified grade. |
| **Reliability** | Each stage must produce valid JSON conforming to its sub-schema; failures must be retried before failing the pipeline. |

---

## 6. Constraints and Rules

### 6.1 The AI Must

- Always output JSON.
- Follow the exact schema.
- Use grade-appropriate language.
- Align content with subject and topic.
- Use measurable verbs (Bloom's taxonomy) for objectives.
- Ensure internal consistency across all sections.
- Use chapter content when provided.

### 6.2 The AI Must Not

- Output markdown.
- Include explanations or commentary.
- Add or remove fields from the schema.
- Hallucinate standards.
- Include any prose outside the JSON.
- Invent chapter content that is not in `chapterPdfText` (when in PDF mode).

---

## 7. Tech Stack

| Component | Choice |
|---|---|
| Programming language | Python |
| Orchestration framework | LangGraph (one node per generation stage) |
| Output validation | Pydantic models per section |
| LLM provider | Anthropic / OpenAI (TBD; configurable per node) |

The architectural decision to use a LangGraph linear sequential pipeline is documented in the **Solution Decision Document** (Approach 2), with a planned post-MVP migration to a parallel DAG (Approach 3) once production performance data is available.

---

## 8. Success Criteria

The AI generation layer is considered complete and production-ready when:

1. **Schema compliance** — 100% of generated outputs validate against the defined JSON schema across a test suite of at least 50 representative input cases (mix of Mode A and Mode B).
2. **Mode A correctness** — Topic-based generations produce pedagogically sound, grade-appropriate, board-aligned plans for at least 5 grade levels and 5 subjects.
3. **Mode B grounding** — In PDF mode, at least 90% of factual content (examples, definitions, exercises) in the generated plan is traceable to the provided chapter text.
4. **Time breakdown accuracy** — `sum(timeBreakdown.values()) == duration` in 100% of outputs.
5. **Regeneration** — Per-section regeneration works for every regenerable field listed in the schema, returns only the requested section, and remains consistent with the rest of the existing plan.
6. **Pipeline reliability** — Less than 2% pipeline-level failure rate after retry logic.
7. **Latency** — Median end-to-end generation latency under 60 seconds for Mode A and under 90 seconds for Mode B (acceptable for MVP; to be tightened post-launch).

---

## 9. Assumptions

- The PDF parser upstream of this service produces clean, readable text. If parsing quality degrades, generation quality will degrade proportionally.
- The list of supported boards (CBSE, ICSE, etc.) and their valid standards/competencies will be maintained in a curated reference list available to the standards stage.
- LLM provider rate limits and pricing remain stable enough to support the per-request cost of running 9 sequential calls.
- The backend will handle schema validation of standards against an authoritative source.
- "Grade", "subject", and "topic" inputs are validated upstream — the AI service receives well-formed strings.

---

## 10. Open Questions

The following items should be resolved before or during early implementation:

1. **LLM provider selection** — Anthropic vs OpenAI vs both (with provider abstraction)? Cost vs quality tradeoff to be measured.
2. **Standards reference data** — Where is the curated list of valid board standards stored, and how does the standards stage access it?
3. **Chapter context size limits** — What is the maximum expected size of `chapterPdfText`? Need this to size the chapter-extraction preprocessing step.
4. **Streaming** — Should the API stream partial section outputs back to the frontend as each stage completes, or only return the final assembled JSON?
5. **Caching policy** — Are identical inputs allowed to return cached outputs, or must every request generate fresh content?
6. **Localization** — Is multi-language generation in scope (e.g. Hindi, regional languages), or English-only for MVP?

---

## 11. Deliverables

The AI developer must implement and deliver:

- Topic-based generation (Mode A).
- PDF-based generation (Mode B).
- Section-wise prompt templates (one per stage).
- Multi-step LangGraph pipeline with context passing.
- Per-section regeneration logic.
- Strict JSON-only outputs validated by Pydantic.
- Chapter-aware content extraction (preprocessing step for Mode B).
- Standards generation stage.
- Time breakdown generation stage.
- Unit tests for each stage.
- Integration tests covering Mode A, Mode B, and regeneration flows.

---

## 12. Related Documents

- **Solution Decision Document** — Architectural decision (Approach 2: LangGraph Linear Sequential Pipeline) with alternatives considered, justification, risk register, and post-MVP migration plan to Approach 3.
- **AI Service Requirements Document (source PDF)** — Original detailed specification from which this problem statement is derived.

---

*This problem statement is the authoritative scope reference for the AI generation layer. Any change in scope, inputs, outputs, or rules must be reflected here and re-approved.*
