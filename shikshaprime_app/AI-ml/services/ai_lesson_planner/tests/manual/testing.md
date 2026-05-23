 How to Test on Swagger UI — Step by Step

  ---
  Step 1 — Start the Server                                                                                                   

  Open your terminal and run:

  cd C:\Retechprime\shilkshaprime\ShikshaPrime_new\AI-ml\services\ai_lesson_planner
  uv run uvicorn app.main:app --reload

  You should see:
  INFO:     Uvicorn running on http://127.0.0.1:8000

  ---
  Step 2 — Open Swagger UI

  Open your browser and go to:
  http://localhost:8000/docs

  You will see a page like this:

  AI Lesson Planner

    GET  /health
    POST /generate
    POST /regenerate      ← this one
    POST /generate-with-pdf

  ---
  Step 3 — Click on POST /regenerate

  Click on the green POST button next to /regenerate.

  It will expand and show you the endpoint details.

  ---
  Step 4 — Click "Try it out"

  On the right side you will see a button that says Try it out — click it.

  The input box will become editable.

  ---
  Step 5 — Paste the JSON Body

  You will see a large text box with example JSON. Delete everything in that box and paste this:

  {
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
  }

  ---
  Step 6 — Click Execute

  Click the blue Execute button.

  Wait 15–40 seconds (one Gemini call is being made).

  ---
  Step 7 — Read the Response

  Scroll down. You will see three sections:

  Code — should be 200

  Response body — should look like:
  {
    "objectives": [
      "Identify the raw materials required for photosynthesis",
      "Describe how sunlight is used to produce glucose",
      "Compare photosynthesis in different lighting conditions",
      "Apply understanding of photosynthesis to explain why plants are producers"
    ]
  }

  Response headers — technical info, you can ignore this.

  ---
  Test Different Sections

  Change the regenerateSection value and the userInstruction to test different things. Here are ready-to-paste bodies:        

  ---
  Test — Regenerate guidedPractice with instruction

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
  }

  Response will have only:
  {"guidedPractice": "In pairs, students receive a blank flow diagram..."}

  ---
  Test — Regenerate assessment summative with MCQ instruction

  {
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
  }

  Response will have only:
  {"summative": "Q1 (MCQ): Which gas is released during photosynthesis? a) CO2  b) O2  c) N2  d) H2..."}

  ---
  Test — Validation error (wrong section name)

  Paste this — it should return 422 immediately without calling Gemini:

  {
    "regenerateSection": "somethingWrong",
    "grade": "7",
    "subject": "Science",
    "topic": "Photosynthesis",
    "duration": 45,
    "board": "CBSE",
    "teachingStyle": "Activity-based",
    "depth": "Standard",
    "existingPlan": {}
  }

  Response will be:
  {
    "detail": [
      {
        "msg": "Value error, 'somethingWrong' is not a valid regenerateSection..."
      }
    ]
  }

  ---