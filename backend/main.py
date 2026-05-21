import os
import datetime
import uuid
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd

from backend.utils.path_helper import get_writable_path, ensure_directory_exists
from backend.repositories.excel_repository import ExcelRepository
from backend.utils.logger import logger
from backend.core.constants import RECORD_ID_COL, SHEET_NAMES, GROUP_COUNSELING_SHEET, REQUEST_SHEET

app = FastAPI(title="상담일지 Electron 백엔드 API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for local Electron app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Excel Repository
EXCEL_PATH = get_writable_path("data/상담일지.xlsx")
# Ensure directory exists
ensure_directory_exists(os.path.dirname(EXCEL_PATH))

repo = ExcelRepository()

@app.on_event("startup")
def startup_event():
    logger.info("FastAPI 서버 시작 및 데이터 로딩...")
    if not os.path.exists(EXCEL_PATH):
        logger.warning(f"상담일지 엑셀 파일이 없습니다. 기본 템플릿 생성을 개시합니다. 경로: {EXCEL_PATH}")
        repo.main_file_path = EXCEL_PATH
        repo._ensure_template_initialized()
    try:
        repo.load_data(EXCEL_PATH)
        logger.info("엑셀 데이터 로드 완료")
    except Exception as e:
        logger.error(f"엑셀 데이터 로드 중 에러 발생: {e}")

@app.get("/health")
def health_check():
    return {"status": "ok", "excel_path": EXCEL_PATH}

# Pydantic Schemas for Requests
class SessionCreate(BaseModel):
    name: str = ""
    studentId: str = ""
    grade: str = ""
    gender: str = ""
    date: str
    type: str
    sheetType: str
    summary: str
    detail: str

class SessionUpdate(BaseModel):
    date: str
    type: str
    summary: str
    detail: str
    sheetType: str

@app.get("/students")
def get_students():
    """
    모든 개인상담 대상 학생들의 고유 정보를 집계하여 반환합니다.
    (이름, 학번) 기준으로 그룹화하며 세션수, 최근상담일, 상담구분 태그를 포함합니다.
    """
    try:
        # 엑셀 최신 데이터 보장
        repo.load_data(EXCEL_PATH)
    except Exception as e:
        logger.error(f"데이터 리로드 실패: {e}")

    student_map = {} # key: (이름, 학번) -> dict

    # 개인상담, 보호자상담, 교원자문, 의뢰 시트에서 학생 정보를 수집합니다.
    target_sheets = ["개인상담", "보호자상담", "교원자문", REQUEST_SHEET]

    for sheet in target_sheets:
        df = repo.data_frames.get(sheet)
        if df is None or df.empty:
            continue
        
        for idx, row in df.iterrows():
            # 예시 행 제외
            if str(row.get("순번", "")).strip() == "예시":
                continue
            
            name = str(row.get("이름", "")).strip()
            student_id = str(row.get("학번", "")).strip().replace(".0", "")
            
            if not name:
                continue

            grade = str(row.get("학년", "")).strip()
            # "1학년" -> "1" 형식으로 전처리
            if grade.endswith("학년"):
                grade = grade.replace("학년", "").strip()
            
            gender = str(row.get("성별", "")).strip()
            date = str(row.get("*상담일자", "")).strip()
            tag = str(row.get("*상담구분", "")).strip()

            key = (name, student_id)
            if key not in student_map:
                student_map[key] = {
                    "id": f"{name}_{student_id}",
                    "name": name,
                    "studentId": student_id,
                    "grade": grade,
                    "gender": gender,
                    "sessionCount": 0,
                    "lastDate": "",
                    "tags": set()
                }

            student = student_map[key]
            student["sessionCount"] += 1
            if date and (not student["lastDate"] or date > student["lastDate"]):
                student["lastDate"] = date
                # 학년과 성별도 최신 상담 기록 기준으로 업데이트
                if grade:
                    student["grade"] = grade
                if gender:
                    student["gender"] = gender
            
            if tag and tag != "nan":
                student["tags"].add(tag)

    # tags set을 list로 변환 및 정렬하여 리스트 반환
    result = []
    for s in student_map.values():
        s["tags"] = sorted(list(s["tags"]))
        result.append(s)

    # 최근 상담일 내림차순, 이름 오름차순 정렬
    result.sort(key=lambda x: (x["lastDate"], x["name"]), reverse=True)
    return result

@app.get("/sessions/{student_name}")
def get_sessions(student_name: str, student_id: str = Query("")):
    """
    특정 학생의 상담 이력을 조회합니다.
    개인상담, 보호자상담, 교원자문, 의뢰 시트에서 이름/학번 일치 항목을 가져오며,
    학번이 일치하는 집단상담 내역도 조회하여 병합 반환합니다.
    """
    try:
        repo.load_data(EXCEL_PATH)
    except Exception as e:
        logger.error(f"데이터 리로드 실패: {e}")

    sessions = []

    # 1. 개인/보호자/교원자문/의뢰 시트 매칭
    individual_sheets = ["개인상담", "보호자상담", "교원자문", REQUEST_SHEET]
    for sheet in individual_sheets:
        df = repo.data_frames.get(sheet)
        if df is None or df.empty:
            continue
        
        # sheetType 매핑 (상세 명칭 제거)
        sheet_type_short = sheet
        if "의뢰" in sheet:
            sheet_type_short = "의뢰"

        for idx, row in df.iterrows():
            if str(row.get("순번", "")).strip() == "예시":
                continue
            
            row_name = str(row.get("이름", "")).strip()
            row_sid = str(row.get("학번", "")).strip().replace(".0", "")
            
            # 매칭 검증
            name_match = (row_name == student_name)
            id_match = True
            if student_id:
                id_match = (row_sid == student_id)
                
            if name_match and id_match:
                sessions.append({
                    "id": str(row.get(RECORD_ID_COL, "")),
                    "studentId": f"{student_name}_{student_id}",
                    "date": str(row.get("*상담일자", "")),
                    "session": str(row.get("상담회기", "")) if "상담회기" in row else "",
                    "type": str(row.get("*상담구분", "")),
                    "sheetType": sheet_type_short,
                    "summary": str(row.get("*상담제목", "")),
                    "detail": str(row.get("상담내용(상세)", "")),
                    "rawIndex": idx # 수정 시 메모리 싱크를 위해 인덱스 보관
                })

    # 2. 집단상담 시트 매칭 (학번 기준)
    if student_id:
        group_sheet = GROUP_COUNSELING_SHEET
        df = repo.data_frames.get(group_sheet)
        if df is not None and not df.empty:
            for idx, row in df.iterrows():
                if str(row.get("순번", "")).strip() == "예시":
                    continue
                
                row_sid = str(row.get("학번", "")).strip().replace(".0", "")
                # 학번이 일치하거나, 콤마로 구분된 학번에 포함되어 있는지 확인
                if student_id == row_sid or student_id in [sid.strip() for sid in row_sid.split(",")]:
                    sessions.append({
                        "id": str(row.get(RECORD_ID_COL, "")),
                        "studentId": f"{student_name}_{student_id}",
                        "date": str(row.get("*상담일자", "")),
                        "session": str(row.get("상담회기", "")),
                        "type": str(row.get("*상담구분", "")),
                        "sheetType": "집단상담",
                        "summary": str(row.get("*상담제목", "")),
                        "detail": str(row.get("상담내용(상세)", "")),
                        "rawIndex": idx
                    })

    # 날짜 역순으로 정렬
    sessions.sort(key=lambda x: x["date"], reverse=True)
    return sessions

@app.post("/sessions")
def create_session(data: SessionCreate):
    """
    새로운 상담 기록을 생성하고 엑셀 시트에 안전하게 추가합니다.
    """
    # short sheetType을 실제 시트명으로 매핑
    sheet_mapping = {
        "개인상담": "개인상담",
        "집단상담": GROUP_COUNSELING_SHEET,
        "보호자상담": "보호자상담",
        "교원자문": "교원자문",
        "의뢰": REQUEST_SHEET
    }

    real_sheet_name = sheet_mapping.get(data.sheetType)
    if not real_sheet_name:
        raise HTTPException(status_code=400, detail=f"알 수 없는 시트 타입입니다: {data.sheetType}")

    try:
        repo.load_data(EXCEL_PATH)
    except Exception as e:
        logger.error(f"데이터 리로드 실패: {e}")

    df = repo.data_frames.get(real_sheet_name)
    
    # 학년 포맷 정리 ("2" -> "2학년", "혼합" -> "혼합")
    grade_formatted = data.grade.strip()
    if grade_formatted and grade_formatted.isdigit():
        grade_formatted = f"{grade_formatted}학년"

    # 상담 회기 계산
    session_count = 1
    if df is not None and not df.empty:
        if data.sheetType == "집단상담":
            # 학번 기준 매칭
            client_records = df[df["학번"].astype(str).str.strip().str.replace(".0", "") == data.studentId.strip()]
        else:
            # 이름 기준 매칭
            client_records = df[df["이름"].astype(str).str.strip() == data.name.strip()]
        session_count = len(client_records) + 1

    # Default Column Mapping
    default_counseling_types = {
        "개인상담": ("상담", "개인상담", "면담"),
        GROUP_COUNSELING_SHEET: ("상담", "집단상담", "면담"),
        "보호자상담": ("상담", "학부모상담", "면담"),
        "교원자문": ("자문", "교원자문", "면담"),
        REQUEST_SHEET: ("의뢰", "교내외의뢰", "면담")
    }
    
    category, subcategory, medium = default_counseling_types.get(real_sheet_name, ("상담", "개인상담", "면담"))

    row_data = {
        "학번": data.studentId,
        "상담시간": "12:30~13:10" if data.sheetType != "집단상담" else "13:10~13:50",
        "기타 및 특이사항": "",
        "*상담분류": "전문상담",
        "*Wee클래스": "Wee클래스",
        "*대분류": category,
        "*중분류": subcategory,
        "*상담구분": data.type,
        "*상담인원": "1" if data.sheetType != "집단상담" else "10", # default group count
        "*학년도": data.date[:4] if len(data.date) >= 4 else str(datetime.date.today().year),
        "*상담일자": data.date,
        "학년": grade_formatted if grade_formatted else ("혼합" if data.sheetType == "집단상담" else "1학년"),
        "성별": data.gender if data.gender else ("혼성" if data.sheetType == "집단상담" else "남"),
        "*상담제목": data.summary,
        "*상담내용": data.summary,
        "상담내용(상세)": data.detail,
        "*상담시간(시)": "0",
        "*상담시간(분)": "40",
        "*상담사소속": "전문상담사",
        "*상담매체구분": medium,
        RECORD_ID_COL: uuid.uuid4().hex
    }

    # 시트별 필수 필드 추가
    if data.sheetType != "집단상담":
        row_data["이름"] = data.name

    if data.sheetType in ["개인상담", "집단상담"]:
        row_data["상담회기"] = str(session_count)

    if data.sheetType == "집단상담":
        row_data["프로그램명"] = "집단상담"
        row_data["목표"] = data.summary

    # Save to Excel
    success, err = repo.append_new_row_to_excel(real_sheet_name, pd.DataFrame([row_data]))
    if not success:
        raise HTTPException(status_code=500, detail=err)

    return {"status": "success", "session_id": row_data[RECORD_ID_COL]}

@app.put("/sessions/{session_id}")
def update_session(session_id: str, data: SessionUpdate):
    """
    기존 상담 기록을 수정하고 엑셀 시트에 안전하게 반영합니다.
    """
    try:
        repo.load_data(EXCEL_PATH)
    except Exception as e:
        logger.error(f"데이터 리로드 실패: {e}")

    # 모든 시트에서 UUID에 해당하는 행을 검색합니다.
    target_sheet = None
    target_idx = None

    for sheet_name in SHEET_NAMES:
        df = repo.data_frames.get(sheet_name)
        if df is None or df.empty:
            continue
        
        matches = df[df[RECORD_ID_COL] == session_id]
        if not matches.empty:
            target_sheet = sheet_name
            target_idx = int(matches.index[0])
            break

    if target_sheet is None:
        raise HTTPException(status_code=404, detail="해당 ID의 상담 기록을 찾을 수 없습니다.")

    # 엑셀 파일 내의 해당 열들 업데이트 구성
    updates = {
        "*상담일자": data.date,
        "*학년도": data.date[:4] if len(data.date) >= 4 else str(datetime.date.today().year),
        "*상담구분": data.type,
        "*상담제목": data.summary,
        "*상담내용": data.summary,
        "상담내용(상세)": data.detail
    }

    success, err = repo.update_excel_row(target_sheet, target_idx, updates)
    if not success:
        raise HTTPException(status_code=500, detail=err)

    return {"status": "success"}

@app.get("/stats/today")
def get_today_stats():
    """
    오늘 진행된 상담 건수를 집계합니다.
    """
    try:
        repo.load_data(EXCEL_PATH)
    except Exception as e:
        logger.error(f"데이터 리로드 실패: {e}")

    today_str = datetime.date.today().strftime("%Y%m%d")
    
    total = 0
    guardian = 0
    referral = 0

    for sheet_name in SHEET_NAMES:
        df = repo.data_frames.get(sheet_name)
        if df is None or df.empty:
            continue
        
        # 오늘 날짜에 매칭되는 행 수 계산 (예시 행 제외)
        if "*상담일자" in df.columns:
            # Nan/Null 제거 후 스트링 비교
            valid_rows = df[(df["*상담일자"].astype(str).str.strip() == today_str) & (df["순번"].astype(str).str.strip() != "예시")]
            count = len(valid_rows)
            total += count
            if sheet_name == "보호자상담":
                guardian += count
            elif sheet_name == REQUEST_SHEET:
                referral += count

    return {
        "total": total,
        "guardian": guardian,
        "referral": referral,
        "pending": 0  # 미작성 건수는 향후 일정/예약 추가 시 계산
    }

@app.post("/backup")
def trigger_backup():
    """
    엑셀 파일 수동 백업을 수행합니다.
    """
    success, result = repo.save_backup_excel()
    if not success:
        raise HTTPException(status_code=500, detail=result)
    
    file_name, backup_dir = result
    return {
        "status": "success",
        "filename": file_name,
        "directory": backup_dir
    }

if __name__ == "__main__":
    import uvicorn
    import multiprocessing
    # PyInstaller multiprocessing support
    multiprocessing.freeze_support()
    # Run uvicorn server directly with single worker
    uvicorn.run(app, host="127.0.0.1", port=8765, reload=False)
