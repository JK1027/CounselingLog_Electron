import os
import sys

def get_resource_path(relative_path):
    """
    Get absolute path to resource, works for development and for PyInstaller.
    Used for reading read-only assets packaged inside the executable.
    """
    try:
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        base_path = sys._MEIPASS
    except AttributeError:
        # In development, path is relative to the backend root (which is parent of 'utils')
        base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.normpath(os.path.join(base_path, relative_path))

def get_writable_path(relative_path):
    """
    Get writable path for runtime data.
    In production (PyInstaller packaged), this writes to the user's AppData folder
    to avoid PermissionErrors when installed in write-protected system directories (e.g. Program Files).
    """
    if getattr(sys, 'frozen', False):
        # 프로덕션 패키징 환경: 사용자 AppData/Roaming/counselinglog-electron 경로 사용
        appdata = os.environ.get('APPDATA')
        if not appdata:
            appdata = os.path.expanduser('~')
        base_dir = os.path.join(appdata, "counselinglog-electron")
    else:
        # 개발 환경: workspace root (parent of 'backend')
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    return os.path.normpath(os.path.join(base_dir, relative_path))

def ensure_directory_exists(dir_path):
    """Helper to ensure a directory exists."""
    if not os.path.exists(dir_path):
        os.makedirs(dir_path)

def get_user_documents_path():
    """
    Get the standard Windows 'My Documents' folder path using Win32 API via ctypes.
    Fallback to standard home directory if Windows API is not available or fails.
    """
    if sys.platform == 'win32':
        try:
            import ctypes
            from ctypes import wintypes
            CSIDL_PERSONAL = 5  # My Documents
            SHGFP_TYPE_CURRENT = 0
            
            buf = ctypes.create_unicode_buffer(wintypes.MAX_PATH)
            # SHGetFolderPathW is highly compatible and returns redirected folders (e.g. OneDrive/Documents)
            res = ctypes.windll.shell32.SHGetFolderPathW(None, CSIDL_PERSONAL, None, SHGFP_TYPE_CURRENT, buf)
            if res == 0:
                return buf.value
        except Exception:
            pass
            
    # Fallback for non-Windows or if API fails
    home = os.path.expanduser('~')
    docs_path = os.path.join(home, 'Documents')
    if os.path.exists(docs_path):
        return docs_path
    
    # 한글 윈도우/특이 케이스 대응용
    docs_ko = os.path.join(home, '문서')
    if os.path.exists(docs_ko):
        return docs_ko
        
    return home

CURRENT_BACKUP_DIR = ""

def get_user_backup_path():
    """
    Get the writable path for user's manual backup.
    If CURRENT_BACKUP_DIR is configured, it overrides My Documents.
    """
    if CURRENT_BACKUP_DIR:
        return os.path.normpath(CURRENT_BACKUP_DIR)
        
    doc_dir = get_user_documents_path()
    backup_dir = os.path.join(doc_dir, '상담일지 백업 파일')
    return os.path.normpath(backup_dir)
