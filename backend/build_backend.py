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
    # shell=False 호환성을 위해 shutil.which로 글로벌 절대 경로 탐색
    PIP_BIN = shutil.which("pip") or "pip"
    PYINSTALLER_BIN = shutil.which("pyinstaller") or "pyinstaller"

GENERATED_ICON_PNG = r"C:\Users\user\.gemini\antigravity-ide\brain\42038f0d-d29a-4004-8910-bf887cb25f3d\counseling_app_icon_1779371372161.png"

def run_command(args, cwd=None, ignore_error=False):
    print(f"Running: {' '.join(args)} in {cwd or os.getcwd()}")
    # Windows CI 등에서 인자 파싱 및 경로 탈출 오류 방지를 위해 shell=False 적용
    res = subprocess.run(args, cwd=cwd, shell=False)
    if res.returncode != 0:
        print(f"Error executing command: {' '.join(args)}")
        if not ignore_error:
            sys.exit(res.returncode)
        return False
    return True

def main():
    python_bin = sys.executable
    
    print("=== [1] 패키징 라이브러리 설치 ===")
    # 글로벌 환경이거나 경로가 절대경로가 아닌 경우 python -m pip 형식을 사용
    if not os.path.isabs(PIP_BIN):
        pip_cmd = [python_bin, "-m", "pip", "install", "pyinstaller", "pillow"]
    else:
        pip_cmd = [PIP_BIN, "install", "pyinstaller", "pillow"]
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
    
    # PyInstaller execution command arguments
    pyinstaller_args = [
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
        # FastAPI, Pandas, Openpyxl 및 anyio 등 런타임 누락 방지용 hidden-import 명시 추가
        "--hidden-import=fastapi",
        "--hidden-import=pandas",
        "--hidden-import=openpyxl",
        "--hidden-import=anyio",
        "--hidden-import=starlette",
        # Source script
        "main.py"
    ]

    # 글로벌 환경이거나 경로가 절대경로가 아닌 경우 python -m PyInstaller 형식으로 안전하게 구동
    if not os.path.isabs(PYINSTALLER_BIN):
        pyinstaller_cmd = [python_bin, "-m", "PyInstaller"] + pyinstaller_args
    else:
        pyinstaller_cmd = [PYINSTALLER_BIN] + pyinstaller_args

    run_command(pyinstaller_cmd, cwd=BACKEND_DIR)
    print("\n=== 백엔드 빌드 완료! ===")
    print(f"결과물 위치: {os.path.join(dist_dir, 'backend')}")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        import traceback
        print("\n!!! FATAL EXCEPTION IN BUILD BACKEND !!!")
        print(f"Error: {e}")
        traceback.print_exc(file=sys.stdout)
        sys.exit(2)
