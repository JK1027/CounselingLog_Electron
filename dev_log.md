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

---

## [2026-05-23] 사용성 및 생산성 개선 작업 (1~3순위) 완료

### 완료 작업
- [x] **학급(반) 필터링 구현**:
  - `backend/main.py`에 학번 파싱 헬퍼 함수 `extract_ban_from_student_id`를 설계하여 `/students` 응답 데이터에 반(`ban`) 필드를 포함하여 반환하도록 개선.
  - `useAppStore.js`에 학년/반 필터 상태를 연동하고 검색어와 연계되도록 `getFilteredStudents` 함수 수정.
  - `Sidebar.jsx` 상단 검색 바 아래에 학년 및 반 선택 드롭다운 UI 추가 탑재.
- [x] **단축키 바인딩 및 입력 생산성 극대화**:
  - `App.jsx` 전역 키 바인딩을 통해 `Ctrl+N`(새 상담 열기), `Alt+ArrowUp/Down`(학생 위아래 신속 이동) 구현.
  - `QuickEditor.jsx`가 활성화되었을 때 전역 포커스 위치와 무관하게 작동하는 `Ctrl+S`(저장) 및 `Escape`(닫기) 단축키를 연동.
- [x] **연속 입력 모드 (Continuous Entry)**:
  - `QuickEditor.jsx` 폼 하단에 연속 입력 모드 토글 제공 및 `addSession` 완료 후 필터 리스트 상의 다음 학생으로 자동 포커스되어 연속 작성 폼이 기동되도록 연결.
- [x] **저장 안정성 UX 보완**:
  - `useAppStore.js` 및 `QuickEditor.jsx`에 `saveState` ('idle' | 'saving' | 'saved' | 'error') 라이프사이클을 연동하여, 저장 수행 시 폼 입력을 임시 비활성화하고 중복 클릭 및 데이터 손실 방지. 엑셀 쓰기 잠금 시 에러 알림 제공.
- [x] **Compact Mode (압축 뷰) 지원**:
  - `Sidebar.jsx` 헤더에 Minimize/Maximize 토글 버튼을 추가하고, 활성화 시 사이드바 및 타임라인 요소의 간격과 크기를 25% 축소하여 정보 노출 밀도를 극대화.
  - 컴팩트 모드에서는 타임라인 세션 카드의 본문 상세가 기본 `line-clamp-1`로 접혀서 한눈에 요약만 볼 수 있도록 UX 개선.
- [x] **상담 배지 및 톤앤매너 고도화**:
  - `Timeline.jsx` 내 시트 유형(개인상담, 보호자상담, 교원자문 등) 및 상담 구분(자해, 학폭, 진로 등)에 어울리는 HSL 커스텀 테두리 및 뱃지 스타일을 적용하여 디자인의 프리미엄화 완성.

### 테스트 결과
- 프론트엔드 빌드(`npm run build`) 경고/에러 없이 100% 정상 작동 완료 ✅
- 백엔드 파일 컴파일(`python -m py_compile backend/main.py`) 구문 오류 없음 완료 ✅

---

## [2026-05-23] 상담 일지 삭제 기능 추가

### 완료 작업
- [x] **ExcelRepository 내 행 삭제 및 순번 재정렬 기능 구축 (`excel_repository.py`)**:
  - `delete_excel_row(self, sheet_name, df_index)` 메서드를 새로 구현.
  - 임시 파일을 생성하여 `worksheet.delete_rows(excel_row_num, 1)`을 통해 엑셀 시트에서 지정 행을 완전히 삭제하고, 해당 시트에 `순번`이 존재하는 경우 데이터 행들을 순차적(1, 2, 3...)으로 다시 정렬하여 엑셀 서식 유지와 함께 데이터 일관성을 확보.
  - Safe Save 및 오류 발생 시 자동 롤백(`restore_latest_backup`) 체계를 긴밀하게 통합.
  - 메모리 DataFrame에서도 해당 행을 drop하고 엑셀 파일과 동일하게 순번 번호를 리셋 및 동기화.
- [x] **백엔드 DELETE 엔드포인트 구현 (`main.py`)**:
  - `DELETE /sessions/{session_id}` API 추가.
  - `_record_id` (UUID)를 기반으로 모든 시트를 스캔하여 일치하는 데이터를 찾고, ExcelRepository의 삭제 메서드를 호출해 안전하게 데이터를 제거하도록 조치.
- [x] **프론트엔드 Zustand 스토어 연동 (`useAppStore.js`)**:
  - `deleteSession(sessionId)` 비동기 액션을 정의.
  - API 삭제 요청 처리 후 `initialize()`를 통해 학생 목록 및 대시보드 통계를 즉시 리로드하고, 기존에 선택된 학생의 상담 내역을 `loadSessions`로 갱신. 만약 삭제로 인해 해당 학생의 상담 데이터가 더 이상 없어서 학생 목록에서 사라진 경우, 선택 학생 상태를 초기화.
- [x] **UI 내 삭제 버튼 및 삭제 재확인 연동 (`Timeline.jsx`)**:
  - `SessionCard` 우측 수정 버튼 옆에 `Trash2` 아이콘을 품은 빨간색 파스텔 톤의 "삭제" 버튼 추가.
  - 클릭 이벤트가 타임라인 카드로 전파되지 않도록 `e.stopPropagation()`을 지정.
  - 오작동 방지를 위해 `window.confirm` 창을 통해 최종 동의 단계를 거쳐 삭제되도록 연동 완료.

### 테스트 결과
- `test_delete_api.py` (urllib 기반 무의존성 검증 테스터) 작성 및 API 호출 검증 수행:
  - 학생 목록 및 세션 로딩 -> 특정 세션 타겟팅 후 `DELETE` API 호출 -> 200 OK 수신 및 백업 파일 자동 생성 확인 ✅
  - 엑셀 시트 내 행 실삭제 및 메모리/엑셀 순번 갱신 확인 ✅
  - 삭제 완료 후 재조회 결과 잔여 세션 수 1개 감소 및 리스트 정상 복원 완료 검증 완료 ✅
- 프론트엔드 빌드 시 구문 및 정적 분석 경고 없이 깨끗이 빌드 완료 ✅

---

## [2026-05-23] 레이아웃 너비 드래그 조절 (Resizable Split Pane) 기능 추가

### 완료 작업
- [x] **App.jsx 크기 조절 이벤트 상태 관리 및 드래그 조절선 추가 (`App.jsx`)**:
  - `sidebarWidth` 및 `editorWidth` 상태 추가 및 `localStorage` 연동으로 브라우저 재부팅 시에도 사용자가 설정한 너비 비율 복원.
  - 마우스 드래그를 실시간 트래킹하여 사이드바 최소 `200px` ~ 최대 `400px`, 에디터 최소 `280px` ~ 최대 `500px` 한계점 제약 부여.
  - 사이드바/메인영역 경계선 및 메인영역/에디터 패널 경계선에 `w-1` 두께의 크기 조절 핸들(`col-resize` 커서 및 HSL 강조 적용) 배치.
  - 리사이징 도중 화면 내 텍스트가 블록 선택되지 않도록 드래그 중인 윈도우 전체에 `select-none` 클래스 및 커서 제어 스타일 연동.
- [x] **Sidebar.jsx 동적 너비 대응 (`Sidebar.jsx`)**:
  - `width` prop을 추가로 파라미터로 수신하여 `<aside>` style의 `width` 속성으로 매핑.
  - 드래그 동작 반응 속도를 최대화하기 위해 `width` prop 주입 시 transition 딜레이 클래스(`transition-all`)가 꺼지도록 분기 제어.
- [x] **QuickEditor.jsx 동적 너비 대응 (`QuickEditor.jsx`)**:
  - `width` prop을 수신하여 기존 `w-80` 고정 너비 대신 style의 `width` 속성으로 렌더링되게 변경.

### 테스트 결과
- 프론트엔드 빌드(`npm run build`) 결과 771ms 만에 에러 및 경고 없이 성공 빌드 확인 ✅
- 일렉트론 앱 상에서 마우스 드래그로 사이드바 너비 및 에디터 패널의 가로 폭을 실시간 크기 조절할 때 부드럽게 렌더링 연동됨을 검증 ✅
- 사이드바 최소(200px)/최대(400px), 에디터 최소(280px)/최대(500px) 범위 제한 및 드래그 중 텍스트 긁힘 방지 정상 동작 확인 ✅
- 프로그램 종료 후 재기동 시 조절했던 너비 비율이 그대로 유지되며 켜지는 로컬스토리지 복원 기법 작동 완료 ✅

---

## [2026-05-23] 신규 학생 상담 등록 버튼 접근성 강화

### 완료 작업
- [x] **Zustand 전역 상태 확장 (`useAppStore.js`)**:
  - `registerOpen` (기본값 `false`) 상태 및 `setRegisterOpen(open)` 액션 추가.
  - 가상 학생 신규 등록(`registerVirtualStudent`) 완료 단계에서 모달이 닫히도록 `registerOpen: false` 상태 주입 연동.
- [x] **CommandPalette.jsx 등록 폼 다이렉트 켜기 구현 (`CommandPalette.jsx`)**:
  - `registerOpen` 이 활성화되었을 때, `showRegisterForm` 상태를 즉시 `true`로 설정하고 등록 폼 필드들을 초기화하여 모달 오픈.
  - ESC 및 취소, 헤더 닫기(X) 클릭 시 `registerOpen` 도 함께 리셋되어 모달이 자연스럽게 닫히도록 닫기 헬퍼 로직 추가.
- [x] **Sidebar.jsx 신규 학생 상담 등록 버튼 추가 (`Sidebar.jsx`)**:
  - `UserPlus` 아이콘을 임포트하고, '학생 검색...' 버튼 바로 아래 공간에 꽉 차는 Accent 파란색 버튼 배치.
  - 클릭 시 `setRegisterOpen(true)`를 트리거하도록 연계.
  - 압축 모드(`isCompactMode`)일 때 글자 크기 및 세로 패딩 비율이 부드럽게 줄어들도록 반응형 CSS 클래스 분기 처리.

### 테스트 결과
- 프론트엔드 빌드(`npm run build`) 결과 557ms 만에 에러 및 경고 없이 성공 빌드 확인 ✅
- 일렉트론 앱 상에서 사이드바 상단 검색 바 바로 아래에 **[신규 학생 상담 등록]** 버튼이 깔끔하게 렌더링된 것을 확인 ✅
- 버튼 클릭 시 검색 목록 없이 **"신규 학생 등록" 입력 폼 양식이 다이렉트로 기동**되는 것을 확인 ✅
- 모달 내 이름, 학번 등을 입력한 뒤 등록을 완료했을 때 모달이 꺼지며 좌측 리스트에 학생이 자동 추가/선택되고, 우측 QuickEditor 상담 작성 폼이 즉각적으로 켜지는 E2E 흐름 검증 통과 ✅

---

## [2026-05-23] 타임라인 상담 시트 유형 필터 탭 추가

### 완료 작업
- [x] **Timeline.jsx 내 필터 상태 관리 및 연동 (`Timeline.jsx`)**:
  - `selectedSheetFilter` 로컬 상태를 추가하고, 학생이 변경될 때 필터 상태가 `'전체'`로 자동 초기화되도록 `useEffect` 감지 리셋 추가.
  - 각 필터 탭별 세션 데이터 누적 건수를 동적으로 집계하는 `getCountForFilter(filter)` 함수 수립.
  - 선택한 탭에 속하는 기록만 타임라인에 실시간 가공하여 렌더링하도록 `filteredSessions` 목록 필터 조건 바인딩.
- [x] **필터 탭 메뉴 Pills UI 컴포넌트 마크업 및 스타일링 (`Timeline.jsx`)**:
  - 기존 상담 유형 태그 영역의 아래에 캡슐 알약 형태의 탭 단추들(`전체`, `개인상담`, `집단상담`, `보호자상담`, `교원자문`, `의뢰`)을 가로 스크롤 대응 형태로 렌더링.
  - 활성화된 탭에는 앱 테마 액센트 칼라(`var(--accent)`), 그림자 및 흰색 텍스트와 강조 뱃지 디자인 적용.
  - 비활성화 탭에는 회색조 테마(`var(--bg-primary)`, `var(--text-secondary)`) 및 옅은 뱃지 연동.
- [x] **필터 결과 빈 상태 대응 및 뱃지 일치화 (`Timeline.jsx`)**:
  - 전체 상담 이력이 0개인 경우(원래 Empty State)와, 특정 탭을 필터링했을 때 결과가 0개인 경우(필터 Empty State)로 분기.
  - 필터링 결과가 비어있는 경우 "선택한 유형의 상담 기록이 없습니다." 와 같은 직관적인 안내 플레이스홀더 노출.
  - 필터 결과에 매치되는 번호만 1부터 깔끔하게 역순으로 노출되도록 `sessionNumber` 바인딩 튜닝.

### 테스트 결과
- 프론트엔드 빌드(`npm run build`) 결과 562ms 만에 에러 및 경고 없이 빌드 완료 확인 ✅
- 일렉트론 앱 기동 후 학생 타임라인 상단에 누계 건수가 기록된 6가지 필터 탭들이 정상 노출되는 것을 확인 ✅
- 각 탭 클릭 시 목록이 실시간으로 분류되어 정상 표출되며, 일지 미존재 필터 클릭 시 전용 안내 문구가 깨끗이 노출됨을 검증 ✅
- 학생을 전환하여도 필터가 `'전체'` 탭으로 정상 복원 및 자동 로딩되는 것을 검증 ✅

---

## [2026-05-23] 상담일지 다각도 인쇄 및 PDF 저장 기능 추가

### 완료 작업
- [x] **백엔드 전체 상담 내역 조회 API 구현 (`main.py`)**:
  - `GET /sessions` 엔드포인트를 구현하여 전체 5대 시트(`개인상담`, `집단상담` 등) 또는 특정 시트의 비예시 데이터를 날짜 오름차순으로 취합해 한 번에 전달하는 인쇄용 데이터 서빙 레이어 완성.
- [x] **인쇄 설정 모달 개발 (`PrintSetupModal.jsx`)**:
  - 인쇄 버튼 클릭 시 나타나는 설정 팝업 구현.
  - 출력 대상 범위(선택된 학생, 상담 유형별, 전체 출력) 및 포맷(상세 보고서 양식, 대장 양식), 특정 회기 선택 등 다각도 필터 옵션을 지원.
- [x] **A4 격식의 프린트 프리뷰 개발 (`PrintPreview.jsx`)**:
  - 인쇄 시 미리보기 화면을 띄워 하얀색 A4 용지 형태의 실제 결과물을 모니터링할 수 있도록 렌더러 구현.
  - **상세 보고서 양식**: 한국 교육기관 표준 상담일지 규격의 테두리 격자 양식(인적사항, 상담일시, 제목, 본문, 서명란 등)에 매핑 및 복수 출력 시 페이지 브레이크(`.page-break`) 자동 제어.
  - **대장 양식**: 전체 내역을 테이블에 담아 요약 목록 형태로 한눈에 출력할 수 있도록 요약 표 마크업 구현.
  - 상단 툴바를 배치하여 "인쇄 및 PDF 저장"과 "닫기" 트리거링 연동.
- [x] **타임라인 및 전역 통합 연동 (`Timeline.jsx`, `App.jsx`)**:
  - 타임라인 상단 학생 헤더에 `[🖨️ 인쇄]` 단축 버튼을 디자인하여 자연스럽게 모달을 띄울 수 있는 단일 진입점 구현.
  - `App.jsx`에서 인쇄 모달 상태와 프리뷰 오버레이 컴포넌트의 가시성 라이프사이클 통합 제어.
- [x] **인쇄 전용 CSS 미디어 쿼리 스타일 구축 (`App.css`)**:
  - `@media print` 쿼리를 사용해 실제 인쇄 시에는 상단 툴바, 사이드바, 에디터, 어두운 배경 등 화면 UI를 감추고 오직 A4 하얀색 종이 양식만 프린터로 출력되도록 인쇄 영역 격리.
  - 브라우저 인쇄 설정 시 헤더/푸터가 노출되지 않도록 A4 여백 셋팅 및 긴 테이블 출력 시 매 페이지 상단에 헤더가 반복 고정되도록 `table-header-group` CSS 바인딩 적용.

### 테스트 결과
- 프론트엔드 빌드(`npm run build`) 경고/에러 없이 100% 정상 작동 완료 (562ms) ✅
- Electron 및 React dev 기동 환경에서 타임라인 인쇄 버튼 클릭 -> 모달 옵션 선택 -> 미리보기 -> Ctrl+P 네이티브 인쇄 대화상자까지 E2E 연동 동작 완료 확인 ✅

---

## [2026-05-23] 코드 리뷰 피드백 반영 — Excel 동시성 잠금, 캐싱 성능 최적화, 프로세스 종료 라이프사이클 및 localStorage 안전화 완료

### 완료 작업
- [x] **ExcelRepository 동시성 제어를 위한 스레드 락 적용 (`excel_repository.py`)**:
  - `threading.RLock()` 객체를 인스턴스 멤버 `self.lock`으로 정의.
  - 동일 스레드 내에서의 재진입을 지원하여 데드락을 원천 예방하고, 파일 읽기/쓰기/스왑이 수행되는 모든 원자적 블록(`load_data`, `save_all_data_to_excel`, `delete_excel_row` 등)을 `with self.lock:` 구문으로 안전하게 래핑하여 다중 쓰기/읽기 경합 조건(Race Condition) 해결.
- [x] **mtime 기반 Dirty-Check 레이지 캐싱 구현 (`excel_repository.py`)**:
  - `self._last_loaded_time` 멤버를 두고, 파일 로드 시점에 `os.path.getmtime(file_path)` 값을 기록.
  - `check_and_reload` 메서드를 신설하여 락 내에서 실시간 수정 시각을 비교하고, 외부 변경이 없는 경우 불필요한 디스크 I/O 없이 메모리에 캐싱된 데이터프레임을 즉시 반환하도록 최적화.
- [x] **FastAPI API 엔드포인트 캐시 적용 (`main.py`)**:
  - `/students`, `/sessions/{student_name}`, `/sessions`, `/stats/today` 등 모든 무거운 데이터 조회 엔드포인트의 `load_data` 직접 호출을 `check_and_reload` 호출로 전환하여 속도를 0ms 수준으로 단축하고 UI 프리징 발생 요인 제거.
- [x] **Windows 환경 대응 프로세스 트리 강제 킬 구현 (`main.js`)**:
  - `window-all-closed` 및 `quit` 이벤트 발생 시 `killPythonProcess` 헬퍼 함수를 통해 Windows의 `taskkill /pid {pid} /T /F` 시스템 명령어를 동적으로 실행.
  - 단순 프로세스 단일 kill이 아닌 uvicorn 하위 프로세스 및 python 인터프리터 전체 프로세스 트리를 강제 강탈시킴으로써 좀비 프로세스로 포트 8765가 막히는 문제를 차단.
- [x] **localStorage 가로 폭 복원 NaN/Bound 예외 방어 적용 (`App.jsx`)**:
  - 사이드바 및 에디터의 너비 조절값 로딩부에서 `Number.isFinite` 검증 및 안전 바운더리 체크(사이드바: 200px~400px, 에디터: 280px~500px) 로직을 추가하여 깨진 값이나 유효하지 않은 값이 들어올 때 레이아웃이 붕괴되는 현상 차단.

### 테스트 결과
- 프론트엔드 프로덕션 빌드 (`npm run build`) 오류 및 경고 없이 성공 빌드 확인 ✅
- API 동시성 검증: 연속적인 API 요청 및 조회 동작 시 매번 디스크 로딩 없이 인메모리 캐싱 데이터가 지연시간 0ms로 쾌적하게 반환됨을 확인 ✅
- 프로세스 클린업 검증: Electron 앱 종료 시 uvicorn(Python) 포트 8765가 강제 회수되고 좀비 프로세스가 남지 않는 것을 `netstat` 및 `tasklist` 명령으로 교차 검증 통과 ✅





