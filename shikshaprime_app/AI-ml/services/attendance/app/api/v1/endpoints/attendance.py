import csv
import cv2
import json
import uuid
import httpx
import numpy as np
import ssl
import base64
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Header, File, UploadFile
from fastapi.responses import JSONResponse
from typing import Optional
from app.core import config
from app.core.url_builder import build_ocr_api_url
from app.core.logging import logger
from app.services.mistral_service import MistralOCRService
from app.services.gemini_service import GeminiService
from app.services.image_service import preprocess_image, resize_with_aspect_ratio

router = APIRouter()

# Initialize Services
mistral_service = MistralOCRService()
gemini_service = GeminiService()
logger.info("Services initialized successfully.")


def _append_cost_log(
    request_id: str,
    tenant: str,
    filename: str,
    mistral_usage: dict,
    gemini_usage: dict,
    total_cost_usd: float,
) -> None:
    path = config.COST_LOG_PATH
    write_header = not path.exists()
    with open(path, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        if write_header:
            writer.writerow([
                "timestamp", "request_id", "tenant", "filename",
                # Mistral
                "mistral_pages", "mistral_cost_usd",
                # Gemini — tokens
                "gemini_input_tokens", "gemini_output_tokens",
                "gemini_thinking_tokens", "gemini_total_tokens",
                # Gemini — cost per token type
                "gemini_input_cost_usd", "gemini_output_cost_usd",
                "gemini_thinking_cost_usd", "gemini_total_cost_usd",
                # Grand total
                "total_cost_usd",
            ])
        writer.writerow([
            datetime.now(timezone.utc).isoformat(),
            request_id,
            tenant,
            filename,
            mistral_usage["pages_processed"],
            mistral_usage["cost_usd"],
            gemini_usage["input_tokens"],
            gemini_usage["output_tokens"],
            gemini_usage["thinking_tokens"],
            gemini_usage["total_tokens"],
            gemini_usage["input_cost_usd"],
            gemini_usage["output_cost_usd"],
            gemini_usage["thinking_cost_usd"],
            gemini_usage["total_cost_usd"],
            round(total_cost_usd, 6),
        ])

def safe_parse_json(raw):
    """
    Handle both parsed Python objects and JSON strings from Gemini.
    
    Gemini with response_mime_type: "application/json" returns a native Python object (list/dict),
    not a raw JSON string. This function handles both cases.
    
    Args:
        raw: Either a Python object (list/dict) or a JSON string that may be truncated
        
    Returns:
        Parsed JSON object
        
    Raises:
        ValueError: If JSON string cannot be repaired
        TypeError: If input is an unexpected type
    """
    # If Gemini already returned a parsed Python object (list/dict), use it directly
    if isinstance(raw, (list, dict)):
        return raw
    
    # If it's a string, try to parse it
    if isinstance(raw, str):
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            for closing in ['"}]', '"}', '"]', '}]', '}', ']']:
                try:
                    return json.loads(raw + closing)
                except:
                    continue
            raise ValueError("Could not repair truncated JSON from Gemini")
    
    raise TypeError(f"Unexpected type from Gemini: {type(raw)}")

@router.post("/extract-attendance")
async def extract_attendance(
    file: UploadFile = File(...),
    x_tenant: Optional[str] = Header(None)
):
    """
    Full Pipeline:
    1. Read Image from UploadFile
    2. Preprocess -> Save specific folder
    3. Mistral OCR -> Markdown -> Save specific folder
    4. Gemini -> JSON -> Save specific folder
    
    Args:
        file: Uploaded image file (multipart/form-data)
        x_tenant: Tenant identifier from X-Tenant header (e.g., 'collegea', 'collegeb')
    """
    try:
        # Validate tenant header
        if not x_tenant:
            logger.error("X-Tenant header is missing")
            return JSONResponse(
                status_code=400,
                content={"status": 0, "message": "X-Tenant header is required"}
            )
        
        # Request Tracking
        request_id = str(uuid.uuid4())
        logger.bind(request_id=request_id, tenant=x_tenant).info(f"Processing new request: {request_id} from file: {file.filename}")
        
        # Build OCR API URL dynamically based on tenant
        try:
            ocr_api_url = build_ocr_api_url(x_tenant)
            logger.debug(f"Built OCR API URL for tenant '{x_tenant}': {ocr_api_url}")
        except ValueError as e:
            logger.error(f"Invalid tenant format: {str(e)}")
            return JSONResponse(
                status_code=400,
                content={"status": 0, "message": f"Invalid tenant format: {str(e)}"}
            )
        
        # --- Step 1: Acquire Image Bytes ---
        logger.debug(f"Reading file: {file.filename}")
        contents = await file.read()
        logger.debug(f"Successfully read {len(contents)} bytes from upload")

        # Decode Image
        nparr = np.frombuffer(contents, np.uint8)
        cv_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if cv_img is None:
             logger.error("Failed to decode image from bytes.")
             return JSONResponse(status_code=200, content={"status": 0, "message": "Invalid image content downloaded from URL"})

        # Resize & Preprocess
        logger.debug("Starting preprocessing...")
        resized_img = resize_with_aspect_ratio(cv_img, max_width=2000)
        preprocessed_img = preprocess_image(resized_img)
        
        # --- Save Preprocessed Image ---
        img_filename = f"{request_id}_processed.jpg"
        img_path = config.OUTPUT_DIRS["IMAGES"] / img_filename
        cv2.imwrite(str(img_path), preprocessed_img)
        logger.info(f"Saved processed image to {img_path}")

        # Convert back to bytes for APIs
        success, encoded_img = cv2.imencode('.jpg', preprocessed_img)
        if not success:
             logger.error("CV2 encoding failed.")
             return JSONResponse(status_code=200, content={"status": 0, "message": "Failed to encode preprocessed image"})
        
        final_image_bytes = encoded_img.tobytes()

        # --- Step 2: Mistral OCR ---
        logger.debug("Sending to Mistral OCR...")
        markdown_output, mistral_usage = mistral_service.get_markdown_from_image(final_image_bytes)
        if not markdown_output:
             logger.error("Mistral OCR returned empty content.")
             return JSONResponse(status_code=200, content={"status": 0, "message": "Mistral OCR failed to return content"})
        
        # Save Markdown
        md_filename = f"{request_id}_ocr.md"
        md_path = config.OUTPUT_DIRS["MARKDOWN"] / md_filename
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write(markdown_output)
        logger.info(f"Saved markdown to {md_path}")

        # --- Step 3: Gemini Parsing ---
        logger.debug("Sending to Gemini for JSON parsing...")
        raw_json_output, gemini_usage = gemini_service.generate_json(final_image_bytes, markdown_output)
        
        # Repair truncated JSON if necessary
        try:
            json_output = safe_parse_json(raw_json_output)
        except ValueError as parse_err:
            logger.error(f"Failed to repair JSON from Gemini: {parse_err}")
            return JSONResponse(
                status_code=200,
                content={"status": 0, "message": f"Failed to parse Gemini response: {str(parse_err)}"}
            )
        
        # Save JSON
        json_filename = f"{request_id}_data.json"
        json_path = config.OUTPUT_DIRS["JSON"] / json_filename
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(json_output, f, indent=2)
        logger.info(f"Saved JSON to {json_path}")

        # --- Cost Tracking ---
        total_cost_usd = mistral_usage["cost_usd"] + gemini_usage["total_cost_usd"]
        logger.info(
            f"[COST] request={request_id} tenant={x_tenant} | "
            f"Mistral pages={mistral_usage['pages_processed']} ${mistral_usage['cost_usd']:.6f} | "
            f"Gemini input={gemini_usage['input_tokens']}tok(${gemini_usage['input_cost_usd']:.6f}) "
            f"output={gemini_usage['output_tokens']}tok(${gemini_usage['output_cost_usd']:.6f}) "
            f"thinking={gemini_usage['thinking_tokens']}tok(${gemini_usage['thinking_cost_usd']:.6f}) "
            f"gemini_total=${gemini_usage['total_cost_usd']:.6f} | "
            f"GRAND TOTAL=${total_cost_usd:.6f}"
        )
        _append_cost_log(request_id, x_tenant, file.filename, mistral_usage, gemini_usage, total_cost_usd)
        logger.success(f"Request {request_id} completed successfully.")

        return {
            "status": 1,
            "message": "Attendance Data Extracted Successfully",
            "request_id": request_id,
            "usage": {
                "mistral": {
                    "model":           "mistral-ocr-latest",
                    "pages_processed": mistral_usage["pages_processed"],
                    "cost_usd":        mistral_usage["cost_usd"],
                },
                "gemini": {
                    "model":                config.MODEL_NAME,
                    "input_tokens":         gemini_usage["input_tokens"],
                    "input_cost_usd":       gemini_usage["input_cost_usd"],
                    "output_tokens":        gemini_usage["output_tokens"],
                    "output_cost_usd":      gemini_usage["output_cost_usd"],
                    "thinking_tokens":      gemini_usage["thinking_tokens"],
                    "thinking_cost_usd":    gemini_usage["thinking_cost_usd"],
                    "total_tokens":         gemini_usage["total_tokens"],
                    "total_cost_usd":       gemini_usage["total_cost_usd"],
                },
                "grand_total_cost_usd": round(total_cost_usd, 6),
            },
            "paths": {
                "image": str(img_path),
                "markdown": str(md_path),
                "json": str(json_path)
            },
            "data": json_output
        }

    except Exception as e:
        error_msg = str(e)
        logger.exception(f"Unhandled exception in extract_attendance: {error_msg}")
        
        # Check for Rate Limit specific strings
        if "429" in error_msg or "Resource exhausted" in error_msg:
             return JSONResponse(
                status_code=200,
                content={"status": 0, "message": "API Rate Limit Exceeded. Please try again later."}
            )

        # Return Standard Failure
        return JSONResponse(
            status_code=200,
            content={"status": 0, "message": error_msg}
        )
