import time
import uuid
from typing import Literal

from fastapi import FastAPI, File, Form, HTTPException, Request, Response, UploadFile

from app.config import VERSION, get_settings
from app.graph.pipeline import run_pipeline, run_pipeline_with_pdf, run_regen_pipeline
from app.graph.state import LessonPlanState
from app.observability.logging import configure_logging, get_logger, request_id_var
from app.schemas.inputs import GenerateRequest, RegenerateRequest
from app.schemas.outputs import LessonPlan
from app.utils.pdf_uploader import upload_pdf_to_gemini

settings = get_settings()
configure_logging(settings.log_level)

logger = get_logger(__name__)

app = FastAPI(
    title="AI Lesson Planner",
    description=(
        "AI generation layer for structured lesson plan creation "
        "using LangGraph + Google Gemini"
    ),
    version=VERSION,
)


@app.middleware("http")
async def _request_lifecycle(request: Request, call_next) -> Response:
    """Attach a UUID request_id to every request; log start and completion."""
    rid = f"req_{uuid.uuid4().hex[:settings.request_id_length]}"
    token = request_id_var.set(rid)
    start = time.monotonic()
    try:
        logger.info(f"request started path={request.url.path} method={request.method}")
        response = await call_next(request)
        duration_ms = int((time.monotonic() - start) * 1000)
        logger.info(
            f"request completed path={request.url.path} "
            f"status={response.status_code} duration_ms={duration_ms}"
        )
        return response
    finally:
        request_id_var.reset(token)


@app.get("/health", tags=["ops"])
async def health() -> dict:
    """Liveness check. Returns service status and version."""
    return {"status": "ok", "version": VERSION}


@app.post("/generate", response_model=LessonPlan, tags=["generation"])
async def generate(req: GenerateRequest) -> LessonPlan:
    """Generate a full structured lesson plan (Mode A — topic only).

    Supply grade/subject/topic/duration/board/teachingStyle/depth.
    Runs 9 sequential Gemini calls and returns a validated LessonPlan JSON.
    Expect 30–120 seconds depending on model tier and rate-limit pauses.
    """
    try:
        return await run_pipeline(req)
    except ValueError as exc:
        logger.error("pipeline configuration error: %s", exc)
        raise HTTPException(status_code=503, detail="Upstream AI service unavailable") from exc
    except RuntimeError as exc:
        logger.error("pipeline generation failed: %s", exc)
        raise HTTPException(status_code=502, detail="Generation failed. Please retry.") from exc
    except Exception as exc:
        # Catches unexpected errors e.g. google.genai.errors.ServerError (503 from Gemini)
        # that are not ValueError or RuntimeError. Prevents raw 500 crashes.
        logger.error("unexpected pipeline error: %s", exc)
        raise HTTPException(status_code=503, detail="Upstream AI service unavailable") from exc


@app.post("/regenerate", tags=["generation"])
async def regenerate(req: RegenerateRequest) -> dict:
    """Regenerate a single section of an existing lesson plan (S3).

    Accepts the same original input parameters as /generate plus the full existing
    plan JSON and the dotted path of the section to regenerate.

    Returns only the regenerated field — not the full plan:
      {"guidedPractice": "..."}   for regenerateSection="activities.guidedPractice"
      {"objectives": [...]}       for regenerateSection="objectives"

    The frontend patches its local plan with the returned partial dict.
    Expect 15–40 seconds (single Gemini call with regen prefix).
    """
    try:
        return await run_regen_pipeline(req)
    except ValueError as exc:
        logger.error("regen pipeline configuration error: %s", exc)
        raise HTTPException(status_code=503, detail="Upstream AI service unavailable") from exc
    except RuntimeError as exc:
        logger.error("regen pipeline generation failed: %s", exc)
        raise HTTPException(status_code=502, detail="Generation failed. Please retry.") from exc
    except Exception as exc:
        logger.error("unexpected regen pipeline error: %s", exc)
        raise HTTPException(status_code=503, detail="Upstream AI service unavailable") from exc


@app.post("/generate-with-pdf", response_model=LessonPlan, tags=["generation"])
async def generate_with_pdf(
    grade: str = Form(...),
    subject: str = Form(...),
    topic: str = Form(...),
    duration: int = Form(...),
    board: str = Form(...),
    teachingStyle: str = Form(...),
    depth: str = Form(...),
    pdf_file: UploadFile = File(...),
) -> LessonPlan:
    """Generate a full structured lesson plan (Mode B — topic + chapter PDF).

    Accepts multipart/form-data with the same fields as /generate plus a PDF file.
    The PDF is uploaded to Gemini Files API once; the chapter_extraction node reads
    it natively (text, tables, diagrams, equations) and produces a compact
    chapterContext that all 9 generation nodes use for grounded output.

    Expect 3–5 minutes on the free tier (chapter extraction + 9 generation nodes).
    """
    # --- Input validation ---
    pdf_bytes = await pdf_file.read()
    max_bytes = settings.max_pdf_size_mb * 1024 * 1024
    if len(pdf_bytes) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"PDF exceeds the maximum allowed size of {settings.max_pdf_size_mb} MB",
        )

    valid_depths: tuple[str, ...] = ("Basic", "Standard", "Advanced")
    if depth not in valid_depths:
        raise HTTPException(
            status_code=422,
            detail=f"depth must be one of: {', '.join(valid_depths)}",
        )

    if not (0 < duration <= settings.max_lesson_duration):
        raise HTTPException(
            status_code=422,
            detail=f"duration must be between 1 and {settings.max_lesson_duration} minutes",
        )

    # --- Upload PDF to Gemini Files API ---
    try:
        file_uri = upload_pdf_to_gemini(pdf_bytes)
    except Exception as exc:
        logger.error("PDF upload to Gemini Files API failed: %s", exc)
        raise HTTPException(status_code=503, detail="Upstream AI service unavailable") from exc

    # --- Build initial pipeline state ---
    initial_state: LessonPlanState = {
        "grade": grade,
        "subject": subject,
        "topic": topic,
        "duration": duration,
        "board": board,
        "teachingStyle": teachingStyle,
        "depth": depth,
        "geminiFileUri": file_uri,
    }

    # --- Run pipeline ---
    try:
        return await run_pipeline_with_pdf(initial_state)
    except ValueError as exc:
        logger.error("pipeline configuration error: %s", exc)
        raise HTTPException(status_code=503, detail="Upstream AI service unavailable") from exc
    except RuntimeError as exc:
        logger.error("pipeline generation failed: %s", exc)
        raise HTTPException(status_code=502, detail="Generation failed. Please retry.") from exc
    except Exception as exc:
        logger.error("unexpected pipeline error: %s", exc)
        raise HTTPException(status_code=503, detail="Upstream AI service unavailable") from exc
