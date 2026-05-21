// Mock 데이터 - 1단계에서 실제 API 연결 전 사용

export const MOCK_STUDENTS = [
  { id: 1, name: '김민수', grade: '2', studentId: '20240101', gender: '남', sessionCount: 4, lastDate: '20260521', tags: ['진로', '학업'] },
  { id: 2, name: '이서준', grade: '1', studentId: '20250201', gender: '남', sessionCount: 2, lastDate: '20260519', tags: ['대인관계'] },
  { id: 3, name: '박지호', grade: '3', studentId: '20230301', gender: '남', sessionCount: 6, lastDate: '20260518', tags: ['진로', '성격'] },
  { id: 4, name: '최아름', grade: '2', studentId: '20240402', gender: '여', sessionCount: 3, lastDate: '20260515', tags: ['학업'] },
  { id: 5, name: '정수현', grade: '1', studentId: '20250501', gender: '여', sessionCount: 1, lastDate: '20260514', tags: ['대인관계'] },
  { id: 6, name: '한예진', grade: '3', studentId: '20230601', gender: '여', sessionCount: 8, lastDate: '20260512', tags: ['자해 및 자살', '정신건강'] },
  { id: 7, name: '오동현', grade: '2', studentId: '20240701', gender: '남', sessionCount: 2, lastDate: '20260510', tags: ['학교폭력 피해'] },
  { id: 8, name: '임소영', grade: '1', studentId: '20250801', gender: '여', sessionCount: 5, lastDate: '20260508', tags: ['가정 및 가족관계'] },
];

export const MOCK_SESSIONS = {
  1: [
    {
      id: 101, studentId: 1, date: '20260521', session: 4,
      type: '진로', sheetType: '개인상담',
      summary: '진로 방향 재설정 상담',
      detail: '학생이 이과에서 문과 계열로 진로를 변경하고 싶다는 의사를 밝혔다. 관심 분야(심리학, 사회복지)에 대해 탐색하고, 부모님과의 대화 방법에 대해 논의함. 다음 회기에 부모님과의 대화 결과를 공유하기로 함.',
    },
    {
      id: 100, studentId: 1, date: '20260510', session: 3,
      type: '학업', sheetType: '개인상담',
      summary: '중간고사 스트레스 및 시험 불안',
      detail: '중간고사 직전 시험 불안을 호소함. 수면 패턴이 불규칙해지고 식욕이 감소했다고 보고. 이완 기법(복식호흡)을 안내하고 시험 준비 계획을 함께 수립함.',
    },
    {
      id: 99, studentId: 1, date: '20260428', session: 2,
      type: '진로', sheetType: '개인상담',
      summary: '진로 적성 검사 결과 해석',
      detail: '홀랜드 적성검사 결과(SAE 유형)에 대해 함께 살펴봄. 사회형과 진취형이 높게 나온 것에 대해 학생 스스로 놀라움을 표현. 관련 직업군 탐색 과제 부여.',
    },
    {
      id: 98, studentId: 1, date: '20260415', session: 1,
      type: '학업', sheetType: '개인상담',
      summary: '초기 상담 - 학업 스트레스',
      detail: '담임 선생님 의뢰로 첫 상담 진행. 3학년 진급 후 성적 하락으로 인한 스트레스를 주로 호소. 상담 목표(진로 방향 설정, 시험 불안 완화)에 합의.',
    },
  ],
  2: [
    {
      id: 201, studentId: 2, date: '20260519', session: 2,
      type: '대인관계', sheetType: '개인상담',
      summary: '학급 내 소외감 호소',
      detail: '학급 내 특정 그룹에서 소외되는 느낌이 든다고 보고. 점심시간에 혼자 밥을 먹는 날이 많아졌다고 함. 학급에서 새로운 관계를 시작하는 방법에 대해 구체적으로 논의.',
    },
    {
      id: 200, studentId: 2, date: '20260507', session: 1,
      type: '대인관계', sheetType: '개인상담',
      summary: '초기 상담 - 친구 관계',
      detail: '자발적 내방. 친한 친구가 다른 반으로 옮겨 외로움을 느끼고 있다고 함. 현재 학급에서의 관계 탐색 및 상담 목표 설정.',
    },
  ],
  6: [
    {
      id: 601, studentId: 6, date: '20260512', session: 8,
      type: '정신건강', sheetType: '개인상담',
      summary: '추적 상담 - 안정화 확인',
      detail: '지난 4주간 자해 행동 없음 확인. 기분이 전반적으로 안정적이라고 보고. 학교 적응에 어려움은 있으나 이전보다 개선됨. 외부 기관(정신건강복지센터) 연계 유지 중.',
    },
  ],
};

export const MOCK_TODAY_STATS = {
  total: 6,
  pending: 2,
  guardian: 1,
  referral: 1,
};

export const COUNSELING_TYPES = [
  '학업', '진로', '성격', '성', '대인관계', '가정 및 가족관계',
  '일탈 및 비행', '학교폭력 가해', '학교폭력 피해', '자해 및 자살',
  '정신건강', '컴퓨터 및 스마트폰 과사용', '정보제공', '기타'
];

export const SHEET_TYPES = ['개인상담', '집단상담', '보호자상담', '교원자문', '의뢰'];

export const TAG_COLORS = {
  '진로': 'bg-blue-50 text-blue-600',
  '학업': 'bg-purple-50 text-purple-600',
  '대인관계': 'bg-green-50 text-green-600',
  '자해 및 자살': 'bg-red-50 text-red-600',
  '정신건강': 'bg-orange-50 text-orange-600',
  '학교폭력 피해': 'bg-red-50 text-red-600',
  '학교폭력 가해': 'bg-amber-50 text-amber-600',
  '가정 및 가족관계': 'bg-yellow-50 text-yellow-700',
  '성격': 'bg-teal-50 text-teal-600',
  '성': 'bg-pink-50 text-pink-600',
  '일탈 및 비행': 'bg-rose-50 text-rose-600',
  '컴퓨터 및 스마트폰 과사용': 'bg-cyan-50 text-cyan-600',
  '정보제공': 'bg-slate-100 text-slate-600',
  '기타': 'bg-gray-100 text-gray-600',
  'default': 'bg-gray-100 text-gray-600',
};

