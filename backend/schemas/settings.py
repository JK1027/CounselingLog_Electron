from pydantic import BaseModel

class SettingsRequest(BaseModel):
    backupDir: str = ""

class BackupTestRequest(BaseModel):
    backup_dir: str = ""

class OpenFileRequest(BaseModel):
    path: str
