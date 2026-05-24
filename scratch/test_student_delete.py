import os
import sys
import shutil
import pandas as pd

# 로컬 backend 경로 추가
sys.path.append(r"c:\Coding3\CounselingLog_Electron")

from backend.repositories.excel_repository import ExcelRepository
from backend.utils.path_helper import get_user_backup_path

def test_delete():
    excel_path = r"c:\Coding3\CounselingLog_Electron\data\상담일지.xlsx"
    if not os.path.exists(excel_path):
        print(f"ERROR: Excel file not found at {excel_path}")
        return

    print("Initializing ExcelRepository...")
    repo = ExcelRepository()
    repo.load_data(excel_path)
    
    # 1. 테스트 전 데이터 스캔
    print("=== Before Deletion ===")
    target_student_name = "홍길동"
    target_student_id = "9999"
    
    # 임의로 홍길동 학생의 데이터를 개인상담 시트와 보호자상담 시트에 한 행씩 추가
    # 테스트 안전성을 위해 기존 데이터 보존 상태에서 mock row 추가 후 테스트 진행
    print(f"Injecting mock data for {target_student_name}({target_student_id}) for testing...")
    
    # 개인상담 모의 데이터
    mock_row_individual = pd.DataFrame([{
        "순번": "99",
        "이름": target_student_name,
        "학번": target_student_id,
        "학년": "3학년",
        "성별": "남",
        "*상담일자": "20260524",
        "*상담제목": "테스트 삭제 주제",
        "상담내용(상세)": "테스트 삭제 상세 내용",
        "상담회기": "1",
        "_record_id": "test_record_id_1"
    }])
    
    # 보호자상담 모의 데이터
    mock_row_guardian = pd.DataFrame([{
        "순번": "99",
        "이름": target_student_name,
        "학번": target_student_id,
        "학년": "3학년",
        "성별": "남",
        "*상담일자": "20260524",
        "*상담제목": "보호자 테스트 삭제 주제",
        "상담내용(상세)": "보호자 테스트 삭제 상세",
        "_record_id": "test_record_id_2"
    }])
    
    # 백업 생성용 원본 보존을 위해 엑셀에 모의 행 삽입 및 저장
    repo.data_frames["개인상담"] = pd.concat([repo.data_frames["개인상담"], mock_row_individual], ignore_index=True)
    repo.data_frames["보호자상담"] = pd.concat([repo.data_frames["보호자상담"], mock_row_guardian], ignore_index=True)
    repo.save_all_data_to_excel()
    print("Mock data successfully injected and saved.")

    # 2. 삭제 함수 호출
    print("\nCalling delete_student_info...")
    success, err = repo.delete_student_info(target_student_name, target_student_id)
    if not success:
        print(f"FAILED to delete: {err}")
        return
        
    print("delete_student_info returned SUCCESS!")
    
    # 3. 자동 백업 확인
    backup_dir = get_user_backup_path()
    print(f"\nChecking backup directory: {backup_dir}")
    if os.path.exists(backup_dir):
        backups = [f for f in os.listdir(backup_dir) if f.startswith("상담일지(") and f.endswith(".xlsx")]
        if backups:
            print(f"Backup file successfully generated: {backups[-1]}")
        else:
            print("WARNING: No backup file found in backup directory!")
    else:
        print("ERROR: Backup directory does not exist!")

    # 4. 삭제 및 순번 재정렬 확인
    print("\nVerifying deletion from DataFrames...")
    repo.check_and_reload() # 엑셀 리로드
    
    for sheet in ["개인상담", "보호자상담", "교원자문", "의뢰(정서행동의뢰, 자문의 의뢰 등)"]:
        df = repo.data_frames.get(sheet)
        if df is None:
            continue
        # 홍길동 9999 매칭되는 행이 있는지 체크
        matched = df[(df["이름"].astype(str) == target_student_name) & (df["학번"].astype(str).str.replace(".0", "") == target_student_id)]
        if not matched.empty:
            print(f"ERROR: Student row still exists in sheet [{sheet}]!")
        else:
            print(f"SUCCESS: Student row removed from sheet [{sheet}].")
            
        # 순번 재정렬 검증 (예시 행 제외한 순번이 1, 2, 3... 인지)
        if "순번" in df.columns:
            seqs = df[df["순번"].astype(str).str.strip() != "예시"]["순번"].tolist()
            # 순번 리스트가 1, 2, 3... 인지 검사
            expected_seqs = [str(i) for i in range(1, len(seqs) + 1)]
            if seqs == expected_seqs:
                print(f"SUCCESS: Sequence renumbered correctly in sheet [{sheet}] -> {seqs[:5]}")
            else:
                print(f"WARNING: Renumbering mismatch in sheet [{sheet}]. Got: {seqs[:5]}, Expected: {expected_seqs[:5]}")

    print("\nTest unit finished successfully.")

if __name__ == "__main__":
    test_delete()
