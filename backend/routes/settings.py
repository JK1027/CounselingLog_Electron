import os
from fastapi import APIRouter, HTTPException
import backend.core.dependencies as deps
import backend.utils.path_helper as path_helper
from backend.schemas.settings import SettingsRequest, BackupTestRequest, OpenFileRequest
from backend.utils.logger import logger

router = APIRouter()

@router.post("/settings")
def update_settings(data: SettingsRequest):
    path_helper.CURRENT_BACKUP_DIR = data.backupDir.strip()
    logger.info(f"동적 백업 설정 갱신: {path_helper.CURRENT_BACKUP_DIR}")
    return {"status": "success"}

@router.post("/backup/test")
def test_backup_path(data: BackupTestRequest):
    path = data.backup_dir.strip()
    if not path:
        return {"status": "error", "message": "경로가 지정되지 않았습니다."}
    try:
        os.makedirs(path, exist_ok=True)
        test_file = os.path.join(path, "backup_test.tmp")
        # 쓰기 테스트
        with open(test_file, 'w', encoding='utf-8') as f:
            f.write("write test")
        # 읽기 테스트
        with open(test_file, 'r', encoding='utf-8') as f:
            content = f.read()
        # 삭제 테스트
        os.remove(test_file)
        if content != "write test":
            return {"status": "error", "message": "데이터 무결성 검증 실패"}
        return {"status": "success"}
    except Exception as e:
        logger.error(f"백업 테스트 경로 실패 ({path}): {e}")
        return {"status": "error", "message": str(e)}

@router.post("/backup")
def trigger_backup():
    """
    엑셀 파일 수동 백업을 수행합니다.
    """
    with deps.repo.lock:
        success, result = deps.repo.save_backup_excel()
        if not success:
            raise HTTPException(status_code=500, detail=result)
        
        file_name, backup_dir = result
        return {
            "status": "success",
            "filename": file_name,
            "directory": backup_dir
        }

@router.post("/open-file")
def open_file(data: OpenFileRequest):
    """
    엑셀 파일을 새로 로드하고 활성화된 파일 경로를 변경합니다.
    """
    with deps.repo.lock:
        path = data.path.strip()
        if not os.path.exists(path):
            raise HTTPException(status_code=404, detail="지정된 경로에 파일이 존재하지 않습니다.")
        try:
            deps.repo.load_data(path)
            deps.CURRENT_EXCEL_PATH = path
            logger.info(f"성공적으로 새 엑셀 파일을 불러왔습니다: {path}")
            return {"status": "success", "excel_path": path}
        except Exception as e:
            logger.error(f"엑셀 파일 로딩 중 에러 발생: {e}")
            raise HTTPException(status_code=500, detail=f"엑셀 파일을 열 수 없습니다: {str(e)}")
