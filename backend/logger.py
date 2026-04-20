"""
Centralized logging configuration for the Email Agent backend.
Replace print() statements with proper logging.
"""
import logging
import sys
from pathlib import Path

# Create logs directory if needed
_BACKEND_DIR = Path(__file__).resolve().parent
_LOGS_DIR = _BACKEND_DIR / "logs"
_LOGS_DIR.mkdir(exist_ok=True)

# Configure root logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(_LOGS_DIR / "app.log", encoding="utf-8"),
    ]
)

# Suppress noisy third-party loggers
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

def get_logger(name: str) -> logging.Logger:
    """Get a logger instance with the given name."""
    return logging.getLogger(name)
