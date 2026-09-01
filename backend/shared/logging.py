import logging
from pathlib import Path
from config.config import get_settings


def setup_logger(name: str) -> logging.Logger:
    """Return logger outputting to stdout and logs/app.log.

    Args:
        name: Logger name, typically __name__.

    Returns:
        Configured logging.Logger.
    """
    settings = get_settings()
    log_format = "%(asctime)s — %(name)s — %(levelname)s — %(message)s"
    level = getattr(logging, settings.log_level.upper(), logging.INFO)

    logger = logging.getLogger(name)
    logger.setLevel(level)

    # Avoid adding duplicate handlers on repeated calls
    if logger.handlers:
        return logger

    # Console handler (stdout)
    console_handler = logging.StreamHandler()
    console_handler.setLevel(level)
    console_handler.setFormatter(logging.Formatter(log_format))
    logger.addHandler(console_handler)

    # File handler (logs/app.log)
    log_dir = Path("logs")
    log_dir.mkdir(parents=True, exist_ok=True)
    file_handler = logging.FileHandler(log_dir / "app.log", encoding="utf-8")
    file_handler.setLevel(level)
    file_handler.setFormatter(logging.Formatter(log_format))
    logger.addHandler(file_handler)

    return logger
