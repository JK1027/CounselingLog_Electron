import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Calendar, FileText, Loader2, Sparkles, User, Users, Check, Printer } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { formatDate, IconButton } from '@/components/ui/shared'
import PeerCounselDialog from './PeerCounselDialog'

const getTodayDateString = () => {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}${mm}${dd}`
}

const COUNSELING_TYPES = [
  '일반상담', '자해 및 자살', '학교폭력 피해', '학교폭력 가해', 
  '정신건강', '진로', '학업', '대인관계', '기타'
]

export default function GroupCounseling({ onOpenPrintModal }) {
  const { 
    groupSessions, 
    addGroupSession, 
    updateGroupSession, 
    deleteGroupSession, 
    saveState, 
    isCompactMode, 
    loadGroupSessions,
    selectedSession,
    setSelectedSession
  } = useAppStore()

  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showPeerModal, setShowPeerModal] = useState(false)
  const [editorMode, setEditorMode] = useState('new') // 'new' | 'edit'
  const [selectedId, setSelectedId] = useState(null)

  const [formValues, setFormValues] = useState({
    date: getTodayDateString(),
    grade: '1',
    ban: '',
    type: '일반상담',
    session: '',
    summary: '',
    studentId: '',
    detail: ''
  })

  // 컴포넌트 마운트 시 최신 데이터 패치
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      await loadGroupSessions()
      setLoading(false)
    }
    fetchData()
  }, [loadGroupSessions])

  const handleOpenNewForm = () => {
    setEditorMode('new')
    setSelectedId(null)
    setFormValues({
      date: getTodayDateString(),
      grade: '1',
      ban: '',
      type: '일반상담',
      session: '',
      summary: '',
      studentId: '',
      detail: ''
    })
    setShowForm(true)
  }

  const handleOpenPeerCounsel = () => {
    const hasUnsavedContent = formValues.summary.trim() || formValues.detail.trim() || formValues.studentId.trim()
    if (showForm && hasUnsavedContent) {
      const confirmOverwrite = window.confirm('현재 작성 또는 수정 중인 상담 양식이 존재합니다. 또래상담 도우미로 덮어쓰시겠습니까?')
      if (!confirmOverwrite) {
        return
      }
    }
    setShowPeerModal(true)
  }

  const handlePeerCounselComplete = (data) => {
    setEditorMode('new')
    setSelectedId(null)
    setFormValues({
      date: getTodayDateString(),
      grade: '혼합',
      ban: '',
      type: '일반상담',
      session: '',
      summary: data.summary,
      studentId: data.studentId,
      detail: data.detail
    })
    setShowForm(true)
    setShowPeerModal(false)
    useAppStore.getState().addToast('또래상담 입력 값이 폼에 정상 주입되었습니다. 내용을 최종 검토해 주십시오.', 'success')
  }

  const handleOpenEditForm = (session) => {
    setEditorMode('edit')
    setSelectedId(session.id)
    
    // "1학년" -> "1" 형식으로 전처리
    let gradeVal = session.grade || '1'
    if (gradeVal.endsWith('학년')) {
      gradeVal = gradeVal.replace('학년', '')
    }

    setFormValues({
      date: session.date || getTodayDateString(),
      grade: gradeVal,
      ban: session.studentId ? '' : '', // 반 정보가 따로 엑셀에 적혀 있으면 로드, 아니면 빈칸
      type: session.type || '일반상담',
      session: session.session || '',
      summary: session.summary || '',
      studentId: session.studentId || '', // 엑셀의 '학번' 컬럼 값을 그대로 매핑
      detail: session.detail || ''
    })
    setShowForm(true)
  }

  useEffect(() => {
    if (selectedSession && selectedSession.sheetType === '집단상담') {
      handleOpenEditForm(selectedSession)
      setSelectedSession(null)
    }
  }, [selectedSession, setSelectedSession])

  const handleInputChange = (field, value) => {
    setFormValues(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // 폼 검증
    const datePattern = /^\d{8}$/
    if (!datePattern.test(formValues.date)) {
      useAppStore.getState().addToast('날짜는 8자리 숫자(YYYYMMDD) 형식이어야 합니다.', 'error')
      return
    }
    if (!formValues.summary.trim()) {
      useAppStore.getState().addToast('주제(제목)를 입력해 주세요.', 'error')
      return
    }
    if (!formValues.studentId.trim()) {
      useAppStore.getState().addToast('참가학생 학번(명단)을 입력해 주세요.', 'error')
      return
    }
    if (!formValues.detail.trim()) {
      useAppStore.getState().addToast('활동내용을 입력해 주세요.', 'error')
      return
    }

    const payload = {
      name: '', // 집단상담이므로 빈값
      studentId: formValues.studentId.trim(),
      grade: formValues.grade,
      gender: '혼성', // 집단상담 기본값
      date: formValues.date.trim(),
      type: formValues.type,
      summary: formValues.summary.trim(),
      detail: formValues.detail.trim(),
      session: formValues.session.trim() // 빈값일 경우 백엔드에서 자동 계산
    }

    if (editorMode === 'new') {
      await addGroupSession(payload)
    } else {
      await updateGroupSession(selectedId, payload)
    }

    // 성공적으로 처리되었으면 폼 닫기
    if (useAppStore.getState().saveState !== 'error') {
      setShowForm(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white" style={{ background: 'var(--bg-primary)' }}>
        <Loader2 size={36} className="animate-spin text-accent mb-2" style={{ color: 'var(--accent)' }} />
        <p className="text-sm font-semibold text-gray-500" style={{ color: 'var(--text-muted)' }}>집단상담 데이터를 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex h-full overflow-hidden select-none bg-neutral-50/20" style={{ background: 'var(--bg-primary)' }}>
      {/* 좌측: 대장 목록 테이블 */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* 상단 헤더 */}
        <div 
          className={`flex items-center justify-between shrink-0 border-b ${isCompactMode ? 'px-4 py-3' : 'px-6 py-4'}`}
          style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center text-indigo-500">
              <Users size={16} />
            </div>
            <div>
              <h2 className="text-base font-extrabold" style={{ color: 'var(--text-primary)' }}>집단상담 대장</h2>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>총 {groupSessions.length}건의 집단상담이 등록되어 있습니다.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <IconButton
              icon={Printer}
              onClick={() => onOpenPrintModal({
                initialTarget: 'type',
                defaultSheetType: '집단상담',
                disableStudentOption: true
              })}
              title="집단상담 대장 인쇄"
              className={isCompactMode ? 'p-1.5 rounded-xl' : 'p-2.5 rounded-xl'}
              iconSize={13}
            />
            <button
              onClick={handleOpenPeerCounsel}
              className={`flex items-center gap-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                isCompactMode ? 'px-3 py-1.5' : 'px-4 py-2.5'
              }`}
              style={{
                background: 'var(--bg-hover)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)'
              }}
            >
              <Sparkles size={13} className="text-yellow-500 animate-pulse" />
              또래상담 추가
            </button>
            <button
              onClick={handleOpenNewForm}
              className={`flex items-center gap-1.5 rounded-xl text-xs font-bold text-white transition-all active:scale-95 cursor-pointer ${
                isCompactMode ? 'px-3 py-1.5' : 'px-4 py-2.5'
              }`}
              style={{ background: 'var(--accent)', boxShadow: '0 2px 8px rgba(75,142,241,0.35)' }}
            >
              <Plus size={13} />
              새 집단상담 등록
            </button>
          </div>
        </div>

        {/* 테이블 본문 */}
        <div className="flex-1 overflow-auto p-4 md:p-6 no-scrollbar">
          {groupSessions.length > 0 ? (
            <div className="bg-white dark:bg-neutral-900 border rounded-2xl overflow-hidden shadow-sm" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
              <table className="w-full border-collapse text-left text-xs" style={{ color: 'var(--text-primary)' }}>
                <thead>
                  <tr className="border-b font-extrabold select-none h-10 bg-neutral-50/50" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
                    <th className="px-4 text-center w-[7%]">순번</th>
                    <th className="px-4 text-center w-[12%]">일자</th>
                    <th className="px-4 text-center w-[12%]">대상 학년</th>
                    <th className="px-4 text-center w-[12%]">상담구분</th>
                    <th className="px-4 w-[25%]">주제 (목표)</th>
                    <th className="px-4 w-[20%]">참가자 학번</th>
                    <th className="px-4 text-center w-[12%]">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ divideColor: 'var(--border)' }}>
                  {groupSessions.map((session, idx) => (
                    <tr key={session.id} className="h-11 hover:bg-neutral-50/30 transition-all dark:hover:bg-neutral-800/10">
                      <td className="px-4 text-center font-bold text-neutral-400">{groupSessions.length - idx}</td>
                      <td className="px-4 text-center font-medium">
                        <div className="inline-flex items-center gap-1">
                          <Calendar size={10} className="text-neutral-400" />
                          <span>{formatDate(session.date)}</span>
                        </div>
                      </td>
                      <td className="px-4 text-center font-semibold">
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold text-[10px]">
                          {session.grade ? (session.grade.endsWith('학년') ? session.grade : `${session.grade}학년`) : '혼합'}
                        </span>
                      </td>
                      <td className="px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-bold text-[10px]" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
                          {session.type || '일반상담'}
                        </span>
                      </td>
                      <td className="px-4 font-bold text-neutral-800 dark:text-neutral-200 truncate max-w-[200px]" title={session.summary}>
                        {session.summary}
                      </td>
                      <td className="px-4 text-neutral-500 font-medium truncate max-w-[150px]" title={session.studentId}>
                        {session.studentId}
                      </td>
                      <td className="px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditForm(session)}
                            className="p-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-indigo-500 transition-all cursor-pointer"
                            title="수정"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm("정말로 이 집단상담 기록을 삭제하시겠습니까?\n삭제된 엑셀 데이터는 복구할 수 없습니다.")) {
                                await deleteGroupSession(session.id)
                              }
                            }}
                            className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 transition-all cursor-pointer"
                            title="삭제"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-80 gap-3 border-2 border-dashed rounded-2xl p-8" style={{ borderColor: 'var(--border)' }}>
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center text-indigo-500">
                <Users size={24} />
              </div>
              <div className="text-center">
                <h3 className="text-sm font-extrabold mb-1" style={{ color: 'var(--text-primary)' }}>집단상담 기록이 없습니다</h3>
                <p className="text-xs max-w-xs mb-3" style={{ color: 'var(--text-muted)' }}>등록된 집단상담 일지가 아직 없습니다. 상단 버튼을 클릭하여 새 일지를 추가해 주십시오.</p>
                <button
                  onClick={handleOpenNewForm}
                  className="text-xs px-3.5 py-2 bg-indigo-500 hover:bg-indigo-400 active:scale-95 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  첫 집단상담 기록 추가하기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 우측: 전용 에디터 폼 */}
      {showForm && (
        <div 
          className="w-[380px] h-full shrink-0 border-l flex flex-col"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
        >
          {/* 폼 헤더 */}
          <div 
            className={`flex items-center justify-between shrink-0 border-b ${isCompactMode ? 'px-4 py-3' : 'px-5 py-4'}`}
            style={{ borderColor: 'var(--border)' }}
          >
            <h3 className="text-sm font-extrabold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
              <Sparkles size={14} className="text-yellow-500 animate-pulse" />
              {editorMode === 'new' ? '집단상담 기록 추가' : '집단상담 기록 수정'}
            </h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-xs px-2.5 py-1 rounded-lg border hover:bg-hover font-bold transition-all cursor-pointer"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              닫기
            </button>
          </div>

          {/* 폼 입력 영역 */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 no-scrollbar">
            {/* 상담일자 */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold" style={{ color: 'var(--text-secondary)' }}>* 상담일자 (8자리)</label>
              <input
                type="text"
                maxLength={8}
                value={formValues.date}
                onChange={e => handleInputChange('date', e.target.value)}
                placeholder="YYYYMMDD (예: 20260524)"
                className="w-full text-xs px-3 py-2.5 rounded-xl border outline-none font-medium focus:ring-1 focus:ring-accent focus:border-accent transition-all"
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>

            {/* 학년 및 반 */}
            <div className="flex gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-[11px] font-bold" style={{ color: 'var(--text-secondary)' }}>학년</label>
                <select
                  value={formValues.grade}
                  onChange={e => handleInputChange('grade', e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border outline-none font-semibold cursor-pointer"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="1">1학년</option>
                  <option value="2">2학년</option>
                  <option value="3">3학년</option>
                  <option value="4">4학년</option>
                  <option value="5">5학년</option>
                  <option value="6">6학년</option>
                  <option value="혼합">혼합</option>
                </select>
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-[11px] font-bold" style={{ color: 'var(--text-secondary)' }}>반 (선택)</label>
                <input
                  type="text"
                  maxLength={3}
                  value={formValues.ban}
                  onChange={e => handleInputChange('ban', e.target.value)}
                  placeholder="예: 3"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border outline-none font-medium transition-all"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            {/* 상담구분 및 회기 */}
            <div className="flex gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-[11px] font-bold" style={{ color: 'var(--text-secondary)' }}>상담구분</label>
                <select
                  value={formValues.type}
                  onChange={e => handleInputChange('type', e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border outline-none font-semibold cursor-pointer"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                >
                  {COUNSELING_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-[11px] font-bold" style={{ color: 'var(--text-secondary)' }}>상담회기 (선택)</label>
                <input
                  type="text"
                  maxLength={3}
                  value={formValues.session}
                  onChange={e => handleInputChange('session', e.target.value)}
                  placeholder="미입력 시 자동계산"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border outline-none font-medium transition-all"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            {/* 주제 (제목) */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold" style={{ color: 'var(--text-secondary)' }}>* 주제 (제목)</label>
              <input
                type="text"
                value={formValues.summary}
                onChange={e => handleInputChange('summary', e.target.value)}
                placeholder="상담 일지의 대주제 또는 주제 입력"
                className="w-full text-xs px-3 py-2.5 rounded-xl border outline-none font-semibold transition-all"
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>

            {/* 참가학생 명단 (학번) */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold flex items-center justify-between" style={{ color: 'var(--text-secondary)' }}>
                <span>* 참가학생 학번 (명단)</span>
                <span className="text-[9px] text-indigo-500 font-semibold">쉼표 구분 입력</span>
              </label>
              <input
                type="text"
                value={formValues.studentId}
                onChange={e => handleInputChange('studentId', e.target.value)}
                placeholder="예: 2415, 2416 또는 2학년 3반 학생 전체"
                className="w-full text-xs px-3 py-2.5 rounded-xl border outline-none font-semibold transition-all"
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
              <p className="text-[9px] text-neutral-400 leading-normal pl-0.5 pt-0.5">
                ※ 실제 엑셀의 '학번' 컬럼에 기록됩니다. 교사가 보관할 자유 명칭을 기재하셔도 됩니다.
              </p>
            </div>

            {/* 활동 내용 */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold" style={{ color: 'var(--text-secondary)' }}>* 활동 내용 (상세)</label>
              <textarea
                rows={10}
                value={formValues.detail}
                onChange={e => handleInputChange('detail', e.target.value)}
                placeholder="집단 상담 진행 활동 내역 및 결과 요약을 기록해 주세요."
                className="w-full text-xs px-3 py-2.5 rounded-xl border outline-none font-medium leading-relaxed resize-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>

            {/* 저장 버튼 */}
            <button
              type="submit"
              disabled={saveState === 'saving'}
              className="w-full py-3 text-xs font-extrabold text-white rounded-xl active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-4"
              style={{
                background: saveState === 'saving' ? 'var(--text-muted)' : 'var(--accent)',
                boxShadow: saveState === 'saving' ? 'none' : '0 4px 14px rgba(75,142,241,0.35)',
              }}
            >
              {saveState === 'saving' ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Check size={13} />
                  {editorMode === 'new' ? '기록 저장하기' : '수정 완료하기'}
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* 또래상담 입력 도우미 모달 */}
      <PeerCounselDialog
        isOpen={showPeerModal}
        onClose={() => setShowPeerModal(false)}
        onComplete={handlePeerCounselComplete}
      />
    </div>
  )
}
