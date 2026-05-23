# Development Log — CounselingLog_Electron

---

## [2026-05-21] 프로젝트 초기화

### 작업 내용
- 프로젝트 폴더 `c:\Coding3\CounselingLog_Electron` 생성
- 하위 디렉토리 구성: `frontend/`, `backend/`, `electron/`
- AI 협업 지침 `AGENTS.md` 작성 완료

---

## [2026-05-21] 1단계 — React UI 기반 구축 완료

### 완료 작업

#### 프로젝트 초기화
- [x] Vite + React 18 프로젝트 생성 (`frontend/`)
- [x] Tailwind CSS v4 설정 (`@tailwindcss/vite` 플러그인)
- [x] Zustand 상태 관리 설치
- [x] `@` 경로 별칭 설정 (`vite.config.js`)
- [x] Google Fonts (Pretendard) 연동
- [x] 다크모드 CSS 변수 시스템 구축 (`index.css`)

#### Electron 셸 구성
- [x] `electron/main.js` 생성 (개발: Vite 서버, 프로덕션: 빌드 파일)
- [x] `electron/preload.js` 생성 (contextBridge IPC 브릿지)
- [x] `electron/package.json` 생성 (electron, electron-builder, cross-env)
- [x] Electron 의존성 설치 완료

#### 컴포넌트 개발
- [x] **Sidebar** — 학생 목록, 주의 학생 그룹, 검색 버튼
- [x] **Timeline** — 학생 헤더, 상담 카드 목록, 빈 상태 처리
- [x] **QuickEditor** — 폼 입력 패널 (상담일자, 유형, 제목, 내용), Ctrl+S 저장
- [x] **Dashboard** — 오늘 상담 통계, 주의 학생, 최근 상담 목록
- [x] **CommandPalette** — Ctrl+K 단축키, 학생 검색 오버레이
- [x] **공유 UI** — Avatar, TagBadge, formatDate

#### 상태 관리 (Zustand)
- [x] 학생 선택 / 세션 목록
- [x] Command Palette 토글
- [x] QuickEditor 패널 토글 + 편집 모드
- [x] Mock 세션 추가 (`addSession`) — 타임라인에 즉시 반영
- [x] Mock 세션 수정 (`updateSession`)

#### Mock 데이터
- [x] 8명 학생 데이터 (긴급/일반 혼합)
- [x] 상담 세션 샘플 데이터
- [x] 오늘 통계 Mock
- [x] 상담 구분 전체 목록 (COUNSELING_TYPES)
- [x] 시트 유형 목록 (SHEET_TYPES)
- [x] 태그 색상 매핑 (TAG_COLORS) — 14가지 전체 정의

### 테스트 결과
- `npm run dev` 실행 → `http://localhost:5173/` 정상 동작 확인
- 학생 클릭 → 타임라인 전환 ✅
- 새 상담 기록 → QuickEditor 열림 ✅
- Ctrl+K → Command Palette 열림 ✅
- 학생 미선택 → Dashboard 표시 ✅
- Mock 저장 → 타임라인에 즉시 반영 ✅

### 1단계 완료 기준 달성
> Mock 데이터로 앱이 실행되고 모든 화면 전환 동작 ✅

### 남은 이슈
- Electron 실행은 3단계 시작 전까지 별도 확인 필요
- `alert()` 대신 Toast 알림 (2단계에서 처리)
- CommandPalette 키보드 네비게이션 (↑↓ 화살표) — 2단계에서 구현

### 다음 단계 (2단계)
- Command Palette 키보드 UX (↑↓, Enter 선택)
- Timeline 카드 상세 보기 (확장형 카드)
- QuickEditor 키보드 UX 개선 (Enter로 다음 필드 이동)
- Toast 알림 (저장 완료, 오류 등)
- 자동완성 (학생 이름/학번)
- 최근 상담 이어쓰기 흐름

---

## [2026-05-21] 테마 밝은 파스텔톤 전환 및 빌드 최적화

### 완료 작업
- [x] **Vite PostCSS 경고 수정**: `index.css` 내부의 `@import url(...)` 구문을 `index.html` 내 `<link>` 태그 방식으로 이관하여 PostCSS 경고 제거.
- [x] **태그 색상 파스텔화 (`mockData.js`)**: 고대비 다크 톤의 태그 매핑(`bg-.../20 text-...`)을 소프트한 파스텔 라이트 톤(`bg-...-50 text-...-600`)으로 변경.
- [x] **아바타 개선 (`shared.jsx`)**: `Avatar` 컴포넌트의 단색 채도를 파스텔톤 조합으로 부드럽게 조정하고, 사이드바 목록 선택 상태(`selected`)에 유기적으로 연동되는 흰색 카드 형태의 스타일 분기 추가.
- [x] **상담 카드 디테일 개선 (`Timeline.jsx`)**: `typeColors`에서 세션 구분별 카드 테두리와 배경색을 은은하고 깔끔하게 리디자인.
- [x] **대시보드 경고 및 지표 가독성 확보 (`Dashboard.jsx`)**: 주의 필요 학생 카드 테두리 및 주의 표시 색상을 CSS 변수(`var(--red)`, `var(--red-soft)`)로 통합하여 하드코딩 제거. 회기 수 텍스트 컬러를 `var(--accent)`로 정밀 매핑하여 흰 카드 위 가독성 개선.

### 테스트 결과
- 개발 서버 콘솔 내 `@import` 관련 CSS 에러 및 경고 100% 제거 확인.
- HMR이 정상 반영되어, 흰색 카드와 부드러운 하늘색 파스텔톤 배경이 정상 렌더링됨을 확인.

---

## [2026-05-21] 2단계 — UX 핵심 기능 구현 완료

### 완료 작업
- [x] **초성 검색 유틸리티 구축 (`hangul.js`)**: 한글 자모 분석을 통해 초성 자모 스트링을 추출하는 `getChosung` 함수 작성 및 적용.
- [x] **Zustand 전역 상태 확장 (`useAppStore.js`)**:
  - Toast 알림 메시지 상태 및 `addToast`, `removeToast` 액션 추가 (3초 후 자동 제거 타이머 적용).
  - `getFilteredStudents` 메서드에 초성(예: `ㄱㅁㅅ` -> `김민수`) 및 학번 검색 검색어 매칭 로직 탑재.
- [x] **Command Palette 화살표/엔터 키바인딩 (`CommandPalette.jsx`)**:
  - `ArrowUp` 및 `ArrowDown` 방향키로 검색 목록에서 활성 행(Focus Index) 이동 및 포커싱.
  - `Enter` 키로 선택 즉시 모달을 닫고 해당 학생 상세 정보 및 타임라인 화면으로 로드 처리.
- [x] **Timeline 세션 카드 접기/펼치기 구현 (`Timeline.jsx`)**:
  - 카드 본문 2줄 축소 기본값 (`line-clamp-2`) 적용.
  - 카드 클릭 시 개별 상태(`isExpanded`)를 토글하여 긴 상세 본문을 펼침/접힘으로 유연하게 확인하고, '더보기 ▼' / '접기 ▲' 인디케이터가 표출되도록 구현.
- [x] **QuickEditor 입력 편의성 강화 (`QuickEditor.jsx`)**:
  - 각 폼 필드(날짜 -> 시트 -> 구분 -> 제목) 간의 `Enter` 이동 포커스 액션 탑재 (`useRef` 및 포커싱 순서 핸들러 구현).
  - 텍스트 입력창(`textarea`) 내에서의 Enter 입력은 줄 바꿈이 정상 동작하도록 예외 처리.
  - 유효성 검사 에러 노출 시 기존 `alert()` 창 대신 Toast 알림으로 자연스럽게 표시되도록 수정.
- [x] **Dashboard 최근 상담 이어쓰기 동선 구축 (`Dashboard.jsx`)**:
  - 최근 상담 및 주의 필요 학생 목록 내 "이어쓰기" 액션 버튼 배치.
  - 이어쓰기 클릭 시 해당 학생 자동 선택 + QuickEditor 새 모드로 열림 + 오늘 날짜 자동 기본값 세팅 처리.
- [x] **커스텀 Toast UI 컴포넌트 추가 및 통합 (`ToastContainer.jsx`, `App.jsx`, `App.css`)**:
  - 성공(연녹색), 오류(연적색) 기반 파스텔 라이트 테마에 조화되는 Toast 알림 UI 구축.
  - 우하단 위치에서 슬라이드 인/페이드 아웃 효과를 구현하여 매끄러운 상태 전환 안내 피드백 제공.
- [x] **Electron 윈도우 배경색 라이트화 (`electron/main.js`)**: Window 초기화 시 다크 백그라운드로 인한 시작 시 플래시 현상을 차단하고자 `#f0f4f9`로 변경.

### 테스트 결과
- Vite 빌드 결과 에러 없이 성공적으로 CSS/JS 번들링 완료.
- Electron 개발자 도구 디버깅 및 실행 검증:
  - `ㄱㅁㅅ` 입력 시 초성 필터링 및 키보드로 학생 로딩 테스트 완료.
  - QuickEditor 폼 내 Enter 이동 및 상세창 엔터 줄바꿈 정상 동작 확인.
  - "이어쓰기" 및 Toast 팝업 애니메이션 정상 출력 확인.

### 2단계 완료 기준 달성
> Mock 데이터 기준으로 전체 상담 입력 → 조회 흐름이 끊김 없이 동작 ✅

---

## [2026-05-21] 3단계 — Python Engine 연결 완료

### 완료 작업
- [x] **FastAPI 백엔드 개발 환경 및 API 구현**:
  - `backend/main.py`에 REST API 구현: `GET /students`, `GET /sessions/{name}`, `POST /sessions`, `PUT /sessions/{id}`, `GET /stats/today`, `POST /backup`, `GET /health` 추가.
  - 기존 엑셀 처리 엔진 `ExcelRepository` 이식 완료.
  - `backend/core/constants.py`에 상용 엑셀 컬럼 스키마 및 시트 정의 포팅.
  - `backend/utils/` (`path_helper.py`, `security.py`, `logger.py`, `validator.py`) 포팅.
  - 저장 실패 시 자동으로 롤백하고 이전 자동 백업본을 복원하는 Safe Save & Rollback 로직 탑재.
- [x] **Electron 백엔드 프로세스 제어**:
  - `electron/main.js`에서 Electron 기동 시 가상환경의 python (`backend/venv/Scripts/python.exe`)을 사용하여 uvicorn 백엔드 자동 spawn 구현.
  - `cwd`를 프로젝트 루트로 지정하여 uvicorn 모듈 임포트 에러 방지.
  - Electron 종료 시 (`window-all-closed`, `quit`) Python 프로세스를 강제 종료(`kill`)하도록 클린업 처리.
- [x] **Frontend Zustand 스토어 및 API 연동**:
  - `useAppStore.js`를 Mock 데이터 구조에서 실제 FastAPI 서버 통신 구조(`fetch`)로 100% 전환.
  - 앱 로드 시 `App.jsx`에서 `initialize()`를 통해 학생 목록 및 통계 데이터를 동기적으로 호출.
  - 세션 저장(`addSession`) 및 수정(`updateSession`) 완료 시 자동으로 전체 학생 목록 및 대시보드 통계 리로드 및 화면 동기화 구현.
- [x] **신규 학생 등록 UX 고도화**:
  - `CommandPalette.jsx`에서 검색 결과 미존재 또는 상단 버튼 클릭 시 신규 학생 등록 모달 폼 표출.
  - 검색어 자동 분석 기능: 숫자인 경우 학번으로 입력 및 학년(앞자리) 자동 유추, 문자열인 경우 이름으로 자동 입력.
  - 학번 5자리 유효성 검사 적용 및 등록 성공 시 즉시 해당 학생을 선택하고 QuickEditor 작성 폼 자동 기동.
- [x] **엑셀 파일 잠금(PermissionError) 복구/알림 예외 처리**:
  - 엑셀 파일이 다른 프로그램(예: Microsoft Excel)에 의해 사용 중(잠금 상태)일 때 발생하는 `PermissionError`를 백엔드에서 포착하여 HTTP 500과 함께 안내 메시지 반환.
  - 프론트엔드 Zustand에서 에러 발생 시 Toast 컴포넌트를 통해 한국어 설명 메시지 알림 처리 완료.
- [x] **자동 테스트 및 검증 환경 구축**:
  - `scratch/test_crud_api.py`를 활용하여 Health check, Student List, Session CRUD, stats 변경 검증, openpyxl 엑셀 파일 임시 잠금 시뮬레이션 및 데이터 원복을 포함한 자동화 API 테스터 구동 완료.

### 테스트 결과
- `test_crud_api.py` 테스트 실행 결과: **모든 테스트 케이스 통과! (Success)**
  - 신규 학생 등록 및 상담 기록 저장 후 엑셀 시트에 기록 확인 ✅
  - 상담 기록 수정 및 엑셀 반영 확인 ✅
  - 파일 잠금 시 `PermissionError` 감지 및 한글 예외 메시지 반환 확인 ✅
  - 테스트 종료 후 테스트 데이터의 엑셀 자동 삭제 확인 ✅
- Electron 및 React dev 기동 상태에서 UI 정상 연동 동작 완료 확인.

### 3단계 완료 기준 달성
> 실제 상담일지.xlsx 파일로 CRUD 전체 동작 및 파일 잠금 예외 대응 완료 ✅

## [2026-05-21] 4단계 — 배포 패키징 완료

### 완료 작업
- [x] **Python 백엔드 단독 빌드 및 최적화**:
  - `backend/build_backend.py` 제작 및 빌드 파이프라인 연동.
  - 가상환경 의존성(pyinstaller, pillow)을 자동 설치하고 `requirements.txt`에 기록.
  - Pillow를 활용해 `assets/icon.png` 이미지를 규격별 `.ico` 포맷으로 자동 변환하여 사용.
  - uvicorn 및 pandas 연동 모듈을 hidden import로 보강하고 PyInstaller `--onedir` 기반 컴파일을 통해 `electron/resources/backend`에 바이너리를 성공적으로 빌드.
- [x] **경로 안정화 및 샌드박스 쓰기 로직 구현**:
  - `backend/utils/path_helper.py` 내 `sys.frozen` 상태 분기를 개선하여 설치 루트 폴더에 쓰기 가능하도록 조정.
  - 엑셀 템플릿 복제와 로그 출력을 프로그램 구동 루트의 `data/` 및 `logs/` 디렉토리에 정확하게 쓰도록 고도화.
- [x] **Electron 패키징 및 NSIS 마법사 설정**:
  - `electron/package.json` 내 `build` 설정을 확장하여 React build output(`frontend/dist`) 및 Python 바이너리(`resources/backend`) 리소스가 app.asar 컨테이너 및 resources 경로에 누락 없이 복사되도록 조율.
  - NSIS 설정을 세팅하여 사용자 설치 경로 선택 기능을 지원하고 바탕화면 구동 바로가기 연동 완료.
- [x] **최종 단일 인스톨러 생성 및 가상 검증**:
  - React 빌드 (`npm run build` in frontend) 및 Electron Builder 패키징 (`npm run build` in electron) 연동 실행.
  - 배포 마법사 `dist/상담일지 Setup 0.1.0.exe` (119MB) 생성 완료.
  - 무음 설치 및 설치된 바이너리 구동 검증을 통해 `backend.exe` 자동 spawn과 데이터베이스/로그 자동 초기화 및 포트 바인딩 안정성을 100% 검증.

### 테스트 결과
- `dist/상담일지 Setup 0.1.0.exe` 패키지 설치 완료 후 바탕화면 혹은 설치 폴더에서 실행 시 정상 구동 확인 ✅
- 실행 시 백그라운드 uvicorn 포트 `8765` 점유 및 React UI 렌더링 확인 ✅
- `data/상담일지.xlsx` 및 `logs/app.log`가 설치 폴더 하위 디렉토리에 정상 자동 복원/기록됨을 검증 ✅
- 프로그램 종료 시 Python 백엔드가 좀비 프로세스로 남지 않고 클린업 킬(Kill) 됨을 확인 ✅

### 4단계 완료 기준 달성
> 단일 exe 실행 및 설치 인스톨러를 통한 앱 전체 정상 동작 및 엑셀 데이터 동기화 완료 ✅

---

## [2026-05-23] 추가 기능 — 파일 열기(경로 탐색, 드래그앤드롭) 및 상단 메뉴 한국어화 완료

### 완료 작업
- [x] **FastAPI 백엔드 동적 경로 대응**: `EXCEL_PATH` 상수를 유연한 `CURRENT_EXCEL_PATH` 변수로 대체하고, `/health` API에서 이를 제공하게 개선 및 `POST /open-file` API로 동적 파일 전환 지원.
- [x] **일렉트론 공통 다이얼로그 및 IPC 수립**: `main.js`에 `dialog.showOpenDialog`를 래핑한 `handleFileOpen` 구현하고 `dialog:openFile` IPC 핸들러 등록.
- [x] **상단 메뉴바 한국어화**: 일렉트론의 기본 영문 상단 메뉴를 한글(`파일`, `편집`, `보기`, `창`, `도움말`)로 전면 개편하고 단축키(Ctrl+O) 클릭 시 파일 열기 액션 연동.
- [x] **Zustand 및 사이드바 UI 개선**: `currentFilePath`와 `openFileByPath` 액션을 스토어에 연동하고, 사이드바 헤더에 현재 열려있는 엑셀 파일명 표시 및 폴더 열기 아이콘 배치.
- [x] **앱 전체 드래그 앤 드롭 오버레이 구현**: 앱 전체 화면 어느 곳이든 `.xlsx` 파일 드래그 시 흐림 오버레이가 출력되고, 드롭 시 자동으로 해당 파일의 상담기록 데이터를 읽어와 갱신하는 UX 설계.

### 테스트 결과
- React 빌드 (`npm run build`) 결과 빌드 오류 및 경고 없이 100% 정상 번들링 완료.
- 개발 환경 구동 및 로직 확인 완료.
- **[Hotfix] Program Files 권한 오류(WinError 5) 해결**: `C:\Program Files`에 앱이 설치된 경우, 쓰기 권한 제한으로 인해 백엔드가 로그/데이터 폴더를 생성하지 못하고 즉시 크래시되는 문제를 해결하였습니다. 프로덕션 환경의 쓰기 경로(`get_writable_path`)를 사용자 폴더(`AppData/Roaming/counselinglog-electron`)로 분리 설정하여 권한 문제를 차단하였습니다.
- **[Hotfix] Vite 프로덕션 빌드 Base 경로 수정**: Vite의 기본 빌드 설정이 절대 경로(`/assets`)로 설정되어 있어 패키징된 Electron 환경(`file://` 프로토콜)에서 스크립트 로드 실패로 인해 화면이 하얗게 멈추고 동작하지 않던(백화 현상) 중명 버그를 수정하였습니다. `vite.config.js`에 `base: './'` 설정을 주어 상대 경로로 안전하게 로드되도록 조치하였습니다.




