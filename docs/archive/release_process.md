# 🚀 릴리즈 및 배포 절차서 (release_process.md)

> 본 문서는 사용자가 명시적으로 릴리즈 배포를 요청했을 때, 프로그램 패키징 및 배포를 안전하게 완료하기 위해 순차적으로 수행해야 하는 운영 절차를 다룹니다.

---

## 1단계. 버전 정보 업데이트

1. `electron/package.json` 파일을 엽니다.
2. `"version"` 속성을 배포하고자 하는 새로운 버전(`X.Y.Z`)으로 수정 및 저장합니다.
   * 예: `"version": "0.1.8"`

---

## 2단계. Python 백엔드 컴파일 빌드

파이썬 FastAPI 백엔드 모듈을 가상환경 내 PyInstaller를 사용하여 독립 실행형 파일로 빌드합니다.
1. 프로젝트 루트 경로로 이동합니다.
2. 다음 파이썬 스크립트를 실행합니다:
   ```bash
   python backend/build_backend.py
   ```
3. 실행 완료 후 `electron/resources/backend/` 디렉토리 하위에 `backend.exe` 및 필요한 종속 모듈 컴파일 라이브러리 폴더가 성공적으로 업데이트되었는지 확인합니다.

---

## 3단계. React 프론트엔드 정적 빌드

React 렌더러 소스 코드를 프로덕션 최적화 JS/CSS 번들 파일로 컴파일합니다.
1. `frontend/` 디렉토리 경로로 이동합니다.
2. 의존성을 확인하고 빌드를 수행합니다:
   ```bash
   npm run build
   ```
3. 빌드가 정상 종료되고 `frontend/dist/` 디렉토리 내에 `index.html` 및 `assets/index-*.js`, `assets/index-*.css` 번들 파일이 생성되었는지 교차 검증합니다.

---

## 4단계. Electron 패키징 및 인스톨러 빌드

React 정적 파일과 Python 백엔드 패키지 바이너리를 단일 인스톨러 파일로 통합 래핑합니다.
1. `electron/` 디렉토리 경로로 이동합니다.
2. 일렉트론 빌더를 작동시킵니다:
   ```bash
   npm run build
   ```
   *(또는 `npx electron-builder build --windows` 실행)*
3. 빌드가 완료되면 `electron/dist/` 디렉토리 내에 다음 두 파일이 성공적으로 생성되었는지 검증합니다:
   * **`상담일지 Setup X.Y.Z.exe`** (최종 윈도우 설치형 마법사 프로그램)
   * **`latest.yml`** (자동 업데이트용 메타데이터 검증 파일)

---

## 5단계. 로컬 설치 및 구동 검증 (Sanity Test)

1. 생성된 `상담일지 Setup X.Y.Z.exe`를 더블 클릭하여 설치 과정을 가상 시뮬레이션합니다.
2. 바탕화면 바로가기 또는 설치 경로에서 프로그램이 크래시 없이 정상 기동되는지 확인합니다.
3. 기동 후 8765 포트 uvicorn이 정상 바인딩되어 데이터 조회/수정이 되는지, 그리고 종료 시 백그라운드 프로세스가 좀비로 남지 않는지 확인합니다.

---

## 6단계. GitHub Release 게시 및 메타데이터 업로드

자동 업데이트 연동을 유지하며 사용자에게 배포하기 위해 깃허브에 게시합니다.
1. GitHub 저장소의 **Releases** 페이지로 이동하여 **'Draft a new release'**를 클릭합니다.
2. 태그 규격은 **`vX.Y.Z`** (예: `v0.1.8`)로 생성합니다.
3. 릴리즈 노트 제목을 `vX.Y.Z`로 적고, 변경점(Feature, Bug Fix, Docs)을 구조화해 기록합니다.
4. **[중요]** 다음 두 개의 핵심 산출물을 바이너리 첨부 파일로 드래그하여 업로드합니다:
   * **`상담일지 Setup X.Y.Z.exe`**
   * **`latest.yml`** (이 파일이 누락되면 배포판 내 `autoUpdater`가 업데이트 검증을 실패함)
5. **'Publish release'**를 클릭하여 릴리즈를 공식 게시합니다.
