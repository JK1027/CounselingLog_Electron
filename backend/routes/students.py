import os
import json
from fastapi import APIRouter, HTTPException, Body
from backend.core.dependencies import repo
from backend.schemas.student import StudentUpdate, StudentDelete
from backend.utils.logger import logger
from backend.utils.path_helper import get_writable_path, ensure_directory_exists
from backend.core.constants import REQUEST_SHEET

router = APIRouter()

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

def extract_ban_from_student_id(student_id: str) -> str:
    student_id = student_id.strip()
    if not student_id.isdigit():
        return ""
    if len(student_id) == 4:
        return str(int(student_id[1]))  # 1203 -> 2
    elif len(student_id) == 5:
        return str(int(student_id[1:3]))  # 10203 -> 2, 11203 -> 12
    return ""

@router.get("/students")
def get_students():
    """
    모든 개인상담 대상 학생들의 고유 정보를 집계하여 반환합니다.
    (이름, 학번) 기준으로 그룹화하며 세션수, 최근상담일, 상담구분 태그를 포함합니다.
    """
    with repo.lock:
        try:
            repo.check_and_reload()
        except Exception as e:
            logger.error(f"데이터 리로드 실패: {e}")
            if not any(not df.empty for df in repo.data_frames.values()):
                raise HTTPException(status_code=500, detail="데이터베이스 로드 실패 및 유효한 캐시가 없습니다.")

        student_map = {}

        target_sheets = ["개인상담", "보호자상담", "교원자문", REQUEST_SHEET]

        for sheet in target_sheets:
            df = repo.data_frames.get(sheet)
            if df is None or df.empty:
                continue
            
            for idx, row in df.iterrows():
                if str(row.get("순번", "")).strip() == "예시":
                    continue
                
                name = str(row.get("이름", "")).strip()
                student_id = str(row.get("학번", "")).strip().replace(".0", "")
                
                if not name:
                    continue

                grade = str(row.get("학년", "")).strip()
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
                    if grade:
                        student["grade"] = grade
                    if ban:
                        student["ban"] = ban
                    if gender:
                        student["gender"] = gender
                
                if tag and tag != "nan":
                    student["tags"].add(tag)

        result = []
        for s in student_map.values():
            s["tags"] = sorted(list(s["tags"]))
            result.append(s)

        result.sort(key=lambda x: (x["lastDate"], x["name"]), reverse=True)
        return result

@router.post("/students/update")
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

@router.post("/students/delete")
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

@router.get("/peer-counsel/students")
def get_peer_students():
    """
    또래상담 학생 명단을 로드합니다.
    AppData 디렉토리에 파일이 없을 경우 기본 명단 12명 파일을 자동 생성하여 반환합니다.
    """
    file_path = get_writable_path("peer_counsel_students.json")
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

@router.post("/peer-counsel/students")
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
