import cv2
import numpy as np
from PIL import Image
from app.core.logging import logger

def load_image_cv(image_path: str) -> np.ndarray:
    """Loads an image from path using OpenCV."""
    logger.debug(f"Loading image from: {image_path}")
    img = cv2.imread(image_path)
    if img is None:
        logger.error(f"Failed to load image from {image_path}")
        raise ValueError(f"Could not load image at {image_path}")
    return img

def pil_to_cv(pil_image: Image.Image) -> np.ndarray:
    """Converts a PIL Image to OpenCV format (numpy array)."""
    return cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)

def cv_to_pil(cv_image: np.ndarray) -> Image.Image:
    """Converts an OpenCV image (numpy array) to PIL Image."""
    if len(cv_image.shape) == 2:
        return Image.fromarray(cv_image, mode='L')
    else:
        return Image.fromarray(cv2.cvtColor(cv_image, cv2.COLOR_BGR2RGB))

def preprocess_image(image: np.ndarray) -> np.ndarray:
    """
    Applies the requested 2-step preprocessing:
    1. Grayscale
    2. High Contrast
    """
    try:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        contrast_enhanced = cv2.convertScaleAbs(gray, alpha=1.5, beta=0)
        logger.debug("Image preprocessing (Grayscale + High Contrast) completed.")
        return contrast_enhanced
    except Exception as e:
        logger.error(f"Error during image preprocessing: {e}")
        raise e

def resize_with_aspect_ratio(image: np.ndarray, max_width: int = 1920) -> np.ndarray:
    """Resizes the image if it exceeds max_width, maintaining aspect ratio."""
    height, width = image.shape[:2]
    if width > max_width:
        scaling_factor = max_width / float(width)
        new_height = int(height * scaling_factor)
        new_dim = (max_width, new_height)
        logger.debug(f"Resizing image from {width}x{height} to {max_width}x{new_height}")
        return cv2.resize(image, new_dim, interpolation=cv2.INTER_AREA)
    return image
