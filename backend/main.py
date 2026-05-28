import os
import multiprocessing
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.core.dependencies import repo, CURRENT_EXCEL_PATH
from backend.utils.logger import logger
from backend.routes.students import router as students_router
from backend.routes.sessions import router as sessions_router
from backend.routes.settings import router as settings_router

app = FastAPI(title="상담일지 Electron 백엔드 API")

# Configure CORS
is_packaged = os.environ.get("NODE_ENV") != "development"
if is_packaged:
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "file://",
        "vscode-webview://"
    ]
else:
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    logger.info("FastAPI 서버 시작 및 데이터 로딩...")
    if not os.path.exists(CURRENT_EXCEL_PATH):
        logger.warning(f"상담일지 엑셀 파일이 없습니다. 기본 템플릿 생성을 개시합니다. 경로: {CURRENT_EXCEL_PATH}")
        repo.main_file_path = CURRENT_EXCEL_PATH
        repo._ensure_template_initialized()
    try:
        repo.load_data(CURRENT_EXCEL_PATH)
        logger.info("엑셀 데이터 로드 완료")
    except Exception as e:
        logger.error(f"엑셀 데이터 로드 중 에러 발생: {e}")

@app.get("/health")
def health_check():
    import backend.core.dependencies as deps
    return {"status": "ok", "excel_path": deps.CURRENT_EXCEL_PATH}

# 등록된 라우터들을 통합 바인딩합니다.
app.include_router(students_router)
app.include_router(sessions_router)
app.include_router(settings_router)

if __name__ == "__main__":
    import uvicorn
    # PyInstaller multiprocessing support
    multiprocessing.freeze_support()
    # Run uvicorn server directly with single worker
    uvicorn.run(app, host="127.0.0.1", port=8765, reload=False)
