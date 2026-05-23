from pathlib import Path
from dotenv import load_dotenv
import os
from google.genai import types

# Explicitly load .env from parent directory (services/attendance/.env or services/.env)

BASE_DIR = Path(__file__).resolve().parent.parent.parent # points to services/attendance

env_path = BASE_DIR / "app" / ".env"
print(f"DEBUG: Checking {env_path}")
if not env_path.exists():
    env_path = BASE_DIR / ".env"
    print(f"DEBUG: Checking {env_path}")
if not env_path.exists():
     env_path = BASE_DIR.parent / ".env" # services/.env
     print(f"DEBUG: Checking {env_path}")

print(f"DEBUG: Loading .env from {env_path}, exists={env_path.exists()}")
load_dotenv(env_path)

# API Keys
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")

# OCR API Configuration (Dynamic URL based on tenant)
OCR_API_BASE_DOMAIN = os.getenv("OCR_API_BASE_DOMAIN", "mainapp.shikshaprime.com")
OCR_API_PORT = os.getenv("OCR_API_PORT", "8081")
OCR_API_ENDPOINT = os.getenv("OCR_API_ENDPOINT", "/api/v1/extract-attendance")

# Output Directory Configuration
BASE_OUTPUT_DIR = BASE_DIR / "outputs"
OUTPUT_DIRS = {
    "IMAGES": BASE_OUTPUT_DIR / "processed_images",
    "MARKDOWN": BASE_OUTPUT_DIR / "ocr_markdown",
    "JSON": BASE_OUTPUT_DIR / "extracted_json",
    "LOGS": BASE_OUTPUT_DIR / "logs"
}

# Ensure directories exist
for path in OUTPUT_DIRS.values():
    path.mkdir(parents=True, exist_ok=True)

# Model Config
MODEL_NAME = "gemini-2.5-flash-lite"
GENERATION_CONFIG = {
    "temperature": 0.1,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 65536,
    "response_mime_type": "application/json",
    "thinking_config": types.ThinkingConfig(thinking_budget=-1)
}

# Pricing constants (source: official pricing pages)
#   Mistral OCR:           https://mistral.ai/technology/#pricing
#   Gemini 2.5 Flash-Lite: https://ai.google.dev/gemini-api/docs/pricing
MISTRAL_OCR_COST_PER_PAGE      = 2.00 / 1_000       # $2.00 per 1,000 pages (mistral-ocr-latest, OCR 3)
GEMINI_INPUT_COST_PER_TOKEN    = 0.10 / 1_000_000   # $0.10 per 1M input tokens (text/image/video)
GEMINI_OUTPUT_COST_PER_TOKEN   = 0.40 / 1_000_000   # $0.40 per 1M output tokens
# Official docs state: "Output price (including thinking tokens) = $0.40/1M"
# thinking_tokens are billed at the same $0.40/1M rate as regular output tokens.
GEMINI_THINKING_COST_PER_TOKEN = 0.40 / 1_000_000   # $0.40 per 1M thinking tokens (same as output)

COST_LOG_PATH = OUTPUT_DIRS["LOGS"] / "cost_tracking.csv"