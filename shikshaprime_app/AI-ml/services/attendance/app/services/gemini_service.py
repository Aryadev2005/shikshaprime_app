from google import genai
from google.genai import types
import json
from app.core import config
from app.core.logging import logger
from app.prompts.attendance_prompt import ATTENDANCE_JSON_PROMPT

class GeminiService:
    def __init__(self):
        self.api_key = config.GOOGLE_API_KEY
        if not self.api_key:
            logger.error("Gemini API Key missing in config.")
            raise ValueError("GOOGLE_API_KEY not found in configuration")
        self.client = genai.Client(api_key=self.api_key)

    def generate_json(self, image_bytes: bytes, markdown_context: str) -> tuple[list, dict]:
        """
        Generate structured JSON from image and markdown context.
        Returns (parsed_data, usage_dict).
        usage_dict keys: input_tokens, output_tokens, thinking_tokens, total_tokens, cost_usd
        """
        usage = {"input_tokens": 0, "output_tokens": 0, "thinking_tokens": 0, "total_tokens": 0, "cost_usd": 0.0}
        json_text = ""

        try:
            logger.debug("Preparing Gemini JSON generation request...")
            full_prompt = f"{ATTENDANCE_JSON_PROMPT}\n\n## EXTRACTED MARKDOWN CONTEXT:\n{markdown_context}"

            response = self.client.models.generate_content(
                model=config.MODEL_NAME,
                contents=[
                    types.Part.from_text(text=full_prompt),
                    types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg")
                ],
                config=types.GenerateContentConfig(**config.GENERATION_CONFIG)
            )

            um = response.usage_metadata
            input_tokens    = getattr(um, "prompt_token_count",     0) or 0
            output_tokens   = getattr(um, "candidates_token_count", 0) or 0
            thinking_tokens = getattr(um, "thoughts_token_count",   0) or 0

            input_cost_usd    = input_tokens    * config.GEMINI_INPUT_COST_PER_TOKEN
            output_cost_usd   = output_tokens   * config.GEMINI_OUTPUT_COST_PER_TOKEN
            thinking_cost_usd = thinking_tokens * config.GEMINI_THINKING_COST_PER_TOKEN
            total_cost_usd    = input_cost_usd + output_cost_usd + thinking_cost_usd

            usage = {
                "input_tokens":       input_tokens,
                "input_cost_usd":     round(input_cost_usd,    8),
                "output_tokens":      output_tokens,
                "output_cost_usd":    round(output_cost_usd,   8),
                "thinking_tokens":    thinking_tokens,
                "thinking_cost_usd":  round(thinking_cost_usd, 8),
                "total_tokens":       input_tokens + output_tokens + thinking_tokens,
                "total_cost_usd":     round(total_cost_usd,    6),
            }
            logger.debug(
                f"Gemini done. "
                f"input={input_tokens}tok(${input_cost_usd:.6f}) | "
                f"output={output_tokens}tok(${output_cost_usd:.6f}) | "
                f"thinking={thinking_tokens}tok(${thinking_cost_usd:.6f}) | "
                f"TOTAL=${total_cost_usd:.6f}"
            )

            json_text = response.text

            # Clean Markdown Code Blocks (```json ... ```)
            if json_text.strip().startswith("```"):
                lines = json_text.strip().split("\n")
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines[-1].startswith("```"):
                    lines = lines[:-1]
                json_text = "\n".join(lines)

            # Parse JSON to ensure it's valid dict/list
            parsed_data = json.loads(json_text)
            logger.debug(f"Gemini parsed {len(parsed_data)} records successfully.")
            return parsed_data, usage

        except json.JSONDecodeError as e:
            logger.error(f"JSON Decode Error: {e}")
            logger.warning("Attempting to repair truncated JSON...")

            try:
                rindex = json_text.rfind("},")
                if rindex != -1:
                    fixed_json = json_text[:rindex+1] + "\n  ]\n}"
                    if json_text.strip().startswith("["):
                        fixed_json = json_text[:rindex+1] + "\n]"

                    parsed_data = json.loads(fixed_json)
                    logger.success(f"Successfully repaired JSON! Recovered {len(parsed_data)} records.")
                    return parsed_data, usage
            except Exception as repair_error:
                logger.error(f"JSON Repair failed: {repair_error}")

            logger.error(f"Raw JSON causing error: {json_text}")
            raise e
        except Exception as e:
            logger.error(f"Error in Gemini JSON Generation: {e}")
            raise e
