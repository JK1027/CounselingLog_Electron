import os
import sys
import subprocess
import shutil

# Paths configuration
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BACKEND_DIR)
ASSETS_DIR = os.path.join(ROOT_DIR, "assets")
VENV_DIR = os.path.join(BACKEND_DIR, "venv")
if os.path.exists(VENV_DIR):
    PIP_BIN = os.path.join(VENV_DIR, "Scripts", "pip.exe")
    PYINSTALLER_BIN = os.path.join(VENV_DIR, "Scripts", "pyinstaller.exe")
else:
    PIP_BIN = "pip"
    PYINSTALLER_BIN = "pyinstaller"

GENERATED_ICON_PNG = r"C:\Users\user\.gemini\antigravity-ide\brain\42038f0d-d29a-4004-8910-bf887cb25f3d\counseling_app_icon_1779371372161.png"

def run_command(args, cwd=None, ignore_error=False):
    print(f"Running: {' '.join(args)} in {cwd or os.getcwd()}")
    res = subprocess.run(args, cwd=cwd, shell=True)
    if res.returncode != 0:
        print(f"Error executing command: {' '.join(args)}")
        if not ignore_error:
            sys.exit(res.returncode)
        return False
    return True

def main():
    print("=== [1] 패키징 라이브러리 설치 ===")
    # GitHub Actions나 글로벌 환경에서는 python -m pip 포맷을 사용하고, 실패해도 빌드를 멈추지 않음
    pip_cmd = [PIP_BIN, "install", "pyinstaller", "pillow"]
    if PIP_BIN == "pip":
        pip_cmd = ["python", "-m", "pip", "install", "pyinstaller", "pillow"]
    run_command(pip_cmd, ignore_error=True)

    # Update requirements.txt to include new deps
    req_file = os.path.join(BACKEND_DIR, "requirements.txt")
    if os.path.exists(req_file):
        with open(req_file, "r+", encoding="utf-8") as f:
            content = f.read()
            if "pyinstaller" not in content.lower():
                f.write("pyinstaller\npillow\n")
                print("requirements.txt에 pyinstaller 및 pillow 추가 완료")

    print("\n=== [2] 아이콘 리소스 및 폴더 생성 ===")
    if not os.path.exists(ASSETS_DIR):
        os.makedirs(ASSETS_DIR)
        print(f"폴더 생성 완료: {ASSETS_DIR}")

    target_png = os.path.join(ASSETS_DIR, "icon.png")
    target_ico = os.path.join(ASSETS_DIR, "icon.ico")

    # Copy generated PNG to assets
    if os.path.exists(GENERATED_ICON_PNG):
        shutil.copy2(GENERATED_ICON_PNG, target_png)
        print(f"아이콘 PNG 복사 완료: {target_png}")
        
        # Convert PNG to ICO using Pillow
        try:
            from PIL import Image
            img = Image.open(target_png)
            # Standard Windows icon sizes
            icon_sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
            img.save(target_ico, format='ICO', sizes=icon_sizes)
            print(f"아이콘 ICO 변환 성공: {target_ico}")
        except Exception as e:
            print(f"아이콘 ICO 변환 중 에러 발생: {e}")
            sys.exit(1)
    else:
        if os.path.exists(target_png) and os.path.exists(target_ico):
            print("로컬 절대 경로에 원본 아이콘은 없지만, assets 디렉토리에 이미 아이콘 파일들이 존재하므로 변환 과정을 스킵합니다.")
        else:
            print(f"에러: 아이콘 파일을 찾을 수 없고 assets 디렉토리에도 존재하지 않습니다. (검색 경로: {GENERATED_ICON_PNG})")
            sys.exit(1)

    print("\n=== [3] PyInstaller 백엔드 빌드 실행 ===")
    dist_dir = os.path.join(ROOT_DIR, "electron", "resources")
    
    # PyInstaller execution command
    pyinstaller_args = [
        PYINSTALLER_BIN,
        "--onedir",
        "--clean",
        "--noconfirm",
        "--name", "backend",
        "--paths", ROOT_DIR,
        "--distpath", dist_dir,
        "--add-data", "config.json;.",
        # Hidden imports for uvicorn loops/protocols
        "--hidden-import=uvicorn",
        "--hidden-import=uvicorn.logging",
        "--hidden-import=uvicorn.loops",
        "--hidden-import=uvicorn.loops.auto",
        "--hidden-import=uvicorn.protocols",
        "--hidden-import=uvicorn.protocols.http",
        "--hidden-import=uvicorn.protocols.http.auto",
        "--hidden-import=uvicorn.protocols.websockets",
        "--hidden-import=uvicorn.protocols.websockets.auto",
        "--hidden-import=uvicorn.lifespan",
        "--hidden-import=uvicorn.lifespan.on",
        # Source script
        "main.py"
    ]

    run_command(pyinstaller_args, cwd=BACKEND_DIR)
    print("\n=== 백엔드 빌드 완료! ===")
    print(f"결과물 위치: {os.path.join(dist_dir, 'backend')}")

if __name__ == "__main__":
    main()
