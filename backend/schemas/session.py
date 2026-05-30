from pydantic import BaseModel

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
    counselingCount: str = ""
    programName: str = ""

class SessionUpdate(BaseModel):
    date: str
    type: str
    summary: str
    detail: str
    sheetType: str
    counselingCount: str = ""
    programName: str = ""
