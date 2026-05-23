import os
import sys
import subprocess
import shutil

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BACKEND_DIR)

def main():
    print(f"=== [PyInstaller] Build Start (CWD: {BACKEND_DIR}) ===")
    
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
    print("=== [PyInstaller] Compilation Successful ===")
    
    # 2. 빌드 산출물을 electron/resources/backend 디렉토리로 안전하게 복사
    target_resource_dir = os.path.join(ROOT_DIR, "electron", "resources", "backend")
    source_dist_dir = os.path.join(BACKEND_DIR, "dist", "backend")
    
    print(f"Moving build artifacts to Electron resource directory: {target_resource_dir}")
    
    import time
    
    def safe_copy_dir(src, dst):
        # 1. 청소 retry
        if os.path.exists(dst):
            print(f"Cleaning existing resource directory with retry guard: {dst}")
            for attempt in range(5):
                try:
                    shutil.rmtree(dst)
                    break
                except Exception as e:
                    print(f"[Warning] Failed to remove {dst} (Attempt {attempt + 1}/5): {e}. Retrying in 1s...")
                    time.sleep(1)
            else:
                print(f"[Error] Absolutely failed to clean {dst} after 5 attempts due to lock/permissions.")
                raise IOError(f"Directory lock/permission error on target path: {dst}")
        
        # 2. 복사 retry
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        for attempt in range(5):
            try:
                shutil.copytree(src, dst)
                print(f"Successfully copied build artifacts to {dst}")
                return
            except Exception as e:
                print(f"[Warning] Copying to {dst} failed (Attempt {attempt + 1}/5): {e}. Cleaning and retrying in 1s...")
                if os.path.exists(dst):
                    try:
                        shutil.rmtree(dst)
                    except Exception:
                        pass
                time.sleep(1)
        else:
            print(f"[Error] Absolutely failed to copy to {dst} after 5 attempts.")
            raise IOError(f"Failed to copy build artifacts to target path: {dst}")

    try:
        safe_copy_dir(source_dist_dir, target_resource_dir)
        print("=== [PyInstaller] Resource copy and packaging completed! ===")
    except Exception as e:
        print(f"[Fatal Error] Failed packaging step: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
