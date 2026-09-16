import React, { useState } from 'react'
import { useApp } from '../../app/index'
import type { AnalysisResult, CharacterAnalysis } from '../../domain'

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
        needsReview: false,
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
  const { analysisResult, setAnalysisResult, navigate } = useApp()

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

  const characters = analysisResult?.characters || []
  const isEmpty = characters.length === 0

  // 1. 空狀態處理 (Empty State)
  if (isEmpty) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon" aria-hidden="true">
            📭
          </div>
          <h2 className="empty-state-title">目前尚無生字分析資料</h2>
          <p className="empty-state-desc">
            尚未進行教材分析，或生字清單已被全部移除。您可以返回上傳頁重新分析，或是載入示範教材資料進行審核。
          </p>
          <div className="btn-group" style={{ justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('upload')}
            >
              ← 返回教材上傳
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setAnalysisResult(structuredClone(defaultSampleAnalysis))}
            >
              ✨ 載入三上示範生字（學、習）
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 統計數量
  const totalCount = characters.length
  const needsReviewCount = characters.filter((c) => c.editableState.needsReview).length
  const confirmedCount = characters.filter((c) => c.editableState.status === 'confirmed').length
  const editedCount = characters.filter((c) => c.editableState.status === 'edited').length

  const handleStartEdit = (idx: number) => {
    const item = characters[idx]
    setEditingIndex(idx)
    setIsAddingNew(false)
    setFieldErrors({})
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
    setEditForm({
      character: '',
      zhuyin: '',
      radical: '',
      strokeCount: 1,
      words: '',
      exampleSentence: '',
    })
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    if ([...editForm.character.trim()].length !== 1) {
      errors.character = '生字必須為剛好 1 個字元'
    }
    if (!editForm.zhuyin.trim()) {
      errors.zhuyin = '注音不可為空'
    }
    if (!editForm.radical.trim()) {
      errors.radical = '部首不可為空'
    }
    if (!editForm.strokeCount || editForm.strokeCount < 1 || !Number.isInteger(editForm.strokeCount)) {
      errors.strokeCount = '筆畫必須為大於 0 的整數'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSaveEdit = () => {
    if (!validateForm()) return

    const parsedWords = editForm.words
      .split(/[,、，]/)
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
        source: { page: 1, block: '教師手動新增' },
        imageSuggestion: null,
        editableState: {
          status: 'confirmed',
          isEditable: true,
          needsReview: false,
        },
      }
      setAnalysisResult({ characters: [...characters, newChar] })
      setIsAddingNew(false)
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
      setAnalysisResult({ characters: updatedChars })
      setEditingIndex(null)
    }
  }

  const handleConfirmItem = (index: number) => {
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
    setAnalysisResult({ characters: updatedChars })
  }

  const handleConfirmAll = () => {
    const updatedChars = characters.map((item) => ({
      ...item,
      editableState: {
        ...item.editableState,
        status: 'confirmed' as const,
        needsReview: false,
      },
    }))
    setAnalysisResult({ characters: updatedChars })
  }

  const handleDeleteItem = (index: number) => {
    const charName = characters[index].character
    if (window.confirm(`確定要刪除生字「${charName}」嗎？`)) {
      const updatedChars = characters.filter((_, idx) => idx !== index)
      setAnalysisResult({ characters: updatedChars })
      if (editingIndex === index) {
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
              教師擁有最終審核與修改權：可核對注音部首筆畫、補充詞句或自訂新增生字
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleStartAddNew}
            disabled={isAddingNew}
          >
            ➕ 手動新增生字
          </button>
        </div>
      </div>

      {/* 審核狀態摘要列 (Summary Bar) */}
      <div className="summary-bar" role="status" aria-label="審核進度統計">
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span>
            生字總數：<strong>{totalCount}</strong> 個
          </span>
          <span style={{ color: needsReviewCount > 0 ? '#b45309' : 'inherit' }}>
            ⚠️ 待審核：<strong>{needsReviewCount}</strong>
          </span>
          <span style={{ color: '#047857' }}>
            ✓ 已確認：<strong>{confirmedCount}</strong>
          </span>
          {editedCount > 0 && (
            <span style={{ color: '#4338ca' }}>
              ✏️ 教師已編修：<strong>{editedCount}</strong>
            </span>
          )}
        </div>
        {needsReviewCount > 0 && (
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '0.25rem 0.65rem', fontSize: '0.85rem' }}
            onClick={handleConfirmAll}
            aria-label="一鍵將所有生字標記為已確認"
          >
            ✓ 全部標記為已確認
          </button>
        )}
      </div>

      {/* 待確認警示區 */}
      {needsReviewCount > 0 && (
        <div className="callout callout-warning" role="region" aria-label="低信心提示">
          <div className="callout-title">⚠️ 注意：有 {needsReviewCount} 個生字建議優先確認</div>
          <p>
            標示為「待審核」的生字可能因教材影像筆畫密集、字形辨識信心度較低，請特別核對注音與部首筆畫。
          </p>
        </div>
      )}

      {/* 手動新增生字表單 (Teacher Add Character) */}
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>生字（單字）：</label>
              <input
                type="text"
                maxLength={1}
                value={editForm.character}
                onChange={(e) => setEditForm({ ...editForm, character: e.target.value })}
                placeholder="例如：春"
                style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              {fieldErrors.character && <div className="form-error">{fieldErrors.character}</div>}
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>注音符號：</label>
              <input
                type="text"
                value={editForm.zhuyin}
                onChange={(e) => setEditForm({ ...editForm, zhuyin: e.target.value })}
                placeholder="例如：ㄔㄨㄣ"
                style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              {fieldErrors.zhuyin && <div className="form-error">{fieldErrors.zhuyin}</div>}
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>部首：</label>
              <input
                type="text"
                value={editForm.radical}
                onChange={(e) => setEditForm({ ...editForm, radical: e.target.value })}
                placeholder="例如：日"
                style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              {fieldErrors.radical && <div className="form-error">{fieldErrors.radical}</div>}
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>總筆畫：</label>
              <input
                type="number"
                min={1}
                value={editForm.strokeCount}
                onChange={(e) => setEditForm({ ...editForm, strokeCount: Number(e.target.value) })}
                style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              {fieldErrors.strokeCount && <div className="form-error">{fieldErrors.strokeCount}</div>}
            </div>
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>推薦詞語（頓號或逗號分隔）：</label>
            <input
              type="text"
              value={editForm.words}
              onChange={(e) => setEditForm({ ...editForm, words: e.target.value })}
              placeholder="例如：春天、春暖花開"
              style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>教學例句：</label>
            <input
              type="text"
              value={editForm.exampleSentence}
              onChange={(e) => setEditForm({ ...editForm, exampleSentence: e.target.value })}
              placeholder="例如：春天來了，花園裡的花朵都開了。"
              style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          <div className="btn-group" style={{ marginTop: '1rem' }}>
            <button type="button" className="btn btn-primary" onClick={handleSaveEdit}>
              儲存並加入清單
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddingNew(false)}>
              取消
            </button>
          </div>
        </div>
      )}

      {/* 生字卡片網格 */}
      <div className="char-grid">
        {characters.map((item, idx) => {
          const isEditingThis = editingIndex === idx
          const isConfirmed = item.editableState.status === 'confirmed'
          const isEdited = item.editableState.status === 'edited'
          const needsReview = item.editableState.needsReview

          return (
            <article
              key={`${item.character}-${idx}`}
              className="char-card"
              style={{
                borderColor: needsReview
                  ? 'var(--color-accent)'
                  : isConfirmed
                  ? 'var(--color-success)'
                  : 'var(--color-border)',
              }}
            >
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
                <div style={{ textAlign: 'right' }}>
                  {needsReview && (
                    <span className="tag tag-warning" style={{ display: 'block', marginBottom: '4px' }}>
                      ⚠️ 待審核
                    </span>
                  )}
                  {isConfirmed && (
                    <span className="tag tag-success" style={{ display: 'block', marginBottom: '4px' }}>
                      ✓ 已確認
                    </span>
                  )}
                  {isEdited && !isConfirmed && (
                    <span className="tag tag-info" style={{ display: 'block', marginBottom: '4px' }}>
                      ✏️ 已編輯
                    </span>
                  )}
                  <span className="tag tag-info">
                    信心度 {(item.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* 編輯表單 */}
              {isEditingThis ? (
                <div
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem',
                    backgroundColor: 'var(--color-bg)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>生字：</label>
                    <input
                      type="text"
                      maxLength={1}
                      value={editForm.character}
                      onChange={(e) => setEditForm({ ...editForm, character: e.target.value })}
                      style={{ width: '100%', padding: '0.35rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    {fieldErrors.character && <div className="form-error">{fieldErrors.character}</div>}
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>注音：</label>
                    <input
                      type="text"
                      value={editForm.zhuyin}
                      onChange={(e) => setEditForm({ ...editForm, zhuyin: e.target.value })}
                      style={{ width: '100%', padding: '0.35rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    {fieldErrors.zhuyin && <div className="form-error">{fieldErrors.zhuyin}</div>}
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>部首：</label>
                    <input
                      type="text"
                      value={editForm.radical}
                      onChange={(e) => setEditForm({ ...editForm, radical: e.target.value })}
                      style={{ width: '100%', padding: '0.35rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    {fieldErrors.radical && <div className="form-error">{fieldErrors.radical}</div>}
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>總筆畫：</label>
                    <input
                      type="number"
                      min={1}
                      value={editForm.strokeCount}
                      onChange={(e) => setEditForm({ ...editForm, strokeCount: Number(e.target.value) })}
                      style={{ width: '100%', padding: '0.35rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    {fieldErrors.strokeCount && <div className="form-error">{fieldErrors.strokeCount}</div>}
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>詞語（頓號分隔）：</label>
                    <input
                      type="text"
                      value={editForm.words}
                      onChange={(e) => setEditForm({ ...editForm, words: e.target.value })}
                      style={{ width: '100%', padding: '0.35rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>例句：</label>
                    <input
                      type="text"
                      value={editForm.exampleSentence}
                      onChange={(e) => setEditForm({ ...editForm, exampleSentence: e.target.value })}
                      style={{ width: '100%', padding: '0.35rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                  </div>

                  <div className="btn-group" style={{ marginTop: '0.5rem' }}>
                    <button type="button" className="btn btn-primary" style={{ fontSize: '0.85rem' }} onClick={handleSaveEdit}>
                      儲存修改
                    </button>
                    <button type="button" className="btn btn-secondary" style={{ fontSize: '0.85rem' }} onClick={() => setEditingIndex(null)}>
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.88rem', marginBottom: '0.35rem' }}>
                    <strong>詞語：</strong> {item.words.join('、')}
                  </div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                    <strong>例句：</strong> {item.exampleSentences[0] || '（無例句）'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                    來源：第 {item.source.page ?? 1} 頁 ｜ {item.source.block ?? '正文'}
                  </div>

                  <div className="btn-group">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.82rem' }}
                      onClick={() => handleStartEdit(idx)}
                      aria-label={`編輯生字「${item.character}」`}
                    >
                      ✏️ 編輯
                    </button>
                    {!isConfirmed && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.82rem' }}
                        onClick={() => handleConfirmItem(idx)}
                        aria-label={`確認生字「${item.character}」無誤`}
                      >
                        ✓ 確認
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-danger"
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.82rem', marginLeft: 'auto' }}
                      onClick={() => handleDeleteItem(idx)}
                      aria-label={`刪除生字「${item.character}」`}
                    >
                      刪除
                    </button>
                  </div>
                </div>
              )}
            </article>
          )
        })}
      </div>

      <div className="btn-group" style={{ marginTop: '2.5rem', justifyContent: 'space-between' }}>
        <button type="button" className="btn btn-secondary" onClick={() => navigate('upload')}>
          ← 返回重新上傳
        </button>
        <button
          type="button"
          className="btn btn-primary"
          style={{ padding: '0.65rem 1.6rem', fontSize: '1rem' }}
          onClick={() => navigate('images')}
        >
          下一步：配圖選擇 →
        </button>
      </div>
    </div>
  )
}
