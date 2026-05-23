import os
import sys
import subprocess
import shutil

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BACKEND_DIR)

def main():
    print(f"=== [PyInstaller] 빌드 시작 (CWD: {BACKEND_DIR}) ===")
    
    # 1. PyInstaller 실행 (backend.spec 기반으로 backend/dist/backend 폴더 빌드)
    pyinstaller_cmd = [
        sys.executable,
        "-m",
        "PyInstaller",
        "backend.spec",
        "--clean",
        "--noconfirm"
    ]
    
    print(f"Running: {' '.join(pyinstaller_cmd)}")
    subprocess.run(
        pyinstaller_cmd,
        cwd=BACKEND_DIR,
        check=True
    )
    print("=== [PyInstaller] 컴파일 성공 ===")
    
    # 2. 빌드 산출물을 electron/resources/backend 디렉토리로 안전하게 복사
    target_resource_dir = os.path.join(ROOT_DIR, "electron", "resources", "backend")
    source_dist_dir = os.path.join(BACKEND_DIR, "dist", "backend")
    
    print(f"Moving build artifacts to Electron resource directory: {target_resource_dir}")
    
    if os.path.exists(target_resource_dir):
        print(f"Cleaning existing resource directory: {target_resource_dir}")
        shutil.rmtree(target_resource_dir)
        
    os.makedirs(os.path.dirname(target_resource_dir), exist_ok=True)
    shutil.copytree(source_dist_dir, target_resource_dir)
    print("=== [PyInstaller] 리소스 복사 및 패키징 완료! ===")

if __name__ == "__main__":
    main()
