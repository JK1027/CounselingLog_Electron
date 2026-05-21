import logging
import os
from backend.utils.path_helper import get_writable_path, ensure_directory_exists

# Initialize logger
logger = logging.getLogger("CounselingLog")
logger.setLevel(logging.DEBUG)

if not logger.handlers:
    # Standard formatter
    formatter = logging.Formatter('[%(asctime)s] [%(levelname)s] %(message)s', '%Y-%m-%d %H:%M:%S')

    # Ensure logs folder exists
    log_dir = get_writable_path("logs")
    ensure_directory_exists(log_dir)
    log_file_path = os.path.join(log_dir, "app.log")

    # File Logging Handler (persists logs to disk)
    file_handler = logging.FileHandler(log_file_path, encoding='utf-8')
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    # Console Logging Handler (for debugging)
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.DEBUG)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
