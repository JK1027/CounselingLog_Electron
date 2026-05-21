import re
from datetime import datetime
from backend.core.constants import GROUP_COUNSELING_SHEET, REQUEST_SHEET, REQUIRED_FIELDS

def validate_date_format(date_str):
    """날짜가 YYYYMMDD 규격인지 검증합니다. 성공 시 True, 실패 시 False를 반환합니다."""
    if not date_str:
        return False
    # 정규식 패턴 검사 (숫자 8자리)
    if not re.match(r"^\d{8}$", str(date_str)):
        return False
    # 실제 달력 상 존재하는 날짜인지 파싱 시도
    try:
        datetime.strptime(str(date_str), "%Y%m%d")
        return True
    except ValueError:
        return False

def validate_student_id(student_id):
    """학번이 정수 숫자 형태인지 검증합니다. 성공 시 True, 실패 시 False를 반환합니다."""
    if not student_id:
        return False
    # 숫자 문자열인지 확인 (공백 제거 후)
    val = str(student_id).strip()
    if not val:
        return False
    return val.isdigit()

def validate_required_fields(sheet_name, data):
    """
    시트 종류에 따라 필수 입력값이 모두 작성되었는지 검증합니다.
    누락된 필수 항목이 있으면 (False, '누락된 항목 명칭')을, 통과 시 (True, None)을 반환합니다.
    """
    required_cols = REQUIRED_FIELDS.get(sheet_name, ["이름", "*상담구분", "상담내용(상세)"])

    # 필수 필드 표시 이름 매핑
    display_mapping = {
        "이름": "이름",
        "학번": "학번",
        "학년": "학년",
        "성별": "성별",
        "*상담구분": "상담구분",
        "*상담일자": "의뢰일자" if sheet_name == REQUEST_SHEET else "상담일자",
        "*상담제목": "상담제목" if sheet_name == GROUP_COUNSELING_SHEET else "상담내용(요약)",
        "*상담내용": "상담내용",
        "상담내용(상세)": "상담내용(상세)"
    }

    for col in required_cols:
        val = data.get(col)
        if val is None or str(val).strip() == "":
            return False, display_mapping.get(col, col)
            
    return True, None
