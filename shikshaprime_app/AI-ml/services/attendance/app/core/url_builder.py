"""
Utility module for building dynamic URLs based on tenant information.
"""
from app.core import config


def build_ocr_api_url(tenant: str) -> str:
    """
    Build the OCR API URL dynamically based on tenant.
    
    Args:
        tenant (str): The tenant identifier (e.g., 'collegea', 'collegeb')
    
    Returns:
        str: The full OCR API URL for the given tenant
        
    Example:
        >>> build_ocr_api_url('collegea')
        'https://collegea.mainapp.shikshaprime.com:8081/api/v1/extract-attendance'
    """
    if not tenant or not isinstance(tenant, str):
        raise ValueError("Tenant must be a non-empty string")
    
    # Remove any whitespace and convert to lowercase
    tenant = tenant.strip().lower()
    
    url = f"https://{tenant}.{config.OCR_API_BASE_DOMAIN}:{config.OCR_API_PORT}{config.OCR_API_ENDPOINT}"
    return url
