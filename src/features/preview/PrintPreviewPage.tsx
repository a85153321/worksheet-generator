import React, { useEffect, useState, useRef } from 'react'
import { useApp } from '../../app/index'
import {
  buildWorksheet,
  exportWorksheetToDocx,
  lookupCharacterFromDictionary,
  lookupDictionaryEntriesByTerm,
  lookupLookalikeCandidateSuggestions,
  resolveSentenceCandidatesForWords,
  resolveOwnSentencesForWord,
  updateAnalysisResult,
  type WorksheetPage,
  type WorksheetTemplate,
  type WorksheetFont,
  type DictionaryEntry,
} from '../../services'
import {
  createSentenceBlank,
  type ElementaryGrade,
  type AnalysisResult,
  type WordSentenceBlank,
} from '../../domain'
import {
  WorksheetSheet,
  TEMPLATE_NAMES,
} from '../../components/worksheet'
import { WordDefinitionModal } from '../../components/dictionary/WordDefinitionModal'
import { selectReplacementCandidates } from './candidate-selection'

type CandidateKind = 'words' | 'sentences'

function getCandidateText(candidate: unknown): string {
  if (typeof candidate === 'string') return candidate
  if (
    candidate &&
    typeof candidate === 'object' &&
    'text' in candidate &&
    typeof (candidate as { text: unknown }).text === 'string'
  ) {
    return (candidate as { text: string }).text
  }
  return String(candidate ?? '')
}

export const PrintPreviewPage: React.FC = () => {
  const {
    worksheetDoc,
    setWorksheetDoc,
    analysisResult,
    setAnalysisResult,
    worksheetImages,
    selectedTemplate,
    selectedDocxTemplateId,
    navigate,
    selectedGrade,
  } = useApp()

  const previewFont: WorksheetFont =
    (selectedGrade ?? 3) <= 2 ? 'zihi-kai-zhuyin' : 'standard-kai'
  const [isExportingDocx, setIsExportingDocx] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [exportSuccess, setExportSuccess] = useState<string | null>(null)
  const [isFontReminderExpanded, setIsFontReminderExpanded] = useState(false)
  const [isCandidatePanelExpanded, setIsCandidatePanelExpanded] = useState(false)
  const [expandedCharacterIndices, setExpandedCharacterIndices] = useState<Set<number>>(() => new Set())
  const [candidateNotice, setCandidateNotice] = useState<Record<string, string>>({})
  const [isLookalikeGroupPanelExpanded, setIsLookalikeGroupPanelExpanded] = useState(true)
  const [lookalikeSelection, setLookalikeSelection] = useState<Set<string>>(() => new Set())
  const [lookalikeSuggestions, setLookalikeSuggestions] = useState<string[]>([])
  const [lookalikeGroupError, setLookalikeGroupError] = useState<string | null>(null)
  const [lookalikeGroupNotice, setLookalikeGroupNotice] = useState<string | null>(null)
  const sheetsContainerRef = useRef<HTMLDivElement>(null)

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

  const activeTemplate: WorksheetTemplate = worksheetDoc?.template || selectedTemplate
  const isWordSentenceBlankTemplate = activeTemplate === 'word-sentence-blank'
  const isCharacterLookalikeTemplate = activeTemplate === 'character-lookalike-practice'

  const commitAnalysisUpdate = async (updated: AnalysisResult): Promise<boolean> => {
    const result = await updateAnalysisResult(updated)
    if (!result.ok) {
      setLookalikeGroupError(result.error.message)
      return false
    }
    setAnalysisResult(result.value)
    setWorksheetDoc(null)
    return true
  }

  const toggleCharacterExpanded = (index: number) => {
    setExpandedCharacterIndices((previous) => {
      const next = new Set(previous)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  // 自動同步：若尚未由 buildWorksheet 組裝，或當前 worksheetDoc 與已選 selectedTemplate 不一致時，自動呼叫 buildWorksheet
  useEffect(() => {
    if (analysisResult && analysisResult.characters.length > 0) {
      if (
        !worksheetDoc ||
        worksheetDoc.template !== selectedTemplate ||
        worksheetDoc.docxTemplateId !== (selectedDocxTemplateId ?? undefined)
      ) {
        const imageList = Object.values(worksheetImages)
        buildWorksheet(analysisResult, selectedTemplate, {
          images: imageList,
          grade: selectedGrade as ElementaryGrade,
          docxTemplateId: selectedDocxTemplateId ?? undefined,
        }).then((res) => {
          if (res.ok) {
            setWorksheetDoc(res.value)
          } else {
            setExportError(res.error.message)
          }
        })
      }
    }
  }, [selectedTemplate, selectedDocxTemplateId, selectedGrade, analysisResult, worksheetDoc, worksheetImages, setWorksheetDoc])

  const handleSelectTargetWord = async (characterIndex: number, word: string) => {
    if (!analysisResult) return
    const item = analysisResult.characters[characterIndex]
    if (!item) return

    // 如果點選已經選中的語詞，則取消選取
    if (item.wordSentenceBlank?.targetWord === word) {
      await handleClearTargetWord(characterIndex)
      return
    }

    const lookup = lookupCharacterFromDictionary(item.character)
    // 呼叫既有契約 resolveOwnSentencesForWord 取得專屬例句（不 fallback 至通用例句）
    const ownSentences = lookup ? resolveOwnSentencesForWord(lookup, word) : []

    let blankResult: WordSentenceBlank | null = null
    for (const sentence of ownSentences) {
      const blank = createSentenceBlank(sentence, word)
      if (blank) {
        blankResult = blank
        break
      }
    }

    if (!blankResult) {
      setCandidateNotice((previous) => ({
        ...previous,
        [`${characterIndex}-targetWord`]: '此語詞沒有可用的挖空例句，請換一個候選',
      }))
      return
    }

    setCandidateNotice((previous) => {
      const next = { ...previous }
      delete next[`${characterIndex}-targetWord`]
      return next
    })

    const updatedChars = analysisResult.characters.map((char, idx) => {
      if (idx !== characterIndex) return char
      return {
        ...char,
        wordSentenceBlank: blankResult,
      }
    })

    const updated: AnalysisResult = { ...analysisResult, characters: updatedChars }
    await commitAnalysisUpdate(updated)
  }

  const handleClearTargetWord = async (characterIndex: number) => {
    if (!analysisResult) return
    const updatedChars = analysisResult.characters.map((char, idx) => {
      if (idx !== characterIndex) return char
      return {
        ...char,
        wordSentenceBlank: undefined,
      }
    })

    setCandidateNotice((previous) => {
      const next = { ...previous }
      delete next[`${characterIndex}-targetWord`]
      return next
    })

    const updated: AnalysisResult = { ...analysisResult, characters: updatedChars }
    await commitAnalysisUpdate(updated)
  }

  const handleReplaceCandidates = async (characterIndex: number, kind: CandidateKind) => {
    if (!analysisResult) return
    const item = analysisResult.characters[characterIndex]
    if (!item) return

    const lookup = lookupCharacterFromDictionary(item.character)
    const isWords = kind === 'words'
    const wordStrings = item.wordCandidates.map(getCandidateText)
    const currentCandidates = isWords ? wordStrings : item.sentenceCandidates
    const fullCandidates = isWords
      ? lookup?.wordCandidates ?? []
      : lookup
        ? resolveSentenceCandidatesForWords(lookup, wordStrings)
        : []
    const replacement = selectReplacementCandidates(
      fullCandidates,
      currentCandidates,
      isWords ? 3 : 2,
    )
    const noticeKey = `${characterIndex}-${kind}`

    if (!replacement) {
      setCandidateNotice((previous) => ({
        ...previous,
        [noticeKey]: lookup ? '已無其他候選可替換' : '辭典查無這個生字',
      }))
      return
    }

    const updated: AnalysisResult = {
      ...analysisResult,
      characters: analysisResult.characters.map((character, index) => {
        if (index !== characterIndex) return character
        if (!isWords) return { ...character, sentenceCandidates: replacement }

        const linkedSentences = lookup
          ? resolveSentenceCandidatesForWords(lookup, replacement).slice(0, 2)
          : character.sentenceCandidates
        return {
          ...character,
          wordCandidates: replacement,
          sentenceCandidates: linkedSentences,
        }
      }),
    }
    if (!await commitAnalysisUpdate(updated)) return
    setCandidateNotice((previous) => ({
      ...previous,
      [noticeKey]: isWords ? '已換一批語詞，預覽同步更新' : '已換一批例句，預覽同步更新',
    }))
  }

  const assignedLookalikeGroupByCharacter = new Map<string, number>()
  ;(analysisResult?.lookalikeGroups ?? []).forEach((group, groupIndex) => {
    group.characters.forEach((character) => assignedLookalikeGroupByCharacter.set(character, groupIndex))
  })

  const toggleLookalikeCharacter = (character: string) => {
    if (!analysisResult || assignedLookalikeGroupByCharacter.has(character)) return
    setLookalikeGroupError(null)
    setLookalikeGroupNotice(null)
    setLookalikeSelection((previous) => {
      const next = new Set(previous)
      if (next.has(character)) {
        next.delete(character)
      } else {
        if (next.size >= 6) {
          setLookalikeGroupError('每組最多只能選擇 6 個字。')
          return previous
        }
        next.add(character)
        const available = new Set(analysisResult.characters.map((item) => item.character))
        setLookalikeSuggestions(
          lookupLookalikeCandidateSuggestions(character).filter((candidate) => (
            candidate !== character &&
            available.has(candidate) &&
            !assignedLookalikeGroupByCharacter.has(candidate)
          )),
        )
      }
      return next
    })
  }

  const handleConfirmLookalikeGroup = async () => {
    if (!analysisResult) return
    const selected = [...lookalikeSelection]
    if (selected.length < 2 || selected.length > 6) {
      setLookalikeGroupError('請選擇 2 到 6 個字後再確認分組。')
      return
    }
    const available = new Set(analysisResult.characters.map((item) => item.character))
    const missing = selected.filter((character) => !available.has(character))
    if (missing.length > 0) {
      setLookalikeGroupError(`以下字元不在本次教材中：${missing.join('、')}`)
      return
    }
    const assigned = selected.filter((character) => assignedLookalikeGroupByCharacter.has(character))
    if (assigned.length > 0) {
      setLookalikeGroupError(`以下字元已屬於其他組：${assigned.join('、')}`)
      return
    }
    const nextGroups = [
      ...(analysisResult.lookalikeGroups ?? []),
      { id: `lookalike-${Date.now()}`, characters: selected },
    ]
    if (!await commitAnalysisUpdate({ ...analysisResult, lookalikeGroups: nextGroups })) return
    setLookalikeSelection(new Set())
    setLookalikeSuggestions([])
    setLookalikeGroupError(null)
    setLookalikeGroupNotice(`已建立第 ${nextGroups.length} 組：${selected.join('、')}`)
  }

  const handleDeleteLookalikeGroup = async (groupId: string) => {
    if (!analysisResult) return
    const nextGroups = (analysisResult.lookalikeGroups ?? []).filter((group) => group.id !== groupId)
    if (!await commitAnalysisUpdate({ ...analysisResult, lookalikeGroups: nextGroups })) return
    setLookalikeSelection(new Set())
    setLookalikeSuggestions([])
    setLookalikeGroupError(null)
    setLookalikeGroupNotice('已解散分組，原有字元可重新選擇。')
  }

  // 純前端瀏覽器端 Word (.docx) 匯出 (完全在用戶端執行，不呼叫任何外部後端或雲端服務)
  const handleExportDocx = async () => {
    if (activeTemplate === 'character-lookalike-practice') {
      setExportSuccess(null)
      setExportError('此學習單類型尚未提供 Word 範本，請先使用畫面預覽。')
      return
    }
    if (!worksheetDoc) return
    setIsExportingDocx(true)
    setExportError(null)
    setExportSuccess(null)

    try {
      const cleanTitle = (worksheetDoc.title || TEMPLATE_NAMES[activeTemplate] || '學習單').replace(/[\\/:*?"<>|]/g, '_')
      const fileName = `${cleanTitle}.docx`
      await exportWorksheetToDocx(worksheetDoc, fileName, { font: previewFont })
      setExportSuccess(`✅ 已成功於瀏覽器端生成「${fileName}」並開始下載！（純本機 Word 運算，未傳輸至任何外部伺服器）`)
      setTimeout(() => setExportSuccess(null), 6000)
    } catch (err) {
      console.error('DOCX export error:', err)
      setExportError('匯出 Word 檔 (.docx) 時發生錯誤，請確認瀏覽器支援或稍後重試。')
    } finally {
      setIsExportingDocx(false)
    }
  }

  const activeTitle =
    worksheetDoc?.title && worksheetDoc.title !== '範例生字學習單'
      ? worksheetDoc.title
      : (activeTemplate === 'word-sentence-blank'
          ? '語詞例句填空學習單'
          : activeTemplate === 'character-lookalike-practice'
            ? '形近字辨析學習單'
            : '生字注音學習單')

  // 取得 WorksheetDoc 中組裝之頁面陣列（支援多頁），若為空則預設 1 頁
  const pages: WorksheetPage[] = worksheetDoc?.pages && worksheetDoc.pages.length > 0
    ? worksheetDoc.pages
    : [{ pageNumber: 1, blocks: [], sections: [] }]

  return (
    <div>
      {/* 畫面控制列（列印時自動隱藏） */}
      <div className="card no-print" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="card-title">📝 步驟 6：A4 學習單預覽與匯出</h1>
            <p className="card-subtitle">
              已套用「{TEMPLATE_NAMES[activeTemplate] || '標準模板'}」· 國小 {selectedGrade} 年級；本步驟由純前端引擎執行，不會傳送資料到外部服務
            </p>
          </div>
          <div className="btn-group">
            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: '0.65rem 1.35rem', fontSize: '1rem', backgroundColor: '#1d4ed8' }}
              onClick={handleExportDocx}
              disabled={isExportingDocx || !worksheetDoc}
              aria-label="在瀏覽器端本機生成並下載 Word docx 檔案"
            >
              {isExportingDocx ? (
                <>
                  <span className="spinner-sm" aria-hidden="true"></span>
                  <span>正在生成 Word 檔（本機運算中）...</span>
                </>
              ) : (
                '📝 下載 Word 檔 (.docx)'
              )}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('templates')}
            >
              ← 更換模板
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('upload')}
            >
              製作新學習單
            </button>
          </div>
        </div>

        {/* 狀態反饋提示 */}
        {exportSuccess && (
          <div
            className="callout callout-success"
            style={{
              borderColor: 'var(--color-success)',
              backgroundColor: 'var(--color-success-light)',
              color: '#065f46',
              marginTop: '1rem',
            }}
            role="status"
            aria-live="polite"
          >
            {exportSuccess}
          </div>
        )}

        {exportError && (
          <div
            className="callout callout-warning"
            style={{
              borderColor: 'var(--color-danger)',
              backgroundColor: 'var(--color-danger-light)',
              color: '#7f1d1d',
              marginTop: '1rem',
            }}
            role="alert"
          >
            ❌ {exportError}
          </div>
        )}

        {/* 字型安裝與 Word (.docx) 排版提醒區塊（可收折，預設收合） */}
        <section
          className="callout no-print font-reminder-section"
          style={{
            marginTop: '1.25rem',
            padding: isFontReminderExpanded ? '1.1rem 1.25rem' : '0.75rem 1.25rem',
            backgroundColor: '#f8fafc',
            border: '1.5px solid #cbd5e1',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.88rem',
            lineHeight: '1.65',
            color: '#334155',
            transition: 'padding 0.2s ease',
          }}
          aria-label="學習單字型安裝與 Word 排版提醒"
        >
          <div
            role="button"
            tabIndex={0}
            aria-expanded={isFontReminderExpanded}
            onClick={() => setIsFontReminderExpanded((prev) => !prev)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setIsFontReminderExpanded((prev) => !prev)
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              userSelect: 'none',
              marginBottom: isFontReminderExpanded ? '0.75rem' : 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.1rem' }}>💡</span>
              <strong style={{ fontSize: '0.98rem', color: '#0f172a' }}>
                學習單字型安裝與 Word (.docx) 排版提醒
              </strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.82rem' }}>
              <span>{isFontReminderExpanded ? '點擊收合' : '點擊展開'}</span>
              <span aria-hidden="true" style={{ fontSize: '0.75rem' }}>
                {isFontReminderExpanded ? '▼' : '▶'}
              </span>
            </div>
          </div>

          {isFontReminderExpanded && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {/* 1. 預覽與 Word 差異說明 */}
              <p style={{ margin: 0 }}>
                <strong>📢 顯示與 Word 匯出說明：</strong>
                本系統在<strong>「瀏覽器預覽」</strong>、<strong>「瀏覽器列印」</strong>與<strong>「下載 PDF 學習單」</strong>時，均已內建打包完整 WebFont 字型，使用者電腦<strong>無需額外安裝字型即可 100% 正確顯示</strong>。但若選擇<strong>「下載 Word 檔 (.docx)」</strong>，因 Word 文件本身不內嵌字型檔案，若收件者（其他老師或家長）電腦上未安裝同一套字型，Word 開啟時系統會自動以預設字型替換，注音或方框排版可能會發生跑版或錯位。
              </p>

              {/* 2. 三款字型與官方下載連結 */}
              <div style={{ margin: 0 }}>
                <strong>🔗 三款字型官方開源下載連結：</strong>
                字型源自開源專案 <strong>ButTaiwan/bpmfvs</strong>（採 Apache 2.0 / SIL OFL 開源授權，可免費商用、自由嵌入與免費下載）：
                <ul style={{ margin: '0.35rem 0 0.35rem 1.25rem', padding: 0 }}>
                  <li>
                    <strong>標楷體（標準字體）</strong>：Windows 系統已內建「標楷體」；macOS / Linux 使用者若無，可使用系統楷體或至政府資料開放平臺下載「全字庫正楷體」。
                  </li>
                  <li>
                    <strong>標楷有注音</strong>（字型檔：<code>BpmfZihiKaiStd-Regular.ttf</code>，安裝後系統字型名稱：<code>ㄅ字嗨注音標楷 Regular</code>）
                  </li>
                  <li>
                    <strong>純注音</strong>（字型檔：<code>BpmfZihiOnly-R.ttf</code>，安裝後系統字型名稱：<code>ㄅ字嗨注音而已 R</code>）
                  </li>
                </ul>
                <div style={{ marginTop: '0.35rem' }}>
                  👉 前往官方下載：
                  <a
                    href="https://github.com/ButTaiwan/bpmfvs/releases"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#0284c7', textDecoration: 'underline', fontWeight: 600, marginLeft: '0.25rem' }}
                  >
                    ButTaiwan/bpmfvs GitHub Releases 官方發布頁面 ↗
                  </a>
                  <span style={{ color: '#64748b', fontSize: '0.82rem', marginLeft: '0.4rem' }}>
                    （進入 Releases 頁面後於 Assets 區塊下載對應的 zip 壓縮檔解壓縮即可取得字型檔）
                  </span>
                </div>
              </div>

              {/* 3. 簡短安裝步驟 */}
              <div style={{ margin: 0 }}>
                <strong>🛠️ 簡短安裝步驟：</strong>
                <div style={{ paddingLeft: '1rem', marginTop: '0.2rem' }}>
                  • <strong>Windows 使用者</strong>：下載解壓縮後，對 <code>.ttf</code> 或 <code>.otf</code> 字型檔案按滑鼠右鍵，點選<strong>「安裝」</strong>（或「為所有使用者安裝」）。<br />
                  • <strong>Mac 使用者</strong>：下載解壓縮後，連按兩下（雙擊）字型檔案，在彈出的「字體簿（Font Book）」視窗中點擊<strong>「安裝字體」</strong>。
                </div>
              </div>

              {/* 4. 安全性說明 */}
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b', borderTop: '1px dashed #e2e8f0', paddingTop: '0.5rem' }}>
                <strong>🛡️ 安全性說明：</strong>
                這是開源專案在 GitHub 上公開發布的字型檔案（純字型向量格式，不是可執行程式），字型檔本身不具備執行程式碼能力，安裝風險等同於作業系統一般安裝字型的安全性。建議只從上述 GitHub 官方 Release 連結下載，確保取得未受竄改之原始檔案。
              </p>
            </div>
          )}
        </section>

        {analysisResult && analysisResult.characters.length > 0 && (
          <section
            className={`preview-candidate-panel ${isCandidatePanelExpanded ? 'is-expanded' : 'is-collapsed'}`}
            aria-labelledby="preview-candidate-heading"
          >
            <button
              type="button"
              className="preview-candidate-panel__header"
              onClick={() => setIsCandidatePanelExpanded((prev) => !prev)}
              aria-expanded={isCandidatePanelExpanded}
              aria-controls="preview-candidate-content"
              aria-label={`匯出前候選內容確認，共 ${analysisResult.characters.length} 個生字，目前${isCandidatePanelExpanded ? '已展開' : '已收合'}，點擊切換`}
            >
              <div className="preview-candidate-panel__title-group">
                <span className="preview-candidate-panel__icon" aria-hidden="true">📋</span>
                <h2 id="preview-candidate-heading" className="preview-candidate-panel__title">
                  匯出前候選內容確認 ({analysisResult.characters.length} 個生字)
                </h2>
                <span className="preview-candidate-panel__badge">
                  語詞最多 3 個・例句最多 2 則
                </span>
              </div>
              <div className="preview-candidate-panel__toggle">
                <span className="preview-candidate-panel__toggle-text">
                  {isCandidatePanelExpanded ? '點擊收合' : '點擊展開'}
                </span>
                <span className="preview-candidate-panel__arrow" aria-hidden="true">
                  {isCandidatePanelExpanded ? '▼' : '▶'}
                </span>
              </div>
            </button>

            {isCandidatePanelExpanded && (
              <div id="preview-candidate-content" className="preview-candidate-panel__body">
                <p className="preview-candidate-panel__desc">
                  可直接替換最終學習單使用的語詞與例句；每次只會從本機教育部辭典候選中抽選。
                </p>

                <div className="preview-candidate-list" role="region" aria-label="生字候選內容折疊清單">
              {analysisResult.characters.map((item, characterIndex) => {
                const isExpanded = expandedCharacterIndices.has(characterIndex)
                return (
                  <article
                    className={`preview-candidate-item ${isExpanded ? 'is-expanded' : 'is-collapsed'}`}
                    key={`${item.character}-${characterIndex}`}
                  >
                    <button
                      type="button"
                      className="preview-candidate-summary"
                      onClick={() => toggleCharacterExpanded(characterIndex)}
                      aria-expanded={isExpanded}
                      aria-controls={`preview-candidate-details-${characterIndex}`}
                      aria-label={`生字「${item.character}」候選內容，目前${isExpanded ? '已展開' : '已收合'}，點擊切換`}
                    >
                      <div className="preview-candidate-summary__title">
                        <div className="preview-candidate-character" aria-hidden="true">
                          {item.character}
                        </div>
                        <span className="preview-candidate-label">
                          生字「{item.character}」
                        </span>
                      </div>
                      <div className="preview-candidate-arrow-wrap">
                        <span className="preview-candidate-toggle-hint">
                          {isExpanded ? '點擊收合' : '點擊展開'}
                        </span>
                        <span className="preview-candidate-arrow" aria-hidden="true">
                          {isExpanded ? '▼' : '▶'}
                        </span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div
                        id={`preview-candidate-details-${characterIndex}`}
                        className="preview-candidate-details"
                      >
                        <div className="preview-candidate-groups">
                          <div className="preview-candidate-group">
                            <div>
                              <strong>語詞候選</strong>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.35rem' }}>
                                {item.wordCandidates.slice(0, 3).map(getCandidateText).filter(Boolean).length > 0 ? (
                                  item.wordCandidates
                                    .slice(0, 3)
                                    .map(getCandidateText)
                                    .filter(Boolean)
                                    .map((word) => {
                                      const isTargetWord = isWordSentenceBlankTemplate && item.wordSentenceBlank?.targetWord === word
                                      if (!isWordSentenceBlankTemplate) {
                                        return (
                                          <button
                                            key={word}
                                            type="button"
                                            className="word-candidate-link"
                                            onClick={() => handleViewWordDefinition(word)}
                                            title={`查看「${word}」教育部詞義`}
                                          >
                                            <span>{word}</span>
                                            <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>📖</span>
                                          </button>
                                        )
                                      }
                                      return (
                                        <div
                                          key={word}
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            backgroundColor: isTargetWord ? '#eff6ff' : '#f8fafc',
                                            border: isTargetWord ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                                          }}
                                        >
                                          <button
                                            type="button"
                                            className="word-candidate-link"
                                            onClick={() => handleViewWordDefinition(word)}
                                            title={`查看「${word}」教育部詞義`}
                                          >
                                            <span>{word}</span>
                                            <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>📖</span>
                                          </button>
                                          <button
                                            type="button"
                                            className={`btn ${isTargetWord ? 'btn-primary' : 'btn-secondary'}`}
                                            style={{
                                              fontSize: '0.72rem',
                                              padding: '1px 6px',
                                              minHeight: 'auto',
                                              lineHeight: '1.2',
                                              borderRadius: '3px',
                                            }}
                                            onClick={() => handleSelectTargetWord(characterIndex, word)}
                                            title={isTargetWord ? '點擊取消填空語詞設定' : `將「${word}」指定為填空題語詞`}
                                            aria-label={isTargetWord ? `取消「${word}」設為填空語詞` : `將「${word}」設為填空語詞`}
                                          >
                                            {isTargetWord ? '✓ 已設為填空' : '設為填空'}
                                          </button>
                                        </div>
                                      )
                                    })
                                ) : (
                                  <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
                                    （目前沒有語詞）
                                  </p>
                                )}
                              </div>
                            </div>
                            {isWordSentenceBlankTemplate && item.wordSentenceBlank && (
                              <div
                                style={{
                                  margin: '0.4rem 0',
                                  padding: '0.4rem 0.65rem',
                                  backgroundColor: '#f0fdf4',
                                  border: '1px solid #bbf7d0',
                                  borderRadius: '4px',
                                  fontSize: '0.82rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  flexWrap: 'wrap',
                                  gap: '0.5rem',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                                  <span style={{ color: '#166534', fontWeight: 700 }}>🎯 填空題：</span>
                                  <span style={{ color: '#15803d', fontWeight: 600 }}>{`【${item.wordSentenceBlank.targetWord}】`}</span>
                                  <span style={{ color: '#374151' }}>
                                    {item.wordSentenceBlank.sentenceBeforeBlank}
                                    <strong style={{ borderBottom: '2px solid #16a34a', padding: '0 6px', color: '#166534' }}>
                                      {'（\u3000\u3000）'}
                                    </strong>
                                    {item.wordSentenceBlank.sentenceAfterBlank}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  style={{ fontSize: '0.75rem', padding: '1px 6px', minHeight: 'auto' }}
                                  onClick={() => handleClearTargetWord(characterIndex)}
                                  title="清除此生字的填空題目設定"
                                >
                                  ✕ 取消填空
                                </button>
                              </div>
                            )}
                            {isWordSentenceBlankTemplate && candidateNotice[`${characterIndex}-targetWord`] && (
                              <div
                                className="callout callout-warning"
                                style={{
                                  margin: '0.35rem 0',
                                  padding: '0.35rem 0.65rem',
                                  fontSize: '0.82rem',
                                  borderColor: '#f87171',
                                  backgroundColor: '#fef2f2',
                                  color: '#991b1b',
                                }}
                                role="alert"
                              >
                                ⚠️ {candidateNotice[`${characterIndex}-targetWord`]}
                              </div>
                            )}
                            <button
                              type="button"
                              className="btn btn-secondary preview-candidate-button"
                              onClick={() => handleReplaceCandidates(characterIndex, 'words')}
                              aria-label={`為「${item.character}」換一批語詞候選`}
                            >
                              🎲 換一批語詞
                            </button>
                            {candidateNotice[`${characterIndex}-words`] && (
                              <small role="status">{candidateNotice[`${characterIndex}-words`]}</small>
                            )}
                          </div>

                          <div className="preview-candidate-group">
                            <div>
                              <strong>例句候選</strong>
                              {item.sentenceCandidates.length > 0 ? (
                                <ol>
                                  {item.sentenceCandidates.slice(0, 2).map((sentence, sentenceIndex) => (
                                    <li key={`${sentence}-${sentenceIndex}`}>{sentence}</li>
                                  ))}
                                </ol>
                              ) : (
                                <p>（目前沒有例句）</p>
                              )}
                            </div>
                            <button
                              type="button"
                              className="btn btn-secondary preview-candidate-button"
                              onClick={() => handleReplaceCandidates(characterIndex, 'sentences')}
                              aria-label={`為「${item.character}」換一批例句候選`}
                            >
                              🎲 換一批例句
                            </button>
                            {candidateNotice[`${characterIndex}-sentences`] && (
                              <small role="status">{candidateNotice[`${characterIndex}-sentences`]}</small>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                )})}
              </div>
            </div>
          )}
        </section>
      )}

      {isCharacterLookalikeTemplate && analysisResult && analysisResult.characters.length > 0 && (
        <section
          className={`preview-candidate-panel ${isLookalikeGroupPanelExpanded ? 'is-expanded' : 'is-collapsed'}`}
          aria-labelledby="lookalike-group-heading"
          style={{ marginTop: '1rem' }}
        >
          <button
            type="button"
            className="preview-candidate-panel__header"
            onClick={() => setIsLookalikeGroupPanelExpanded((value) => !value)}
            aria-expanded={isLookalikeGroupPanelExpanded}
            aria-controls="lookalike-group-content"
          >
            <div className="preview-candidate-panel__title-group">
              <span className="preview-candidate-panel__icon" aria-hidden="true">🔎</span>
              <h2 id="lookalike-group-heading" className="preview-candidate-panel__title">形近字分組</h2>
              <span className="preview-candidate-panel__badge">每組 2–6 字・由教師確認</span>
            </div>
            <div className="preview-candidate-panel__toggle">
              <span className="preview-candidate-panel__toggle-text">
                {isLookalikeGroupPanelExpanded ? '點擊收合' : '點擊展開'}
              </span>
              <span className="preview-candidate-panel__arrow" aria-hidden="true">
                {isLookalikeGroupPanelExpanded ? '▼' : '▶'}
              </span>
            </div>
          </button>

          {isLookalikeGroupPanelExpanded && (
            <div id="lookalike-group-content" className="preview-candidate-panel__body">
              <p className="preview-candidate-panel__desc">
                勾選本次教材中的生字，確認後才會建立分組。候選建議僅供參考，不會自動成組。
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem', marginBottom: '0.9rem' }}>
                {analysisResult.characters.map((item) => {
                  const groupIndex = assignedLookalikeGroupByCharacter.get(item.character)
                  const isAssigned = groupIndex !== undefined
                  const isSelected = lookalikeSelection.has(item.character)
                  return (
                    <button
                      key={item.character}
                      type="button"
                      className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                      disabled={isAssigned}
                      onClick={() => toggleLookalikeCharacter(item.character)}
                      aria-pressed={isSelected}
                      title={isAssigned ? `已屬於第 ${groupIndex + 1} 組` : `${isSelected ? '取消選取' : '選取'}「${item.character}」`}
                      style={{ minWidth: '5.5rem' }}
                    >
                      {isSelected ? '✓ ' : ''}{item.character}
                      {isAssigned && <small style={{ display: 'block' }}>第 {groupIndex + 1} 組</small>}
                    </button>
                  )
                })}
              </div>

              <div style={{ padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '8px', background: '#f8fafc' }}>
                <strong>目前選取：{Array.from(lookalikeSelection).join('、') || '尚未選取'}（{lookalikeSelection.size}/6）</strong>
                {lookalikeSuggestions.length > 0 && (
                  <div style={{ marginTop: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span>你可能還想加：</span>
                    {lookalikeSuggestions.map((character) => (
                      <button
                        key={character}
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => toggleLookalikeCharacter(character)}
                        disabled={lookalikeSelection.size >= 6}
                        style={{ padding: '0.15rem 0.55rem', minHeight: 'auto' }}
                      >
                        ＋{character}
                      </button>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.55rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-primary" onClick={handleConfirmLookalikeGroup}>
                    確認建立分組
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setLookalikeSelection(new Set())
                      setLookalikeSuggestions([])
                      setLookalikeGroupError(null)
                    }}
                  >
                    清除選取
                  </button>
                </div>
              </div>

              {lookalikeGroupError && <div className="callout callout-warning" role="alert" style={{ marginTop: '0.75rem' }}>⚠️ {lookalikeGroupError}</div>}
              {lookalikeGroupNotice && <div className="callout callout-info" role="status" style={{ marginTop: '0.75rem' }}>✅ {lookalikeGroupNotice}</div>}

              {(analysisResult.lookalikeGroups ?? []).length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <strong>已建立的分組</strong>
                  <div style={{ display: 'grid', gap: '0.55rem', marginTop: '0.5rem' }}>
                    {(analysisResult.lookalikeGroups ?? []).map((group, groupIndex) => (
                      <div key={group.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                        <span><strong>第 {groupIndex + 1} 組：</strong>{group.characters.join('、')}</span>
                        <button type="button" className="btn btn-secondary" onClick={() => handleDeleteLookalikeGroup(group.id)}>
                          解散此組
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}
      </div>

      {/* 僅供參考提示（所有模板均適用） */}
      <div
        className="callout callout-info preview-disclaimer-callout"
        style={{
          maxWidth: '900px',
          margin: '0 auto 1.5rem auto',
          textAlign: 'center',
          backgroundColor: 'var(--color-bg-secondary, #f8fafc)',
          borderColor: 'var(--color-border, #cbd5e1)',
          color: 'var(--color-text-muted, #64748b)',
          fontSize: '0.92rem',
        }}
        role="note"
      >
        📌 此為預覽畫面，實際版面請以下載的 Word 文件為準
      </div>

      {/* A4 紙張預覽區（支援多頁依序呈現） */}
      <div ref={sheetsContainerRef} className="a4-preview-container">
        {pages.map((page) => (
          <WorksheetSheet
            key={page.pageNumber}
            page={page}
            totalPages={pages.length}
            template={activeTemplate}
            title={activeTitle}
            previewFont={previewFont}
            characters={analysisResult?.characters}
            images={worksheetImages}
          />
        ))}
      </div>
      {/* 語詞釋義彈窗 (教育部國語辭典簡編本) */}
      <WordDefinitionModal
        definition={activeWordDefinition}
        onClose={() => setActiveWordDefinition(null)}
      />
    </div>
  )
}
