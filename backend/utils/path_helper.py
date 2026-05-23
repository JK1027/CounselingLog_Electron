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
