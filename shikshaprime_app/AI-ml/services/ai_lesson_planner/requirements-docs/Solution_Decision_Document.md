# Solution Decision Document

**Project:** AI Lesson Planner — AI Generation Layer
**Date:** 5 May 2026
**Status:** Approved for MVP implementation
**Tech Stack:** Python, LangGraph, Pydantic, LLM provider SDK (Anthropic / OpenAI)

---

## 1. Executive Summary

The AI generation layer of the AI Lesson Planner must produce a strictly structured JSON lesson plan in two modes (topic-based and PDF-chapter-based), support per-section regeneration, and follow a multi-step pipeline where each stage is aware of all previously generated content.

After evaluating three candidate architectures, **Approach 2 — LangGraph Linear Sequential Pipeline with Context Passing** has been selected for the MVP. It is the smallest design that fully honors the requirements document, gives us per-section quality and debuggability, and provides a clean evolution path to a parallelized DAG architecture (Approach 3) once the MVP is in production and real performance data is available.

---

## 2. Context & Problem Statement

The AI service must:

- Accept either topic-only inputs or topic + extracted PDF chapter text.
- Generate a 9-field lesson plan JSON in an exact schema with no prose, markdown, or extra fields.
- Run as a multi-step pipeline (9 stages) where each stage receives the user inputs plus all accumulated outputs from previous stages.
- Support partial regeneration of any single section using an existing plan as context.
- Avoid hallucinated content when PDF text is provided — generation must stay grounded in the chapter.

The AI developer must implement this as nodes in LangGraph using Python.

---

## 3. Chosen Approach — LangGraph Linear Sequential Pipeline

### 3.1 Architecture

A single LangGraph `StateGraph` with one node per generation stage. State is a `TypedDict` that mirrors the final output schema plus the input fields, and accumulates as the graph executes.

```
START
  ↓
[chapter_extraction]    (only runs if chapterPdfText is present)
  ↓
[objectives]
  ↓
[prerequisites]
  ↓
[materials]
  ↓
[activities]
  ↓
[assessments]
  ↓
[differentiation]
  ↓
[homework]
  ↓
[time_breakdown]
  ↓
[standards]
  ↓
[assemble]
  ↓
END
```

### 3.2 Key Design Decisions

- **Single shared state object.** A `TypedDict` matching the final JSON schema (section 2.1 of the spec) plus all input fields. Each node reads what it needs and writes its own output back into state.
- **Per-section Pydantic models.** Every node validates its own output before writing to state. Invalid output triggers up to 2 retries with the validation error fed back into the prompt.
- **Chapter pre-processing node.** When `chapterPdfText` is present, a preprocessing node extracts a structured `chapterContext` (key concepts, definitions, examples, exercises, subtopics) once at the start. All downstream nodes consume the structured context, not the raw PDF text. This prevents token bloat and improves grounding.
- **Conditional regeneration routing.** The graph uses `add_conditional_edges` from `START`. If `regenerateSection` is present in the input, the graph routes directly to that single node, skips the others, and the `assemble` node detects partial-regeneration mode and returns only the regenerated section as required by spec section 6.
- **Mixed model strategy.** Lighter stages (`prerequisites`, `time_breakdown`, `standards`) can use a cheaper/faster model. Heavier stages (`activities`, `assessments`) use the stronger model. This is configurable per node and is a cost-optimization lever for later.
- **Strict JSON output.** Every node uses structured output / JSON mode from the LLM SDK plus Pydantic validation. The `assemble` node is the only place the final schema is constructed.

---

## 4. Alternatives Considered

### 4.1 Approach 1 — Single Monolithic LLM Call

One large prompt produces the entire lesson plan JSON in a single call. No orchestration framework.

| Dimension | Assessment |
|---|---|
| Build time | 1–2 days |
| Token cost | Lowest |
| Latency | ~5–10s (best) |
| Output quality | Degrades on long structured JSON |
| Spec fit | ✗ Violates the multi-step + context-passing requirement |
| Regeneration | Requires hacky workarounds — no native fit |
| Debuggability | Poor — cannot isolate which section failed |
| Maintainability | Poor — any prompt tweak risks regressing every section |

**Why rejected:** Directly violates the requirements document. Long-form structured JSON is a known weak spot for LLMs (missing fields, malformed JSON, dropped keys). Cannot cleanly support regeneration. The short-term build savings would be paid back many times over in debugging and quality issues.

### 4.2 Approach 3 — LangGraph DAG with Parallel Branches

Same nodes as Approach 2, but the graph fans out where the dependency chain allows: after `activities` completes, `time_breakdown` runs in parallel with the `assessments → differentiation → homework → standards` chain. Each generator is paired with a dedicated validator/retry node.

| Dimension | Assessment |
|---|---|
| Build time | 5–7 days |
| Token cost | Comparable to Approach 2 |
| Latency | ~20–40s (30–40% faster than Approach 2) |
| Output quality | Highest |
| Spec fit | ✓ Meets spec, exceeds it |
| Regeneration | Native |
| Debuggability | Medium — parallel paths complicate tracing |
| Maintainability | Medium — reducer functions and parallel state merging add cognitive load |

**Why deferred (not rejected):** The latency and reliability improvements are real but not yet justified for an MVP. State-merging across parallel branches in LangGraph requires careful reducer functions, which is engineering effort that should be spent only when real-user latency feedback proves it is needed. **This approach is the planned post-MVP migration target — see Section 7.**

---

## 5. Justification for the Choice

Approach 2 is selected for the following reasons:

1. **Spec alignment.** The requirements document explicitly describes a multi-step pipeline with context passing (sections 5 and "Use a Multi-Step Pipeline WITH Context Passing"). Approach 2 maps 1:1 to this — node names, dependency edges, and the shared context object all correspond directly to the spec. There is no impedance mismatch between design and requirements.

2. **Output quality.** Smaller, focused prompts produce more reliable structured output than one mega-prompt. Each node is responsible for a small JSON fragment, which is well within the reliable output range for current models.

3. **Debuggability.** When a generation fails or produces low-quality output, the failure is isolated to one stage. Logs, retries, and prompt tweaks can be applied surgically without affecting other stages.

4. **Native regeneration support.** LangGraph's conditional edges make per-section regeneration a natural construct rather than a bolt-on. The same graph definition handles both full generation and single-section regeneration.

5. **Right-sized for the team and timeline.** A 3–4 day MVP fits a small team. Approach 1 is faster but throws away the spec; Approach 3 is more powerful but spends engineering days on parallelism that has no proven user benefit yet.

6. **Clean evolution path.** Approach 2 is a strict subset of Approach 3. The nodes, prompts, validators, and state schema all carry over. Migrating later is an architectural change to the graph topology, not a rewrite.

7. **Cost controls available.** Mixed model strategy and prompt caching can be applied without changing the architecture if token costs become a concern.

---

## 6. Risks and Mitigation Plan

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | A single stage's LLM call fails or returns invalid JSON, halting the pipeline | Medium | High | Per-node retry policy (max 2 retries) with the Pydantic validation error injected into the retry prompt. After 2 failures, the node returns a safe default and flags the section for regeneration in the response metadata. |
| R2 | Token budget overrun when `chapterPdfText` is large (e.g. a full textbook chapter) | High | Medium | Run a one-time `chapter_extraction` preprocessing node that compresses raw PDF text into a structured `chapterContext` (concepts, definitions, examples, exercises). All downstream nodes read this structured context, not the raw text. |
| R3 | End-to-end latency too high (~30–60s) for users on slow connections | Medium | Medium | (a) Stream partial results to the frontend as each stage completes, so the user sees progress. (b) Use a faster/cheaper model for lightweight stages. (c) If still unacceptable in production, migrate to Approach 3 (parallel DAG). |
| R4 | LLM hallucinates content that is not present in the chapter when in PDF mode | Medium | High | (a) Each PDF-mode prompt includes an explicit instruction: "Use only content present in chapterContext. Do not invent facts, examples, or exercises." (b) Add a lightweight grounding-check node after `objectives` and `assessments` that flags content not traceable to the extracted chapter context. |
| R5 | Cumulative token cost in the sequential pipeline (each stage re-includes accumulated context) | Medium | Medium | (a) Use Anthropic prompt caching for the static portions of the context. (b) Per-stage context trimming — each prompt only receives the prior outputs it actually needs (per the dependency chain in spec section 5), not the full state. |
| R6 | Regeneration produces a section that contradicts the rest of the existing plan | Low | Medium | The regeneration prompt includes the full `existingPlan` as read-only context and explicitly instructs the model to remain consistent with the unchanged sections. |
| R7 | Prompt drift over time as individual stage prompts are tweaked independently | Medium | Low | Maintain a `prompts/` folder with versioned prompt files. Add a small regression test suite (5–10 fixed input cases) run on every prompt change to catch unintended quality regressions. |
| R8 | LangGraph state schema and Pydantic models drift apart, causing runtime errors | Low | Medium | Single source of truth: define the Pydantic models first, derive the `TypedDict` from them. Add a unit test that asserts schema parity. |
| R9 | "Standards" generation produces fabricated board-specific standards (a known LLM weakness) | High | Medium | The spec already notes the backend will validate standards. Mitigate further by providing the `standards` node with a curated list of valid board outcomes (CBSE/ICSE/etc.) per subject+grade in the prompt context, and instructing the model to select rather than generate. |

---

## 7. Post-MVP Evolution — Migration to Approach 3

**Approach 2 is explicitly designed as the foundation for a future migration to Approach 3 (LangGraph DAG with Parallel Branches) once the MVP is in production.**

### 7.1 When to migrate

Migration to Approach 3 should be triggered when **any** of the following becomes true after MVP launch:

- Median end-to-end generation latency exceeds the product team's acceptable threshold (suggested initial threshold: 45 seconds), measured over real user traffic.
- User feedback or analytics show drop-off during plan generation.
- Stage failure rates require per-node validation/retry infrastructure beyond what the simple linear pipeline supports cleanly.
- Concurrent request volume makes per-request latency a throughput bottleneck.

### 7.2 What changes in the migration

Because Approach 2 is a strict subset of Approach 3, the migration is incremental and low-risk:

1. **Nodes, prompts, Pydantic models, and state schema carry over unchanged.** No prompt re-engineering required.
2. **Graph topology is updated** to fan out parallel branches after `activities`:
   - Branch A: `time_breakdown` (depends only on activities)
   - Branch B: `assessments → differentiation → homework → standards`
   - Both branches join at `assemble`.
3. **Add reducer functions** to the `TypedDict` state to safely merge writes from parallel branches (using LangGraph's `Annotated[..., reducer]` pattern).
4. **Add dedicated validator/retry nodes** between each generator and the next stage, replacing the inline retry logic in Approach 2.
5. **Add observability** — per-node timing, success/failure rates, and token usage — to verify the parallelization actually delivers the expected latency improvement.

### 7.3 Estimated migration effort

2–3 engineering days, assuming the MVP is well-tested. Most of the time goes into reducer functions, parallel-branch testing, and updating the test suite — not into prompt or schema work.

### 7.4 What we explicitly do NOT do during MVP

To keep the migration path clean, the MVP **avoids**:

- Hard-coding sequential assumptions inside node implementations (e.g. a node assuming a sibling node has already run).
- Mixing prompt logic with graph orchestration logic in the same module.
- Storing transient state outside the LangGraph `TypedDict`.

This discipline ensures the Approach 2 → Approach 3 migration is a topology change, not a rewrite.

---

## 8. Decision Log

| Date | Decision | Rationale |
|---|---|---|
| 5 May 2026 | Adopt Approach 2 for MVP | Best fit for spec, balanced complexity, clean migration path |
| 5 May 2026 | Defer Approach 3 until post-MVP performance data | Avoid premature optimization; parallel DAG complexity not justified without real latency data |
| 5 May 2026 | Reject Approach 1 | Violates multi-step + context-passing requirement; poor regeneration support |

---

## 9. Approval

| Role | Name | Signature / Approval | Date |
|---|---|---|---|
| AI Developer | | | |
| Tech Lead | | | |
| Product Owner | | | |

---

*This document is the authoritative record of the architectural decision for the AI generation layer. Any change to the chosen approach requires updating this document and re-approval.*
