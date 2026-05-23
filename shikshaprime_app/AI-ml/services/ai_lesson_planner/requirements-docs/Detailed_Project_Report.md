# Detailed Project Report (DPR)

**Project:** AI Lesson Planner — AI Generation Layer
**Date:** 5 May 2026
**Deadline:** 22 May 2026 (17 calendar days / ~12 working days)
**Team Size:** 1 (solo developer)
**Tech Stack:** Python 3.11+, `uv` (package & project manager), LangGraph, Pydantic v2, FastAPI, Google Gemini (`google-genai` SDK), Docker
**Selected Architecture:** Approach 2 — LangGraph Linear Sequential Pipeline (per Solution Decision Document)
**Status:** Approved for execution

---

## 1. Executive Summary

This DPR is the execution plan for delivering the AI generation layer of the AI Lesson Planner by 22 May 2026. It translates the Final Problem Statement and the Solution Decision Document into a concrete day-by-day build plan, a pragmatic TDD strategy suited to a single developer, and a minimum-viable deployment strategy.

**The plan is deliberately scoped for one developer.** Standard enterprise practices (full CI matrix, exhaustive unit tests, multi-environment promotion, observability stack) are explicitly deferred or simplified. The MVP target is a working, validated, containerized AI service exposed via a FastAPI HTTP endpoint — not a production-grade platform.

**Why this tech stack:** `uv` is used as the Python package manager because it gives us a real lockfile (`uv.lock`) and ~10–100× faster installs than pip — which matters both for local iteration speed on a tight timeline and for fast Docker builds. **Google Gemini** is used as the LLM because its `google-genai` SDK supports passing Pydantic models directly as `response_schema` for structured output, which is a near-perfect fit for this project where every node already has a Pydantic model defined. The split between `gemini-2.5-pro` (heavy nodes) and `gemini-2.5-flash` (light nodes) is the cost-control lever discussed in the Solution Decision Document.

---

## 2. Inputs to This DPR

| Input | Source |
|---|---|
| Final Problem Statement | `Final_Problem_Statement.md` |
| Selected solution architecture | `Solution_Decision_Document.md` (Approach 2) |
| Tech stack | Python (managed with `uv`), LangGraph, Pydantic, Gemini |
| Team size | 1 |
| Timeline | 17 calendar days (5 May – 22 May 2026) |

---

## 3. What Will Be Built — Feature Specifications (SDD)

The deliverable is a Python service exposing two HTTP endpoints. Each feature below is specified with inputs, outputs, behavior, and acceptance criteria.

### F1 — Full Lesson Plan Generation (Mode A: Topic-only)

**Endpoint:** `POST /generate`
**Input:** Mode A JSON (grade, subject, topic, duration, board, teachingStyle, depth)
**Output:** Full lesson plan JSON conforming to schema in section 2.1 of source spec
**Behavior:** Runs the 9-stage LangGraph pipeline sequentially, accumulating context after each stage, and returns the assembled JSON.
**Acceptance:**
- Output validates against the full Pydantic schema.
- All 9 sections are present and non-empty.
- `sum(timeBreakdown.values()) == duration` from input.
- No prose, markdown, or extra fields in the response.

### F2 — Full Lesson Plan Generation (Mode B: With chapter PDF text)

**Endpoint:** `POST /generate` (same endpoint; presence of `chapterPdfText` triggers Mode B)
**Input:** Mode A inputs + `chapterPdfText`
**Output:** Same schema as F1
**Behavior:** Runs an initial `chapter_extraction` node that produces a structured `chapterContext`, then runs the 9 stages with that context available. Generated content stays grounded in the chapter.
**Acceptance:**
- All F1 acceptance criteria.
- Manual spot-check on 3 sample chapters: at least 90% of factual content (definitions, examples, exercises) traceable to the input text.
- No invented chapter facts on inspection.

### Architecture Note — How One Endpoint Handles Both Modes

A natural question on review: *should Mode A and Mode B be separate endpoints?* **No** — they share `POST /generate`. Mode is a property of the **request payload**, not of the URL. Both modes return the same `LessonPlan` response schema, so splitting the endpoint would add complexity without benefit and force the client to know which URL to call.

Mode handling is split cleanly across three layers, each with one responsibility:

**Layer 1 — Pydantic input model (validation).** `chapterPdfText` is declared `Optional[str]`. Pydantic auto-validates the incoming JSON before any business logic runs: present → Mode B, absent or `null` → Mode A. Malformed payloads return HTTP 422 automatically.

```python
class GenerateRequest(BaseModel):
    grade: str
    subject: str
    topic: str
    duration: int = Field(gt=0, le=240)
    board: Literal["CBSE", "ICSE", "State", "IB"]
    teachingStyle: str
    depth: Literal["Basic", "Standard", "Advanced"]
    chapterPdfText: Optional[str] = Field(default=None, min_length=50)
```

**Layer 2 — FastAPI endpoint (dumb pass-through).** The endpoint validates and hands off. No `if mode == ...` branching at the HTTP layer.

```python
@app.post("/generate", response_model=LessonPlan)
async def generate(req: GenerateRequest) -> LessonPlan:
    return await run_pipeline(req)
```

**Layer 3 — LangGraph conditional entry edge (routing).** The graph chooses the path based on whether `chapterPdfText` is in state. Mode B routes through `chapter_extraction` first; Mode A skips straight to `objectives`. Both paths converge on the same downstream chain.

```python
def route_entry(state: LessonPlanState) -> str:
    return "chapter_extraction" if state.get("chapterPdfText") else "objectives"

g.add_conditional_edges(START, route_entry, {
    "chapter_extraction": "chapter_extraction",
    "objectives": "objectives",
})
g.add_edge("chapter_extraction", "objectives")  # Mode B rejoins the main chain
```

**Request flow comparison:**

| | Mode A (no PDF) | Mode B (with PDF) |
|---|---|---|
| Client sends | `{grade, subject, topic, duration, ...}` | Mode A fields **+** `chapterPdfText` |
| HTTP endpoint | `POST /generate` | `POST /generate` (same) |
| Graph entry | → `objectives` | → `chapter_extraction` → `objectives` |
| Downstream chain | identical 8-stage chain | identical 8-stage chain |
| Response | `LessonPlan` JSON | `LessonPlan` JSON (same shape) |

**Node-level rule:** Inside each generation node, the branching reduces to a single check — `state.get("chapterContext")`. If present, the node grounds its output in the extracted chapter content; if not, it generates from user inputs alone. **No node knows or cares about the label "Mode A" or "Mode B"** — nodes only react to the data in state. This keeps every node uniform and means adding a third input source later (e.g. a video transcript or a teacher's handwritten notes) is a one-node addition, not a service rewrite.

**Why this is the correct design:**
- The endpoint is dumb (validates and delegates).
- The graph is smart (routes based on data).
- The nodes are uniform (one rule, no mode-awareness).
- The client API stays simple (one URL, optional field).
- Adding new input modes is additive, not disruptive.

### F3 — Per-Section Regeneration

**Endpoint:** `POST /regenerate`
**Input:** `regenerateSection` (e.g. `"activities.guidedPractice"`) + `existingPlan` + (optional) `chapterPdfText`
**Output:** JSON containing only the regenerated section
**Behavior:** Conditional graph routing executes only the requested node, using `existingPlan` as read-only context. The `assemble` step extracts and returns only the regenerated field.
**Acceptance:**
- Returns only the specified section in the output JSON.
- Regenerated section is internally consistent with unchanged sections of `existingPlan`.
- Works for all 9 top-level sections and for nested fields under `activities`, `assessment`, `differentiation`.

### F4 — Strict Schema Validation

**Behavior:** Every node validates its own output via a Pydantic sub-model before writing to state. On validation failure, retry up to 2 times, injecting the validation error into the retry prompt. After 2 failures, raise a structured error.
**Acceptance:**
- 100% of successful pipeline runs produce schema-valid JSON.
- Validation failure paths are unit-tested with deliberately malformed mock LLM responses.

### F5 — Health & Readiness Endpoint

**Endpoint:** `GET /health`
**Output:** `{"status": "ok", "version": "<git-sha>"}`
**Acceptance:** Returns 200 within 100ms.

### F6 — API Documentation

**Behavior:** FastAPI auto-generates OpenAPI docs at `/docs`.
**Acceptance:** All endpoints documented with example request/response payloads.

---

## 4. Work Breakdown Structure (WBS)

The 17-day calendar is broken into 5 phases. Buffer days are **non-negotiable** — they exist because something always slips.

### Phase 0 — Setup & Scaffolding (Days 1–2: 5–6 May)

- Install `uv` if not already present: `curl -LsSf https://astral.sh/uv/install.sh | sh` (macOS/Linux) or `pip install uv` as a fallback.
- Initialize the project: `uv init ai-lesson-planner && cd ai-lesson-planner`. This creates `pyproject.toml`.
- Repo structure: `app/`, `app/nodes/`, `app/prompts/`, `app/schemas/`, `app/graph/`, `tests/`.
- Add runtime dependencies: `uv add langgraph pydantic fastapi uvicorn google-genai python-dotenv`.
- Add dev dependencies: `uv add --dev pytest pytest-asyncio`.
- This produces `pyproject.toml` and `uv.lock` — **commit both** for reproducible builds.
- `.env` handling for `GEMINI_API_KEY`. `.env.example` committed; `.env` in `.gitignore`.
- Skeleton FastAPI app with `/health` endpoint.
- Skeleton LangGraph `StateGraph` with placeholder nodes and a passing end-to-end "echo" test.
- README with setup instructions: install `uv` → `uv sync` → `uv run uvicorn app.main:app`.

**Exit criterion:** `uv run uvicorn app.main:app --reload` starts the service locally; `/health` returns 200; `uv run pytest` passes (even with one trivial test).

### Phase 1 — Schemas, State, and Prompt Infrastructure (Days 3–4: 7–8 May)

- Pydantic models for every section: `Objectives`, `Prerequisites`, `Materials`, `Activities`, `Assessment`, `Differentiation`, `Homework`, `Standards`, `TimeBreakdown`, and the top-level `LessonPlan`.
- `LessonPlanState` TypedDict mirroring the schema plus input fields plus optional `chapterContext` and `regenerateSection`.
- Gemini client wrapper using the `google-genai` SDK. Use Gemini's native structured-output mode by passing `response_mime_type="application/json"` and `response_schema=PydanticModel` directly in the generation config — this returns parsed Pydantic objects and eliminates manual JSON parsing for most cases. Wrap in a retry helper (max 2 retries on Pydantic validation failure or transient API errors).
- Per-node model configuration: `gemini-2.5-pro` for heavy nodes (`activities`, `assessments`, `chapter_extraction`); `gemini-2.5-flash` for lightweight nodes (`prerequisites`, `time_breakdown`, `homework`). Configurable per node via env vars or a small config dict.
- Prompt template loader reading from `app/prompts/*.txt` files (versioned, easy to tweak without code changes).
- Unit tests for: schema validation (valid + invalid samples), retry helper (mock LLM failing once then succeeding).

**Exit criterion:** All Pydantic models pass round-trip tests with realistic example data.

### Phase 2 — Node Implementation (Days 5–10: 9–14 May)

Six days, nine nodes plus chapter extraction. Average ~1 day per heavyweight node, half a day for lighter ones. Order matches the dependency chain so each new node has working upstream context.

| Day | Node(s) Implemented | Notes |
|---|---|---|
| Day 5 (9 May) | `chapter_extraction`, `objectives` | Chapter extraction is reused by all PDF-mode nodes — must be solid. |
| Day 6 (10 May) | `prerequisites`, `materials` | Lightweight; can fit two in a day. |
| Day 7 (11 May) | `activities` | Heaviest node; 5 sub-fields. Dedicate full day. |
| Day 8 (12 May) | `assessments`, `differentiation` | Medium weight each. |
| Day 9 (13 May) | `homework`, `time_breakdown`, `standards` | Time breakdown needs sum-to-duration validation. Standards needs grounded prompt. |
| Day 10 (14 May) | `assemble` + full pipeline integration | Wire all nodes into the StateGraph. End-to-end Mode A run. |

For each node, the standard checklist:
1. Write the prompt template in `app/prompts/<node>.txt`.
2. Write the Pydantic model (if not already in Phase 1).
3. Write the node function.
4. Write at least one unit test with a mocked LLM response.
5. Write at least one happy-path integration test calling Gemini directly (optional — guard with env flag to avoid API costs in CI).

**Exit criterion (Day 10):** End-to-end Mode A request returns a fully valid lesson plan JSON.

### Phase 3 — Mode B and Regeneration (Days 11–13: 15–17 May)

- Day 11: PDF mode end-to-end. Verify chapter grounding manually on 3 sample chapters.
- Day 12: Regeneration routing. Conditional edge from START. `assemble` partial-output mode. Test regeneration for each top-level section + nested `activities.guidedPractice`.
- Day 13: Edge cases — empty inputs, very long `chapterPdfText`, invalid `regenerateSection` values, time-breakdown mismatch handling.

**Exit criterion (Day 13):** Both endpoints work for all input shapes; regeneration returns only the requested section.

### Phase 4 — Hardening, Tests, and Deployment (Days 14–16: 18–20 May)

- Day 14: Integration test suite covering the 5 acceptance scenarios (see Section 5.3). Fix bugs found.
- Day 15: Dockerfile, container build, smoke test in container. Deploy script for chosen target.
- Day 16: First deployment to staging. End-to-end smoke test against deployed service.

**Exit criterion (Day 16):** Service is reachable on a public URL and passes all acceptance tests when called over HTTP.

### Phase 5 — Buffer & Handover (Day 17: 21–22 May)

- Final bug-bash.
- Update README with deployment URL, example curl commands, environment variable list.
- Demo-ready checklist.

**This buffer is reserved. Do not pre-spend it.**

### Calendar Summary

```
Day  Date    Phase                            Output
1-2  5-6 May  Setup & Scaffolding             Repo + skeleton service
3-4  7-8 May  Schemas + Infra                 Pydantic models + LLM client
5    9 May    chapter_extraction, objectives
6    10 May   prerequisites, materials
7    11 May   activities                       Heaviest node — full day
8    12 May   assessments, differentiation
9    13 May   homework, time_breakdown, standards
10   14 May   assemble + integration           First end-to-end Mode A success
11   15 May   Mode B (PDF grounding)
12   16 May   Regeneration
13   17 May   Edge cases
14   18 May   Integration test suite
15   19 May   Docker + deploy script
16   20 May   First staging deploy + smoke
17   21-22    Buffer / final fixes / handover
```

---

## 5. Test-Driven Development Plan

Pragmatic TDD for a solo developer. **Goal: high confidence, not high coverage.** Three layers:

### 5.1 Unit Tests (run on every commit)

- Pydantic models: valid input passes, invalid input raises clear errors.
- LLM client retry helper: succeeds first try / succeeds on retry / fails after max retries.
- Prompt loader: loads correctly, errors loudly on missing files.
- Each node: with a mocked LLM response, produces correct state mutation.
- `assemble` node: assembles partial state correctly in both full-generation and regeneration modes.
- Time-breakdown validator: rejects breakdowns that don't sum to duration.

**Target:** ~30–40 unit tests by end of project. Run in <5 seconds.

### 5.2 Integration Tests (run before deploy, optional in CI due to LLM cost)

Tests that hit the real LLM. Run with `pytest -m integration`. Skipped by default.

- I1: Mode A end-to-end → schema-valid output, all 9 sections populated.
- I2: Mode B end-to-end with sample chapter → schema-valid + grounded.
- I3: Regeneration of `activities.guidedPractice` → returns only that field, consistent with rest of plan.
- I4: Regeneration of `objectives` (top-level array) → returns only `objectives` array.
- I5: Time-breakdown sums correctly to input `duration` for 3 different durations (30, 45, 60 min).

### 5.3 Acceptance Test Cases (manual verification, 5 fixed cases)

Run before declaring "done." These are written as concrete `curl` commands with expected output checks.

| ID | Scenario | Pass Condition |
|---|---|---|
| A1 | Mode A: Grade 7 Science, Photosynthesis, 45 min, CBSE | All 9 sections present; objectives use Bloom verbs; time sums to 45 |
| A2 | Mode A: Grade 10 Math, Quadratic Equations, 60 min, ICSE | Schema valid; standards reference ICSE outcomes |
| A3 | Mode B: Photosynthesis with NCERT Class 7 chapter text | Examples in plan match chapter; no invented diagrams |
| A4 | Regeneration: F1 output → regenerate `activities.guidedPractice` | Output contains only `guidedPractice` key; new content is consistent with unchanged `objectives` and `assessment` |
| A5 | Edge: very short chapter text (<200 words) | Service does not crash; produces best-effort plan with grounded content |

### 5.4 What is Explicitly NOT in the Test Plan

To stay within timeline:
- Load testing / concurrency testing (deferred to post-MVP).
- Property-based or fuzz testing.
- Multi-language input testing (English only for MVP).
- Adversarial prompt-injection testing (deferred).

---

## 6. Acceptance Criteria (Definition of Done)

The project is complete when **all** of the following are true:

1. Both `/generate` and `/regenerate` endpoints are deployed and reachable.
2. All 5 acceptance test cases (A1–A5) pass.
3. README documents setup, env vars, deployment URL, and example curl invocations.
4. Source code is in a Git repository with a clean commit history.
5. Dockerfile builds and runs the service identically to local.
6. `/health` returns 200 and the deployed version SHA.
7. The Solution Decision Document and Final Problem Statement are committed alongside the code.

---

## 7. Deployment Strategy

Minimum viable deployment for a solo developer working on a 17-day clock. **No multi-environment promotion. No blue-green. No autoscaling.**

### 7.1 Target Environment

**Primary recommendation:** A single container deployed to one of:
- **Railway** or **Render** — easiest for solo dev, Git-push-to-deploy, free/cheap tier, HTTPS included.
- **Fly.io** — also good, slightly more configuration.
- **AWS ECS Fargate / Google Cloud Run** — if the company already has cloud accounts and IAM set up.

Pick whichever the developer (or the company) already has credentials for. Do not spend a day setting up a new cloud account.

### 7.2 Containerization

- Single `Dockerfile`, multi-stage build using the official uv image as the builder for fast, reproducible installs.
- **Builder stage:** base on `ghcr.io/astral-sh/uv:python3.11-bookworm-slim`; copy `pyproject.toml` + `uv.lock`; run `uv sync --frozen --no-dev` to materialize the venv into `.venv/`.
- **Runtime stage:** base on `python:3.11-slim`; copy `.venv/` and `app/` from the builder; set `PATH` to include `.venv/bin`. No `uv` needed at runtime.
- Non-root user (`useradd app && USER app`).
- `EXPOSE 8000`; `CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]` — uvicorn is invoked from the synced venv directly.
- `.dockerignore` excludes `.venv`, `.env`, `__pycache__`, `tests/`, `.git/`, local data files.
- **Critical:** commit `uv.lock` to the repo so the Docker build is byte-for-byte reproducible.

### 7.3 Configuration

- All config via environment variables (no hardcoded secrets):
  - `GEMINI_API_KEY` — Google AI Studio API key.
  - `MODEL_NAME_HEAVY` — Gemini model used for heavy nodes (default: `gemini-2.5-pro`).
  - `MODEL_NAME_LIGHT` — Gemini model used for lightweight nodes (default: `gemini-2.5-flash`).
  - `LOG_LEVEL` — logging verbosity (default: `INFO`).
- `.env.example` committed; real `.env` in `.gitignore`.
- Confirm exact model names from Google AI Studio at the start of Day 1 — Gemini model SKUs evolve and the names above are defaults to be verified, not contractual.

### 7.4 Release Plan

| Step | Action | When |
|---|---|---|
| 1 | First successful local Docker run | Day 15 (19 May) |
| 2 | First push to staging environment | Day 16 (20 May) |
| 3 | Acceptance tests A1–A5 against staging URL | Day 16 (20 May) |
| 4 | Final demo-ready deploy | Day 17 (21–22 May) |

### 7.5 Rollback

For a solo MVP: rollback = redeploy previous Git tag. Tag every successful deploy as `v0.1.0`, `v0.2.0`, etc. The platform's "redeploy previous version" button is the rollback mechanism.

### 7.6 Observability (Minimum)

- `print` / `logging` to stdout (the platform captures it).
- Per-request log line: timestamp, mode (A/B/regenerate), duration, success/failure, total Gemini input + output tokens used per node (Gemini's API returns these in `usage_metadata`).
- Manual dashboard: tail logs in the platform's web UI.

**Deferred to post-MVP:** structured logging (JSON), distributed tracing, Prometheus metrics, alerting.

### 7.7 What Could Go Wrong During Deploy

| Risk | Mitigation |
|---|---|
| `GEMINI_API_KEY` not set in production env | `/health` check on first deploy verifies the key works (extend health check to do a 1-token Gemini ping using `gemini-2.5-flash`) |
| Cold-start timeout on first request | Configure platform health-check to a long-enough timeout; warm with a startup ping |
| Gemini rate limits or per-day quota in production | Log rate-limit errors clearly; fall back to `gemini-2.5-flash` for the offending node on next retry; document per-day quota as a known MVP limitation. Consider enabling billing in Google AI Studio before the demo if free-tier quotas are tight. |

---

## 8. Project Execution Risks

These are *project delivery* risks — distinct from the architectural risks already in the Solution Decision Document.

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| P1 | Single node (likely `activities`) takes far longer than estimated, eating buffer | High | High | Buffer is already 1 day; if Day 7 (`activities`) slips, cut scope on `differentiation` to a simpler 2-line output rather than skip the buffer. |
| P2 | LLM quality on a specific node (likely `standards` or `differentiation`) is poor and needs prompt iteration | High | Medium | Reserve evening of Day 10 for prompt-tuning pass. Don't aim for perfection in Phase 2. |
| P3 | Solo developer falls sick / unavailable for a day | Medium | High | The 1-day buffer absorbs one lost day. More than that = scope cut: drop F6 (deferred OpenAPI polish), simplify deployment to local Docker only with ngrok for the demo. |
| P4 | Gemini API outage or quota limit hit during integration testing | Low | High | Have unit tests with mocked Gemini responses that don't depend on the real API; integration tests can run later. Have a backup AI Studio key under a different Google account in case of project-level rate limits. |
| P5 | Regeneration logic complexity underestimated | Medium | Medium | Day 12 is dedicated — but if regeneration is broken on Day 13, ship Mode A + Mode B without regeneration as the MVP and document regeneration as a fast-follow. |
| P6 | Schema drift between Pydantic models and TypedDict causes runtime errors late in the project | Low | High | Single source of truth: derive `TypedDict` from Pydantic models. Catch drift with a dedicated unit test from Day 4 onwards. |
| P7 | Deploy environment account/credentials not ready | Medium | High | Decide on the deploy target on Day 1, not Day 15. Verify deploy access on Day 2 with a "hello world" container push. |

---

## 9. Quality Gates

Before each phase exits, verify:

| Gate | When | Pass Condition |
|---|---|---|
| G1 — Skeleton works | End of Day 2 | `/health` returns 200; `pytest` runs |
| G2 — Schemas validated | End of Day 4 | All Pydantic models pass example-based tests |
| G3 — First node works | End of Day 5 | `objectives` node returns valid output for one real input |
| G4 — Mode A end-to-end | End of Day 10 | Full pipeline returns valid full plan |
| G5 — Mode B grounded | End of Day 11 | Sample chapter produces grounded output on manual review |
| G6 — Regeneration works | End of Day 12 | All 9 top-level sections regenerable |
| G7 — Deployed & smoke-tested | End of Day 16 | A1–A5 pass against staging URL |
| G8 — Done | Day 17 | Section 6 acceptance criteria all met |

If any gate fails by more than 1 day, invoke scope-cut decisions in Section 8 (P1, P3, P5).

---

## 10. Deliverables Checklist

- [ ] Git repository with clean history
- [ ] Working `/generate` endpoint (Mode A + Mode B)
- [ ] Working `/regenerate` endpoint
- [ ] Working `/health` endpoint
- [ ] `pyproject.toml` and `uv.lock` committed (reproducible builds)
- [ ] Pydantic schemas for all sections
- [ ] LangGraph pipeline with 9 nodes + chapter_extraction + assemble
- [ ] Prompt templates in `app/prompts/`
- [ ] Unit test suite (≥30 tests)
- [ ] Integration test suite (5 tests, runnable manually)
- [ ] Acceptance test cases A1–A5 (documented + passing)
- [ ] Dockerfile + working container build
- [ ] Service deployed to a public URL
- [ ] README with setup, env vars, deploy URL, example curl commands
- [ ] `.env.example` committed
- [ ] Final Problem Statement, Solution Decision Document, and this DPR committed in `docs/`

---

## 11. Out of Scope for MVP (Explicit Deferrals)

To protect the timeline, the following are explicitly **not** in scope and will be tracked as post-MVP work:

- Migration to Approach 3 (parallel DAG) — see Solution Decision Document Section 7.
- Authentication / API keys for the service itself.
- Rate limiting on the public endpoints.
- Persistence of generated plans.
- Caching layer for repeated identical inputs.
- Streaming responses to the frontend.
- Multi-language (Hindi / regional) support.
- Comprehensive observability (Prometheus, tracing, alerting).
- CI/CD pipeline (deploys are manual `git push` for MVP).
- Load testing.
- Standards reference data (curated CBSE/ICSE outcomes list) — for MVP, the standards node generates from the LLM and the backend validates separately, as the spec already states.

---

## 12. Approval

| Role | Name | Approval | Date |
|---|---|---|---|
| AI Developer (you) | | | |
| Tech Lead / Boss | | | |

---

*This DPR is the single execution reference for the project. Updates required if scope, timeline, or architecture changes — re-approval needed in those cases.*
