import os
from backend.utils.path_helper import get_writable_path, ensure_directory_exists
from backend.repositories.excel_repository import ExcelRepository

# 엑셀 데이터 파일 경로 설정
CURRENT_EXCEL_PATH = get_writable_path("data/상담일지.xlsx")
ensure_directory_exists(os.path.dirname(CURRENT_EXCEL_PATH))

# 싱글톤 레포지토리 인스턴스 생성
repo = ExcelRepository()
