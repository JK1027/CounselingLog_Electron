
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ["NODE_ENV"] = "development"

import uvicorn
from backend.main import app, repo

# Override the file path to use working copy
WORK_COPY = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "테스트_작업본.xlsx")
repo.load_data(WORK_COPY)

import backend.main as main_module
main_module.CURRENT_EXCEL_PATH = WORK_COPY

uvicorn.run(app, host="127.0.0.1", port=18765, log_level="warning")
