import os
import sys

# 프로젝트 루트를 Python path에 추가하여 backend 패키지 임포트 가능하도록 설정
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

from backend.utils.path_helper import get_user_documents_path, get_user_backup_path
from backend.repositories.excel_repository import ExcelRepository

def test_backup_path():
    print("=== 수동 백업 경로 테스트 시작 ===")
    
    docs_path = get_user_documents_path()
    backup_path = get_user_backup_path()
    
    print(f"1. 윈도우 표준 내 문서 경로: {docs_path}")
    print(f"2. 수동 백업 저장 경로: {backup_path}")
    
    # 윈도우 환경인 경우 Documents 혹은 OneDrive/Documents 등이 포함되어야 함
    assert docs_path is not None, "내 문서 경로를 찾을 수 없습니다."
    assert "상담일지 백업 파일" in backup_path, "백업 폴더명이 경로에 포함되지 않았습니다."
    
    # 임시 원본 파일 생성 후 백업 API 기능 검증
    temp_excel = os.path.join(project_root, "data", "test_origin.xlsx")
    os.makedirs(os.path.dirname(temp_excel), exist_ok=True)
    
    # 빈 엑셀 파일 시뮬레이션 작성
    import openpyxl
    wb = openpyxl.Workbook()
    wb.save(temp_excel)
    print(f"3. 테스트용 가상 엑셀 생성: {temp_excel}")
    
    try:
        # ExcelRepository 기동 및 백업 생성 테스트
        repo = ExcelRepository(main_file_path=temp_excel)
        success, result = repo.save_backup_excel()
        
        assert success is True, f"백업 실패 에러: {result}"
        file_name, backup_dir = result
        dest_file_path = os.path.join(backup_dir, file_name)
        
        print(f"4. 백업 성공 여부: {success}")
        print(f"5. 백업 파일명: {file_name}")
        print(f"6. 백업 생성 폴더: {backup_dir}")
        print(f"7. 백업 파일 전체 경로: {dest_file_path}")
        
        # 파일이 실제 내 문서/상담일지 백업 파일 경로에 존재하는지 검증
        assert os.path.exists(dest_file_path), "실제 백업 파일이 경로상에 존재하지 않습니다!"
        print("-> [성공] 실제 문서 폴더에 백업 파일이 안전하게 기록되었습니다.")
        
        # 클린업
        os.remove(dest_file_path)
        print("8. 생성된 테스트 백업 파일 삭제 완료")
        
    finally:
        if os.path.exists(temp_excel):
            os.remove(temp_excel)
            print("9. 가상 엑셀 클린업 완료")
            
    print("=== 모든 백업 경로 테스트 통과 (SUCCESS) ===")

if __name__ == "__main__":
    test_backup_path()
