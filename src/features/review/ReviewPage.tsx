import React, { useState } from 'react'
import { useApp } from '../../app/index'
import type { AnalysisResult, CharacterAnalysis } from '../../domain'
import { buildAnalysisCacheKey, updateAnalysisResult } from '../../services'

const defaultSampleAnalysis: AnalysisResult = {
  characters: [
    {
      character: '學',
      zhuyin: 'ㄒㄩㄝˊ',
      radical: '子',
      strokeCount: 16,
      words: ['學校', '學習', '學生'],
      exampleSentences: ['我每天到學校學習新知識。'],
      confidence: 0.96,
      source: { page: 1, block: '第一段' },
      imageSuggestion: {
        prompt: '小學生在明亮的教室裡專心學習，兒童教材插畫風格',
        rationale: '用熟悉的校園情境幫助理解「學」。',
        selected: false,
      },
      editableState: {
        status: 'draft',
        isEditable: true,
        needsReview: true,
      },
    },
    {
      character: '習',
      zhuyin: 'ㄒㄧˊ',
      radical: '羽',
      strokeCount: 11,
      words: ['學習', '練習', '習慣'],
      exampleSentences: ['多練習可以讓生字寫得更漂亮。'],
      confidence: 0.88,
      source: { page: 1, block: '第一段' },
      imageSuggestion: {
        prompt: '小朋友手握鉛筆在作業本上認真習字練習，特寫溫馨插畫',
        rationale: '對應習字、練習的生活經驗。',
        selected: false,
      },
      editableState: {
        status: 'draft',
        isEditable: true,
        needsReview: true,
      },
    },
    {
      character: '一',
      zhuyin: 'ㄧ',
      radical: '一',
      strokeCount: 1,
      words: ['一起', '一定', '一樣', '第一'],
      exampleSentences: [
        '我們一起到公園玩耍。',
        '只要努力練習，一定能把字寫好。',
      ],
      confidence: 0.98,
      source: { page: 1, block: '第一段' },
      imageSuggestion: {
        prompt: '一群小朋友手牽手開心地在草地上一起玩耍，溫暖童趣風格',
        rationale: '「一起」的同儕合作情境，貼近國小學生生活。',
        selected: false,
      },
      editableState: {
        status: 'draft',
        isEditable: true,
        needsReview: true,
      },
    },
  ],
}

interface EditFormState {
  character: string
  zhuyin: string
  radical: string
  strokeCount: number
  words: string
  exampleSentence: string
}

export const ReviewPage: React.FC = () => {
  const {
    analysisResult,
    setAnalysisResult,
    uploadedFile,
    includeZhuyin,
    navigate,
  } = useApp()

  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<EditFormState>({
    character: '',
    zhuyin: '',
    radical: '',
    strokeCount: 1,
    words: '',
    exampleSentence: '',
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isAddingNew, setIsAddingNew] = useState(false)

  // 儲存狀態與錯誤狀態 (Requirement 3)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null)

  const characters = analysisResult?.characters || []
  const isEmpty = characters.length === 0

  // 通用儲存函式：呼叫 updateAnalysisResult use case (Requirement 2 & 3)
  const saveAnalysisData = async (updatedData: AnalysisResult): Promise<boolean> => {
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccessMsg(null)

    try {
      // 依快取特徵更新快取
      const contentHash = uploadedFile
        ? buildAnalysisCacheKey(
            `hash-${encodeURIComponent(uploadedFile.name)}-${uploadedFile.size}-p${(uploadedFile.selectedPages ?? [1]).slice().sort((a, b) => a - b).join(',')}`,
            { language: 'zh-TW', includeZhuyin },
          )
        : undefined

      // 呼叫 updateAnalysisResult use case
      const res = await updateAnalysisResult(updatedData, contentHash)

      if (res.ok) {
        setAnalysisResult(res.value)
        setSaveSuccessMsg('生字資料已成功通過驗證並儲存！')
        setTimeout(() => setSaveSuccessMsg(null), 3500)
        setIsSaving(false)
        return true
      } else {
        setSaveError(res.error.message)
        setIsSaving(false)
        return false
      }
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : '儲存資料時發生非預期錯誤。')
      setIsSaving(false)
      return false
    }
  }

  // 1. 空狀態呈現 (Requirement 3: 空狀態清楚呈現)
  if (isEmpty) {
    return (
      <div className="card">
        {/* 儲存錯誤呈現 */}
        {saveError && (
          <div
            className="callout callout-warning"
            style={{
              borderColor: 'var(--color-danger)',
              backgroundColor: 'var(--color-danger-light)',
              marginBottom: '1rem',
            }}
            role="alert"
          >
            <div className="callout-title" style={{ color: 'var(--color-danger)' }}>
              ❌ 資料載入失敗
            </div>
            <p style={{ color: '#7f1d1d' }}>{saveError}</p>
          </div>
        )}

        <div className="empty-state">
          <div className="empty-state-icon" aria-hidden="true">
            📭
          </div>
          <h2 className="empty-state-title">目前尚無生字分析成果</h2>
          <p className="empty-state-desc">
            尚未進行教材分析，或生字清單已被全部移除。您可以返回上傳頁重新選頁分析，或載入國語示範生字資料進行審核。
          </p>
          <div className="btn-group" style={{ justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('upload')}
              disabled={isSaving}
            >
              ← 返回教材上傳
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={async () => {
                const sample = structuredClone(defaultSampleAnalysis)
                await saveAnalysisData(sample)
              }}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span className="spinner-sm" aria-hidden="true"></span>
                  <span>載入中...</span>
                </>
              ) : (
                '✨ 載入三上示範生字（學、習）'
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 統計生字狀態
  const totalCount = characters.length
  const needsReviewCount = characters.filter((c) => c.editableState.status !== 'confirmed').length
  const confirmedCount = characters.filter((c) => c.editableState.status === 'confirmed').length
  const editedCount = characters.filter((c) => c.editableState.status === 'edited').length

  const handleStartEdit = (idx: number) => {
    const item = characters[idx]
    setEditingIndex(idx)
    setIsAddingNew(false)
    setFieldErrors({})
    setSaveError(null)
    setEditForm({
      character: item.character,
      zhuyin: item.zhuyin,
      radical: item.radical,
      strokeCount: item.strokeCount,
      words: item.words.join('、'),
      exampleSentence: item.exampleSentences[0] || '',
    })
  }

  const handleStartAddNew = () => {
    setIsAddingNew(true)
    setEditingIndex(null)
    setFieldErrors({})
    setSaveError(null)
    setEditForm({
      character: '',
      zhuyin: '',
      radical: '',
      strokeCount: 1,
      words: '',
      exampleSentence: '',
    })
  }

  // 表單前置欄位檢查
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    if ([...editForm.character.trim()].length !== 1) {
      errors.character = '生字必須為剛好 1 個單一字元'
    }
    if (!editForm.zhuyin.trim()) {
      errors.zhuyin = '注音符號不可為空'
    }
    if (!editForm.radical.trim()) {
      errors.radical = '部首不可為空'
    }
    if (!editForm.strokeCount || editForm.strokeCount < 1 || !Number.isInteger(editForm.strokeCount)) {
      errors.strokeCount = '筆畫必須為大於 0 的正整數'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // 儲存編輯或新增（呼叫 updateAnalysisResult）
  const handleSaveEdit = async () => {
    if (!validateForm()) return

    const parsedWords = editForm.words
      .split(/[,、，\s]/)
      .map((w) => w.trim())
      .filter(Boolean)

    if (isAddingNew) {
      const newChar: CharacterAnalysis = {
        character: editForm.character.trim(),
        zhuyin: editForm.zhuyin.trim(),
        radical: editForm.radical.trim(),
        strokeCount: editForm.strokeCount,
        words: parsedWords.length > 0 ? parsedWords : [editForm.character.trim()],
        exampleSentences: editForm.exampleSentence.trim() ? [editForm.exampleSentence.trim()] : [],
        confidence: 1.0,
        source: { page: 1, block: '教師自訂新增' },
        imageSuggestion: null,
        editableState: {
          status: 'confirmed',
          isEditable: true,
          needsReview: false,
        },
      }
      const updated: AnalysisResult = { characters: [...characters, newChar] }
      const success = await saveAnalysisData(updated)
      if (success) {
        setIsAddingNew(false)
      }
    } else if (editingIndex !== null) {
      const updatedChars = [...characters]
      const current = updatedChars[editingIndex]
      updatedChars[editingIndex] = {
        ...current,
        character: editForm.character.trim(),
        zhuyin: editForm.zhuyin.trim(),
        radical: editForm.radical.trim(),
        strokeCount: editForm.strokeCount,
        words: parsedWords,
        exampleSentences: editForm.exampleSentence.trim() ? [editForm.exampleSentence.trim()] : [],
        editableState: {
          ...current.editableState,
          status: 'edited',
          needsReview: false,
        },
      }
      const updated: AnalysisResult = { characters: updatedChars }
      const success = await saveAnalysisData(updated)
      if (success) {
        setEditingIndex(null)
      }
    }
  }

  // 單一項目確認無誤
  const handleConfirmItem = async (index: number) => {
    const updatedChars = [...characters]
    const item = updatedChars[index]
    updatedChars[index] = {
      ...item,
      editableState: {
        ...item.editableState,
        status: 'confirmed',
        needsReview: false,
      },
    }
    await saveAnalysisData({ characters: updatedChars })
  }

  // 單一項目取消確認，改回待審核狀態
  const handleUnconfirmItem = async (index: number) => {
    const updatedChars = [...characters]
    const item = updatedChars[index]
    updatedChars[index] = {
      ...item,
      editableState: {
        ...item.editableState,
        status: 'draft',
        needsReview: true,
      },
    }
    await saveAnalysisData({ characters: updatedChars })
  }

  // 一鍵將所有「待審核」生字標記為已確認（已確認的項目維持不變）
  const handleConfirmAll = async () => {
    const updatedChars = characters.map((item) => {
      if (item.editableState.status === 'confirmed') {
        return item
      }
      return {
        ...item,
        editableState: {
          ...item.editableState,
          status: 'confirmed' as const,
          needsReview: false,
        },
      }
    })
    await saveAnalysisData({ characters: updatedChars })
  }

  // 刪除生字項目
  const handleDeleteItem = async (index: number) => {
    const charName = characters[index].character
    if (window.confirm(`確定要自本次學習單中刪除生字「${charName}」嗎？`)) {
      const updatedChars = characters.filter((_, idx) => idx !== index)
      const success = await saveAnalysisData({ characters: updatedChars })
      if (success && editingIndex === index) {
        setEditingIndex(null)
      }
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="card-title">🔍 步驟 3：分析結果審核與編輯</h1>
            <p className="card-subtitle">
              教師享有最終編輯審核權：逐字核對注音、部首、筆畫、詞語、例句，所有修改即時儲存
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleStartAddNew}
            disabled={isAddingNew || isSaving}
            aria-label="手動新增自訂生字"
          >
            ➕ 手動新增生字
          </button>
        </div>
      </div>

      {/* 錯誤狀態呈現 (Requirement 3: 錯誤狀態清楚呈現) */}
      {saveError && (
        <div
          className="callout callout-warning"
          style={{
            borderColor: 'var(--color-danger)',
            backgroundColor: 'var(--color-danger-light)',
            marginBottom: '1rem',
          }}
          role="alert"
        >
          <div className="callout-title" style={{ color: 'var(--color-danger)' }}>
            ❌ 資料儲存失敗
          </div>
          <p style={{ color: '#7f1d1d' }}>{saveError}</p>
        </div>
      )}

      {/* 儲存成功提示 */}
      {saveSuccessMsg && (
        <div
          className="callout"
          style={{
            borderColor: 'var(--color-success)',
            backgroundColor: 'var(--color-success-light)',
            color: '#065f46',
            marginBottom: '1rem',
          }}
          role="status"
          aria-live="polite"
        >
          ✅ {saveSuccessMsg}
        </div>
      )}

      {/* 審核進度狀態列 */}
      <div className="summary-bar" role="status" aria-label="審核進度統計">
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span>
            生字總數：<strong>{totalCount}</strong> 個
          </span>
          <span style={{ color: needsReviewCount > 0 ? '#b45309' : 'inherit', fontWeight: needsReviewCount > 0 ? 700 : 'normal' }}>
            ⚠️ 待審核：<strong>{needsReviewCount}</strong>
          </span>
          <span style={{ color: '#047857' }}>
            ✓ 已確認：<strong>{confirmedCount}</strong>
          </span>
          {editedCount > 0 && (
            <span style={{ color: '#4338ca' }}>
              ✏️ 已修改：<strong>{editedCount}</strong>
            </span>
          )}
          {isSaving && (
            <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
              <span className="spinner-sm" style={{ marginRight: '4px', borderColor: 'rgba(13,148,136,0.3)', borderTopColor: 'var(--color-primary)' }}></span>
              儲存更新中...
            </span>
          )}
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
          onClick={handleConfirmAll}
          disabled={isSaving || needsReviewCount === 0}
          aria-label="一鍵將所有待審核生字標記為已確認"
        >
          ✓ 全部確認
        </button>
      </div>

      {/* needsReview 項目提示橫幅 (Requirement 1) */}
      {needsReviewCount > 0 && (
        <div className="callout callout-warning" role="region" aria-label="待審核提示">
          <div className="callout-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>⚠️ 注意：有 {needsReviewCount} 個生字標記為「待審核」</span>
          </div>
          <p>
            標示有黃色警示外框與「⚠️ 待審核」圖示的項目為 AI 信心值偏低或字形筆畫辨識存疑處，建議特別核對<strong>注音與總筆畫</strong>。
          </p>
        </div>
      )}

      {/* 手動自訂新增生字表單 */}
      {isAddingNew && (
        <div
          style={{
            border: '2px dashed var(--color-primary)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            backgroundColor: 'var(--color-primary-light)',
            marginBottom: '1.5rem',
          }}
        >
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: 'var(--color-primary-dark)' }}>
            ➕ 教師自訂新增生字
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '0.75rem' }}>
            <div>
              <label htmlFor="new-char-input" style={{ fontSize: '0.85rem', fontWeight: 600 }}>生字（單字）：</label>
              <input
                id="new-char-input"
                type="text"
                maxLength={1}
                value={editForm.character}
                onChange={(e) => setEditForm({ ...editForm, character: e.target.value })}
                placeholder="例如：春"
                disabled={isSaving}
                style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              {fieldErrors.character && <div className="form-error">{fieldErrors.character}</div>}
            </div>
            <div>
              <label htmlFor="new-zhuyin-input" style={{ fontSize: '0.85rem', fontWeight: 600 }}>注音符號：</label>
              <input
                id="new-zhuyin-input"
                type="text"
                value={editForm.zhuyin}
                onChange={(e) => setEditForm({ ...editForm, zhuyin: e.target.value })}
                placeholder="例如：ㄔㄨㄣ"
                disabled={isSaving}
                style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              {fieldErrors.zhuyin && <div className="form-error">{fieldErrors.zhuyin}</div>}
            </div>
            <div>
              <label htmlFor="new-radical-input" style={{ fontSize: '0.85rem', fontWeight: 600 }}>部首：</label>
              <input
                id="new-radical-input"
                type="text"
                value={editForm.radical}
                onChange={(e) => setEditForm({ ...editForm, radical: e.target.value })}
                placeholder="例如：日"
                disabled={isSaving}
                style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              {fieldErrors.radical && <div className="form-error">{fieldErrors.radical}</div>}
            </div>
            <div>
              <label htmlFor="new-strokes-input" style={{ fontSize: '0.85rem', fontWeight: 600 }}>總筆畫：</label>
              <input
                id="new-strokes-input"
                type="number"
                min={1}
                value={editForm.strokeCount}
                onChange={(e) => setEditForm({ ...editForm, strokeCount: Number(e.target.value) })}
                disabled={isSaving}
                style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              {fieldErrors.strokeCount && <div className="form-error">{fieldErrors.strokeCount}</div>}
            </div>
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <label htmlFor="new-words-input" style={{ fontSize: '0.85rem', fontWeight: 600 }}>詞語（頓號、逗號分隔）：</label>
            <input
              id="new-words-input"
              type="text"
              value={editForm.words}
              onChange={(e) => setEditForm({ ...editForm, words: e.target.value })}
              placeholder="例如：春天、春風、春暖花開"
              disabled={isSaving}
              style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <label htmlFor="new-sentence-input" style={{ fontSize: '0.85rem', fontWeight: 600 }}>教學例句：</label>
            <input
              id="new-sentence-input"
              type="text"
              value={editForm.exampleSentence}
              onChange={(e) => setEditForm({ ...editForm, exampleSentence: e.target.value })}
              placeholder="例如：春天來了，公園裡開滿了五顏六色的花朵。"
              disabled={isSaving}
              style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <div className="btn-group" style={{ marginTop: '1rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveEdit}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span className="spinner-sm" aria-hidden="true"></span>
                  <span>儲存中...</span>
                </>
              ) : (
                '💾 儲存並加入清單'
              )}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsAddingNew(false)}
              disabled={isSaving}
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 逐字呈現生字、注音、部首、筆畫、詞語、例句 (Requirement 1) */}
      <div className="char-grid" role="region" aria-label="生字分析結果清單">
        {characters.map((item, idx) => {
          const isEditingThis = editingIndex === idx
          const isConfirmed = item.editableState.status === 'confirmed'
          const isEdited = item.editableState.status === 'edited'

          return (
            <article
              key={`${item.character}-${idx}`}
              className="char-card"
              style={{
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: isConfirmed
                  ? '#10b981'
                  : isEdited
                  ? '#6366f1'
                  : '#f59e0b',
                backgroundColor: isConfirmed
                  ? 'var(--color-surface)'
                  : '#fffbeb',
              }}
              aria-label={`生字卡片：${item.character}，${isConfirmed ? '已確認' : '待審核'}`}
            >
              {/* 卡片標頭：生字、注音、部首、筆畫 */}
              <div className="char-card-header">
                <div>
                  <span className="char-big">{item.character}</span>
                  <div className="char-meta-row">
                    <span>
                      注音：<strong>{item.zhuyin}</strong>
                    </span>
                    <span>
                      部首：<strong>{item.radical}</strong>
                    </span>
                    <span>
                      筆畫：<strong>{item.strokeCount}</strong> 畫
                    </span>
                  </div>
                </div>

                {/* 清楚標示狀態標籤 */}
                <div style={{ textAlign: 'right' }}>
                  {isConfirmed ? (
                    <span className="tag tag-success" style={{ display: 'block', marginBottom: '4px' }}>
                      ✓ 已確認
                    </span>
                  ) : isEdited ? (
                    <span className="tag tag-info" style={{ display: 'block' }}>
                      ✏️ 已編輯
                    </span>
                  ) : (
                    <span
                      className="tag tag-warning"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                        marginBottom: '4px',
                        border: '1px solid #d97706',
                      }}
                    >
                      ⚠️ 待審核
                    </span>
                  )}
                </div>
              </div>

              {/* 編輯每個欄位的表單 (Requirement 2 & 3: 儲存中與錯誤狀態) */}
              {isEditingThis ? (
                <div
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.85rem',
                    backgroundColor: 'var(--color-bg)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-primary-dark)' }}>
                    ✏️ 編輯「{item.character}」欄位：
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>生字：</label>
                      <input
                        type="text"
                        maxLength={1}
                        value={editForm.character}
                        onChange={(e) => setEditForm({ ...editForm, character: e.target.value })}
                        disabled={isSaving}
                        style={{ width: '100%', padding: '0.35rem', borderRadius: '4px', border: '1px solid #ccc' }}
                      />
                      {fieldErrors.character && <div className="form-error">{fieldErrors.character}</div>}
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>注音符號：</label>
                      <input
                        type="text"
                        value={editForm.zhuyin}
                        onChange={(e) => setEditForm({ ...editForm, zhuyin: e.target.value })}
                        disabled={isSaving}
                        style={{ width: '100%', padding: '0.35rem', borderRadius: '4px', border: '1px solid #ccc' }}
                      />
                      {fieldErrors.zhuyin && <div className="form-error">{fieldErrors.zhuyin}</div>}
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>部首：</label>
                      <input
                        type="text"
                        value={editForm.radical}
                        onChange={(e) => setEditForm({ ...editForm, radical: e.target.value })}
                        disabled={isSaving}
                        style={{ width: '100%', padding: '0.35rem', borderRadius: '4px', border: '1px solid #ccc' }}
                      />
                      {fieldErrors.radical && <div className="form-error">{fieldErrors.radical}</div>}
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>總筆畫：</label>
                      <input
                        type="number"
                        min={1}
                        value={editForm.strokeCount}
                        onChange={(e) => setEditForm({ ...editForm, strokeCount: Number(e.target.value) })}
                        disabled={isSaving}
                        style={{ width: '100%', padding: '0.35rem', borderRadius: '4px', border: '1px solid #ccc' }}
                      />
                      {fieldErrors.strokeCount && <div className="form-error">{fieldErrors.strokeCount}</div>}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>詞語（頓號、逗號分隔）：</label>
                    <input
                      type="text"
                      value={editForm.words}
                      onChange={(e) => setEditForm({ ...editForm, words: e.target.value })}
                      disabled={isSaving}
                      style={{ width: '100%', padding: '0.35rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>例句：</label>
                    <input
                      type="text"
                      value={editForm.exampleSentence}
                      onChange={(e) => setEditForm({ ...editForm, exampleSentence: e.target.value })}
                      disabled={isSaving}
                      style={{ width: '100%', padding: '0.35rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                  </div>

                  <div className="btn-group" style={{ marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ fontSize: '0.85rem' }}
                      onClick={handleSaveEdit}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <span className="spinner-sm" aria-hidden="true"></span>
                          <span>儲存中...</span>
                        </>
                      ) : (
                        '💾 儲存修改'
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.85rem' }}
                      onClick={() => setEditingIndex(null)}
                      disabled={isSaving}
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                /* 正常呈現狀態 */
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.88rem', marginBottom: '0.35rem' }}>
                    <strong>詞語：</strong> {item.words.join('、')}
                  </div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                    <strong>例句：</strong> {item.exampleSentences[0] || '（無例句）'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                    來源：第 {item.source.page ?? 1} 頁 ｜ {item.source.block ?? '課文段落'}
                  </div>

                  <div className="btn-group">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.82rem' }}
                      onClick={() => handleStartEdit(idx)}
                      disabled={isSaving}
                      aria-label={`編輯生字「${item.character}」所有欄位`}
                    >
                      ✏️ 編輯
                    </button>

                    {isConfirmed ? (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.82rem' }}
                        onClick={() => handleUnconfirmItem(idx)}
                        disabled={isSaving}
                        aria-label={`取消確認生字「${item.character}」`}
                      >
                        ↩️ 取消確認
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.82rem' }}
                        onClick={() => handleConfirmItem(idx)}
                        disabled={isSaving}
                        aria-label={`確認生字「${item.character}」無誤`}
                      >
                        ✓ 確認無誤
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn btn-danger"
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.82rem', marginLeft: 'auto' }}
                      onClick={() => handleDeleteItem(idx)}
                      disabled={isSaving}
                      aria-label={`自學習單中刪除生字「${item.character}」`}
                    >
                      🗑️ 刪除
                    </button>
                  </div>
                </div>
              )}
            </article>
          )
        })}
      </div>

      {/* 底部流程按鈕 */}
      <div className="btn-group" style={{ marginTop: '2.5rem', justifyContent: 'space-between' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate('upload')}
          disabled={isSaving}
        >
          ← 返回教材上傳選頁
        </button>
        <button
          type="button"
          className="btn btn-primary"
          style={{ padding: '0.65rem 1.6rem', fontSize: '1rem' }}
          onClick={() => navigate('images')}
          disabled={isSaving || isEmpty}
          aria-label="前往下一步：上傳配圖"
        >
          下一步：上傳配圖 →
        </button>
      </div>
    </div>
  )
}
