import uuid
import datetime
import pandas as pd
from fastapi import APIRouter, HTTPException, Query
from backend.core.dependencies import repo
from backend.schemas.session import SessionCreate, SessionUpdate
from backend.utils.logger import logger
from backend.core.constants import RECORD_ID_COL, SHEET_NAMES, GROUP_COUNSELING_SHEET, REQUEST_SHEET

router = APIRouter()

def extract_ban_from_student_id(student_id: str) -> str:
    student_id = student_id.strip()
    if not student_id.isdigit():
        return ""
    if len(student_id) == 4:
        return str(int(student_id[1]))  # 1203 -> 2
    elif len(student_id) == 5:
        return str(int(student_id[1:3]))  # 10203 -> 2, 11203 -> 12
    return ""

@router.get("/sessions/{student_name}")
def get_sessions(student_name: str, student_id: str = Query("")):
    """
    특정 학생의 상담 이력을 조회합니다.
    개인상담, 보호자상담, 교원자문, 의뢰 시트에서 이름/학번 일치 항목을 가져오며,
    집단상담은 보안 노출 차단 방침에 따라 이 개인상담 이력 조회 목록에서 제외됩니다.
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
            
            sheet_type_short = sheet
            if "의뢰" in sheet:
                sheet_type_short = "의뢰"

            for idx, row in df.iterrows():
                if str(row.get("순번", "")).strip() == "예시":
                    continue
                
                row_name = str(row.get("이름", "")).strip()
                row_sid = str(row.get("학번", "")).strip().replace(".0", "")
                
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
                        "counselingTime": str(row.get("상담시간", "")).strip() if "상담시간" in row and not pd.isna(row.get("상담시간")) else "",
                        "counselingCount": str(row.get("*상담인원", "")).strip().replace(".0", "") if "*상담인원" in row and not pd.isna(row.get("*상담인원")) else "",
                        "ban": extract_ban_from_student_id(row_sid),
                        "rawIndex": idx
                    })

        # 2. 상담유형별로 세션들을 분류하여 날짜 오름차순 기준으로 회기 번호 동적 보정
        by_type = {}
        for s in sessions:
            stype = s["sheetType"]
            if stype not in by_type:
                by_type[stype] = []
            by_type[stype].append(s)

        for stype, type_sessions in by_type.items():
            type_sessions.sort(key=lambda x: (x["date"], x.get("rawIndex", 0)))
            for i, s in enumerate(type_sessions):
                s["session"] = str(i + 1)

        # 날짜 역순 정렬
        sessions.sort(key=lambda x: x["date"], reverse=True)
        return sessions

@router.get("/sessions")
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
                    "counselingTime": str(row.get("상담시간", "")).strip() if "상담시간" in row and not pd.isna(row.get("상담시간")) else "",
                    "counselingCount": str(row.get("*상담인원", "")).strip().replace(".0", "") if "*상담인원" in row and not pd.isna(row.get("*상담인원")) else "",
                    "programName": str(row.get("프로그램명", "")).strip() if "프로그램명" in row and not pd.isna(row.get("프로그램명")) else "",
                    "ban": extract_ban_from_student_id(student_id),
                    "rawIndex": idx
                })

        # 학생별 및 상담유형별로 세션들을 그룹화하여 날짜 오름차순 기준으로 회기 번호 동적 보정
        by_student_and_type = {}
        for s in sessions:
            key = (s.get("name", ""), s.get("studentId", ""), s.get("sheetType", ""))
            if key not in by_student_and_type:
                by_student_and_type[key] = []
            by_student_and_type[key].append(s)

        for key, group_sessions in by_student_and_type.items():
            group_sessions.sort(key=lambda x: (x["date"], x.get("rawIndex", 0)))
            for i, s in enumerate(group_sessions):
                s["session"] = str(i + 1)
                
        # 날짜 최신순 정렬
        sessions.sort(key=lambda x: x["date"], reverse=True)
        return sessions

@router.post("/sessions")
def create_session(data: SessionCreate):
    """
    새로운 상담 기록을 생성하고 엑셀 시트에 안전하게 추가합니다.
    """
    with repo.lock:
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
            if not any(not df.empty for df in repo.data_frames.values()):
                raise HTTPException(status_code=500, detail="데이터베이스 리로드 실패로 쓰기 작업을 진행할 수 없습니다.")

        df = repo.data_frames.get(real_sheet_name)
        
        grade_formatted = data.grade.strip()
        if grade_formatted and grade_formatted.isdigit():
            grade_formatted = f"{grade_formatted}학년"

        session_count = 1
        if df is not None and not df.empty:
            if data.sheetType == "집단상담":
                client_records = df[df["학번"].astype(str).str.strip().str.replace(".0", "") == data.studentId.strip()]
            else:
                client_records = df[df["이름"].astype(str).str.strip() == data.name.strip()]
            session_count = len(client_records) + 1

        default_counseling_types = {
            "개인상담": ("상담", "개인상담", "면담"),
            GROUP_COUNSELING_SHEET: ("상담", "집단상담", "면담"),
            "보호자상담": ("상담", "학부모상담", "면담"),
            "교원자문": ("자문", "교원자문", "면담"),
            REQUEST_SHEET: ("의뢰", "교내외의뢰", "면담")
        }
        
        category, subcategory, medium = default_counseling_types.get(real_sheet_name, ("상담", "개인상담", "면담"))
        
        counseling_count = "1"
        if data.sheetType == "집단상담":
            if data.counselingCount:
                counseling_count = data.counselingCount.strip()
            else:
                student_ids = [sid.strip() for sid in data.studentId.split(",") if sid.strip()]
                counseling_count = str(len(student_ids)) if student_ids else "10"

        row_data = {
            "학번": data.studentId,
            "상담시간": "12:30~13:10" if data.sheetType != "집단상담" else "13:10~13:50",
            "기타 및 특이사항": "",
            "*상담분류": "전문상담",
            "*Wee클래스": "Wee클래스",
            "*대분류": category,
            "*중분류": subcategory,
            "*상담구분": data.type,
            "*상담인원": counseling_count,
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

        if data.sheetType != "집단상담":
            row_data["이름"] = data.name

        if data.sheetType in ["개인상담", "집단상담"]:
            row_data["상담회기"] = str(session_count)

        if data.sheetType == "집단상담":
            row_data["프로그램명"] = data.programName.strip() if data.programName else "집단상담"
            row_data["목표"] = data.summary

        success, err = repo.append_new_row_to_excel(real_sheet_name, pd.DataFrame([row_data]))
        if not success:
            raise HTTPException(status_code=500, detail=err)

        return {"status": "success", "session_id": row_data[RECORD_ID_COL]}

@router.put("/sessions/{session_id}")
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

        updates = {
            "*상담일자": data.date,
            "*학년도": data.date[:4] if len(data.date) >= 4 else str(datetime.date.today().year),
            "*상담구분": data.type,
            "*상담제목": data.summary,
            "*상담내용": data.summary,
            "상담내용(상세)": data.detail
        }
        if data.sheetType == "집단상담" and hasattr(data, "counselingCount"):
            updates["*상담인원"] = data.counselingCount
        if target_sheet == GROUP_COUNSELING_SHEET and hasattr(data, "programName"):
            updates["프로그램명"] = data.programName

        success, err = repo.update_excel_row(target_sheet, target_idx, updates)
        if not success:
            raise HTTPException(status_code=500, detail=err)

        return {"status": "success"}

@router.delete("/sessions/{session_id}")
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

@router.get("/stats/today")
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
            
            if "*상담일자" in df.columns:
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
            "pending": 0
        }

@router.get("/validation-options")
def get_validation_options():
    """
    각 시트별 상담구분 드롭박스 옵션 목록을 반환합니다. (메모리 캐시 즉시 리턴)
    """
    return repo.get_validation_options()

@router.post("/validation-options/reload")
def reload_validation_options():
    """
    엑셀의 데이터 유효성 검사 설정을 수동으로 재파싱하여 캐시를 갱신합니다.
    """
    with repo.lock:
        repo.validation_options_cache = {}
        return repo.get_validation_options()
