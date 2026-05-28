from pydantic import BaseModel

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
