
# KNOWLEDGE.md

## 목적

실패 사례와 해결 경험을 축적한다.
같은 실수를 두 번 하지 않는 것이 목표다.

# 기록 템플릿

제목
프로젝트
발생일
문제
증상
원인
해결
재발 방지
관련 파일

# GitHub Actions

## UnicodeEncodeError
* **프로젝트**: CounselingLog_Electron
* **발생일**: 2026-05-24
* **문제**: GitHub Actions CI (`windows-latest`) 환경에서 파이썬 백엔드 컴파일 단계 중 즉각 빌드 실패 발생.
* **증상**: `UnicodeEncodeError: 'charmap' codec can't encode character...` 에러와 함께 프로세스 강제 종료.
* **원인**: 로컬 개발 컴퓨터(한국어 Windows, CP949/UTF-8)와 달리 GitHub Actions VM은 영문 Windows 환경(CP1252)이 디폴트이며, 파이썬 `print()` 함수가 유니코드 한글 문자("빌드 시작" 등)를 출력하려 시도하면서 인코딩 크래시 발생.
* **해결**: 빌드용 파이썬 스크립트(`build_backend.py`) 내의 모든 로그 출력을 영문 표준(ASCII)으로 대체.
* **재발 방지**: CI/CD 서버에서 구동되는 모든 스크립트의 로그 출력문은 영문으로 작성할 것을 강제함.
* **관련 파일**: `backend/build_backend.py`, `.github/workflows/`

---

## shell=False 실행 실패
* **프로젝트**: CounselingLog_Electron
* **발생일**: 2026-05-24
* **문제**: 프로세스 인자 꼬임을 피하기 위해 `shell=False`로 실행하자마자 `FileNotFoundError` 발생하며 프로세스가 중단됨.
* **원인**: `shell=True` 모드에서는 cmd.exe가 환경 변수 `PATH`를 자동 스캔하여 `"python"` 명령의 절대 경로를 찾아주지만, `shell=False`일 때는 OS 로우레벨 프로세스 API가 직접 구동되어 단순 텍스트인 `"python"`의 실행 경로를 찾지 못함.
* **해결**: 현재 구동 중인 파이썬 인터프리터의 보장된 절대 경로인 `sys.executable`을 자식 프로세스 실행 파일 인자로 상속 구동함.
* **재발 방지**: `shell=False` 구동 시에는 무조건 실행 파일의 절대 경로를 획득하여 전달하며, 파라미터는 공백 분할이 아닌 리스트(`list`) 형식을 사용함.
* **관련 파일**: `backend/build_backend.py`

---

# Electron

## HWP SaveAs 실패

원인
OneDrive 또는 백신 충돌

해결
0.5초 간격 재시도

재발 방지
Atomic Save + Retry

# GAS

## 동시 저장 충돌

원인
LockService 미사용

해결
ScriptLock 적용

# 누적 규칙

새로운 장애 발생 시 반드시 기록한다.
