import json
from backend.utils.path_helper import get_resource_path

# Load external configuration
config_path = get_resource_path("config.json")
try:
    with open(config_path, "r", encoding="utf-8") as f:
        CONFIG = json.load(f)
except Exception:
    CONFIG = {
        "sheets": {
            "all_sheets": [
                "개인상담",
                "집단상담(또래상담, 학급별 집단)",
                "보호자상담",
                "교원자문",
                "의뢰(정서행동의뢰, 자문의 의뢰 등)"
            ],
            "group_counseling": "집단상담(또래상담, 학급별 집단)",
            "request": "의뢰(정서행동의뢰, 자문의 의뢰 등)"
        },
        "validation_options": {
            "개인상담": ["기타"],
            "보호자상담": ["기타"],
            "교원자문": ["기타"],
            "의뢰(정서행동의뢰, 자문의 의뢰 등)": ["기타"]
        }
    }

SHEET_NAMES = CONFIG["sheets"]["all_sheets"]
GROUP_COUNSELING_SHEET = CONFIG["sheets"]["group_counseling"]
REQUEST_SHEET = CONFIG["sheets"]["request"]

# UUID Column Name
RECORD_ID_COL = "_record_id"

# Validation & Required Fields Configuration
REQUIRED_FIELDS = {
    "개인상담": ["이름", "*상담일자", "*상담구분", "*상담제목", "상담내용(상세)"],
    GROUP_COUNSELING_SHEET: ["학번", "*상담일자", "*상담제목", "상담내용(상세)"],
    "보호자상담": ["이름", "*상담일자", "*상담구분", "*상담제목", "상담내용(상세)"],
    "교원자문": ["이름", "*상담일자", "*상담구분", "*상담제목", "상담내용(상세)"],
    REQUEST_SHEET: ["이름", "*상담일자", "*상담구분", "*상담제목", "상담내용(상세)"]
}

# Standard Columns Schema from actual Excel file (NICE Upload Compatible)
SHEET_SCHEMAS = {
    "개인상담": [
        "순번", "학번", "이름", "상담시간", "기타 및 특이사항", 
        "*상담분류", "*Wee클래스", "*대분류", "*중분류", "*상담구분", "*상담인원", "*학년도", "*상담일자", 
        "학년", "성별", "*상담제목", "*상담내용", "상담내용(상세)", 
        "*상담시간(시)", "*상담시간(분)", "*상담사소속", "*상담매체구분", "상담회기", RECORD_ID_COL
    ],
    GROUP_COUNSELING_SHEET: [
        "순번", "학번", "프로그램명", "상담시간", "상담회기", "목표", "기타 및 특이사항", 
        "*상담분류", "*Wee클래스", "*대분류", "*중분류", "*상담구분", "*상담인원", "*학년도", "*상담일자", 
        "학년", "성별", "*상담제목", "*상담내용", "상담내용(상세)", 
        "*상담시간(시)", "*상담시간(분)", "*상담사소속", "*상담매체구분", RECORD_ID_COL
    ],
    "보호자상담": [
        "순번", "학번", "이름", "상담시간", "기타 및 특이사항", 
        "*상담분류", "*Wee클래스", "*대분류", "*중분류", "*상담구분", "*상담인원", "*학년도", "*상담일자", 
        "학년", "성별", "*상담제목", "*상담내용", "상담내용(상세)", 
        "*상담시간(시)", "*상담시간(분)", "*상담사소속", "*상담매체구분", RECORD_ID_COL
    ],
    "교원자문": [
        "순번", "학번", "이름", "상담시간", "기타 및 특이사항", 
        "*상담분류", "*Wee클래스", "*대분류", "*중분류", "*상담구분", "*상담인원", "*학년도", "*상담일자", 
        "학년", "성별", "*상담제목", "*상담내용", "상담내용(상세)", 
        "*상담시간(시)", "*상담시간(분)", "*상담사소속", "*상담매체구분", RECORD_ID_COL
    ],
    REQUEST_SHEET: [
        "순번", "학번", "이름", "상담시간", "기타 및 특이사항", 
        "*상담분류", "*Wee클래스", "*대분류", "*중분류", "*상담구분", "*상담인원", "*학년도", "*상담일자", 
        "학년", "성별", "*상담제목", "*상담내용", "상담내용(상세)", 
        "*상담시간(시)", "*상담시간(분)", "*상담사소속", "*상담매체구분", RECORD_ID_COL
    ]
}
