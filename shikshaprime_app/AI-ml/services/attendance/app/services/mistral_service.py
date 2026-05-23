from mistralai import Mistral
import base64
from app.core import config
from app.core.logging import logger

class MistralOCRService:
    def __init__(self):
        self.api_key = config.MISTRAL_API_KEY
        if not self.api_key:
            logger.error("Mistral API Key missing in config.")
            raise ValueError("MISTRAL_API_KEY not found in configuration")
        self.client = Mistral(api_key=self.api_key)

    def get_markdown_from_image(self, image_bytes: bytes) -> tuple[str, dict]:
        """
        Send image bytes to Mistral OCR and return (markdown, usage_dict).
        usage_dict keys: pages_processed, cost_usd
        """
        try:
            logger.debug("Preparing Mistral OCR request...")
            base64_img = base64.b64encode(image_bytes).decode('utf-8')
            data_uri = f"data:image/jpeg;base64,{base64_img}"

            ocr_response = self.client.ocr.process(
                model="mistral-ocr-latest",
                document={
                    "type": "image_url",
                    "image_url": data_uri
                },
                include_image_base64=False
            )

            try:
                pages_processed = ocr_response.usage.pages_processed
            except AttributeError:
                pages_processed = len(ocr_response.pages) if ocr_response.pages else 1

            cost_usd = pages_processed * config.MISTRAL_OCR_COST_PER_PAGE
            usage = {
                "pages_processed": pages_processed,
                "cost_usd": round(cost_usd, 6)
            }

            if ocr_response.pages and len(ocr_response.pages) > 0:
                logger.debug(f"Mistral OCR done. Pages: {pages_processed}, Cost: ${cost_usd:.6f}")
                return ocr_response.pages[0].markdown, usage
            else:
                logger.warning("Mistral OCR response contained no pages.")
                return "", usage

        except Exception as e:
            logger.error(f"Error in Mistral OCR: {e}")
            raise e
