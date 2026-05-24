import os
import datetime
import uuid
from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd

from backend.utils.path_helper import get_writable_path, ensure_directory_exists
from backend.repositories.excel_repository import ExcelRepository
from backend.utils.logger import logger
from backend.core.constants import RECORD_ID_COL, SHEET_NAMES, GROUP_COUNSELING_SHEET, REQUEST_SHEET

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

# Initialize Excel Repository
CURRENT_EXCEL_PATH = get_writable_path("data/상담일지.xlsx")
# Ensure directory exists
ensure_directory_exists(os.path.dirname(CURRENT_EXCEL_PATH))

repo = ExcelRepository()

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
    return {"status": "ok", "excel_path": CURRENT_EXCEL_PATH}

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

class OpenFileRequest(BaseModel):
    path: str

class StudentUpdate(BaseModel):
    oldName: str
    oldStudentId: str
    newName: str
    newStudentId: str
    grade: str
    gender: str

class StudentDelete(BaseModel):
    name: str
    studentId: str

def extract_ban_from_student_id(student_id: str) -> str:
    student_id = student_id.strip()
    if not student_id.isdigit():
        return ""
    if len(student_id) == 4:
        return str(int(student_id[1]))  # 1203 -> 2
    elif len(student_id) == 5:
        return str(int(student_id[1:3]))  # 10203 -> 2, 11203 -> 12
    return ""

@app.get("/students")
def get_students():
    """
    모든 개인상담 대상 학생들의 고유 정보를 집계하여 반환합니다.
    (이름, 학번) 기준으로 그룹화하며 세션수, 최근상담일, 상담구분 태그를 포함합니다.
    """
    with repo.lock:
        try:
            # 엑셀 최신 데이터 보장
            repo.check_and_reload()
        except Exception as e:
            logger.error(f"데이터 리로드 실패: {e}")
            if not any(not df.empty for df in repo.data_frames.values()):
                raise HTTPException(status_code=500, detail="데이터베이스 로드 실패 및 유효한 캐시가 없습니다.")

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
                
                ban = extract_ban_from_student_id(student_id)
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
                        "ban": ban,
                        "gender": gender,
                        "sessionCount": 0,
                        "lastDate": "",
                        "tags": set()
                    }

                student = student_map[key]
                student["sessionCount"] += 1
                if date and (not student["lastDate"] or date > student["lastDate"]):
                    student["lastDate"] = date
                    # 학년, 반, 성별도 최신 상담 기록 기준으로 업데이트
                    if grade:
                        student["grade"] = grade
                    if ban:
                        student["ban"] = ban
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

@app.post("/students/update")
def update_student(data: StudentUpdate):
    """
    학생의 개인정보(이름, 학번, 학년, 성별)를 모든 시트에서 일괄 수정합니다.
    """
    with repo.lock:
        try:
            repo.check_and_reload()
        except Exception as e:
            logger.error(f"데이터 리로드 실패: {e}")
            if not any(not df.empty for df in repo.data_frames.values()):
                raise HTTPException(status_code=500, detail="데이터베이스 리로드 실패로 수정 작업을 진행할 수 없습니다.")

        # 이름과 학번 필수 검증
        if not data.newName.strip():
            raise HTTPException(status_code=400, detail="이름은 비어 있을 수 없습니다.")
        if not data.newStudentId.strip() or not data.newStudentId.isdigit():
            raise HTTPException(status_code=400, detail="학번은 숫자만 입력해 주세요.")

        success, err = repo.update_student_info(
            old_name=data.oldName,
            old_student_id=data.oldStudentId,
            new_name=data.newName,
            new_student_id=data.newStudentId,
            grade=data.grade,
            gender=data.gender
        )
        
        if not success:
            raise HTTPException(status_code=400 if "이미 학번" in str(err) else 500, detail=err)

        return {"status": "success"}

@app.post("/students/delete")
def delete_student(data: StudentDelete):
    """
    학생의 모든 개인 상담 기록(개인상담, 보호자상담, 교원자문, 의뢰)을 엑셀 시트에서 일괄 삭제합니다.
    """
    with repo.lock:
        try:
            repo.check_and_reload()
        except Exception as e:
            logger.error(f"데이터 리로드 실패: {e}")
            if not any(not df.empty for df in repo.data_frames.values()):
                raise HTTPException(status_code=500, detail="데이터베이스 리로드 실패로 삭제 작업을 진행할 수 없습니다.")

        success, err = repo.delete_student_info(
            name=data.name,
            student_id=data.studentId
        )
        
        if not success:
            raise HTTPException(status_code=400, detail=err)

        return {"status": "success"}

@app.get("/sessions/{student_name}")
def get_sessions(student_name: str, student_id: str = Query("")):
    """
    특정 학생의 상담 이력을 조회합니다.
    개인상담, 보호자상담, 교원자문, 의뢰 시트에서 이름/학번 일치 항목을 가져오며,
    학번이 일치하는 집단상담 내역도 조회하여 병합 반환합니다.
    """
    with repo.lock:
        try:
            repo.check_and_reload()
        except Exception as e:
            logger.error(f"데이터 리로드 실패: {e}")
            if not any(not df.empty for df in repo.data_frames.values()):
                raise HTTPException(status_code=500, detail="데이터베이스 로드 실패 및 유효한 캐시가 없습니다.")

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
                        "name": row_name,
                        "studentId": row_sid,
                        "grade": str(row.get("학년", "")).strip().replace("학년", ""),
                        "gender": str(row.get("성별", "")).strip(),
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
                            "name": str(row.get("이름", "")).strip() if "이름" in row else "",
                            "studentId": student_id,
                            "grade": str(row.get("학년", "")).strip().replace("학년", ""),
                            "gender": str(row.get("성별", "")).strip(),
                            "date": str(row.get("*상담일자", "")),
                            "session": str(row.get("상담회기", "")),
                            "type": str(row.get("*상담구분", "")),
                            "sheetType": "집단상담",
                            "summary": str(row.get("*상담제목", "")),
                            "detail": str(row.get("상담내용(상세)", "")),
                            "rawIndex": idx
                        })

        # 3. 상담유형별(sheetType)로 세션들을 분류하여 날짜 오름차순 기준으로 회기 번호 동적 보정
        by_type = {}
        for s in sessions:
            stype = s["sheetType"]
            if stype not in by_type:
                by_type[stype] = []
            by_type[stype].append(s)

        for stype, type_sessions in by_type.items():
            type_sessions.sort(key=lambda x: (x["date"], x.get("rawIndex", 0)))
            for i, s in enumerate(type_sessions):
                existing_session = str(s.get("session", "")).strip()
                if not existing_session or existing_session == "nan":
                    s["session"] = str(i + 1)

        # 날짜 역순으로 정렬
        sessions.sort(key=lambda x: x["date"], reverse=True)
        return sessions

@app.get("/sessions")
def get_all_sessions(sheet_type: str = Query(None)):
    """
    인쇄/조회용으로 전체 상담 내역 또는 특정 시트의 상담 내역을 조회합니다.
    """
    with repo.lock:
        try:
            repo.check_and_reload()
        except Exception as e:
            logger.error(f"데이터 리로드 실패: {e}")
            if not any(not df.empty for df in repo.data_frames.values()):
                raise HTTPException(status_code=500, detail="데이터베이스 로드 실패 및 유효한 캐시가 없습니다.")

        sessions = []
        
        if sheet_type:
            sheet_mapping = {
                "개인상담": ["개인상담"],
                "집단상담": [GROUP_COUNSELING_SHEET],
                "보호자상담": ["보호자상담"],
                "교원자문": ["교원자문"],
                "의뢰": [REQUEST_SHEET]
            }
            target_sheets = sheet_mapping.get(sheet_type, [])
        else:
            target_sheets = SHEET_NAMES
            
        for sheet in target_sheets:
            df = repo.data_frames.get(sheet)
            if df is None or df.empty:
                continue
                
            sheet_type_short = sheet
            if "의뢰" in sheet:
                sheet_type_short = "의뢰"
            elif sheet == GROUP_COUNSELING_SHEET:
                sheet_type_short = "집단상담"
                
            for idx, row in df.iterrows():
                if str(row.get("순번", "")).strip() == "예시":
                    continue
                    
                name = str(row.get("이름", "")).strip() if "이름" in row else ""
                student_id = str(row.get("학번", "")).strip().replace(".0", "")
                
                if not name and not student_id:
                    continue
                    
                sessions.append({
                    "id": str(row.get(RECORD_ID_COL, "")),
                    "name": name,
                    "studentId": student_id,
                    "grade": str(row.get("학년", "")).strip().replace("학년", ""),
                    "gender": str(row.get("성별", "")).strip(),
                    "date": str(row.get("*상담일자", "")),
                    "session": str(row.get("상담회기", "")) if "상담회기" in row else "",
                    "type": str(row.get("*상담구분", "")),
                    "sheetType": sheet_type_short,
                    "summary": str(row.get("*상담제목", "")),
                    "detail": str(row.get("상담내용(상세)", "")),
                    "rawIndex": idx
                })

        # 학생별(name + studentId) 및 상담유형별(sheetType)로 세션들을 그룹화하여 날짜 오름차순 기준으로 회기 번호 동적 보정
        by_student_and_type = {}
        for s in sessions:
            key = (s.get("name", ""), s.get("studentId", ""), s.get("sheetType", ""))
            if key not in by_student_and_type:
                by_student_and_type[key] = []
            by_student_and_type[key].append(s)

        for key, group_sessions in by_student_and_type.items():
            group_sessions.sort(key=lambda x: (x["date"], x.get("rawIndex", 0)))
            for i, s in enumerate(group_sessions):
                existing_session = str(s.get("session", "")).strip()
                if not existing_session or existing_session == "nan":
                    s["session"] = str(i + 1)
                
        # 날짜 최신순 정렬
        sessions.sort(key=lambda x: x["date"], reverse=True)
        return sessions

@app.post("/sessions")
def create_session(data: SessionCreate):
    """
    새로운 상담 기록을 생성하고 엑셀 시트에 안전하게 추가합니다.
    """
    with repo.lock:
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
            repo.check_and_reload()
        except Exception as e:
            logger.error(f"데이터 리로드 실패: {e}")
            # 쓰기 전 reload가 실패했고 유효한 데이터프레임이 없다면 진행 불가
            if not any(not df.empty for df in repo.data_frames.values()):
                raise HTTPException(status_code=500, detail="데이터베이스 리로드 실패로 쓰기 작업을 진행할 수 없습니다.")

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
    with repo.lock:
        try:
            repo.check_and_reload()
        except Exception as e:
            logger.error(f"데이터 리로드 실패: {e}")
            if not any(not df.empty for df in repo.data_frames.values()):
                raise HTTPException(status_code=500, detail="데이터베이스 리로드 실패로 수정 작업을 진행할 수 없습니다.")

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

@app.delete("/sessions/{session_id}")
def delete_session(session_id: str):
    """
    기존 상담 기록을 삭제하고 엑셀 시트에 안전하게 반영합니다.
    """
    with repo.lock:
        try:
            repo.check_and_reload()
        except Exception as e:
            logger.error(f"데이터 리로드 실패: {e}")
            if not any(not df.empty for df in repo.data_frames.values()):
                raise HTTPException(status_code=500, detail="데이터베이스 리로드 실패로 삭제 작업을 진행할 수 없습니다.")

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

        success, err = repo.delete_excel_row(target_sheet, target_idx)
        if not success:
            raise HTTPException(status_code=500, detail=err)

        return {"status": "success"}

@app.get("/stats/today")
def get_today_stats():
    """
    오늘 진행된 상담 건수를 집계합니다.
    """
    with repo.lock:
        try:
            repo.check_and_reload()
        except Exception as e:
            logger.error(f"데이터 리로드 실패: {e}")
            if not any(not df.empty for df in repo.data_frames.values()):
                raise HTTPException(status_code=500, detail="데이터베이스 로드 실패 및 유효한 캐시가 없습니다.")

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
    with repo.lock:
        success, result = repo.save_backup_excel()
        if not success:
            raise HTTPException(status_code=500, detail=result)
        
        file_name, backup_dir = result
        return {
            "status": "success",
            "filename": file_name,
            "directory": backup_dir
        }

@app.post("/open-file")
def open_file(data: OpenFileRequest):
    """
    엑셀 파일을 새로 로드하고 활성화된 파일 경로를 변경합니다.
    """
    global CURRENT_EXCEL_PATH
    with repo.lock:
        path = data.path.strip()
        if not os.path.exists(path):
            raise HTTPException(status_code=404, detail="지정된 경로에 파일이 존재하지 않습니다.")
        try:
            repo.load_data(path)
            CURRENT_EXCEL_PATH = path
            logger.info(f"성공적으로 새 엑셀 파일을 불러왔습니다: {path}")
            return {"status": "success", "excel_path": path}
        except Exception as e:
            logger.error(f"엑셀 파일 로딩 중 에러 발생: {e}")
            raise HTTPException(status_code=500, detail=f"엑셀 파일을 열 수 없습니다: {str(e)}")

import json

DEFAULT_PEER_STUDENTS = [
    { "grade": 4, "class": 1, "number": 1, "name": "임현준", "studentId": "4101" },
    { "grade": 4, "class": 1, "number": 2, "name": "조서영", "studentId": "4102" },
    { "grade": 4, "class": 2, "number": 1, "name": "조의성", "studentId": "4201" },
    { "grade": 4, "class": 2, "number": 2, "name": "조하윤", "studentId": "4202" },
    { "grade": 5, "class": 1, "number": 1, "name": "김다미", "studentId": "5101" },
    { "grade": 5, "class": 1, "number": 2, "name": "두란사", "studentId": "5102" },
    { "grade": 5, "class": 2, "number": 1, "name": "김선우", "studentId": "5201" },
    { "grade": 5, "class": 2, "number": 2, "name": "이하람", "studentId": "5202" },
    { "grade": 6, "class": 2, "number": 1, "name": "이가인", "studentId": "6201" },
    { "grade": 6, "class": 2, "number": 2, "name": "한다은", "studentId": "6202" },
    { "grade": 6, "class": 1, "number": 1, "name": "이영희", "studentId": "6101" },
    { "grade": 6, "class": 1, "number": 2, "name": "김철수", "studentId": "6102" }
]

@app.get("/peer-counsel/students")
def get_peer_students():
    """
    또래상담 학생 명단을 로드합니다.
    AppData 디렉토리에 파일이 없을 경우 기본 명단 12명 파일을 자동 생성하여 반환합니다.
    """
    file_path = get_writable_path("peer_counsel_students.json")
    # 디렉토리 존재 보장
    ensure_directory_exists(os.path.dirname(file_path))
    
    if not os.path.exists(file_path):
        try:
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(DEFAULT_PEER_STUDENTS, f, ensure_ascii=False, indent=2)
            logger.info(f"기본 또래상담 학생 데이터 생성 완료: {file_path}")
        except Exception as e:
            logger.error(f"기본 또래상담 학생 데이터 생성 실패: {e}")
            raise HTTPException(status_code=500, detail=f"기본 학생 명단 생성 실패: {str(e)}")
            
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            students = json.load(f)
        return students
    except Exception as e:
        logger.error(f"또래상담 학생 데이터 로드 실패: {e}")
        raise HTTPException(status_code=500, detail=f"또래상담 학생 명단 파일 읽기 실패: {str(e)}")

@app.post("/peer-counsel/students")
def save_peer_students(students: list = Body(...)):
    """
    또래상담 학생 명단을 AppData 내 파일에 덮어쓰고 저장합니다.
    """
    file_path = get_writable_path("peer_counsel_students.json")
    ensure_directory_exists(os.path.dirname(file_path))
    
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(students, f, ensure_ascii=False, indent=2)
        logger.info(f"또래상담 학생 데이터 저장 완료: {file_path}")
        return {"status": "success"}
    except Exception as e:
        logger.error(f"또래상담 학생 데이터 저장 실패: {e}")
        raise HTTPException(status_code=500, detail=f"또래상담 학생 명단 파일 쓰기 실패: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    import multiprocessing
    # PyInstaller multiprocessing support
    multiprocessing.freeze_support()
    # Run uvicorn server directly with single worker
    uvicorn.run(app, host="127.0.0.1", port=8765, reload=False)
