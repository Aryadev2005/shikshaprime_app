import sys
from loguru import logger
from app.core import config

# Remove default handler
logger.remove()

# Add Console Handler
logger.add(
    sys.stdout,
    level="DEBUG",
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    enqueue=True
)

# Add File Handlers
logger.add(
    config.OUTPUT_DIRS["LOGS"] / "app.log",
    level="DEBUG",
    rotation="10 MB",
    retention="10 days",
    compression="zip",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}"
)

logger.add(
    config.OUTPUT_DIRS["LOGS"] / "error.log",
    level="ERROR",
    rotation="10 MB",
    retention="30 days",
    compression="zip",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
    filter=lambda record: record["level"].name in ["ERROR", "CRITICAL"]
)
