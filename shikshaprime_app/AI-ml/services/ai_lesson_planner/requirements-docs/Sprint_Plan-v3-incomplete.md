# 🧑‍🏫 AI Lesson Planner MVP — Sprint Plan & Task Breakdown (v2)

**Total estimated effort:** ~88 hours (1 developer, ~17 calendar days, 5 May → 22 May 2026)

**Sprint Length:** Variable — Sprint 0 is 1 day (Mode A end-to-end), remaining sprints are multi-day

**Tech Stack:** Python 3.11+ (managed by `uv`), FastAPI, LangGraph, Pydantic v2, Google Gemini (`google-genai`), Docker

**Reference Docs:** Final Problem Statement, Solution Decision Document, Detailed Project Report, Architecture Document

---

## Legend

- **[S]** = Small (30 min – 1 hour)
- **[M]** = Medium (1–2 hours)
- **[L]** = Large (2–4 hours)
- **[XL]** = Extra Large (4–6 hours)
- **🔗** = Has dependency on another task
- **🧪** = Needs testing / validation
- **⭐** = Critical path (blocks other tasks)
- **🌐** = API / FastAPI task
- **🧠** = LangGraph / orchestration task
- **🔌** = Gemini / LLM task
- **📐** = Pydantic schema task
- **📝** = Prompt engineering task
- **🐳** = Docker / deploy task
- **📚** = Docs / README task
- **✅** = Manual validation step (you review the output yourself)

---

## Sprint Overview

| Sprint | Days | Theme | Demoable Output |
|---|---|---|---|
| **S0** | Day 1 (TODAY) | Mode A End-to-End | `POST /generate` Mode A works locally, returns full valid lesson plan |
| **S1** | Days 2–5 | Stabilize, Test, Stage Deploy | Unit tests, prompt iteration, Mode A deployed to staging |
| **S2** | Days 6–10 | Mode B Prompts + Chapter Grounding | Mode B with PDF grounding works end-to-end |
| **S3** | Days 11–13 | Regeneration | Per-section regeneration with regen prompts |
| **S4** | Days 14–17 | Hardening, Prod Deploy, Handover | Production URL, all tests pass, v1.0.0 tagged |

---

# S0 — Mode A End-to-End in ONE DAY (Today, Day 1)

**Goal:** By end of today, `curl POST /generate` with a Mode A payload returns a valid, schema-correct lesson plan JSON from your local machine. Not deployed yet — just working locally.

**Why compress this?** Once you have one working end-to-end path, everything else (tests, Mode B, regeneration, deploy) is layered on top. Getting the full loop working on Day 1 gives you 16 remaining days for quality, not plumbing.

**Time budget:** ~10 hours. Aggressive but doable with focused execution.

---

### 0.1 Project Setup (~90 min)

```
0.1.1 [M] ⭐ Initialize repo + uv + dependencies
      - Install uv: curl -LsSf https://astral.sh/uv/install.sh | sh
      - mkdir ai-lesson-planner && cd ai-lesson-planner && git init
      - uv init --python 3.11
      - Delete auto-generated hello.py
      - uv add langgraph pydantic fastapi "uvicorn[standard]" google-genai python-dotenv
      - uv add --dev pytest pytest-asyncio httpx
      - Verify: uv run python -c "import langgraph; import pydantic; print('OK')"
      Acceptance: pyproject.toml + uv.lock exist. All imports work

0.1.2 [S] ⭐ Create folder structure + env files
      - Create folders with __init__.py:
        app/, app/schemas/, app/llm/, app/nodes/, app/graph/,
        app/prompts/, app/utils/, app/observability/, tests/
      - Create .gitignore: __pycache__, .venv, .env, .pytest_cache
      - Create .env.example: GEMINI_API_KEY, MODEL_NAME_HEAVY=gemini-2.5-pro,
        MODEL_NAME_LIGHT=gemini-2.5-flash, LOG_LEVEL=INFO
      - cp .env.example .env → paste your real Gemini API key
      Acceptance: uv run python -c "import app" works. .env has your real key

0.1.3 [S] ⭐ 🔌 Gemini API smoke test (5 min — don't overthink this)
      - Quick throwaway test:
        uv run python -c "
        from google import genai; import os; from dotenv import load_dotenv
        load_dotenv()
        c = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))
        r = c.models.generate_content(model='gemini-2.5-flash', contents='Say OK')
        print(r.text)
        "
      - If it prints "OK" or similar, your key works. Move on
      - If it errors: fix the key, check the model name
      Acceptance: Gemini responds. You know the exact working model names

0.1.4 [S] ⭐ 🌐 Skeleton FastAPI with /health + config
      - app/config.py:
        Load GEMINI_API_KEY, MODEL_NAME_HEAVY, MODEL_NAME_LIGHT from env
      - app/main.py:
        FastAPI app, GET /health → {"status": "ok"}
      - Test: uv run uvicorn app.main:app --reload
        curl http://localhost:8000/health
      Acceptance: /health returns 200. /docs shows Swagger UI
```

---

### 0.2 Pydantic Schemas (~60 min)

```
0.2.1 [M] ⭐ 📐 All input + output schemas in one shot
      - app/schemas/inputs.py:
        class GenerateRequest — 7 fields (grade, subject, topic,
        duration, board, teachingStyle, depth)
      - app/schemas/sections.py — ALL 9 section output models:
        ObjectivesOutput, PrerequisitesOutput, MaterialsOutput,
        ActivitiesOutput (5 string fields), AssessmentOutput,
        DifferentiationOutput, HomeworkOutput, StandardsOutput,
        TimeBreakdownOutput (5 int fields)
      - app/schemas/outputs.py:
        class LessonPlan — composes all 9 section models
      - Each model must have Field(description=...) on every field
        because Gemini uses these descriptions for structured output
      Acceptance: In a Python shell, manually construct each model
                  with dummy data. model_dump_json() produces valid JSON
                  matching the spec schema exactly
```

---

### 0.3 Gemini Client + Retry (~60 min)

```
0.3.1 [M] ⭐ 🔌 GeminiClient + retry helper
      - app/llm/client.py:
        class GeminiClient with generate_structured() method
        Uses response_mime_type="application/json" + response_schema
      - app/llm/retry.py:
        call_with_retry() — max 2 retries, feeds validation error
        back into prompt on retry
      - app/utils/prompt_loader.py:
        load_prompt(name) — reads from app/prompts/{name}.txt
        with @lru_cache
      - Quick test: call generate_structured with ObjectivesOutput
        and a simple prompt to confirm it returns a Pydantic instance
      Acceptance: GeminiClient returns a parsed Pydantic object.
                  Retry helper handles mock failures correctly
```

---

### 0.4 Prompt Engineering — Write + Validate ALL 9 Prompts (~2.5 hours)

**THIS IS THE DEDICATED PROMPT EPIC.** Each prompt is written as a separate
task, tested in AI Studio manually by you, and THEN used in the node code.

**ONE PROMPT PER NODE — not two.** Each prompt includes two placeholders:
- `{chapter_block}` — empty in Mode A, filled with chapter context in Mode B
- `{grounding_instruction}` — empty in Mode A, filled with "use only chapter content" in Mode B
This means the SAME .txt file works for both modes. The node code decides
what to fill in. You will NOT create separate _pdf.txt files.

**How to validate each prompt (same process for all 9):**

1. Open Google AI Studio: https://aistudio.google.com
2. Paste the prompt with real variable values filled in
   (use: Grade 7, Science, Photosynthesis, CBSE, Activity-based, Standard, 45 min)
3. For Mode A test: delete the {chapter_block} and {grounding_instruction} lines
4. Run it 3 times
5. Check each run:
   - ✅ Output is valid JSON?
   - ✅ Matches the expected Pydantic model shape?
   - ✅ Content is grade-appropriate?
   - ✅ Content is specific (not vague)?
   - ✅ Bloom verbs used (for objectives)?
   - ✅ All required fields present and non-empty?
6. If any run fails: adjust the prompt, re-test
7. Once 3/3 pass: save the file and move to the next prompt

**Budget: ~15 min per prompt** (5 min write, 10 min test in AI Studio)

```
0.4.1 [S] ⭐ 📝 ✅ Write + validate: objectives.txt
      - File: app/prompts/objectives.txt
      - Role: "Senior curriculum designer for {board} board"
      - Context: grade, subject, topic, board, teachingStyle, depth
      - Upstream context: NONE (first node)
      - Task: "Generate 4-6 learning objectives"
      - PLACEHOLDERS FOR MODE B (include in the prompt file):
        • Add {chapter_block} between Context and Task sections
        • Add {grounding_instruction} after the numbered requirements
        • In Mode A these will be empty strings
        • In Mode B the node code fills them with chapter data
      - Key constraints:
        • Each starts with a Bloom verb (Remember/Understand/Apply/
          Analyze/Evaluate/Create)
        • Measurable and observable
        • Depth level maps to Bloom level (Basic→low, Advanced→high)
        • Grade-appropriate language
      - Constraints block (copy to EVERY prompt):
        "RULES:
         - Return ONLY valid JSON matching the schema
         - No markdown, no prose, no extra fields
         - Use grade-appropriate language for Grade {grade}
         - Align with {board} board curriculum"
      - Variables to .format(): grade, subject, topic, board,
        teachingStyle, depth, chapter_block, grounding_instruction
      
      EXAMPLE of what the prompt file looks like:
      """
      You are a senior curriculum designer for {board} board...
      
      CONTEXT:
      Grade: {grade} | Subject: {subject} | Topic: {topic}
      Board: {board} | Teaching Style: {teachingStyle} | Depth: {depth}
      
      {chapter_block}
      
      TASK: Generate 4-6 learning objectives...
      Requirements:
      1. Start with Bloom verb...
      2. Be measurable...
      3. Align with {board} curriculum...
      {grounding_instruction}
      
      RULES: ...
      """
      
      VALIDATE IN AI STUDIO (Mode A — leave placeholders empty):
      - Fill in: Grade 7, Science, Photosynthesis, CBSE
      - Delete {chapter_block} and {grounding_instruction} lines
      - Run 3x. Each run should return 4-6 strings starting with
        Bloom verbs about photosynthesis
      Acceptance: 3/3 runs produce valid ObjectivesOutput JSON.
                  Each objective starts with a Bloom verb

0.4.2 [S] ⭐ 📝 ✅ Write + validate: prerequisites.txt
      *** SAME PLACEHOLDER PATTERN AS 0.4.1 FOR ALL REMAINING PROMPTS ***
      *** Every prompt includes {chapter_block} + {grounding_instruction} ***
      *** Test in AI Studio with those placeholders removed (Mode A test) ***
      
      - Role: "Curriculum expert identifying prior knowledge"
      - Upstream context: {objectives} (paste real objectives output
        from 0.4.1 validation into AI Studio)
      - Task: "List 3-5 prerequisite knowledge items"
      - Key constraints:
        • Specific concepts, not vague ("plant cell structure"
          NOT "basic biology")
        • Logically lead into the objectives
        • Order from fundamental to advanced
        • Realistic for prior {board} grade levels
      - Variables: grade, subject, topic, board, teachingStyle,
        depth, objectives
      
      VALIDATE IN AI STUDIO:
      - Paste real objectives from previous step as {objectives}
      - Run 3x. Each should return 3-5 specific prior-knowledge items
      Acceptance: 3/3 valid. Items are specific and age-appropriate

0.4.3 [S] ⭐ 📝 ✅ Write + validate: materials.txt
      - Role: "Classroom resource planner for {board} school"
      - Upstream context: {objectives}, {prerequisites}
      - Task: "List 5-8 materials and resources"
      - Key constraints:
        • Mix of: physical aids, digital resources, classroom items, handouts
        • Realistic for {board} school (no expensive lab equipment
          unless depth=Advanced)
        • If teachingStyle=Activity-based: include hands-on materials
        • If teachingStyle=Lecture-based: focus on visual aids
        • No generic "textbook" without specifying which section
      - Variables: grade, subject, topic, board, teachingStyle,
        depth, objectives, prerequisites
      
      VALIDATE IN AI STUDIO:
      - Run 3x. Each should return 5-8 items with a good mix
      Acceptance: 3/3 valid. Mix of physical + digital + handout items

0.4.4 [M] ⭐ 📝 ✅ Write + validate: activities.txt (HARDEST PROMPT — spend extra time)
      - Role: "Experienced {subject} teacher designing a {duration}-minute lesson"
      - Upstream context: {objectives}, {prerequisites}, {materials}
      - Task: "Generate 5 activity phases"
      - The 5 phases (EXPLICITLY define each in the prompt):
        1. intro (~10% of duration): opening hook, connect to prior
           knowledge, state objectives
        2. instruction (~35%): core teaching, reference materials,
           step-by-step explanation
        3. guidedPractice (~20%): teacher-led practice WITH students,
           think-pair-share, class-wide problem
        4. independentPractice (~25%): students work alone/groups,
           teacher monitors, tests objectives
        5. closure (~10%): recap, check understanding, preview homework
      - Key constraints:
        • TEACHER-FACING instructions (what teacher does), NOT
          student-facing prose
        • Each phase AT LEAST 3-4 sentences of specific instructions
        • Reference actual materials from the materials list
        • Must flow logically: intro → instruction → guided →
          independent → closure
        • Be SPECIFIC: "Ask students to draw and label the
          photosynthesis equation on their whiteboards" NOT
          "discuss the topic"
      - Variables: grade, subject, topic, board, teachingStyle,
        depth, duration, objectives, prerequisites, materials
      
      VALIDATE IN AI STUDIO (spend 20-30 min here):
      - Run 3x. For each run, read ALL 5 phases carefully
      - Check: are instructions teacher-facing? specific? ≥3 sentences?
      - Check: do they reference the materials list?
      - If ANY phase is vague → adjust prompt → retest
      - Common failure: Gemini writes "discuss photosynthesis" instead
        of specific instructions → add "Do NOT write vague instructions
        like 'discuss the topic'" to the prompt
      Acceptance: 3/3 runs produce 5 non-empty phases, each ≥3 sentences,
                  teacher-facing, specific, referencing materials.
                  THIS IS THE MOST IMPORTANT PROMPT — don't rush it

0.4.5 [S] ⭐ 📝 ✅ Write + validate: assessments.txt
      - Role: "Assessment design expert for {board} schools"
      - Upstream context: {objectives}, {activities}
      - Task: "Design formative + summative assessment"
      - Key constraints:
        • Formative: quick in-class check (2-3 min), done DURING lesson
          (thumbs up/down, oral quiz, exit ticket, mini-whiteboard)
          — describe what teacher asks, how students respond,
          what to look for
        • Summative: thorough end-of-lesson check (short quiz 3-5
          questions, written task, diagram exercise)
          — write out the ACTUAL questions/tasks, not just "give a quiz"
          — each question maps to an objective
      - Variables: grade, subject, topic, board, depth,
        objectives, activities
      
      VALIDATE IN AI STUDIO:
      - Run 3x. Formative should be a quick technique.
        Summative should have actual written-out questions
      Acceptance: 3/3 valid. Summative has real questions, not placeholders

0.4.6 [S] ⭐ 📝 ✅ Write + validate: differentiation.txt
      - Role: "Inclusive education specialist"
      - Upstream context: {objectives}, {activities}, {assessment}
      - Task: "Strategies for slowLearners + advancedLearners"
      - Key constraints:
        • Each group gets ≥3 CONCRETE strategies
        • Strategies reference the specific activities/assessments
        • slowLearners: scaffolding, simplified versions, visual aids,
          peer pairing — SPECIFIC to this lesson
        • advancedLearners: extension activities, higher-order questions,
          real-world applications — SPECIFIC to this lesson
        • NOT vague: "Provide a partially filled photosynthesis diagram"
          not "simplify the content"
      - Variables: grade, subject, topic, board, depth,
        objectives, activities, assessment
      
      VALIDATE IN AI STUDIO:
      - Run 3x. Each group should have ≥3 concrete strategies
      Acceptance: 3/3 valid. Strategies are specific to THIS lesson

0.4.7 [S] ⭐ 📝 ✅ Write + validate: homework.txt
      - Role: "{subject} teacher assigning homework"
      - Upstream context: {objectives}, {activities}, {assessment},
        {differentiation}
      - Task: "Write homework that reinforces the lesson"
      - Key constraints:
        • EXTEND learning, don't repeat independent practice
        • 20-30 min for Grade {grade}
        • 2-3 specific tasks (write them out fully)
        • ≥1 task requires applying concept to a NEW situation
        • State materials needed at home
      - Variables: grade, subject, topic, board, depth,
        objectives, activities, assessment, differentiation
      
      VALIDATE IN AI STUDIO:
      - Run 3x. Should have 2-3 written-out tasks
      - Check: is it different from independent practice?
      Acceptance: 3/3 valid. Tasks written out. Not a copy of activities

0.4.8 [S] ⭐ 📝 ✅ Write + validate: time_breakdown.txt
      - Role: "Lesson timing expert"
      - Upstream context: {activities}
      - Task: "Allocate {duration} minutes across 5 phases"
      - Key constraints:
        • Sum MUST equal {duration} EXACTLY (say this 3 times in prompt)
        • Approximate split: intro ~10%, instruction ~30-35%,
          guidedPractice ~20%, independentPractice ~25%, closure ~10%
        • Adjust based on actual activity complexity
        • All values positive integers, no phase < 3 minutes
        • Include: "Verify the sum equals {duration} before returning"
      - Variables: duration, activities
      
      VALIDATE IN AI STUDIO:
      - Test with duration=45, then duration=60, then duration=30
      - For each: verify the 5 values sum to the exact duration
      - If sum doesn't match in any run → strengthen the
        "verify before returning" instruction
      Acceptance: 3/3 runs for EACH duration (9 total runs).
                  Sum matches every time

0.4.9 [S] ⭐ 📝 ✅ Write + validate: standards.txt
      - Role: "Curriculum standards specialist for {board} board India"
      - Upstream context: {objectives}, {activities}, {assessment}
      - Task: "Generate 3-5 board-specific learning outcomes"
      - Key constraints:
        • Format: "[Board] [Subject] [Grade].[Unit].[Outcome]: [Description]"
        • Use REALISTIC {board} terminology
        • Cover different learning levels (knowledge, understanding, application)
        • Each standard relates to {topic}
        • Include: "Backend will validate these. Generate PLAUSIBLE
          standards — use descriptive competency statements rather than
          fabricating specific codes you're unsure about"
      - Variables: grade, subject, topic, board,
        objectives, activities, assessment
      
      VALIDATE IN AI STUDIO:
      - Run 3x. Each should return 3-5 standards that look real
      - Check: do they reference the topic? the board?
      Acceptance: 3/3 valid. Standards look plausible for the board

0.4.10 [S] 📝 ✅ Prompt validation summary checkpoint
       - You should now have 9 .txt files in app/prompts/:
         objectives.txt, prerequisites.txt, materials.txt,
         activities.txt, assessments.txt, differentiation.txt,
         homework.txt, time_breakdown.txt, standards.txt
       - Each has been manually tested 3x in AI Studio (Mode A, placeholders empty)
       - Each includes {chapter_block} + {grounding_instruction} placeholders
         ready for Mode B (the node code will fill them in S2)
       - NO separate _pdf.txt files needed — one file handles both modes
       - git add app/prompts/ && git commit -m "Add all 9 prompts with Mode B placeholders (AI Studio validated)"
       Acceptance: 9 files committed. Each has placeholders for Mode B.
                   You have confidence each produces quality Mode A output
```

---

### 0.5 Build ALL 9 Generation Nodes + Assemble (~2.5 hours)

**Now that prompts are validated, coding nodes is mechanical.**
Every node follows the SAME pattern — the only differences are:
which prompt to load, which upstream state keys to read, which
Pydantic model to use, and which model (heavy/light).

```
0.5.0 [S] ⭐ 🧠 Node template — understand the pattern first
      - Every node looks like this (DO NOT CODE YET — just read):
        
        # app/nodes/<name>.py
        from app.graph.state import LessonPlanState
        from app.schemas.sections import <OutputModel>
        from app.llm.retry import call_with_retry
        from app.llm.client import get_gemini_client
        from app.utils.prompt_loader import load_prompt
        from app.config import settings
        import json
        
        def run(state: LessonPlanState) -> dict:
            # ONE prompt file — Mode A vs B handled by filling placeholders
            chapter_ctx = state.get("chapterContext")
            
            if chapter_ctx:
                # Mode B — fill placeholders with chapter data
                chapter_block = f"""CHAPTER CONTEXT (from textbook):
        Concepts: {json.dumps(chapter_ctx['concepts'])}
        Definitions: {json.dumps(chapter_ctx['definitions'])}
        Examples: {json.dumps(chapter_ctx['examples'])}
        Exercises: {json.dumps(chapter_ctx['exercises'])}"""
                grounding_instruction = (
                    "GROUNDING RULE: Use ONLY content from the CHAPTER CONTEXT "
                    "above. Do NOT invent examples or facts not in the chapter."
                )
            else:
                # Mode A — placeholders become empty strings
                chapter_block = ""
                grounding_instruction = ""
            
            prompt = load_prompt("<name>").format(
                grade=state["grade"],
                subject=state["subject"],
                topic=state["topic"],
                board=state["board"],
                teachingStyle=state["teachingStyle"],
                depth=state["depth"],
                chapter_block=chapter_block,
                grounding_instruction=grounding_instruction,
                # + upstream context keys as needed
            )
            output = call_with_retry(
                client=get_gemini_client(),
                prompt=prompt,
                response_schema=<OutputModel>,
                model=settings.MODEL_NAME_HEAVY,  # or LIGHT
            )
            return {"<state_key>": output.<field>}
      
      - The ONLY things that change per node:
        1. Which prompt file to load (always just ONE file per node)
        2. Which .format() variables to pass (upstream context)
        3. Which Pydantic output model
        4. Which Gemini model (heavy vs light)
        5. Which state key to write the result to
      - IMPORTANT: The chapter_block/grounding_instruction pattern is
        IDENTICAL in every node. Copy-paste it. In S0 (today), Mode A
        runs with empty strings. In S2, when chapterContext is in state,
        the SAME code and SAME prompt automatically switches to Mode B
      Acceptance: You understand the pattern. Don't code yet

0.5.1 [S] ⭐ 🧠 LessonPlanState TypedDict
      - app/graph/state.py:
        class LessonPlanState(TypedDict, total=False):
            # Inputs
            grade: str
            subject: str
            topic: str
            duration: int
            board: str
            teachingStyle: str
            depth: str
            # Generated outputs (filled progressively by nodes)
            objectives: List[str]
            prerequisites: List[str]
            materials: List[str]
            activities: dict
            assessment: dict
            differentiation: dict
            homework: str
            standards: List[str]
            timeBreakdown: dict
            # S2 fields (placeholder, unused today)
            chapterPdfText: Optional[str]
            chapterContext: Optional[dict]
      Acceptance: Importing LessonPlanState works

0.5.2 [S] ⭐ 🧠 🔗 objectives node
      - File: app/nodes/objectives.py
      - Prompt: objectives.txt
      - Upstream context: NONE
      - Format vars: grade, subject, topic, board, teachingStyle, depth
      - Output model: ObjectivesOutput
      - Model: HEAVY
      - Returns: {"objectives": output.objectives}
      
      CODE-LEVEL VALIDATION:
      - uv run python -c "
        from app.nodes.objectives import run
        state = {'grade':'7','subject':'Science','topic':'Photosynthesis',
                 'duration':45,'board':'CBSE','teachingStyle':'Activity-based',
                 'depth':'Standard'}
        result = run(state)
        print(result)
        assert 'objectives' in result
        assert len(result['objectives']) >= 3
        print('✅ objectives node works')
        "
      Acceptance: Prints objectives list + "✅ objectives node works"

0.5.3 [S] ⭐ 🧠 🔗 prerequisites node
      - File: app/nodes/prerequisites.py
      - Prompt: prerequisites.txt
      - Upstream context: objectives
      - Format vars: grade, subject, topic, board, teachingStyle,
        depth, objectives (json.dumps)
      - Output model: PrerequisitesOutput
      - Model: LIGHT
      - Returns: {"prerequisites": output.prerequisites}
      
      CODE-LEVEL VALIDATION:
      - Same pattern as 0.5.2 but pass objectives in state
      Acceptance: Returns 3-5 prerequisite strings

0.5.4 [S] ⭐ 🧠 🔗 materials node
      - Prompt: materials.txt
      - Upstream context: objectives, prerequisites
      - Model: LIGHT
      - Returns: {"materials": output.materials}
      Acceptance: Returns 5-8 material strings

0.5.5 [M] ⭐ 🧠 🔗 activities node (spend extra time here)
      - Prompt: activities.txt
      - Upstream context: objectives, prerequisites, materials
      - Format vars: ALL inputs + duration + 3 upstream contexts
      - Output model: ActivitiesOutput
      - Model: HEAVY
      - Returns: {"activities": output.model_dump()}
      - NOTE: activities returns a dict (5 sub-fields), not a list
      
      CODE-LEVEL VALIDATION:
      - Run the node with real upstream state
      - Read the 5 phases manually:
        • Is intro a hook? Does it connect to prior knowledge?
        • Is instruction step-by-step? Does it reference materials?
        • Is guidedPractice teacher-led with student participation?
        • Is independentPractice student-led?
        • Is closure a recap with understanding check?
      - If quality is poor: go back to 0.4.4 and iterate the prompt
      Acceptance: All 5 fields non-empty, each ≥3 sentences,
                  teacher-facing, specific. If not → iterate prompt

0.5.6 [S] ⭐ 🧠 🔗 assessments node
      - Prompt: assessments.txt
      - Upstream context: objectives, activities
      - Model: HEAVY
      - Returns: {"assessment": output.model_dump()}
      Acceptance: formative = quick check, summative = real questions

0.5.7 [S] ⭐ 🧠 🔗 differentiation node
      - Prompt: differentiation.txt
      - Upstream context: objectives, activities, assessment
      - Model: LIGHT
      - Returns: {"differentiation": output.model_dump()}
      Acceptance: Both fields have ≥3 concrete strategies

0.5.8 [S] ⭐ 🧠 🔗 homework node
      - Prompt: homework.txt
      - Upstream context: objectives, activities, assessment, differentiation
      - Model: LIGHT
      - Returns: {"homework": output.homework}
      Acceptance: 2-3 specific tasks written out. Not a copy of activities

0.5.9 [S] ⭐ 🧠 🔗 time_breakdown node (with sum validation)
      - Prompt: time_breakdown.txt
      - Upstream context: activities
      - Format vars: duration, activities
      - Model: LIGHT
      - Returns: {"timeBreakdown": output.model_dump()}
      - EXTRA: After getting output, validate sum == state["duration"]
        If not, raise ValueError so retry helper retries with error msg
      
      CODE-LEVEL VALIDATION:
      - Test with duration=45 → verify sum = 45
      - Test with duration=60 → verify sum = 60
      Acceptance: Sum matches duration for both test cases

0.5.10 [S] ⭐ 🧠 🔗 standards node
       - Prompt: standards.txt
       - Upstream context: objectives, activities, assessment
       - Model: HEAVY
       - Returns: {"standards": output.standards}
       Acceptance: 3-5 standards that reference topic + board

0.5.11 [S] ⭐ 🧠 assemble node (NO LLM call — pure Python)
       - File: app/nodes/assemble.py
       - This node makes NO Gemini call — it just reads
         the accumulated state and builds the final LessonPlan
       - def run(state) -> dict:
             plan = LessonPlan(
                 objectives=state["objectives"],
                 prerequisites=state["prerequisites"],
                 materials=state["materials"],
                 activities=ActivitiesOutput(**state["activities"]),
                 assessment=AssessmentOutput(**state["assessment"]),
                 differentiation=DifferentiationOutput(**state["differentiation"]),
                 homework=state["homework"],
                 standards=state["standards"],
                 timeBreakdown=TimeBreakdownOutput(**state["timeBreakdown"]),
             )
             return {"_final": plan}
       Acceptance: Given manually constructed state dict, returns
                   a LessonPlan that .model_dump_json() produces
                   valid JSON matching the spec schema
```

---

### 0.6 Wire Pipeline + Endpoint (~60 min)

```
0.6.1 [M] ⭐ 🧠 build_graph() with linear edges
      - app/graph/pipeline.py:
        from langgraph.graph import StateGraph, START, END
        
        def build_graph():
            g = StateGraph(LessonPlanState)
            # Register all 10 nodes
            g.add_node("objectives", objectives.run)
            g.add_node("prerequisites", prerequisites.run)
            g.add_node("materials", materials.run)
            g.add_node("activities", activities.run)
            g.add_node("assessments", assessments.run)
            g.add_node("differentiation", differentiation.run)
            g.add_node("homework", homework.run)
            g.add_node("time_breakdown", time_breakdown.run)
            g.add_node("standards", standards.run)
            g.add_node("assemble", assemble.run)
            # Linear chain
            g.add_edge(START, "objectives")
            g.add_edge("objectives", "prerequisites")
            g.add_edge("prerequisites", "materials")
            g.add_edge("materials", "activities")
            g.add_edge("activities", "assessments")
            g.add_edge("assessments", "differentiation")
            g.add_edge("differentiation", "homework")
            g.add_edge("homework", "time_breakdown")
            g.add_edge("time_breakdown", "standards")
            g.add_edge("standards", "assemble")
            g.add_edge("assemble", END)
            return g.compile()
        
        _graph = build_graph()  # compile once at import
        
        async def run_pipeline(req) -> LessonPlan:
            initial_state = req.model_dump()
            result = await _graph.ainvoke(initial_state)
            return result["_final"]
      Acceptance: build_graph() compiles without error

0.6.2 [S] ⭐ 🌐 POST /generate endpoint
      - app/main.py — add:
        from app.schemas.inputs import GenerateRequest
        from app.schemas.outputs import LessonPlan
        from app.graph.pipeline import run_pipeline
        
        @app.post("/generate", response_model=LessonPlan)
        async def generate(req: GenerateRequest) -> LessonPlan:
            return await run_pipeline(req)
      Acceptance: Endpoint registered. Shows in /docs Swagger UI
```

---

### 0.7 End-to-End Test — THE MOMENT OF TRUTH (~30 min)

```
0.7.1 [M] ⭐ 🧪 ✅ Full end-to-end Mode A test
      - Start the server: uv run uvicorn app.main:app --reload
      - In another terminal, run:
        curl -X POST http://localhost:8000/generate \
          -H "Content-Type: application/json" \
          -d '{
            "grade": "7",
            "subject": "Science",
            "topic": "Photosynthesis",
            "duration": 45,
            "board": "CBSE",
            "teachingStyle": "Activity-based",
            "depth": "Standard"
          }'
      - Wait 30-90 seconds (9 sequential Gemini calls)
      - Save the output: ... | python -m json.tool > test_output.json
      
      VALIDATE THE OUTPUT YOURSELF:
      ✅ Is the response valid JSON?
      ✅ Does it have all 9 top-level fields?
      ✅ objectives: 4-6 items, each starts with Bloom verb?
      ✅ prerequisites: 3-5 specific items?
      ✅ materials: 5-8 items, mix of types?
      ✅ activities.intro: ≥3 sentences, teacher-facing?
      ✅ activities.instruction: ≥3 sentences, references materials?
      ✅ activities.guidedPractice: teacher-led with students?
      ✅ activities.independentPractice: student-led?
      ✅ activities.closure: recap + understanding check?
      ✅ assessment.formative: quick in-class check?
      ✅ assessment.summative: actual questions written out?
      ✅ differentiation.slowLearners: ≥3 concrete strategies?
      ✅ differentiation.advancedLearners: ≥3 concrete strategies?
      ✅ homework: 2-3 specific tasks, not a copy of activities?
      ✅ timeBreakdown: all 5 values sum to 45?
      ✅ standards: 3-5 items referencing CBSE + Science?
      
      If ANY check fails: identify which node produced weak output
      → go back to that prompt (0.4.x) → iterate → retest
      
      Acceptance: Full LessonPlan JSON returned. All checks pass.
                  You read the output and it looks like something
                  a real Grade 7 Science teacher could use

0.7.2 [S] ✅ Second test with different inputs
      - Test with: Grade 10, Math, "Quadratic Equations", 60 min, ICSE
      - Same validation checklist as above
      - Especially check: timeBreakdown sums to 60 (not 45)
      - Check: standards reference ICSE and Math
      Acceptance: Both test cases produce quality, valid output

0.7.3 [S] 📚 Commit everything
      - git add -A
      - git commit -m "S0: Mode A end-to-end working locally"
      - git push origin main
      Acceptance: Code on GitHub. You have a working Mode A MVP
```

---

### S0 Checkpoint

```
✅ uv project initialized with all dependencies
✅ Folder structure matches Architecture Doc
✅ Gemini API key tested and working
✅ /health endpoint returns 200
✅ All 9 Pydantic section models defined
✅ GeminiClient + retry helper working
✅ ALL 9 Mode A prompts written and validated in AI Studio (3x each)
✅ ALL 9 generation nodes coded and individually tested
✅ assemble node builds LessonPlan from state
✅ LangGraph pipeline compiles and runs end-to-end
✅ POST /generate returns valid LessonPlan for 2 different inputs
✅ Output manually reviewed and quality-approved by you
✅ Code committed and pushed
✅ MODE A WORKS. Everything else is layering on top of this
```

---

# S1 — Stabilize, Unit Tests, Prompt Iteration, Stage Deploy (Days 2–5)

**Goal:** Harden what you built on Day 1. Add tests. Iterate weak prompts. Deploy to staging.

### 1.1 Unit Tests (Day 2)

```
1.1.1 [M] 🧪 Schema validation tests
      - tests/unit/test_schemas.py
      - For each of the 9 section models: 1 valid test + 1 invalid test
      - For GenerateRequest: valid, missing field, bad board, negative duration
      - For LessonPlan: compose from valid sub-models
      Acceptance: ≥14 tests, all passing, <1 second

1.1.2 [M] 🧪 LLM retry helper tests (mocked, no real Gemini calls)
      - tests/unit/test_llm_retry.py
      - Mock GeminiClient to test: success-first, success-on-retry,
        fail-after-max-retries
      Acceptance: 3 tests, all passing

1.1.3 [S] 🧪 Prompt loader tests
      - tests/unit/test_prompt_loader.py
      - Test: loads existing prompt, raises on missing
      Acceptance: 2 tests passing

1.1.4 [S] 🧪 TimeBreakdown sum validation test
      - Test that sum != duration raises ValueError in the node
      Acceptance: Test passes
```

### 1.2 Prompt Iteration Pass (Day 3)

```
1.2.1 [M] 📝 ✅ Re-run full pipeline 5 times, score each output
      - Run POST /generate 5 times with the same Photosynthesis input
      - For each output, rate each section 1-5 (1=bad, 5=excellent)
      - Identify the 2-3 weakest sections across all 5 runs
      Acceptance: You have a spreadsheet/notes showing which prompts
                  need work and which are consistently strong

1.2.2 [L] 📝 ✅ Iterate the weakest prompts
      - Take the 2-3 weakest prompts from 1.2.1
      - For each: open AI Studio → adjust prompt → test 3x → repeat
      - Common fixes:
        • Too vague → add "be specific, for example..."
        • Too short → add "each section must be AT LEAST 3-4 sentences"
        • Wrong tone → add "write as teacher instructions, not student text"
        • Missing references → add "reference the materials/objectives listed above"
      - Update the .txt files with improved prompts
      - Re-run the full pipeline and verify improvement
      Acceptance: All 9 sections score ≥3/5 across 3 consecutive runs

1.2.3 [S] 📝 ✅ Test with 3 more diverse inputs
      - Test 1: Grade 5, EVS, "Water Cycle", 30 min, CBSE, Lecture-based, Basic
      - Test 2: Grade 12, Physics, "Electromagnetic Induction", 60 min, ICSE, Activity-based, Advanced
      - Test 3: Grade 3, English, "Parts of Speech - Nouns", 40 min, CBSE, Activity-based, Standard
      - For each: manually review quality. Note any prompt that fails
        on a different grade/subject combination
      Acceptance: Prompts generalize across grades, subjects, and boards
```

### 1.3 Observability + Error Handling (Day 4)

```
1.3.1 [M] 🌐 Structured JSON logging + request_id middleware
      - app/observability/logging.py
      - Every log line = valid JSON with ts, level, request_id, message
      - Log: request start, each node completion (with duration_ms,
        tokens_in, tokens_out), request completion, errors
      Acceptance: Tail logs during /generate → see 10 node_complete entries

1.3.2 [S] 🌐 Error responses for LLM failures
      - If pipeline fails after retries → return 502 with
        {"error": "generation_failed", "section": "<which>", "detail": "..."}
      - If Gemini is down → 503 {"error": "upstream_unavailable"}
      Acceptance: Kill your Gemini key temporarily → /generate returns 503
```

### 1.4 Staging Deployment (Day 5)

```
1.4.1 [L] 🐳 Multi-stage Dockerfile
      - Builder: ghcr.io/astral-sh/uv:python3.11-bookworm-slim
        → uv sync --frozen --no-dev

        
      - Runtime: python:3.11-slim → copy .venv + app/
      - .dockerignore: .venv, .env, __pycache__, tests/, .git/
      - Test locally: docker build + docker run + curl /health
      Acceptance: Container builds <2 min. /health and /generate work in container

1.4.2 [M] 🐳 Deploy to staging (Render / Railway / Fly)
      - Connect repo to platform
      - Set env vars: GEMINI_API_KEY, MODEL_NAME_HEAVY, MODEL_NAME_LIGHT
      - Health check path: /health
      - Wait for deploy
      Acceptance: Public HTTPS URL. /health returns 200

1.4.3 [S] 🧪 ✅ Smoke test A1 + A2 against staging URL
      - curl POST /generate with both test payloads against HTTPS URL
      Acceptance: Both return valid LessonPlan over HTTPS

1.4.4 [S] 📚 Update README with staging URL + curl examples
      Acceptance: README has setup + run + test + staging URL
```

### S1 Checkpoint

```
✅ ≥20 unit tests passing
✅ Prompts iterated — all sections score ≥3/5 quality
✅ Prompts tested across 5 different grade/subject combos
✅ Structured logging with request_id working
✅ Error responses for LLM failures
✅ Dockerfile builds and runs
✅ Mode A deployed to staging HTTPS URL
✅ MILESTONE M1 ACHIEVED — Mode A shippable
```

---

# S2 — Mode B: PDF Upload + Chapter Grounding (Days 6–10)

**Goal:** Add PDF chapter support using Approach 3 (Gemini native PDF reading).
Node.js backend sends the actual PDF file to the AI backend. AI backend uploads
it to Gemini Files API. Gemini reads the PDF natively — text, tables, diagrams,
equations all understood. chapter_extraction node compresses it into a small
chapterContext. All 9 downstream nodes use that small context (not the full PDF).

**Architecture Decision: Approach 3 — Gemini Native PDF**
- Node.js sends PDF as multipart/form-data file upload
- AI backend uploads PDF bytes to Gemini Files API → receives file URI
- chapter_extraction node sends [file URI + extraction prompt] to Gemini
- Gemini reads the PDF directly (sees diagrams, tables, equations)
- Returns structured chapterContext (~2000 chars)
- All 9 pipeline nodes use chapterContext only — PDF never sent again
- Token cost: ~5000 for chapter_extraction (once) + ~800 avg per node ✅

---

### 2.0 PDF Upload Infrastructure (Day 6 — NEW for Approach 3)

```
2.0.1 [S] ⭐ 📐 Add python-multipart dependency + geminiFileUri to state
      - uv add python-multipart
        (required by FastAPI to receive file uploads)
      - Add geminiFileUri: Optional[str] to LessonPlanState in state.py
        This field carries the Gemini Files API URI through the pipeline.
        Only chapter_extraction reads it — all other nodes ignore it.
      Acceptance: uv run python -c "import app.graph.state" works.
                  LessonPlanState has geminiFileUri field.

2.0.2 [M] ⭐ 🔌 PDF uploader utility
      - app/utils/pdf_uploader.py:
        def upload_pdf_to_gemini(pdf_bytes: bytes) -> str
          → uploads PDF bytes to Gemini Files API using get_gemini_client()
          → returns file URI string (e.g. "files/abc123xyz")
          → file is stored in Gemini for 48 hours (sufficient for one request)
      - Keep it simple: one function, one responsibility
      
      QUICK TEST:
      - uv run python -c "
        from app.utils.pdf_uploader import upload_pdf_to_gemini
        with open('any_test.pdf', 'rb') as f:
            uri = upload_pdf_to_gemini(f.read())
        print('URI:', uri)
        assert uri.startswith('files/')
        print('✅ PDF upload works')
        "
      Acceptance: Returns a valid Gemini file URI starting with "files/"

2.0.3 [M] ⭐ 🔌 generate_structured_with_file() in client.py
      - Add new function to app/llm/client.py:
        def generate_structured_with_file(
            prompt: str,
            file_uri: str,
            response_schema: type[BaseModel],
            model: str,
        ) -> BaseModel
      - Sends a MULTIMODAL message to Gemini:
        contents = [
            {"file_data": {"file_uri": file_uri, "mime_type": "application/pdf"}},
            {"text": prompt}
        ]
      - Uses response_mime_type="application/json" + response_schema same as
        generate_structured()
      - Raises ValueError if response.parsed is None
      
      Why a separate function: generate_structured() takes a single text
      prompt string. Multimodal calls require a list of content parts
      (file + text). Keeping them separate avoids a confusing optional
      parameter and makes both functions easier to test.
      
      Acceptance: Call with a real PDF URI + extraction prompt →
                  Gemini returns a parsed Pydantic instance

2.0.4 [M] ⭐ 🌐 POST /generate-with-pdf endpoint
      - Add to app/main.py:
        @app.post("/generate-with-pdf", response_model=LessonPlan)
        async def generate_with_pdf(
            grade: str = Form(...),
            subject: str = Form(...),
            topic: str = Form(...),
            duration: int = Form(...),
            board: str = Form(...),
            teachingStyle: str = Form(...),
            depth: str = Form(...),
            pdf_file: UploadFile = File(...),
        ) -> LessonPlan
      
      Steps inside the endpoint:
        1. Read PDF bytes: pdf_bytes = await pdf_file.read()
        2. Upload to Gemini: file_uri = upload_pdf_to_gemini(pdf_bytes)
        3. Build initial state with all form fields + geminiFileUri=file_uri
        4. Run pipeline (same run_pipeline function, pipeline detects
           geminiFileUri and routes through chapter_extraction)
        5. Return LessonPlan
      
      Error handling (same as /generate):
        - 413 if PDF > MAX_PDF_SIZE_MB (add to config, default 20MB)
        - 502 RuntimeError → "Generation failed. Please retry."
        - 503 ValueError → "Upstream AI service unavailable"
      
      Add MAX_PDF_SIZE_MB=20 to config.py + .env.example
      
      Acceptance: Endpoint shows in /docs Swagger UI.
                  Accepts multipart/form-data with PDF file.
                  Returns 413 for oversized PDFs.
```

---

### 2.1 Chapter Extraction Foundation (Day 6)

```
2.1.1 [S] 📐 Add ChapterContext Pydantic model
      - Add ChapterContext model to app/schemas/sections.py:
        class ChapterContext(BaseModel):
            concepts: list[str]
            definitions: list[str]
            examples: list[str]
            exercises: list[str]
            subtopics: list[str]
            learningFlow: Optional[str]
      - This model is the output of the chapter_extraction node
      - Already added in S0 ahead of schedule — verify it exists
      Acceptance: ChapterContext imports and validates correctly

2.1.2 [M] ⭐ 📝 ✅ Write + validate: chapter_extraction.txt
      - APPROACH 3: Prompt is pure extraction instructions only.
        NO {chapterPdfText} placeholder — the PDF is sent as a file
        reference by the node, not embedded in the text prompt.
      - Role: "You are a textbook analyst reading a school chapter PDF"
      - Task: Extract structured information from the attached PDF
      - Key constraints:
        • Read the ENTIRE PDF before extracting
        • Extract ONLY what is present in the PDF — do NOT add own knowledge
        • Copy exercises VERBATIM from the chapter (word for word)
        • Describe any diagrams or figures you can see
        • Return empty list [] for any section with no content
        • Preserve the chapter's exact terminology and phrasing
      
      VALIDATE IN AI STUDIO (Approach 3 — with real PDF):
      - Go to AI Studio: https://aistudio.google.com
      - Click "Add file" → upload a real NCERT Class 7 Science chapter PDF
        (download free from ncert.nic.in)
      - Paste the chapter_extraction.txt prompt text
      - Run 3x
      - Check each run:
        ✅ concepts list matches chapter headings/key terms?
        ✅ definitions exactly as written in the chapter?
        ✅ exercises copied word-for-word from the chapter?
        ✅ diagrams described (if any)?
        ✅ NO invented content not in the PDF?
      Acceptance: 3/3 runs extract real chapter content, zero fabrication.
                  Exercises match the actual textbook word for word.

2.1.3 [M] 🧠 chapter_extraction node + conditional routing
      - app/nodes/chapter_extraction.py:
        def run(state: LessonPlanState) -> dict:
            file_uri = state["geminiFileUri"]
            prompt = load_prompt("chapter_extraction")
            
            output: ChapterContext = call_with_retry_file(
                prompt=prompt,
                file_uri=file_uri,
                response_schema=ChapterContext,
                model=_settings.model_name_heavy,
            )
            return {"chapterContext": output.model_dump()}
      
      - Add call_with_retry_file() to app/llm/retry.py:
        Same as call_with_retry() but calls generate_structured_with_file()
        instead of generate_structured()
      
      - Update app/graph/pipeline.py:
        Change conditional entry edge:
          geminiFileUri present in state → chapter_extraction
          geminiFileUri absent → objectives (Mode A, skip extraction)
        Add edge: chapter_extraction → objectives
      
      Acceptance:
        - Mode A (/generate, no PDF): geminiFileUri absent → skips to objectives ✓
        - Mode B (/generate-with-pdf): geminiFileUri present → chapter_extraction
          runs → chapterContext set → continues to objectives ✓
```

---

### 2.2 Activate Mode B in Nodes + Validate in AI Studio (Days 7–8)

**NO new prompt files needed.** The 9 prompts from S0 already have
`{chapter_block}` and `{grounding_instruction}` placeholders. Now you
fill them with real chapter data (from chapterContext) and validate.

```
2.2.1 [M] ⭐ 🧠 Verify all 7 nodes already fill chapter placeholders
      - The build_chapter_block() function in app/utils/chapter_context.py
        was already built in S0. It reads chapterContext (set by
        chapter_extraction) and returns (chapter_block, grounding_instruction).
      - All 7 nodes already call build_chapter_block(state.get("chapterContext"))
      - Verify by running the pipeline with a Mode B request and checking
        that chapterContext appears in the node prompts
      
      Per-node grounding_instruction specifics (already in build_chapter_block,
      verify these are correct):
        • objectives: "Extract objectives FROM the chapter concepts"
        • prerequisites: "Infer from the chapter's introductory section"
        • materials: "Include materials/apparatus mentioned in the chapter.
          Add 'Textbook: [topic] chapter' as first material"
        • activities: "Follow the chapter's learning flow. Use chapter
          examples in guided practice. Use chapter exercises in
          independent practice"
        • assessments: "Use chapter exercises for summative assessment.
          Use chapter in-text questions for formative"
        • differentiation: "Simplify chapter exercises for slow learners.
          Extend hardest chapter problems for advanced learners"
        • homework: "Assign from chapter's end-of-chapter questions"
      
      Acceptance: Mode A still works (chapter_block is empty string).
                  Mode B: print the prompt before Gemini call →
                  see CHAPTER CONTEXT block with real chapter data.

2.2.2 [M] ⭐ 📝 ✅ Validate ALL 9 prompts in Mode B via AI Studio
      - Use the chapterContext JSON extracted in 2.1.2 validation
      - For each of the 9 generation prompts:
        1. Open AI Studio
        2. Paste the prompt text with all variables filled in
        3. Fill {chapter_block} with the extracted chapterContext JSON
        4. Fill {grounding_instruction} with the node-specific text from 2.2.1
        5. Run 3x
        6. Check: is the output grounded in the chapter?
        7. Check: does it invent anything NOT in the chapter?
      - Spend extra time on activities and assessments (most important)
      Acceptance: All 7 grounded prompts produce chapter-based output
                  3/3 times in AI Studio. No fabrication detected.

2.2.3 [M] 🧪 ✅ Acceptance test A3: Mode B end-to-end with real PDF
      - POST /generate-with-pdf with a real NCERT chapter PDF attached
      - Use multipart/form-data:
        grade=7, subject=Science, topic=Photosynthesis,
        duration=45, board=CBSE, teachingStyle=Activity-based,
        depth=Standard, pdf_file=<chapter4.pdf>
      - Wait for full pipeline (~3-5 min on free tier: extraction + 9 nodes)
      - Manual review of the FULL output:
        ✅ Do objectives use terms from the chapter?
        ✅ Do activities follow the chapter's learning flow?
        ✅ Does summative assessment use actual chapter exercises?
        ✅ Does homework reference chapter questions by number/page?
        ✅ Are any chapter diagrams referenced in activities?
        ✅ Is there ANY content invented that's not in the PDF?
      - ≥90% of factual content must be traceable to the input PDF
      Acceptance: Lesson plan is clearly grounded in the actual PDF.
                  A teacher reading both the PDF and the plan can verify
                  the match.

2.2.4 [S] 🧪 Edge cases
      - Oversized PDF (>MAX_PDF_SIZE_MB): returns 413 immediately ✓
      - Short chapter (<200 words): returns best-effort plan, no crash ✓
      - PDF with only images (scanned): Gemini still extracts via OCR ✓
      - Mode A regression: POST /generate (no PDF) still works ✓
      Acceptance: All 4 cases handled without 500 errors
```

---

### S2 Checkpoint

```
✅ python-multipart installed
✅ geminiFileUri field added to LessonPlanState
✅ upload_pdf_to_gemini() uploads PDF → returns valid Gemini file URI
✅ generate_structured_with_file() sends [PDF file + prompt] to Gemini
✅ call_with_retry_file() wraps multimodal calls with retry logic
✅ POST /generate-with-pdf endpoint accepts multipart/form-data
✅ chapter_extraction.txt prompt validated in AI Studio with real PDF (3x)
✅ chapter_extraction node reads file URI → calls Gemini → sets chapterContext
✅ Pipeline routing: geminiFileUri present → chapter_extraction, else → objectives
✅ All 7 grounded nodes fill chapter_block from chapterContext (not raw PDF)
✅ All 9 prompts validated in Mode B in AI Studio (3x each)
✅ Mode A still works (regression — no geminiFileUri → skips extraction)
✅ Mode B produces chapter-grounded output (A3 passes with real PDF)
✅ Edge cases handled (oversized PDF → 413, short chapter → best-effort)
✅ TOTAL prompt files: 10 (9 generation + 1 chapter_extraction)
✅ MILESTONE M2 ACHIEVED — Mode B with native PDF reading working
```

---




---

# S4 — Hardening, Production Deploy, Handover (Days 14–17)

```
4.1.1 [M] 🧪 Full integration test suite (I1-I5)
4.1.2 [S] 🧪 Acceptance test A5 (short chapter edge case)
4.1.3 [S] 🌐 /health checks Gemini connectivity
4.2.1 [M] 🐳 Production deploy (separate from staging)
4.2.2 [M] 🧪 ✅ All 5 acceptance tests against production
4.3.1 [M] 📚 Final README polish
4.3.2 [S] 📚 Tag v1.0.0 release
4.4.1 [XL] BUFFER — final bug-bash + demo prep
```

### S4 Checkpoint

```
✅ All tests pass on production
✅ README handover-ready
✅ v1.0.0 tagged
✅ Demo script works end-to-end
✅ MVP COMPLETE 🚀
```

---

## Complete Prompt File Inventory

| # | File | Modes | Sprint | Node | Input type | Validated? |
|---|---|---|---|---|---|---|
| 1 | `objectives.txt` | A+B | S0 (0.4.1) | objectives | Text prompt + `{chapter_block}` placeholder | ✅ Mode A 3x, Mode B 3x |
| 2 | `prerequisites.txt` | A+B | S0 (0.4.2) | prerequisites | Text prompt + `{chapter_block}` placeholder | ✅ Mode A 3x, Mode B 3x |
| 3 | `materials.txt` | A+B | S0 (0.4.3) | materials | Text prompt + `{chapter_block}` placeholder | ✅ Mode A 3x, Mode B 3x |
| 4 | `activities.txt` | A+B | S0 (0.4.4) | activities | Text prompt + `{chapter_block}` placeholder | ✅ Mode A 3x + iteration, Mode B 3x |
| 5 | `assessments.txt` | A+B | S0 (0.4.5) | assessments | Text prompt + `{chapter_block}` placeholder | ✅ Mode A 3x, Mode B 3x |
| 6 | `differentiation.txt` | A+B | S0 (0.4.6) | differentiation | Text prompt + `{chapter_block}` placeholder | ✅ Mode A 3x, Mode B 3x |
| 7 | `homework.txt` | A+B | S0 (0.4.7) | homework | Text prompt + `{chapter_block}` placeholder | ✅ Mode A 3x, Mode B 3x |
| 8 | `time_breakdown.txt` | A only | S0 (0.4.8) | time_breakdown | Text prompt only (no grounding) | ✅ Mode A 3x × 3 durations |
| 9 | `standards.txt` | A only | S0 (0.4.9) | standards | Text prompt only (no grounding) | ✅ Mode A 3x |
| 10 | `chapter_extraction.txt` | B only | S2 (2.1.2) | chapter_extraction | **MULTIMODAL: [PDF file URI + text instructions]** | S2 (validate with real PDF in AI Studio) |
| 11 | `_regen_prefix.txt` | A+B | S3 (3.1.1) | all (regen) | Prepended to any node's prompt | S3 |

**Total: 11 prompt files.**
- Prompts 1–9: text-based, each handles Mode A (empty placeholders) and Mode B (filled placeholders)
- Prompt 10: **multimodal** — no text variables, just extraction instructions sent alongside the PDF file
- Prompt 11: regeneration prefix, prepended during regen flow

**Key difference from original plan:**
`chapter_extraction.txt` does NOT take `{chapterPdfText}` as a text variable.
Instead, the node sends the prompt text alongside a PDF file reference (Gemini Files API URI).
Gemini reads the PDF directly — this is why it handles images, tables, and equations correctly.

---

## Task Summary

| Sprint | Days | Tasks | Prompts Created | Est. Hours | Theme |
|---|---|---|---|---|---|
| S0 | Day 1 (TODAY) | 25 tasks | 9 prompts (with Mode B placeholders) | ~10h | Mode A end-to-end locally |
| S1 | Days 2–5 | 12 tasks | 0 (iterate existing) | ~14h | Tests + iteration + staging deploy |
| S2 | Days 6–10 | 11 tasks | 1 prompt (chapter_extraction — multimodal) | ~16h | Mode B: PDF upload + Gemini native reading + grounding |
| S3 | Days 11–13 | 9 tasks | 1 prompt (_regen_prefix) | ~12h | Regeneration |
| S4 | Days 14–17 | 8 tasks | 0 | ~10h | Hardening + prod + handover |
| **Total** | **17 days** | **65 tasks** | **11 prompt files** | **~62h actual** | |

**S2 task count breakdown (+4 new tasks vs original plan):**
- 2.0.1 Add python-multipart + geminiFileUri to state [NEW]
- 2.0.2 PDF uploader utility [NEW]
- 2.0.3 generate_structured_with_file() [NEW]
- 2.0.4 POST /generate-with-pdf endpoint [NEW]
- 2.1.1 ChapterContext model (verify exists from S0)
- 2.1.2 chapter_extraction.txt (multimodal — changed from text-based)
- 2.1.3 chapter_extraction node + routing (uses file URI — changed)
- 2.2.1 Verify 7 nodes fill chapter placeholders (already done in S0)
- 2.2.2 Validate all 9 prompts Mode B in AI Studio
- 2.2.3 Acceptance test A3 with real PDF upload
- 2.2.4 Edge cases

---

## Critical Path

```
0.1.1 Setup
  → 0.2.1 Schemas
    → 0.3.1 Gemini client
      → 0.4.1-0.4.9 ALL 9 PROMPTS WRITTEN (with Mode B placeholders) + AI STUDIO VALIDATED
        → 0.5.2-0.5.11 ALL NODES BUILT (with chapter_block conditional pattern)
          → 0.6.1 Pipeline wired
            → 0.6.2 /generate endpoint
              → 0.7.1 END-TO-END TEST (Mode A works TODAY)
                → 1.2.1-1.2.3 Prompt iteration pass
                  → 1.4.1-1.4.2 Staging deploy (M1)
                    → 2.1.2 chapter_extraction prompt (only NEW prompt file)
                      → 2.2.1 Fill placeholders in node code for Mode B
                        → 2.2.2 Validate all prompts in Mode B via AI Studio
                          → 2.2.3 Acceptance A3 passes
                            → 3.1.1 _regen_prefix prompt (last NEW prompt file)
                              → 3.1.4 Wire regen into nodes
                                → 4.2.1 Production deploy (M2)
```

---

## Risk Buffers

| Risk | Mitigation | Buffer |
|---|---|---|
| Day 1 takes >10 hours | Cut 0.5.9 (standards) to a simpler prompt, iterate in S1 | Borrow 2h from S1 |
| activities prompt quality poor | 0.4.4 has extra iteration time. S1.1.2.2 is a full iteration pass | +2h in S1 |
| Prompts don't generalize across subjects | S1.1.2.3 tests 3 diverse inputs — caught early | +1h iteration in S1 |
| chapter_extraction misses key content | S2.2.1.2 validates with real NCERT chapter in AI Studio | +1h iteration in S2 |
| _pdf prompts still hallucinate | Grounding instruction is explicit in every _pdf prompt. A3 test catches it | +2h iteration in S2 |

---

*Last updated: 6 May 2026*
