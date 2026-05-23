# Regeneration API — Manual curl Test Commands

> **Before running any test:**
> 1. Start the server: `uv run uvicorn app.main:app --reload`
> 2. Server must be running at `http://localhost:8000`
> 3. Your `.env` must have a valid `GEMINI_API_KEY`

---

## UNIT TESTS (no Gemini API — instant)

```bash
uv run pytest tests/unit/test_regeneration.py -v
```

```bash
uv run pytest tests/unit -v
```

---

## HEALTH CHECK

```bash
curl http://localhost:8000/health
```

**Expected:**
```json
{"status":"ok","version":"0.1.0"}
```

---

## TEST 1 — Regenerate top-level section: objectives (no instruction)

```bash
curl -X POST http://localhost:8000/regenerate \
  -H "Content-Type: application/json" \
  -d '{
    "regenerateSection": "objectives",
    "grade": "7",
    "subject": "Science",
    "topic": "Photosynthesis",
    "duration": 45,
    "board": "CBSE",
    "teachingStyle": "Activity-based",
    "depth": "Standard",
    "existingPlan": {
      "objectives": [
        "Define photosynthesis using the correct equation",
        "Explain the role of chlorophyll in capturing light"
      ],
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
      "standards": ["CBSE Science Grade 7.LP-S1: Define photosynthesis"],
      "timeBreakdown": {
        "intro": 5,
        "instruction": 15,
        "guidedPractice": 9,
        "independentPractice": 11,
        "closure": 5
      }
    }
  }'
```

**Expected:** HTTP 200 — only `"objectives"` key returned, array of strings
```json
{"objectives": ["...", "...", "..."]}
```

---

## TEST 2 — Regenerate sub-field: activities.guidedPractice (with user instruction)

```bash
curl -X POST http://localhost:8000/regenerate \
  -H "Content-Type: application/json" \
  -d '{
    "regenerateSection": "activities.guidedPractice",
    "grade": "7",
    "subject": "Science",
    "topic": "Photosynthesis",
    "duration": 45,
    "board": "CBSE",
    "teachingStyle": "Activity-based",
    "depth": "Standard",
    "userInstruction": "make it more student-led, not teacher-driven",
    "existingPlan": {
      "objectives": [
        "Define photosynthesis using the correct equation",
        "Explain the role of chlorophyll in capturing light"
      ],
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
      "standards": ["CBSE Science Grade 7.LP-S1: Define photosynthesis"],
      "timeBreakdown": {
        "intro": 5,
        "instruction": 15,
        "guidedPractice": 9,
        "independentPractice": 11,
        "closure": 5
      }
    }
  }'
```

**Expected:** HTTP 200 — only `"guidedPractice"` key returned, single string
```json
{"guidedPractice": "In pairs, students receive a blank flow diagram..."}
```

---

## TEST 3 — Regenerate sub-field: assessment.summative (with user instruction)

```bash
curl -X POST http://localhost:8000/regenerate \
  -H "Content-Type: application/json" \
  -d '{
    "regenerateSection": "assessment.summative",
    "grade": "7",
    "subject": "Science",
    "topic": "Photosynthesis",
    "duration": 45,
    "board": "CBSE",
    "teachingStyle": "Activity-based",
    "depth": "Standard",
    "userInstruction": "use MCQ questions instead of written answers",
    "existingPlan": {
      "objectives": [
        "Define photosynthesis using the correct equation",
        "Explain the role of chlorophyll in capturing light"
      ],
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
      "standards": ["CBSE Science Grade 7.LP-S1: Define photosynthesis"],
      "timeBreakdown": {
        "intro": 5,
        "instruction": 15,
        "guidedPractice": 9,
        "independentPractice": 11,
        "closure": 5
      }
    }
  }'
```

**Expected:** HTTP 200 — only `"summative"` key returned
```json
{"summative": "Q1 (MCQ): Which gas is released during photosynthesis? a) CO2 b) O2 c) N2 d) H2..."}
```

---

## TEST 4 — Regenerate entire activities section (all 5 phases)

```bash
curl -X POST http://localhost:8000/regenerate \
  -H "Content-Type: application/json" \
  -d '{
    "regenerateSection": "activities",
    "grade": "7",
    "subject": "Science",
    "topic": "Photosynthesis",
    "duration": 45,
    "board": "CBSE",
    "teachingStyle": "Activity-based",
    "depth": "Standard",
    "userInstruction": "use more hands-on experiments throughout",
    "existingPlan": {
      "objectives": [
        "Define photosynthesis using the correct equation",
        "Explain the role of chlorophyll in capturing light"
      ],
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
      "standards": ["CBSE Science Grade 7.LP-S1: Define photosynthesis"],
      "timeBreakdown": {
        "intro": 5,
        "instruction": 15,
        "guidedPractice": 9,
        "independentPractice": 11,
        "closure": 5
      }
    }
  }'
```

**Expected:** HTTP 200 — full `"activities"` object returned with all 5 phases
```json
{
  "activities": {
    "intro": "...",
    "instruction": "...",
    "guidedPractice": "...",
    "independentPractice": "...",
    "closure": "..."
  }
}
```

---

## TEST 5 — Regenerate homework with instruction

```bash
curl -X POST http://localhost:8000/regenerate \
  -H "Content-Type: application/json" \
  -d '{
    "regenerateSection": "homework",
    "grade": "7",
    "subject": "Science",
    "topic": "Photosynthesis",
    "duration": 45,
    "board": "CBSE",
    "teachingStyle": "Activity-based",
    "depth": "Standard",
    "userInstruction": "assign from textbook exercise questions only, no drawing tasks",
    "existingPlan": {
      "objectives": [
        "Define photosynthesis using the correct equation",
        "Explain the role of chlorophyll in capturing light"
      ],
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
      "standards": ["CBSE Science Grade 7.LP-S1: Define photosynthesis"],
      "timeBreakdown": {
        "intro": 5,
        "instruction": 15,
        "guidedPractice": 9,
        "independentPractice": 11,
        "closure": 5
      }
    }
  }'
```

**Expected:** HTTP 200 — only `"homework"` key returned
```json
{"homework": "Complete Q3 and Q5 from NCERT textbook Chapter 1 exercise..."}
```

---

## TEST 6 — Regenerate differentiation.slowLearners

```bash
curl -X POST http://localhost:8000/regenerate \
  -H "Content-Type: application/json" \
  -d '{
    "regenerateSection": "differentiation.slowLearners",
    "grade": "7",
    "subject": "Science",
    "topic": "Photosynthesis",
    "duration": 45,
    "board": "CBSE",
    "teachingStyle": "Activity-based",
    "depth": "Standard",
    "userInstruction": "focus on visual aids and peer support strategies",
    "existingPlan": {
      "objectives": [
        "Define photosynthesis using the correct equation",
        "Explain the role of chlorophyll in capturing light"
      ],
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
      "standards": ["CBSE Science Grade 7.LP-S1: Define photosynthesis"],
      "timeBreakdown": {
        "intro": 5,
        "instruction": 15,
        "guidedPractice": 9,
        "independentPractice": 11,
        "closure": 5
      }
    }
  }'
```

**Expected:** HTTP 200 — only `"slowLearners"` key returned
```json
{"slowLearners": "Pair slow learners with a stronger peer. Provide a colour-coded diagram..."}
```

---

## TEST 7 — Regenerate timeBreakdown

```bash
curl -X POST http://localhost:8000/regenerate \
  -H "Content-Type: application/json" \
  -d '{
    "regenerateSection": "timeBreakdown",
    "grade": "7",
    "subject": "Science",
    "topic": "Photosynthesis",
    "duration": 45,
    "board": "CBSE",
    "teachingStyle": "Activity-based",
    "depth": "Standard",
    "userInstruction": "give more time to independent practice, reduce instruction time",
    "existingPlan": {
      "objectives": [
        "Define photosynthesis using the correct equation",
        "Explain the role of chlorophyll in capturing light"
      ],
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
      "standards": ["CBSE Science Grade 7.LP-S1: Define photosynthesis"],
      "timeBreakdown": {
        "intro": 5,
        "instruction": 15,
        "guidedPractice": 9,
        "independentPractice": 11,
        "closure": 5
      }
    }
  }'
```

**Expected:** HTTP 200 — full `"timeBreakdown"` object returned, all 5 values must sum to 45
```json
{
  "timeBreakdown": {
    "intro": 4,
    "instruction": 10,
    "guidedPractice": 8,
    "independentPractice": 18,
    "closure": 5
  }
}
```

---

## VALIDATION TESTS (these should all FAIL with 422)

### FAIL TEST 1 — Unknown section name

```bash
curl -X POST http://localhost:8000/regenerate \
  -H "Content-Type: application/json" \
  -d '{
    "regenerateSection": "somethingFake",
    "grade": "7",
    "subject": "Science",
    "topic": "Photosynthesis",
    "duration": 45,
    "board": "CBSE",
    "teachingStyle": "Activity-based",
    "depth": "Standard",
    "existingPlan": {}
  }'
```

**Expected: HTTP 422** — `"not a valid regenerateSection"`

---

### FAIL TEST 2 — Missing required field (grade)

```bash
curl -X POST http://localhost:8000/regenerate \
  -H "Content-Type: application/json" \
  -d '{
    "regenerateSection": "objectives",
    "subject": "Science",
    "topic": "Photosynthesis",
    "duration": 45,
    "board": "CBSE",
    "teachingStyle": "Activity-based",
    "depth": "Standard",
    "existingPlan": {}
  }'
```

**Expected: HTTP 422** — `"grade"` field missing

---

### FAIL TEST 3 — Invalid depth value

```bash
curl -X POST http://localhost:8000/regenerate \
  -H "Content-Type: application/json" \
  -d '{
    "regenerateSection": "objectives",
    "grade": "7",
    "subject": "Science",
    "topic": "Photosynthesis",
    "duration": 45,
    "board": "CBSE",
    "teachingStyle": "Activity-based",
    "depth": "Expert",
    "existingPlan": {}
  }'
```

**Expected: HTTP 422** — depth must be `Basic`, `Standard`, or `Advanced`

---

### FAIL TEST 4 — Duration is zero

```bash
curl -X POST http://localhost:8000/regenerate \
  -H "Content-Type: application/json" \
  -d '{
    "regenerateSection": "objectives",
    "grade": "7",
    "subject": "Science",
    "topic": "Photosynthesis",
    "duration": 0,
    "board": "CBSE",
    "teachingStyle": "Activity-based",
    "depth": "Standard",
    "existingPlan": {}
  }'
```

**Expected: HTTP 422** — duration must be greater than 0

---

### FAIL TEST 5 — userInstruction too long (over 500 chars)

```bash
curl -X POST http://localhost:8000/regenerate \
  -H "Content-Type: application/json" \
  -d '{
    "regenerateSection": "objectives",
    "grade": "7",
    "subject": "Science",
    "topic": "Photosynthesis",
    "duration": 45,
    "board": "CBSE",
    "teachingStyle": "Activity-based",
    "depth": "Standard",
    "userInstruction": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "existingPlan": {}
  }'
```

**Expected: HTTP 422** — userInstruction exceeds max length

---

## SWAGGER UI (Easiest — no terminal needed)

Open in browser:
```
http://localhost:8000/docs
```

Click `POST /regenerate` → **Try it out** → paste any JSON body above → **Execute**

---

## WHAT TO CHECK IN EACH SUCCESSFUL RESPONSE

| Test | What to verify |
|---|---|
| TEST 1 — objectives | Response has ONLY `"objectives": [...]`, not the full plan |
| TEST 2 — activities.guidedPractice | Response has ONLY `"guidedPractice": "..."`, not all 5 phases |
| TEST 3 — assessment.summative | Response has ONLY `"summative": "..."`, MCQ format |
| TEST 4 — activities (full) | Response has `"activities"` with all 5 sub-fields |
| TEST 5 — homework | Response has ONLY `"homework": "..."` |
| TEST 6 — differentiation.slowLearners | Response has ONLY `"slowLearners": "..."` |
| TEST 7 — timeBreakdown | All 5 values sum to exactly 45 |
| With `userInstruction` | Output reflects the instruction given |
| Run same test twice | Both responses are DIFFERENT from each other |

---

## ALL VALID regenerateSection VALUES

```
objectives
prerequisites
materials
activities
activities.intro
activities.instruction
activities.guidedPractice
activities.independentPractice
activities.closure
assessment
assessment.formative
assessment.summative
differentiation
differentiation.slowLearners
differentiation.advancedLearners
homework
standards
timeBreakdown
timeBreakdown.intro
timeBreakdown.instruction
timeBreakdown.guidedPractice
timeBreakdown.independentPractice
timeBreakdown.closure
```
