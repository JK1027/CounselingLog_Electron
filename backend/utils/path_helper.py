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
    Get writable path in the runtime directory where the executable/script is executed.
    Used for reading/writing dynamic data files, backups, and logs.
    """
    if getattr(sys, 'frozen', False):
        exe_dir = os.path.dirname(sys.executable)
        # 패키징된 Electron 앱 내부의 resources/backend/에서 실행되는 경우
        if "resources" in exe_dir.lower():
            # resources 상위 폴더(설치 폴더 루트)로 이동
            base_dir = os.path.abspath(os.path.join(exe_dir, "..", ".."))
        else:
            base_dir = exe_dir
    else:
        # Under development, workspace root (parent of 'backend')
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    return os.path.normpath(os.path.join(base_dir, relative_path))

def ensure_directory_exists(dir_path):
    """Helper to ensure a directory exists."""
    if not os.path.exists(dir_path):
        os.makedirs(dir_path)
