/**
 * generate_lesson_plan.js
 *
 * Supports two modes:
 *   Mode A — topic only, no PDF
 *   Mode C — topic + raw text extracted from a PDF (Approach 1)
 *
 * Usage:
 *   node generate_lesson_plan.js                              ← Mode A
 *   node generate_lesson_plan.js --pdf "C:\path\to\file.pdf" ← Mode C
 */

const fs   = require("fs");
const path = require("path");
const pdf  = require("pdf-parse");

// ── Lesson metadata — change these to match the chapter you are testing ──────
const LESSON_META = {
  grade:         "7",
  subject:       "Science",
  topic:         "Nutrition in Plants",
  duration:      45,
  board:         "CBSE",
  teachingStyle: "Activity-based",
  depth:         "Standard",      // "Basic" | "Standard" | "Advanced"
};

const API_URL  = "http://localhost:8000/generate";
const OUTPUT   = "lesson_plan_output.json";
const MAX_CHARS = 50_000;   // CHAPTER_TEXT_MAX_LENGTH in the API
const MIN_CHARS = 50;       // CHAPTER_TEXT_MIN_LENGTH in the API
// ────────────────────────────────────────────────────────────────────────────


// Parse --pdf argument from command line
function getPdfPath() {
  const args    = process.argv.slice(2);
  const flagIdx = args.indexOf("--pdf");
  if (flagIdx !== -1 && args[flagIdx + 1]) {
    return args[flagIdx + 1];
  }
  return null;
}


async function extractTextFromPdf(filePath) {
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`PDF not found: ${absolutePath}`);
  }

  const buffer = fs.readFileSync(absolutePath);
  const data   = await pdf(buffer);
  return data.text.trim();
}


async function callApi(payload) {
  const response = await fetch(API_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
    signal:  AbortSignal.timeout(620_000),  // 620s — just above server's 600s timeout
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${JSON.stringify(body, null, 2)}`);
  }

  return body;
}


function printSummary(plan) {
  console.log("\n══ LESSON PLAN ════════════════════════════════════════════");

  console.log(`\nOBJECTIVES (${plan.objectives.length}):`);
  plan.objectives.forEach(o => console.log(`  • ${o}`));

  console.log(`\nPREREQUISITES (${plan.prerequisites.length}):`);
  plan.prerequisites.forEach(p => console.log(`  • ${p}`));

  console.log(`\nMATERIALS (${plan.materials.length}):`);
  plan.materials.forEach(m => console.log(`  • ${m}`));

  console.log("\nACTIVITIES:");
  for (const [phase, text] of Object.entries(plan.activities)) {
    console.log(`  [${phase}] ${String(text).slice(0, 120)}...`);
  }

  console.log("\nASSESSMENT:");
  console.log(`  Formative : ${String(plan.assessment.formative).slice(0, 120)}...`);
  console.log(`  Summative : ${String(plan.assessment.summative).slice(0, 120)}...`);

  console.log("\nHOMEWORK:");
  console.log(`  ${String(plan.homework).slice(0, 200)}...`);

  console.log(`\nSTANDARDS (${plan.standards.length}):`);
  plan.standards.forEach(s => console.log(`  • ${s}`));

  const tb    = plan.timeBreakdown;
  const total = Object.values(tb).reduce((a, b) => a + b, 0);
  console.log(`\nTIME BREAKDOWN (total = ${total} min):`);
  for (const [phase, mins] of Object.entries(tb)) {
    console.log(`  ${phase}: ${mins} min`);
  }

  console.log("\n══════════════════════════════════════════════════════════");
}


async function main() {
  const pdfPath = getPdfPath();

  try {
    let payload;

    if (pdfPath) {
      // ── Mode C: extract text from PDF, send as chapterPdfText ──────────────
      console.log(`\nMode C — reading PDF: ${pdfPath}`);
      let rawText = await extractTextFromPdf(pdfPath);
      console.log(`Extracted ${rawText.length.toLocaleString()} characters`);

      if (rawText.length < MIN_CHARS) {
        throw new Error(
          `Extracted text is too short (${rawText.length} chars, minimum is ${MIN_CHARS}).\n` +
          `The PDF may be scanned/image-only and not contain selectable text.`
        );
      }

      if (rawText.length > MAX_CHARS) {
        rawText = rawText.slice(0, MAX_CHARS);
        console.log(`Truncated to ${MAX_CHARS.toLocaleString()} characters (API limit)`);
      }

      console.log("\n── Text preview (first 400 chars) ──────────────────────");
      console.log(rawText.slice(0, 400));
      console.log("────────────────────────────────────────────────────────");

      payload = { ...LESSON_META, chapterPdfText: rawText };

    } else {
      // ── Mode A: topic only, no PDF ──────────────────────────────────────────
      console.log("\nMode A — topic only (no PDF)");
      payload = { ...LESSON_META };
    }

    // ── Call the API ──────────────────────────────────────────────────────────
    console.log(`\nCalling ${API_URL}  (topic: "${LESSON_META.topic}")`);
    console.log("This takes 2–5 minutes on the free Gemini tier...\n");

    const plan = await callApi(payload);

    // ── Print and save ────────────────────────────────────────────────────────
    printSummary(plan);

    const outputPath = path.resolve(OUTPUT);
    fs.writeFileSync(outputPath, JSON.stringify(plan, null, 2), "utf-8");
    console.log(`\nFull lesson plan saved to: ${outputPath}`);

  } catch (err) {
    console.error("\nERROR:", err.message);

    if (err.message.includes("ECONNREFUSED") || err.message.includes("fetch failed")) {
      console.error(
        "\nCannot connect to the server.\n" +
        "Start it first:  uv run uvicorn app.main:app --reload"
      );
    }

    process.exit(1);
  }
}

main();
