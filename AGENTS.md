# 🚀 상담일지 Electron 프로젝트 AI 협업 지침 (AGENTS.md)

> 대상 프로젝트:
> Electron + React + Python FastAPI 기반 상담일지 현대화 앱
> (기존 Tkinter 앱의 UX/UI 완전 재설계 + 엑셀 호환 유지)

---

# 0. 프로젝트 핵심 배경

## 이전 프로젝트

- 위치: `c:\Coding3\Counseling_Log`
- 기술: Python Tkinter + pandas + openpyxl
- 상태: 완성 및 배포 중 (참조 가능)
- **Python 백엔드 코드(ExcelRepository 등)는 이 프로젝트에서 재사용**

## 이 프로젝트의 목표

기존 Tkinter UI를 버리고:
- 현대적 React UI로 재설계
- Electron으로 데스크톱 앱 패키징
- Python FastAPI 백엔드로 엑셀 처리 유지
- 엑셀 구조(시트/컬럼)는 절대 변경하지 않음

---

# 1. 핵심 철학 (절대 원칙)

```text
엑셀은 저장 포맷
앱은 실제 작업 공간
```

- 사용자는 현대적 UI에서 작업
- 앱 내부: Student / CounselingSession 객체 중심 처리
- 저장 시에만 Excel row 구조로 변환

---

# 2. 기술 스택

## Frontend
| 기술 | 역할 |
|------|------|
| React 18 | UI 렌더링, 상태 관리 |
| Vite | 번들러 |
| Tailwind CSS | 스타일링 |
| shadcn/ui | UI 컴포넌트 (Sidebar, Dialog, Command, Toast 등) |
| Zustand | 전역 상태 관리 |

## Desktop
| 기술 | 역할 |
|------|------|
| Electron | 데스크톱 앱 프레임워크 |
| Electron Builder | exe 패키징 |

## Backend
| 기술 | 역할 |
|------|------|
| Python 3.11 | 엑셀 처리 엔진 |
| FastAPI | 로컬 REST API 서버 |
| openpyxl | 엑셀 저장/수정 |
| pandas | 엑셀 읽기 |
| uvicorn | ASGI 서버 |

---

# 3. 폴더 구조

```text
CounselingLog_Electron/
│
├── AGENTS.md               ← AI 협업 지침 (이 파일)
├── dev_log.md              ← 개발 기록
├── .gitignore
│
├── frontend/               ← React 앱
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar/        ← 학생 목록 사이드바
│   │   │   ├── Timeline/       ← 상담 타임라인
│   │   │   ├── QuickEditor/    ← 빠른 입력 패널
│   │   │   ├── Dashboard/      ← 오늘 상담 대시보드
│   │   │   └── Search/         ← Command Palette 검색
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── store/              ← Zustand 상태
│   │   └── styles/
│   ├── package.json
│   └── vite.config.js
│
├── backend/                ← Python FastAPI
│   ├── main.py             ← FastAPI 진입점
│   ├── repositories/       ← ExcelRepository (기존에서 이식)
│   ├── services/           ← 비즈니스 로직
│   ├── validators/         ← 입력값 검증
│   ├── utils/              ← 공통 유틸 (logger, path_helper 등)
│   └── requirements.txt
│
├── electron/               ← Electron 메인 프로세스
│   ├── main.js             ← Electron 진입점
│   ├── preload.js          ← IPC 브릿지
│   └── package.json
│
└── data/                   ← 런타임 데이터 (gitignore)
    ├── 상담일지.xlsx
    ├── backup/
    └── logs/
```

---

# 4. Electron ↔ Python 연동 방식

## 선택: FastAPI 로컬 서버

```text
React (Renderer)
  ↓ fetch('http://localhost:8765/...')
Electron (Main)
  ↓ child_process.spawn
Python FastAPI (uvicorn :8765)
  ↓
상담일지.xlsx
```

## 이유
- React에서 표준 fetch() API 사용 가능
- 비동기 처리 자연스럽게 지원
- 기존 Python 코드를 API로 감싸기만 하면 됨

---

# 5. 4단계 개발 계획

## ✅ 현재 단계: 1단계 진행 전

---

## 🔵 1단계 — React UI 기반 구축
**목표**: Mock 데이터로 화면 구조 완성 (저장 없음)

### 작업 목록
- [ ] Electron + React + Vite 프로젝트 초기화
- [ ] Tailwind CSS + shadcn/ui 설정
- [ ] 메인 레이아웃 (3분할: Sidebar | Timeline | QuickEditor)
- [ ] Sidebar 컴포넌트 (학생 목록)
- [ ] Timeline 컴포넌트 (상담 이력 카드)
- [ ] QuickEditor 컴포넌트 (입력 패널)
- [ ] Dashboard (오늘 상담 요약)
- [ ] 다크모드

### 완료 기준
- Mock 데이터로 앱이 실행되고 모든 화면 전환 동작

---

## 🟢 2단계 — UX 핵심 기능 구현
**목표**: 실제 사용 흐름처럼 느껴지게

### 작업 목록
- [ ] Command Palette (Ctrl+K) — 학생 검색
- [ ] Timeline 카드 상세 보기
- [ ] QuickEditor 키보드 UX (Ctrl+S 저장, Enter 이동)
- [ ] 자동완성 (학생 이름/학번)
- [ ] 최근 상담 이어쓰기 흐름
- [ ] Toast 알림

### 완료 기준
- Mock 데이터 기준으로 전체 상담 입력 → 조회 흐름이 끊김 없이 동작

---

## 🟡 3단계 — Python Engine 연결
**목표**: 실제 엑셀 데이터로 구동

### 작업 목록
- [ ] FastAPI 프로젝트 초기화
- [ ] ExcelRepository 이식 (기존 `Counseling_Log/app/repositories/` 참조)
- [ ] API 엔드포인트 구현
  - GET /students — 학생 목록
  - GET /sessions/{student_name} — 상담 이력
  - POST /sessions — 새 상담 저장
  - PUT /sessions/{id} — 수정
  - POST /backup — 백업
- [ ] Electron에서 Python 프로세스 시작 연동
- [ ] Safe Save / Backup 연결

### 완료 기준
- 실제 상담일지.xlsx 파일로 CRUD 전체 동작

---

## 🔴 4단계 — 배포 패키징
**목표**: 학교 배포용 exe 완성

### 작업 목록
- [ ] Python 백엔드 PyInstaller 빌드
- [ ] Electron Builder 설정
- [ ] exe 단일 파일 빌드
- [ ] 아이콘 적용
- [ ] 인스톨러 제작
- [ ] 실사용 테스트

### 완료 기준
- 단일 exe 실행으로 앱 전체 동작

---

# 6. 엑셀 호환성 제약 (절대 원칙)

다음 항목은 어떤 경우에도 변경하지 않는다:

- 기존 시트명 (`개인상담`, `집단상담(또래상담, 학급별 집단)`, `보호자상담`, `교원자문`, `의뢰(정서행동의뢰, 자문의 의뢰 등)`)
- 컬럼 순서 및 컬럼명
- 나이스 업로드 구조
- 기존 서식 (셀 크기, 병합, 테두리, 인쇄 영역)

엑셀은 **저장 포맷**이다. UI 편의를 위해 엑셀 구조를 바꾸는 것은 허용하지 않는다.

---

# 7. AI 작업 원칙

## 7-1. 단계별 작업 원칙

- 현재 단계 완료 전 다음 단계 코드 작성 금지
- 각 컴포넌트는 독립적으로 개발 (의존성 최소화)
- Mock 데이터 → 실제 데이터 순서 준수

## 7-2. 코드 수정 원칙

- 필요한 부분만 수정 (최소 수정 원칙)
- 수정 전 영향 범위 설명
- 저장/백업 로직은 Level 3 위험 작업으로 취급

## 7-3. 컴포넌트별 분리 개발

좋은 요청:
```text
Sidebar 컴포넌트만 만들어줘
```

나쁜 요청:
```text
전체 앱 다 만들어줘
```

## 7-4. 문서화 원칙

- 각 단계 완료 후 반드시 `dev_log.md` 업데이트
- 포함 항목: 완료 작업, 테스트 결과, 남은 이슈, 다음 단계

---

# 8. 기존 Python 코드 참조

이식 시 참조할 파일 위치:

| 항목 | 기존 위치 |
|------|-----------|
| ExcelRepository | `c:\Coding3\Counseling_Log\app\repositories\excel_repository.py` |
| Validator | `c:\Coding3\Counseling_Log\app\utils\validator.py` |
| Logger | `c:\Coding3\Counseling_Log\app\utils\logger.py` |
| SafeSave 로직 | `excel_repository.py` 내 `swap_temp_and_original()` |
| Sanitize | `c:\Coding3\Counseling_Log\app\utils\security.py` |
| 상수/스키마 | `c:\Coding3\Counseling_Log\app\core\constants.py` |
| 설정 파일 | `c:\Coding3\Counseling_Log\app\config.json` |

---

# 9. 데이터 보안 원칙

```text
data/상담일지.xlsx   → .gitignore 필수
data/backup/         → .gitignore 필수
data/logs/           → .gitignore 필수
```

학생 개인정보가 포함된 파일은 절대 깃허브에 올리지 않는다.

---

# 10. 현재 개발 상태

| 항목 | 상태 |
|------|------|
| 프로젝트 폴더 생성 | ✅ 완료 |
| AGENTS.md 작성 | ✅ 완료 |
| 1단계: React UI 기반 구축 | ⬜ 미시작 |
| 2단계: UX 핵심 기능 | ⬜ 미시작 |
| 3단계: Python Engine 연결 | ⬜ 미시작 |
| 4단계: 배포 패키징 | ⬜ 미시작 |
