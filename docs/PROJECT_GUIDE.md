# 📘 프로젝트 아키텍처 가이드 (PROJECT_GUIDE.md)

> 본 문서는 상담일지 Electron 애플리케이션의 시스템 구조, 연동 방식, 개발 가이드 등 시스템 불변 성격의 정보를 정의합니다.

---

## 1. 아키텍처 개요 및 연동 방식

본 애플리케이션은 **Electron 프론트엔드 셸**과 **Python FastAPI 백엔드 엔진**이 상호 작용하는 하이브리드 로컬 아키텍처를 채택하고 있습니다.

```text
React (Renderer / UI)
  │  (Fetch API / http://localhost:8765)
  ▼
FastAPI (Python 로컬 REST API 서버)
  │  (openpyxl, pandas)
  ▼
상담일지.xlsx (로컬 엑셀 파일 저장소)
```

### 1-1. 프로세스 수명 주기 제어
* **구동(Spawn)**: Electron 메인 프로세스(`electron/main.js`) 구동 시, 배포 컴파일된 Python 백엔드 바이너리(`resources/backend/backend.exe`) 또는 가상환경 파이썬 인터프리터를 통해 uvicorn 백엔드를 백그라운드 프로세스로 `spawn`합니다.
* **종료(Kill)**: Electron이 닫힐 때(`before-quit` 및 `will-quit` 생명주기), 윈도우 OS 시스템 명령인 `taskkill /pid {pid} /T /F`를 호출하여 uvicorn 및 Python 프로세스 트리를 강제 파괴함으로써 로컬 포트(8765)를 완전히 반환합니다.

---

## 2. 기술 스택 (Tech Stack)

### 2-1. Frontend & Desktop
* **React 18 & Vite**: 고성능 SPA 및 뷰 렌더링, 빠른 개발 HMR 제공.
* **Tailwind CSS v4 & custom components**: 파스텔 라이트 테마 기반의 모던 UI 및 유기적 컴포넌트 스타일링.
* **Zustand**: 전역 및 비동기 상태 관리 (API 연동, Toast, Layout Resize 상태 관리).
* **Electron & Electron Builder**: 데스크톱 셸 래핑 및 NSIS 단일 인스톨러 배포 패키징 (`상담일지 Setup.exe`).

### 2-2. Backend Engine
* **FastAPI & Uvicorn**: 로컬 REST API 호스팅.
* **openpyxl**: 엑셀 셀 정밀 쓰기, 행 삭제, 서식 적용 및 열 숨김 처리.
* **pandas**: 엑셀 테이블 데이터 파싱 및 고속 DataFrame 인메모리 처리.
* **PyInstaller**: 파이썬 인터프리터 및 의존 라이브러리를 하나의 폴더 패키지(`resources/backend`)로 빌드.

---

## 3. 폴더 구조 (Folder Structure)

```text
CounselingLog_Electron/
│
├── docs/                   ← 프로젝트 문서 및 지침 폴더
│   ├── PROJECT_GUIDE.md    ← 프로젝트 시스템 설명서 (이 파일)
│   ├── PRD.md              ← 요구사항 정의서
│   ├── RULES.md            ← AI 개발 동작 지침
│   ├── DEV_LOG.md          ← 개발 기록 대장
│   ├── release_process.md  ← 릴리즈 및 배포 절차서
│   └── release_troubleshooting.md ← 배포 트러블슈팅
│
├── .gitignore
│
├── frontend/               ← React 렌더러 소스 코드
│   ├── src/
│   │   ├── components/     ← Sidebar, Timeline, QuickEditor, Dashboard, Print 등
│   │   ├── hooks/          ← useLayoutResize.js, useGlobalShortcuts.js 등
│   │   ├── store/          ← useAppStore.js (Zustand 스토어)
│   │   └── styles/         ← index.css, App.css
│   ├── package.json
│   └── vite.config.js
│
├── backend/                ← FastAPI 로컬 서버 소스 코드
│   ├── main.py             ← API 엔드포인트 및 CORS 보안 설정
│   ├── repositories/       ← excel_repository.py (인메모리 캐싱 및 트랜잭션 락)
│   ├── utils/              ← path_helper.py, excel_helpers.py (서식/엑셀 숨김 헬퍼)
│   └── requirements.txt
│
├── electron/               ← Electron 메인 프로세스 소스 코드
│   ├── main.js             ← 일렉트론 엔트리, 백엔드 spawn & kill, 메뉴 및 IPC 제어
│   ├── preload.js          ← 안전한 IPC 브릿지 정의
│   └── package.json
│
└── data/                   ← 런타임 데이터 (Git 제외 대상)
    ├── 상담일지.xlsx
    ├── backup/             ← 자동 백업 경로
    └── logs/               ← 백엔드 app.log 파일 경로
```

---

## 4. 기존 Python 코드 참조 및 이식 가이드

이전 프로젝트(`c:\Coding3\Counseling_Log`)의 파이썬 모듈 이식 구조는 다음과 같이 매핑되어 운영 중입니다.

| 모듈 명칭 | 기존 위치 | 현재 위치 | 주요 특징 |
|---|---|---|---|
| **ExcelRepository** | `app/repositories/excel_repository.py` | `backend/repositories/excel_repository.py` | `threading.RLock()` 및 mtime 캐싱 스로틀링 결합 |
| **Path Helper** | `app/utils/path_helper.py` | `backend/utils/path_helper.py` | `sys.frozen` 판단 및 AppData writable 경로 탐색 기능 포함 |
| **Excel Helpers** | - | `backend/utils/excel_helpers.py` | openpyxl 서식 복제 및 `_record_id` 컬럼 숨김(Hidden) 처리 전담 |

---

## 5. 데이터 보안 원칙 (Data Security)

학생 상담 기록은 민감한 개인정보입니다. 다음 경로와 파일은 절대 Git 리포지토리에 커밋되어서는 안 됩니다.
* `data/상담일지.xlsx` 및 모든 테스트용 `.xlsx` 파일
* `data/backup/` 폴더 내 백업용 엑셀 복제본
* `data/logs/app.log` 및 `err.log` / `out.log`
* 빌드 결과물인 `dist/` 폴더

---

## 6. 배포 및 패키징 아키텍처 (Deployment & Packaging)

* **배포 파이프라인**: Python 백엔드는 PyInstaller를 통해 독립 실행형 바이너리로 먼저 빌드되며, 일렉트론 리소스 경로(`electron/resources/backend`)에 내장되어 패키징됩니다.
* **배포 산출물**: `electron-builder` 설정을 기반으로 최종 단일 설치용 인스톨러(`상담일지 Setup X.Y.Z.exe`) 및 자동 업데이트 메타데이터(`latest.yml`)가 빌드됩니다.
* **배포 저장소**: 빌드 완료된 최종 산출물은 GitHub Release에 업로드되어 배포되며, 프로그램 구동 시 Electron `autoUpdater` 리스너를 통해 버전 업그레이드를 자동 탐색 및 패치합니다.

### 6-1. 정식 릴리즈 및 배포 절차 (Release Steps)

프로그램 패키징 및 배포를 수행할 때 다음 6단계를 순차적으로 실행하여 배포를 안전하게 완료합니다.

#### 1단계. 버전 정보 업데이트
1. `electron/package.json` 파일을 엽니다.
2. `"version"` 속성을 배포하고자 하는 새로운 버전(`X.Y.Z`)으로 수정 및 저장합니다. (예: `"version": "0.2.21"`)

#### 2단계. Python 백엔드 컴파일 빌드
FastAPI 백엔드 모듈을 가상환경 내 PyInstaller를 사용하여 독립 실행형 파일로 빌드합니다.
1. 프로젝트 루트 경로로 이동합니다.
2. 다음 파이썬 빌드 스크립트를 실행합니다:
   ```bash
   python backend/build_backend.py
   ```
3. 실행 완료 후 `electron/resources/backend/` 디렉토리 하위에 `backend.exe` 및 컴파일 폴더가 성공적으로 업데이트되었는지 확인합니다.

#### 3단계. React 프론트엔드 정적 빌드
React 렌더러 소스 코드를 프로덕션 최적화 JS/CSS 번들 파일로 컴파일합니다.
1. `frontend/` 디렉토리 경로로 이동합니다.
2. 의존성을 확인하고 빌드를 수행합니다:
   ```bash
   npm run build
   ```
3. 빌드가 정상 종료되고 `frontend/dist/` 디렉토리 내에 `index.html` 및 번들 파일(`assets/index-*.js`, `assets/index-*.css`)이 생성되었는지 확인합니다.

#### 4단계. Electron 패키징 및 인스톨러 빌드
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

#### 5단계. 로컬 설치 및 구동 검증 (Sanity Test)
1. 생성된 `상담일지 Setup X.Y.Z.exe`를 더블 클릭하여 설치 과정을 가상 시뮬레이션합니다.
2. 바탕화면 바로가기 또는 설치 경로에서 프로그램이 크래시 없이 정상 기동되는지 확인합니다.
3. 기동 후 8765 포트 uvicorn이 정상 바인딩되어 데이터 조회/수정이 되는지, 그리고 종료 시 백그라운드 프로세스가 좀비로 남지 않는지 확인합니다.

#### 6단계. GitHub Release 게시 및 메타데이터 업로드
자동 업데이트 연동을 유지하며 사용자에게 배포하기 위해 깃허브에 게시합니다.
1. GitHub 저장소의 **Releases** 페이지로 이동하여 **'Draft a new release'**를 클릭합니다.
2. 태그 규격은 **`vX.Y.Z`** (예: `v0.2.21`)로 생성합니다.
3. 릴리즈 노트 제목을 `vX.Y.Z`로 적고, 변경점(Feature, Bug Fix, Docs)을 구조화해 기록합니다.
4. **[중요]** 다음 두 개의 핵심 산출물을 바이너리 첨부 파일로 드래그하여 업로드합니다:
   * **`상담일지 Setup X.Y.Z.exe`**
   * **`latest.yml`** (이 파일이 누락되면 배포판 내 `autoUpdater`가 업데이트 검증을 실패함)
5. **'Publish release'**를 클릭하여 릴리즈를 공식 게시합니다.

