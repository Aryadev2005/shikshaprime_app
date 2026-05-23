**AI LESSON PLANNER — AI SERVICE REQUIREMENTS DOCUMENT (WITH PDF MODE)**

**Audience:** AI Developer 

**Scope:** Only the AI generation layer 

**Purpose:** Define the exact inputs, outputs, and generation rules for the AI service, including optional PDF-based chapter extraction.

**1\. INPUTS TO THE AI SERVICE**

The AI service must support **two modes**:

**MODE A — Topic-Based Lesson Plan (No PDF)**

**1.1 Required Input Fields**

{

  "grade": "7",

  "subject": "Science",

  "topic": "Photosynthesis",

  "duration": 45,

  "board": "CBSE",

  "teachingStyle": "Activity-based",

  "depth": "Standard"

}

MODE B — Chapter-Based Lesson Plan (PDF Included)

1.2 Required Input Fields

{

  "grade": "7",

  "subject": "Science",

  "topic": "Photosynthesis",

  "duration": 45,

  "board": "CBSE",

  "teachingStyle": "Activity-based",

  "depth": "Standard",

  "chapterPdfText": "\<extracted text from PDF\>"

}

**Important:** The AI service will **not** receive the PDF file directly. It will receive **already extracted text** from the PDF as a string (chapterPdfText). PDF parsing is handled outside the AI layer.

**2\. OUTPUTS REQUIRED FROM THE AI SERVICE**

The AI must always return strict JSON in the following structure.

2.1 Final Lesson Plan JSON Structure

{

  "objectives": \[\],

  "prerequisites": \[\],

  "materials": \[\],

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

  "standards": \[\],

  "timeBreakdown": {}

}

**2.2 Output Rules**

* Must be **valid JSON**

* Must follow the **exact schema**

* Must not add or remove fields

* Must not include explanations or prose

* Must not include markdown

* Must not include comments

* Must not include natural-language descriptions outside JSON

**3\. AI GENERATION TASKS**

The AI must generate the following content based on the inputs (and optionally the chapter text):

**3.1 Learning Objectives**

* Use measurable verbs (Bloom’s taxonomy)

* Must align with grade, subject, topic, and board

* If PDF text is provided → extract objectives from chapter content

**3.2 Prerequisites**

* Prior knowledge students should have

* If PDF text is provided → infer prerequisites from chapter introduction

**3.3 Materials Required**

* Teaching aids

* Digital resources

* Classroom materials

* If PDF text is provided → extract materials mentioned in chapter

**3.4 Activities**

AI must generate 5 structured activity sections:

* intro

* instruction

* guidedPractice

* independentPractice

* closure

**3.5 Assessment**

* Two types:

* **Formative**

* **Summative**

* If PDF text is provided →

* Use exercises, questions, or examples from the chapter

* **3.6 Differentiation**

* Two fields:

* slowLearners

* advancedLearners

* If PDF text is provided →

* Adapt based on chapter difficulty

* If PDF text is provided →

* Activities must follow the chapter’s flow

* Use examples, diagrams, or explanations from the chapter

**3.7 Homework**

* Must reinforce the topic

* If PDF text is provided →

  * Use end-of-chapter exercises

  * Use practice questions

**3.8 Standards**

AI must generate:

* Board-specific learning outcomes

* Competency-based statements

(Backend will validate these.)

**3.9 Time Breakdown**

AI must generate a breakdown like:

{

  "intro": 5,

  "instruction": 15,

  "guidedPractice": 10,

  "independentPractice": 10,

  "closure": 5

}

Total must equal **duration** provided in input.

**4\. PDF-BASED GENERATION RULES**

When chapterPdfText is provided:

**4.1 AI must extract:**

* Key concepts

* Definitions

* Important explanations

* Examples

* Exercises

* Learning flow

* Subtopics

* Diagrams (text description only)

**4.2 AI must use extracted content to:**

* Build objectives

* Build activities

* Build assessments

* Build homework

* Build materials list

* Build differentiation strategies

**4.3 AI must NOT:**

* Invent content not present in the chapter

* Hallucinate facts

* Add external examples unless necessary

**5\. SECTION-WISE GENERATION (MULTI-STEP)**

The AI developer must implement **separate prompts** for each stage:

1. Generate objectives

2. Generate prerequisites

3. Generate materials

4. Generate activities

5. Generate assessments

6. Generate differentiation

7. Generate homework

8. Generate time breakdown

9. Generate standards

10. Assemble final JSON

Each stage returns **only JSON**, not text.

**6\. REGENERATION REQUIREMENTS**

When the input includes:

{

  "regenerateSection": "activities.guidedPractice",

  "existingPlan": { ... }

}

The AI must:

* Regenerate **only that section**

* Use the existing plan as context

* Use chapterPdfText if provided

* Return JSON containing **only the regenerated section**

Example output:

{

  "guidedPractice": "..."

}

**7\. STRICT RULES THE AI MUST FOLLOW**

**7.1 Must Do**

* Always output JSON

* Follow the exact schema

* Use grade-appropriate language

* Align content with subject \+ topic

* Use measurable verbs

* Ensure internal consistency

* Use chapter content when provided

**7.2 Must NOT Do**

* No markdown

* No explanations

* No commentary

* No extra fields

* No hallucinated standards

* No prose outside JSON

**8\. SUMMARY FOR THE AI DEVELOPER**

**You must implement:**

* Topic-based generation

* PDF-based generation

* Section-wise prompt templates

* Multi-step generation

* Regeneration logic

* Strict JSON-only outputs

* Chapter-aware content extraction

* Standards generation

* Time breakdown generation

