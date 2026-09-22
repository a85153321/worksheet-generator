import React, { useEffect, useState, useRef } from 'react'
import { useApp } from '../../app/index'
import {
  buildWorksheet,
  exportWorksheetToDocx,
  lookupCharacterFromDictionary,
  resolveSentenceCandidatesForWords,
  type WorksheetPage,
  type WorksheetTemplate,
  type WorksheetFont,
} from '../../services'
import type { ElementaryGrade } from '../../domain'
import {
  WorksheetSheet,
  TEMPLATE_NAMES,
} from '../../components/worksheet'
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
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isExportingDocx, setIsExportingDocx] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [exportSuccess, setExportSuccess] = useState<string | null>(null)
  const [isFontReminderExpanded, setIsFontReminderExpanded] = useState(false)
  const [expandedCharacterIndices, setExpandedCharacterIndices] = useState<Set<number>>(() => new Set())
  const [candidateNotice, setCandidateNotice] = useState<Record<string, string>>({})
  const sheetsContainerRef = useRef<HTMLDivElement>(null)

  const activeTemplate: WorksheetTemplate = worksheetDoc?.template || selectedTemplate

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
        (selectedTemplate === 'reference-character-practice' && worksheetDoc.docxTemplateId !== selectedDocxTemplateId)
      ) {
        const imageList = Object.values(worksheetImages)
        buildWorksheet(analysisResult, selectedTemplate, {
          images: imageList,
          grade: selectedGrade as ElementaryGrade,
          docxTemplateId: selectedTemplate === 'reference-character-practice'
            ? selectedDocxTemplateId ?? undefined
            : undefined,
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

  const handlePrint = () => {
    window.print()
  }

  const handleReplaceCandidates = (characterIndex: number, kind: CandidateKind) => {
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

    setAnalysisResult({
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
    })
    setWorksheetDoc(null)
    setCandidateNotice((previous) => ({
      ...previous,
      [noticeKey]: isWords ? '已換一批語詞，預覽同步更新' : '已換一批例句，預覽同步更新',
    }))
  }

  // 純前端瀏覽器端 PDF 匯出 (完全在用戶端執行，不呼叫任何外部 API 或雲端服務)
  const handleExportPdf = async () => {
    if (!sheetsContainerRef.current) return
    const sheetElements = sheetsContainerRef.current.querySelectorAll<HTMLElement>('.a4-sheet')
    if (sheetElements.length === 0) return

    setIsExportingPdf(true)
    setExportError(null)
    setExportSuccess(null)

    try {
      // 動態引入 jspdf 與 html2canvas，維持純前端本機輸出。
      const { jsPDF } = await import('jspdf')
      const html2canvasModule = await import('html2canvas')
      const html2canvas = html2canvasModule.default || html2canvasModule

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      for (let i = 0; i < sheetElements.length; i++) {
        const sheetEl = sheetElements[i]
        // 擷取高解析度 canvas (scale: 2)
        const canvas = await html2canvas(sheetEl, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: sheetEl.scrollWidth || 794,
        })

        const imgData = canvas.toDataURL('image/jpeg', 0.95)
        if (i > 0) {
          pdf.addPage('a4', 'portrait')
        }
        // A4 標準規格為 210mm x 297mm
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST')
      }

      const cleanTitle = (worksheetDoc?.title || TEMPLATE_NAMES[activeTemplate] || '學習單').replace(/[\\/:*?"<>|]/g, '_')
      const fileName = `${cleanTitle}.pdf`
      pdf.save(fileName)

      setExportSuccess(`✅ 已成功於瀏覽器端生成「${fileName}」並開始下載！（純本機運算，未傳輸至任何外部伺服器）`)
      setTimeout(() => setExportSuccess(null), 6000)
    } catch (err) {
      console.error('PDF export error:', err)
      setExportError('匯出 PDF 時發生錯誤，請確認瀏覽器支援或改用「🖨️ 瀏覽器列印」另存 PDF。')
    } finally {
      setIsExportingPdf(false)
    }
  }

  // 純前端瀏覽器端 Word (.docx) 匯出 (完全在用戶端執行，不呼叫任何外部後端或雲端服務)
  const handleExportDocx = async () => {
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
      : activeTemplate === 'reference-character-practice'
        ? '生字注音學習單'
        : TEMPLATE_NAMES[activeTemplate] || '學習單'

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
            <h1 className="card-title">🖨️ 步驟 6：A4 學習單預覽、列印與匯出</h1>
            <p className="card-subtitle">
              已套用「{TEMPLATE_NAMES[activeTemplate] || '標準模板'}」· 國小 {selectedGrade} 年級；本步驟由純前端引擎執行，不會傳送資料到外部服務
            </p>
          </div>
          <div className="btn-group">
            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: '0.65rem 1.35rem', fontSize: '1rem' }}
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              aria-label="在瀏覽器端本機生成並下載 PDF 檔案"
            >
              {isExportingPdf ? (
                <>
                  <span className="spinner-sm" aria-hidden="true"></span>
                  <span>正在生成 PDF（本機運算中）...</span>
                </>
              ) : (
                '📥 下載 PDF 學習單'
              )}
            </button>
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
              style={{ padding: '0.65rem 1.2rem', fontSize: '1rem' }}
              onClick={handlePrint}
              aria-label="開啟系統列印視窗，可直接列印或另存為 PDF"
            >
              🖨️ 瀏覽器列印
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
          <section className="preview-candidate-panel" aria-labelledby="preview-candidate-heading">
            <div className="preview-candidate-panel__heading">
              <div>
                <h2 id="preview-candidate-heading">匯出前候選內容確認</h2>
                <p>可直接替換最終學習單使用的語詞與例句；每次只會從本機教育部辭典候選中抽選。</p>
              </div>
              <span>語詞最多 3 個・例句最多 2 則</span>
            </div>

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
                              <p>
                                {item.wordCandidates
                                  .slice(0, 3)
                                  .map(getCandidateText)
                                  .filter(Boolean)
                                  .join('、') || '（目前沒有語詞）'}
                              </p>
                            </div>
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
                )
              })}
            </div>
          </section>
        )}
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
    </div>
  )
}
