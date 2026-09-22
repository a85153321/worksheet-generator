import React, { useState } from 'react'
import { useApp } from '../../app/index'
import type { AnalysisResult, CharacterAnalysis } from '../../domain'
import {
  getCandidatesForCharacterReading,
  lookupCharacterFromDictionary,
  lookupDictionaryEntriesByTerm,
  resolveSentenceCandidatesForWords,
  updateAnalysisResult,
  type DictionaryEntry,
} from '../../services'
import { resolveBopomofoDisplayCharacter } from '../../infrastructure'

const defaultSampleAnalysis: AnalysisResult = {
  characters: [
    {
      character: '學',
      zhuyin: 'ㄒㄩㄝˊ',
      zhuyinCandidates: ['ㄒㄩㄝˊ'],
      radical: '子',
      strokeCount: 16,
      wordCandidates: ['學校', '學習', '學生'],
      sentenceCandidates: ['我每天到學校學習新知識。'],
      source: { page: null, block: '教育部《國語辭典簡編本》' },
    },
    {
      character: '習',
      zhuyin: 'ㄒㄧˊ',
      zhuyinCandidates: ['ㄒㄧˊ'],
      radical: '羽',
      strokeCount: 11,
      wordCandidates: ['學習', '練習', '習慣'],
      sentenceCandidates: ['多練習可以讓生字寫得更漂亮。'],
      source: { page: null, block: '教育部《國語辭典簡編本》' },
    },
    {
      character: '一',
      zhuyin: 'ㄧ',
      zhuyinCandidates: ['ㄧ', 'ㄧˊ', 'ㄧˋ'],
      radical: '一',
      strokeCount: 1,
      wordCandidates: ['一起', '一定', '一樣', '第一'],
      sentenceCandidates: [
        '我們一起到公園玩耍。',
        '只要努力練習，一定能把字寫好。',
      ],
      source: { page: null, block: '教育部《國語辭典簡編本》' },
    },
  ],
}

interface EditFormState {
  character: string
  zhuyin: string
  zhuyinCandidates: string[]
  radical: string
  strokeCount: number | ''
  words: string
  exampleSentence: string
}

export const ReviewPage: React.FC = () => {
  const {
    analysisResult,
    setAnalysisResult,
    navigate,
  } = useApp()

  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<EditFormState>({
    character: '',
    zhuyin: '',
    zhuyinCandidates: [],
    radical: '',
    strokeCount: '',
    words: '',
    exampleSentence: '',
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [wordDrawNotice, setWordDrawNotice] = useState<string | null>(null)
  const [sentenceDrawNotice, setSentenceDrawNotice] = useState<string | null>(null)
  const [autofillNotice, setAutofillNotice] = useState<string | null>(null)

  // 語詞釋義彈窗狀態 (教育部國語辭典簡編本)
  const [activeWordDefinition, setActiveWordDefinition] = useState<{
    word: string
    entries: DictionaryEntry[]
  } | null>(null)

  const handleViewWordDefinition = (word: string) => {
    const cleanWord = word.trim()
    if (!cleanWord) return
    const entries = lookupDictionaryEntriesByTerm(cleanWord)
    setActiveWordDefinition({ word: cleanWord, entries })
  }

  // 儲存狀態與錯誤狀態 (Requirement 3)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null)

  const characters = analysisResult?.characters || []
  const isEmpty = characters.length === 0

  // 通用儲存函式：呼叫 updateAnalysisResult use case (Requirement 2 & 3)
  const saveAnalysisData = async (
    updatedData: AnalysisResult,
    options?: { silent?: boolean },
  ): Promise<boolean> => {
    setIsSaving(true)
    setSaveError(null)
    if (!options?.silent) {
      setSaveSuccessMsg(null)
    }

    try {
      // 呼叫 updateAnalysisResult use case
      const res = await updateAnalysisResult(updatedData)

      if (res.ok) {
        setAnalysisResult(res.value)
        if (!options?.silent) {
          setSaveSuccessMsg('生字資料已成功通過驗證並儲存！')
          setTimeout(() => setSaveSuccessMsg(null), 3500)
        }
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
          <h2 className="empty-state-title">目前尚無生字查詢成果</h2>
          <p className="empty-state-desc">
            尚未進行生字查詢，或生字清單已被全部移除。您可以返回輸入生字頁重新輸入，或載入國語示範生字資料進行審核。
          </p>
          <div className="btn-group" style={{ justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('upload')}
              disabled={isSaving}
            >
              ← 返回輸入生字
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

  const handleStartEdit = (idx: number) => {
    const item = characters[idx]
    setEditingIndex(idx)
    setIsAddingNew(false)
    setFieldErrors({})
    setSaveError(null)
    setWordDrawNotice(null)
    setSentenceDrawNotice(null)
    setAutofillNotice(null)
    setEditForm({
      character: item.character,
      zhuyin: item.zhuyin,
      zhuyinCandidates: item.zhuyinCandidates,
      radical: item.radical,
      strokeCount: item.strokeCount,
      words: item.wordCandidates.slice(0, 3).join('、'),
      exampleSentence: item.sentenceCandidates.slice(0, 2).join('\n'),
    })
  }

  const handleStartAddNew = () => {
    setIsAddingNew(true)
    setEditingIndex(null)
    setFieldErrors({})
    setSaveError(null)
    setWordDrawNotice(null)
    setSentenceDrawNotice(null)
    setAutofillNotice(null)
    setEditForm({
      character: '',
      zhuyin: '',
      zhuyinCandidates: [],
      radical: '',
      strokeCount: '',
      words: '',
      exampleSentence: '',
    })
  }

  // 自動整理：從教育部辭典補齊空白欄位（不覆蓋已有內容）
  const handleAutofillNewChar = () => {
    const char = editForm.character.trim()
    if (!char) {
      setAutofillNotice('請先輸入生字')
      return
    }
    const lookup = lookupCharacterFromDictionary(char)
    if (!lookup) {
      setAutofillNotice('資料庫查無此字，請手動輸入注音、部首等資料。')
      return
    }

    setAutofillNotice(null)
    setEditForm((prev) => {
      const newZhuyin = prev.zhuyin.trim() ? prev.zhuyin : lookup.zhuyin
      const newRadical = prev.radical.trim() ? prev.radical : lookup.radical
      const newStrokeCount =
        prev.strokeCount !== '' && prev.strokeCount > 0
          ? prev.strokeCount
          : lookup.strokeCount
      const newWords = prev.words.trim()
        ? prev.words
        : lookup.wordCandidates.slice(0, 3).join('、')
      const selectedWords = newWords
        .split(/[,、，\s]/)
        .map((word) => word.trim())
        .filter(Boolean)
      const newSentence = prev.exampleSentence.trim()
        ? prev.exampleSentence
        : resolveSentenceCandidatesForWords(lookup, selectedWords).slice(0, 2).join('\n')

      return {
        ...prev,
        zhuyin: newZhuyin,
        zhuyinCandidates: lookup.zhuyinCandidates,
        radical: newRadical,
        strokeCount: newStrokeCount,
        words: newWords,
        exampleSentence: newSentence,
      }
    })
  }

  // 隨機抽選語詞（優先從當前讀音專屬候選隨機挑選未加入者）
  const handleDrawRandomWord = () => {
    const char = editForm.character.trim()
    if (!char) {
      setWordDrawNotice('請先輸入生字')
      return
    }
    const currentReading = editForm.zhuyin.trim()
    const readingCandidates = currentReading
      ? getCandidatesForCharacterReading(char, currentReading)
      : null
    const lookup = lookupCharacterFromDictionary(char)
    const preferredCandidates = readingCandidates?.allWordCandidates ?? []
    const fallbackCandidates = lookup?.wordCandidates || []
    const fullCandidates = preferredCandidates.length > 0 ? preferredCandidates : fallbackCandidates

    if (fullCandidates.length === 0) {
      setWordDrawNotice('已無更多候選')
      return
    }
    const currentWords = new Set(
      editForm.words
        .split(/[,、，\s]/)
        .map((w) => w.trim())
        .filter(Boolean),
    )
    const unselected = fullCandidates.filter((w) => !currentWords.has(w.trim()))
    if (unselected.length === 0) {
      setWordDrawNotice('已無更多候選')
      return
    }
    const picked = unselected[Math.floor(Math.random() * unselected.length)]
    const currentTrimmed = editForm.words.trim()
    const newWords = currentTrimmed
      ? `${currentTrimmed.replace(/、$/, '')}、${picked}`
      : picked
    setEditForm((prev) => ({ ...prev, words: newWords }))
    setWordDrawNotice(null)
  }

  // 隨機抽選例句（從符合當前讀音或選用語詞之例句中挑選）
  const handleDrawRandomSentence = () => {
    const char = editForm.character.trim()
    if (!char) {
      setSentenceDrawNotice('請先輸入生字')
      return
    }
    const lookup = lookupCharacterFromDictionary(char)
    const selectedWords = editForm.words
      .split(/[,、，\s]/)
      .map((word) => word.trim())
      .filter(Boolean)
    const currentReading = editForm.zhuyin.trim()
    const readingCandidates = currentReading
      ? getCandidatesForCharacterReading(char, currentReading)
      : null
    const linkedWordsSentences = lookup
      ? resolveSentenceCandidatesForWords(lookup, selectedWords)
      : []
    const fullCandidates =
      linkedWordsSentences.length > 0
        ? linkedWordsSentences
        : (readingCandidates?.sentenceCandidates.length ?? 0) > 0
          ? readingCandidates!.sentenceCandidates
          : (lookup?.sentenceCandidates ?? [])

    if (fullCandidates.length === 0) {
      setSentenceDrawNotice('已無更多候選')
      return
    }
    const currentSentences = new Set(
      editForm.exampleSentence
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    )
    const unselected = fullCandidates.filter((s) => !currentSentences.has(s.trim()))
    if (unselected.length === 0) {
      setSentenceDrawNotice('已無更多候選')
      return
    }
    const picked = unselected[Math.floor(Math.random() * unselected.length)]
    const currentTrimmed = editForm.exampleSentence.trim()
    const newSentences = currentTrimmed
      ? `${currentTrimmed}\n${picked}`
      : picked
    setEditForm((prev) => ({ ...prev, exampleSentence: newSentences }))
    setSentenceDrawNotice(null)
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
    if (
      editForm.strokeCount === '' ||
      editForm.strokeCount < 1 ||
      !Number.isInteger(editForm.strokeCount)
    ) {
      errors.strokeCount = '筆畫必須為大於 0 的正整數'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // 儲存編輯或新增（呼叫 updateAnalysisResult）
  const handleSaveEdit = async () => {
    if (!validateForm()) return

    const parsedWords = [...new Set(editForm.words
      .split(/[,、，\s]/)
      .map((w) => w.trim())
      .filter(Boolean))]
      .slice(0, 3)

    const parsedSentences = [...new Set(editForm.exampleSentence
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean))]
      .slice(0, 2)

    const strokeCount = typeof editForm.strokeCount === 'number' ? editForm.strokeCount : 1
    const zhuyinCandidates = [...new Set([
      ...editForm.zhuyinCandidates,
      editForm.zhuyin.trim(),
    ].filter(Boolean))]

    if (isAddingNew) {
      const newChar: CharacterAnalysis = {
        character: editForm.character.trim(),
        zhuyin: editForm.zhuyin.trim(),
        zhuyinCandidates,
        radical: editForm.radical.trim(),
        strokeCount,
        wordCandidates: parsedWords.length > 0 ? parsedWords : [editForm.character.trim()],
        sentenceCandidates: parsedSentences.length > 0 ? parsedSentences : [],
        source: { page: null, block: '教師自訂新增' },
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
        zhuyinCandidates,
        radical: editForm.radical.trim(),
        strokeCount,
        wordCandidates: parsedWords,
        sentenceCandidates: parsedSentences.length > 0 ? parsedSentences : [],
      }
      const updated: AnalysisResult = { characters: updatedChars }
      const success = await saveAnalysisData(updated)
      if (success) {
        setEditingIndex(null)
      }
    }
  }

  // 切換編輯表單中的注音符號時，聯動更新語詞與例句推薦
  const handleEditFormZhuyinChange = (newZhuyin: string) => {
    const char = editForm.character.trim()
    const readingCandidates = getCandidatesForCharacterReading(char, newZhuyin)
    setEditForm((prev) => ({
      ...prev,
      zhuyin: newZhuyin,
      words:
        readingCandidates.wordCandidates.length > 0
          ? readingCandidates.wordCandidates.join('、')
          : prev.words,
      exampleSentence:
        readingCandidates.sentenceCandidates.length > 0
          ? readingCandidates.sentenceCandidates.join('\n')
          : prev.exampleSentence,
    }))
  }

  // 切換多音字讀音並立即儲存（以 silent 模式儲存，同時聯動切換專屬語詞與例句）
  const handleSelectZhuyin = async (idx: number, candidate: string) => {
    if (characters[idx]?.zhuyin === candidate) return
    const targetChar = characters[idx]
    if (!targetChar) return

    // 依選定的讀音取得對應語詞與例句
    const readingCandidates = getCandidatesForCharacterReading(
      targetChar.character,
      candidate,
    )
    const newWords =
      readingCandidates.wordCandidates.length > 0
        ? readingCandidates.wordCandidates
        : targetChar.wordCandidates
    const newSentences =
      readingCandidates.sentenceCandidates.length > 0
        ? readingCandidates.sentenceCandidates
        : targetChar.sentenceCandidates

    const updatedChars = characters.map((c, i) =>
      i === idx
        ? {
            ...c,
            zhuyin: candidate,
            wordCandidates: newWords,
            sentenceCandidates: newSentences,
          }
        : c,
    )

    if (editingIndex === idx) {
      setEditForm((prev) => ({
        ...prev,
        zhuyin: candidate,
        words: newWords.join('、'),
        exampleSentence: newSentences.join('\n'),
      }))
    }
    await saveAnalysisData({ characters: updatedChars }, { silent: true })
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
            <h1 className="card-title">🔍 步驟 3：生字查詢結果審核與編輯</h1>
            <p className="card-subtitle">
              教師享有最終編輯審核權：逐字核對注音、部首、筆畫、語詞候選與例句候選，所有修改即時儲存
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
          {isSaving && (
            <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
              <span className="spinner-sm" style={{ marginRight: '4px', borderColor: 'rgba(13,148,136,0.3)', borderTopColor: 'var(--color-primary)' }}></span>
              儲存更新中...
            </span>
          )}
        </div>
      </div>

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--color-primary-dark)' }}>
              ➕ 教師自訂新增生字
            </h3>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem' }}
              onClick={handleAutofillNewChar}
              disabled={isSaving}
              aria-label="自動整理生字資料"
            >
              🪄 自動整理
            </button>
          </div>

          {autofillNotice && (
            <div
              style={{
                fontSize: '0.85rem',
                color: autofillNotice.includes('查無此字') ? '#b91c1c' : '#d97706',
                backgroundColor: autofillNotice.includes('查無此字') ? '#fef2f2' : '#fffbeb',
                border: `1px solid ${autofillNotice.includes('查無此字') ? '#fca5a5' : '#fcd34d'}`,
                padding: '0.4rem 0.75rem',
                borderRadius: '4px',
                marginBottom: '0.75rem',
                fontWeight: 500,
              }}
              role="status"
            >
              ℹ️ {autofillNotice}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '0.75rem' }}>
            <div>
              <label htmlFor="new-char-input" style={{ fontSize: '0.85rem', fontWeight: 600 }}>生字（單字）：</label>
              <input
                id="new-char-input"
                type="text"
                maxLength={1}
                value={editForm.character}
                onChange={(e) => {
                  setEditForm({
                    ...editForm,
                    character: e.target.value,
                    zhuyin: '',
                    zhuyinCandidates: [],
                  })
                  setAutofillNotice(null)
                }}
                placeholder="例如：春"
                disabled={isSaving}
                style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              {fieldErrors.character && <div className="form-error">{fieldErrors.character}</div>}
            </div>
            <div>
              <label htmlFor="new-zhuyin-input" style={{ fontSize: '0.85rem', fontWeight: 600 }}>注音符號：</label>
              {editForm.zhuyinCandidates.length > 0 ? (
                <select
                  id="new-zhuyin-input"
                  className="zhuyin-form-input"
                  value={editForm.zhuyin}
                  onChange={(e) => handleEditFormZhuyinChange(e.target.value)}
                  disabled={isSaving}
                  style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  {editForm.zhuyinCandidates.map((candidate) => (
                    <option key={candidate} value={candidate}>{candidate}</option>
                  ))}
                </select>
              ) : (
                <input
                  id="new-zhuyin-input"
                  className="zhuyin-form-input"
                  type="text"
                  value={editForm.zhuyin}
                  onChange={(e) => setEditForm({ ...editForm, zhuyin: e.target.value })}
                  placeholder="例如：ㄔㄨㄣ"
                  disabled={isSaving}
                  style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              )}
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
                onChange={(e) => setEditForm({ ...editForm, strokeCount: e.target.value === '' ? '' : Number(e.target.value) })}
                disabled={isSaving}
                placeholder="例如：9"
                style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              {fieldErrors.strokeCount && <div className="form-error">{fieldErrors.strokeCount}</div>}
            </div>
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <label htmlFor="new-words-input" style={{ fontSize: '0.85rem', fontWeight: 600 }}>語詞候選（頓號、逗號分隔）：</label>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}
                onClick={handleDrawRandomWord}
                disabled={isSaving}
              >
                🎲 隨機抽選
              </button>
            </div>
            <input
              id="new-words-input"
              type="text"
              value={editForm.words}
              onChange={(e) => {
                setEditForm({ ...editForm, words: e.target.value })
                setWordDrawNotice(null)
              }}
              placeholder="例如：春天、春風、春暖花開"
              disabled={isSaving}
              style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            {wordDrawNotice && (
              <div style={{ fontSize: '0.8rem', color: '#d97706', marginTop: '4px', fontWeight: 500 }} role="status">
                ⚠️ {wordDrawNotice}
              </div>
            )}
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <label htmlFor="new-sentence-input" style={{ fontSize: '0.85rem', fontWeight: 600 }}>例句候選（可輸入多則例句，每行一則）：</label>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}
                onClick={handleDrawRandomSentence}
                disabled={isSaving}
              >
                🎲 隨機抽選
              </button>
            </div>
            <textarea
              id="new-sentence-input"
              rows={3}
              value={editForm.exampleSentence}
              onChange={(e) => {
                setEditForm({ ...editForm, exampleSentence: e.target.value })
                setSentenceDrawNotice(null)
              }}
              placeholder="例如：春天來了，公園裡開滿了五顏六色的花朵。"
              disabled={isSaving}
              style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' }}
            />
            {sentenceDrawNotice && (
              <div style={{ fontSize: '0.8rem', color: '#d97706', marginTop: '4px', fontWeight: 500 }} role="status">
                ⚠️ {sentenceDrawNotice}
              </div>
            )}
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

      {/* 逐字呈現生字、注音、部首、筆畫、語詞、例句 (Requirement 1) */}
      <div className="char-grid" role="region" aria-label="生字分析結果清單">
        {characters.map((item, idx) => {
          const isEditingThis = editingIndex === idx

          return (
            <article
              key={`${item.character}-${idx}`}
              className="char-card"
              aria-label={`生字卡片：${item.character}`}
            >
              {/* 卡片標頭：生字（標楷注音字體渲染）、部首、筆畫 */}
              <div className="char-card-header">
                <div>
                  <span
                    className="review-bopomofo-character"
                    aria-label={`${item.character}，讀音${item.zhuyin}`}
                  >
                    {resolveBopomofoDisplayCharacter(item.character, item.zhuyin)}
                  </span>
                  <div className="char-meta-row">
                    <span>
                      部首：<strong>{item.radical}</strong>
                    </span>
                    <span>
                      筆畫：<strong>{item.strokeCount}</strong> 畫
                    </span>
                  </div>
                </div>
              </div>

              {/* 讀音選擇按鈕組 */}
              <div className="reading-selector">
                {(item.zhuyinCandidates?.length ?? 0) > 1 ? (
                  <>
                    <div className="reading-selector-row">
                      <span className="reading-selector-label">讀音切換：</span>
                      <div className="reading-buttons" role="group" aria-label={`「${item.character}」候選讀音切換`}>
                        {item.zhuyinCandidates.map((candidate) => {
                          const isSelected = item.zhuyin === candidate
                          return (
                            <button
                              key={candidate}
                              type="button"
                              className={`reading-button ${isSelected ? 'selected' : ''}`}
                              aria-pressed={isSelected}
                              onClick={() => handleSelectZhuyin(idx, candidate)}
                              disabled={isSaving}
                            >
                              <span className="zhuyin-text">{candidate}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <div className="reading-fallback-text">
                      目前讀音：<span className="zhuyin-text reading-highlight">{item.zhuyin}</span>
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
                    讀音：<span className="zhuyin-text single-reading-display">{item.zhuyin}</span>
                  </div>
                )}
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
                        onChange={(e) => setEditForm({
                          ...editForm,
                          character: e.target.value,
                          zhuyin: '',
                          zhuyinCandidates: [],
                        })}
                        disabled={isSaving}
                        style={{ width: '100%', padding: '0.35rem', borderRadius: '4px', border: '1px solid #ccc' }}
                      />
                      {fieldErrors.character && <div className="form-error">{fieldErrors.character}</div>}
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>注音符號：</label>
                      <select
                        className="zhuyin-form-input"
                        value={editForm.zhuyin}
                        onChange={(e) => handleEditFormZhuyinChange(e.target.value)}
                        disabled={isSaving}
                        style={{ width: '100%', padding: '0.35rem', borderRadius: '4px', border: '1px solid #ccc' }}
                      >
                        {editForm.zhuyinCandidates.map((candidate) => (
                          <option key={candidate} value={candidate}>{candidate}</option>
                        ))}
                      </select>
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
                        onChange={(e) => setEditForm({ ...editForm, strokeCount: e.target.value === '' ? '' : Number(e.target.value) })}
                        disabled={isSaving}
                        placeholder="例如：9"
                        style={{ width: '100%', padding: '0.35rem', borderRadius: '4px', border: '1px solid #ccc' }}
                      />
                      {fieldErrors.strokeCount && <div className="form-error">{fieldErrors.strokeCount}</div>}
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <label htmlFor={`edit-words-${idx}`} style={{ fontSize: '0.8rem', fontWeight: 600 }}>語詞候選（頓號、逗號分隔）：</label>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}
                        onClick={handleDrawRandomWord}
                        disabled={isSaving}
                      >
                        🎲 隨機抽選
                      </button>
                    </div>
                    <input
                      id={`edit-words-${idx}`}
                      type="text"
                      value={editForm.words}
                      onChange={(e) => {
                        setEditForm({ ...editForm, words: e.target.value })
                        setWordDrawNotice(null)
                      }}
                      disabled={isSaving}
                      style={{ width: '100%', padding: '0.35rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    {wordDrawNotice && (
                      <div style={{ fontSize: '0.8rem', color: '#d97706', marginTop: '4px', fontWeight: 500 }} role="status">
                        ⚠️ {wordDrawNotice}
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <label htmlFor={`edit-sentence-${idx}`} style={{ fontSize: '0.8rem', fontWeight: 600 }}>例句候選（可輸入多則例句，每行一則）：</label>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}
                        onClick={handleDrawRandomSentence}
                        disabled={isSaving}
                      >
                        🎲 隨機抽選
                      </button>
                    </div>
                    <textarea
                      id={`edit-sentence-${idx}`}
                      rows={3}
                      value={editForm.exampleSentence}
                      onChange={(e) => {
                        setEditForm({ ...editForm, exampleSentence: e.target.value })
                        setSentenceDrawNotice(null)
                      }}
                      disabled={isSaving}
                      style={{ width: '100%', padding: '0.35rem', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' }}
                    />
                    {sentenceDrawNotice && (
                      <div style={{ fontSize: '0.8rem', color: '#d97706', marginTop: '4px', fontWeight: 500 }} role="status">
                        ⚠️ {sentenceDrawNotice}
                      </div>
                    )}
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
                  <div style={{ fontSize: '0.88rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                    <strong>語詞候選：</strong>{' '}
                    {item.wordCandidates.slice(0, 3).length > 0 ? (
                      item.wordCandidates.slice(0, 3).map((word, wIdx) => (
                        <React.Fragment key={`${word}-${wIdx}`}>
                          {wIdx > 0 && <span className="word-candidate-sep">、</span>}
                          <button
                            type="button"
                            className="word-candidate-link"
                            onClick={() => handleViewWordDefinition(word)}
                            title={`點擊查看「${word}」在教育部《國語辭典簡編本》之詞義`}
                            aria-label={`查看語詞「${word}」詞義`}
                          >
                            {word}
                            <span className="word-def-icon" aria-hidden="true">📖</span>
                          </button>
                        </React.Fragment>
                      ))
                    ) : (
                      '（無語詞）'
                    )}
                  </div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                    <strong>例句候選：</strong>
                    {item.sentenceCandidates.slice(0, 2).length > 0 ? (
                      item.sentenceCandidates.slice(0, 2).length === 1 ? (
                        <span> {item.sentenceCandidates[0]}</span>
                      ) : (
                        <ol style={{ margin: '0.25rem 0 0 1.25rem', padding: 0 }}>
                          {item.sentenceCandidates.slice(0, 2).map((sentence, sIdx) => (
                            <li key={sIdx}>{sentence}</li>
                          ))}
                        </ol>
                      )
                    ) : (
                      '（無例句）'
                    )}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                    來源：{item.source.page != null ? `第 ${item.source.page} 頁 ｜ ` : ''}{item.source.block ?? '教育部《國語辭典簡編本》'}
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
          ← 返回輸入生字
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

      {/* 語詞釋義彈窗 Modal（教育部國語辭典簡編本） */}
      {activeWordDefinition && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="word-def-title"
          onClick={() => setActiveWordDefinition(null)}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 id="word-def-title" className="modal-title">
                📖 語詞釋義：{activeWordDefinition.word}
              </h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setActiveWordDefinition(null)}
                aria-label="關閉語詞釋義"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {activeWordDefinition.entries.length > 0 ? (
                activeWordDefinition.entries.map((entry, eIdx) => (
                  <div key={entry.wordNumber || eIdx} className="word-def-entry">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                        {entry.wordName}
                      </span>
                      <span className="zhuyin-text" style={{ color: 'var(--color-primary-dark)', fontSize: '1.05rem' }}>
                        {entry.zhuyin}
                      </span>
                      {entry.radical && (
                        <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                          部首：{entry.radical}
                        </span>
                      )}
                      {entry.strokeCount > 0 && (
                        <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                          筆畫：{entry.strokeCount}
                        </span>
                      )}
                    </div>
                    <div className="word-def-text">
                      {entry.definition}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '1rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                  《國語辭典簡編本》暫無「{activeWordDefinition.word}」之詳細釋義條目。
                </div>
              )}
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', textAlign: 'right' }}>
                資料來源：教育部《國語辭典簡編本》
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                style={{ fontSize: '0.85rem', padding: '0.35rem 1rem' }}
                onClick={() => setActiveWordDefinition(null)}
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
