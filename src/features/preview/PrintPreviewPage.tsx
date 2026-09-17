import React, { useEffect, useState, useRef } from 'react'
import { useApp } from '../../app/index'
import type { CharacterAnalysis } from '../../domain'
import { VerticalZhuyin, TianzigeWithZhuyin } from '../../components/VerticalZhuyin'
import {
  buildWorksheet,
  exportWorksheetToDocx,
  type WorksheetSection,
  type CharacterWorksheetSection,
  type WordWorksheetSection,
  type SentenceWorksheetSection,
  type PictureWorksheetSection,
  type WorksheetPage,
  type WorksheetTemplate,
} from '../../services'

export const PrintPreviewPage: React.FC = () => {
  const {
    worksheetDoc,
    setWorksheetDoc,
    analysisResult,
    worksheetImages,
    selectedTemplate,
    navigate,
    selectedGrade,
    includeZhuyin,
    setIncludeZhuyin,
  } = useApp()

  const [previewFont, setPreviewFont] = useState<'standard' | 'bopomofo'>(
    (selectedGrade ?? 3) <= 2 ? 'bopomofo' : 'standard'
  )
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isExportingDocx, setIsExportingDocx] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [exportSuccess, setExportSuccess] = useState<string | null>(null)
  const sheetsContainerRef = useRef<HTMLDivElement>(null)

  const activeTemplate: WorksheetTemplate = worksheetDoc?.template || selectedTemplate

  const templateNameMap: Record<WorksheetTemplate, string> = {
    'character-practice': '生字田字格練習單',
    'word-practice': '詞語積木擴展單',
    'sentence-practice': '句型仿寫應用單',
    'picture-practice': '看圖識字練習單',
  }

  // 自動同步：若尚未由 buildWorksheet 組裝，或當前 worksheetDoc 與已選 selectedTemplate 不一致時，自動呼叫 buildWorksheet
  useEffect(() => {
    if (analysisResult && analysisResult.characters.length > 0) {
      if (!worksheetDoc || worksheetDoc.template !== selectedTemplate) {
        const imageList = Object.values(worksheetImages)
        buildWorksheet(analysisResult, selectedTemplate, { images: imageList }).then((res) => {
          if (res.ok) {
            setWorksheetDoc(res.value)
          } else {
            setExportError(res.error.message)
          }
        })
      }
    }
  }, [selectedTemplate, analysisResult, worksheetDoc, worksheetImages, setWorksheetDoc])

  const handlePrint = () => {
    window.print()
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

      const cleanTitle = (worksheetDoc?.title || templateNameMap[activeTemplate] || '學習單').replace(/[\\/:*?"<>|]/g, '_')
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
      const cleanTitle = (worksheetDoc.title || templateNameMap[activeTemplate] || '學習單').replace(/[\\/:*?"<>|]/g, '_')
      const fileName = `${cleanTitle}.docx`
      await exportWorksheetToDocx(worksheetDoc, fileName)
      setExportSuccess(`✅ 已成功於瀏覽器端生成「${fileName}」並開始下載！（純本機 Word 運算，未傳輸至任何外部伺服器）`)
      setTimeout(() => setExportSuccess(null), 6000)
    } catch (err) {
      console.error('DOCX export error:', err)
      setExportError('匯出 Word 檔 (.docx) 時發生錯誤，請確認瀏覽器支援或稍後重試。')
    } finally {
      setIsExportingDocx(false)
    }
  }

  const activeTitle = worksheetDoc?.title || templateNameMap[activeTemplate] || '學習單'

  // 取得 WorksheetDoc 中組裝之頁面陣列（支援多頁），若為空則預設 1 頁
  const pages: WorksheetPage[] = worksheetDoc?.pages && worksheetDoc.pages.length > 0
    ? worksheetDoc.pages
    : [{ pageNumber: 1, blocks: [], sections: [] }]

  // 備用 characters（若 sections 尚未建立或非同步中）
  const fallbackCharacters: CharacterAnalysis[] = analysisResult?.characters || [
    {
      character: '學',
      zhuyin: 'ㄒㄩㄝˊ',
      radical: '子',
      strokeCount: 16,
      wordCandidates: ['學校', '學習', '學生'],
      sentenceCandidates: ['我每天到學校學習新知識。'],
      confidence: 0.96,
      source: { page: 1, block: '第一段' },
      editableState: { status: 'confirmed', isEditable: true, needsReview: false },
    },
    {
      character: '習',
      zhuyin: 'ㄒㄧˊ',
      radical: '羽',
      strokeCount: 11,
      wordCandidates: ['學習', '練習', '習慣'],
      sentenceCandidates: ['多練習可以讓生字寫得更漂亮。'],
      confidence: 0.92,
      source: { page: 1, block: '第一段' },
      editableState: { status: 'confirmed', isEditable: true, needsReview: false },
    },
    {
      character: '一',
      zhuyin: 'ㄧ',
      radical: '一',
      strokeCount: 1,
      wordCandidates: ['一起', '一定', '一樣', '第一'],
      sentenceCandidates: ['我們一起到公園玩耍。', '只要努力練習，一定能把字寫好。', '大家都有著一樣的愛心。'],
      confidence: 0.98,
      source: { page: 1, block: '第一段' },
      editableState: { status: 'confirmed', isEditable: true, needsReview: false },
    },
  ]

  // 輔助函式：取得生字的完整資訊
  const findCharacterData = (char: string): CharacterAnalysis | undefined => {
    return fallbackCharacters.find((c) => c.character === char)
  }

  // 1. 渲染生字田字格練習單 (character-practice)
  const renderCharacterPractice = (pageSections: WorksheetSection[]) => {
    const charSections = pageSections.filter((s): s is CharacterWorksheetSection => s.kind === 'character')
    const items = charSections.length > 0
      ? charSections.map((s) => {
          const detail = findCharacterData(s.item.character)
          return {
            character: s.item.character,
            zhuyin: s.item.zhuyin,
            radical: s.item.radical,
            strokeCount: s.item.strokeCount,
            wordCandidates: detail?.wordCandidates || [],
          }
        })
      : fallbackCharacters.map((c) => ({
          character: c.character,
          zhuyin: c.zhuyin,
          radical: c.radical,
          strokeCount: c.strokeCount,
          wordCandidates: c.wordCandidates,
        }))

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="sheet-instruction-banner">
          <strong>【壹、生字筆順與田字格習寫】</strong>{' '}
          {includeZhuyin
            ? '先讀注音與部首，再依正確筆順在田字格內端正書寫。'
            : '觀察字形與部首，再依正確筆順在田字格內端正書寫。'}
        </div>

        {items.map((item, idx) => (
          <section key={`${item.character}-${idx}`} className="sheet-char-card">
            <div className="sheet-char-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
                  生字第 {idx + 1} 題：【 {item.character} 】
                </span>
                <span className="tag tag-info" style={{ fontSize: '11px', padding: '2px 8px' }}>
                  部首：{item.radical || '—'}
                </span>
                <span className="tag tag-info" style={{ fontSize: '11px', padding: '2px 8px' }}>
                  筆畫：{item.strokeCount || '—'} 畫
                </span>
              </div>
              {includeZhuyin && Boolean(item.zhuyin && item.zhuyin.trim()) && (
                <div style={{ fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>讀音：</span>
                  <VerticalZhuyin character={item.character} zhuyin={item.zhuyin} size="md" />
                </div>
              )}
            </div>

            <div className="sheet-char-grid-row">
              {/* 示範大格（國字在田字格內，標準直式注音位於右側注音欄；若 includeZhuyin 為 false 則不渲染右側注音欄，不留空位） */}
              <TianzigeWithZhuyin
                character={item.character}
                zhuyin={item.zhuyin}
                isDemonstration
                showZhuyin={includeZhuyin}
              />

              {/* 1 格描字格 */}
              <TianzigeWithZhuyin
                character={item.character}
                zhuyin={item.zhuyin}
                isTracing
                showZhuyin={false}
              />

              {/* 6 格空白田字格練習 */}
              {Array.from({ length: 6 }).map((_, boxIdx) => (
                <TianzigeWithZhuyin
                  key={boxIdx}
                  character=""
                  zhuyin=""
                  practiceNumber={boxIdx + 1}
                />
              ))}
            </div>

            <div style={{ fontSize: '13px', color: '#334155', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
              <strong>【常用詞語造詞參考】：</strong>
              <span>
                {item.wordCandidates && item.wordCandidates.length > 0
                  ? item.wordCandidates.join('、')
                  : '________________、________________'}
              </span>
            </div>
          </section>
        ))}
      </div>
    )
  }

  // 2. 渲染詞語積木擴展單 (word-practice)
  const renderWordPractice = (pageSections: WorksheetSection[]) => {
    const wordSections = pageSections.filter((s): s is WordWorksheetSection => s.kind === 'word')
    const items = wordSections.length > 0
      ? wordSections.map((s) => {
          const detail = findCharacterData(s.item.character)
          return {
            character: s.item.character,
            zhuyin: detail?.zhuyin || '',
            words: s.item.words,
          }
        })
      : fallbackCharacters.map((c) => ({
          character: c.character,
          zhuyin: c.zhuyin,
          words: c.wordCandidates.map((text) => ({ text, practiceLineCount: 1 })),
        }))

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="sheet-instruction-banner">
          <strong>【貳、詞語積木擴展與習寫】</strong> 讀一讀詞語積木，在書寫格端正寫一次，並完成延伸造詞。
        </div>

        {items.map((item, idx) => (
          <section key={`${item.character}-${idx}`} className="sheet-word-card">
            <div className="sheet-word-char-header">
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  fontWeight: 700,
                  fontFamily: 'inherit',
                }}
              >
                {item.character}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                  生字核心：【 {item.character} 】{includeZhuyin && item.zhuyin && item.zhuyin.trim() ? `（${item.zhuyin}）` : ''}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  請依序練習以下生詞，並在右側空白橫線練習擴詞：
                </div>
              </div>
            </div>

            <div className="sheet-word-list">
              {item.words.map((w, wIdx) => (
                <div key={wIdx} className="sheet-word-item">
                  <div className="sheet-word-badge">
                    {w.text}
                  </div>

                  {/* 為詞語中的每個字提供習寫田字格 */}
                  <div className="sheet-word-boxes">
                    {Array.from(w.text).map((c, cIdx) => (
                      <div
                        key={cIdx}
                        className="sheet-tian-grid sm"
                        style={{ width: '42px', height: '42px' }}
                        aria-label={`詞語習寫格：${c}`}
                      ></div>
                    ))}
                  </div>

                  {/* 擴詞練習橫線 */}
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#475569', whiteSpace: 'nowrap' }}>
                      延伸造詞：
                    </span>
                    <div className="sheet-word-line"></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    )
  }

  // 3. 渲染句型仿寫應用單 (sentence-practice)
  const renderSentencePractice = (pageSections: WorksheetSection[]) => {
    const sentenceSections = pageSections.filter((s): s is SentenceWorksheetSection => s.kind === 'sentence')
    const items = sentenceSections.length > 0
      ? sentenceSections.map((s) => ({
          character: s.item.character,
          sentences: s.item.sentences,
        }))
      : fallbackCharacters.map((c) => ({
          character: c.character,
          sentences: c.sentenceCandidates.map((text) => ({ text, answerLineCount: 2 })),
        }))

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="sheet-instruction-banner">
          <strong>【參、句型仿寫與情境造句】</strong> 細讀課文情境教學例句，分析句型結構，並在橫線上仿寫出完整通順的句子。
        </div>

        {items.map((item, idx) => (
          <section key={`${item.character}-${idx}`} className="sheet-sentence-card">
            <div className="sheet-sentence-header">
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#166534' }}>
                生字造句應用：【 {item.character} 】
              </span>
              <span className="sheet-score-box">教師評閱：[ 優 ． 良 ． 可 ] 簽章：_______</span>
            </div>

            {item.sentences.map((s, sIdx) => (
              <div key={sIdx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="sheet-sentence-example">
                  <strong>📖 課文情境例句：</strong>
                  <span>{s.text}</span>
                </div>

                <div className="sheet-sentence-lines">
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                    ✍️ 句型仿寫（請運用上述句型或生活經驗仿寫一句完整的句子）：
                  </div>
                  <div className="sheet-writing-line">
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>①</span>
                    <div className="sheet-writing-rule"></div>
                  </div>
                  <div className="sheet-writing-line">
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>②</span>
                    <div className="sheet-writing-rule"></div>
                  </div>
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>
    )
  }

  // 4. 渲染看圖識字練習單 (picture-practice)
  const renderPicturePractice = (pageSections: WorksheetSection[]) => {
    const picSections = pageSections.filter((s): s is PictureWorksheetSection => s.kind === 'picture')
    const displayList = picSections.length > 0
      ? picSections.map((s) => ({
          character: s.item.character,
          img: s.item.image,
        }))
      : fallbackCharacters.map((c) => ({
          character: c.character,
          img: worksheetImages[c.character],
        }))

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="sheet-instruction-banner">
          <strong>【伍、看圖識字與表達】</strong> 觀察圖片中的情境，寫出對應的生字，並造出一個完整的句子。
        </div>

        {displayList.map((c, idx) => {
          const img = c.img || worksheetImages[c.character]

          return (
            <section
              key={`${c.character}-${idx}`}
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '12px',
                display: 'flex',
                gap: '16px',
                alignItems: 'center',
                backgroundColor: '#ffffff',
              }}
            >
              <div
                style={{
                  width: '120px',
                  height: '90px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  backgroundColor: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {img ? (
                  <img src={img.url} alt={`教學圖片：${c.character}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '11px' }}>
                    <div style={{ fontSize: '24px' }}>🖼️</div>
                    <div>教學插圖區</div>
                  </div>
                )}
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                    看圖寫字：
                  </span>
                  <div className="sheet-tian-grid sm" aria-label="看圖寫生字格"></div>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    （{includeZhuyin ? '注音：________ ｜ ' : ''}部首：________）
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#334155' }}>
                  <strong>看圖造詞與造句：</strong>
                  <div className="sheet-writing-rule" style={{ marginTop: '8px' }}></div>
                </div>
              </div>
            </section>
          )
        })}
      </div>
    )
  }

  // 根據模板分流渲染當前頁面內容
  const renderContentByTemplate = (pageSections: WorksheetSection[]) => {
    switch (activeTemplate) {
      case 'character-practice':
        return renderCharacterPractice(pageSections)
      case 'word-practice':
        return renderWordPractice(pageSections)
      case 'sentence-practice':
        return renderSentencePractice(pageSections)
      case 'picture-practice':
        return renderPicturePractice(pageSections)
      default:
        return renderCharacterPractice(pageSections)
    }
  }

  return (
    <div>
      {/* 畫面控制列（列印時自動隱藏） */}
      <div className="card no-print" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="card-title">🖨️ 步驟 6：A4 學習單預覽、列印與匯出</h1>
            <p className="card-subtitle">
              已套用「{templateNameMap[activeTemplate] || '標準模板'}」· 國小 {selectedGrade} 年級
              {previewFont === 'bopomofo' ? '（已套用「芫荽注音字體」）' : '（已套用「標楷體」）'}
              ；本步驟由純前端引擎執行，不會傳送資料到外部服務
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
              {/* 即時切換注音開關 */}
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: includeZhuyin ? '#166534' : '#64748b',
                  backgroundColor: includeZhuyin ? '#f0fdf4' : '#f8fafc',
                  border: includeZhuyin ? '1.5px solid #86efac' : '1px solid var(--color-border)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  id="preview-include-zhuyin"
                  checked={includeZhuyin}
                  onChange={(e) => setIncludeZhuyin(e.target.checked)}
                  style={{ cursor: 'pointer', accentColor: '#16a34a' }}
                />
                <span>顯示注音</span>
              </label>

              {/* 直接選擇字體控制 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <label htmlFor="preview-font-select" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#334155' }}>
                  🔤 學習單字體：
                </label>
                <select
                  id="preview-font-select"
                  value={previewFont}
                  onChange={(e) => setPreviewFont(e.target.value as 'standard' | 'bopomofo')}
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.88rem',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                  aria-label="選擇學習單字體"
                >
                  <option value="standard">標楷體（標準字體）</option>
                  <option value="bopomofo">芫荽注音字體</option>
                </select>
              </div>

              <span style={{ fontSize: '0.82rem', color: !includeZhuyin ? '#64748b' : previewFont === 'bopomofo' ? '#0d9488' : '#3b82f6', fontWeight: 600 }}>
                {!includeZhuyin
                  ? '🚫 已關閉注音（純文字排版，不留空白佔位）'
                  : previewFont === 'bopomofo'
                    ? '✨ 已套用「芫荽注音字體」排版'
                    : '📝 已套用標準「標楷體」排版'}
              </span>
            </div>
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
      </div>

      {/* A4 紙張預覽區（支援多頁依序呈現） */}
      <div ref={sheetsContainerRef} className="a4-preview-container">
          {pages.map((page) => (
            <article
              key={page.pageNumber}
              className={`a4-sheet ${previewFont === 'bopomofo' ? 'worksheet-font-bopomofo' : 'worksheet-font-standard'}`}
              role="region"
              aria-label={`A4 學習單第 ${page.pageNumber} 頁預覽`}
            >
              <header className="sheet-header">
                <div className="sheet-header-top">
                  <h2 className="sheet-title">{activeTitle}</h2>
                  <div className="sheet-header-meta">
                    <span>國語單元評量</span>
                    <span className="sheet-header-meta-sep">｜</span>
                    <span>{templateNameMap[activeTemplate] || '生字練習單'}</span>
                    {includeZhuyin ? (
                      previewFont === 'bopomofo' ? (
                        <span className="sheet-header-badge">（芫荽注音）</span>
                      ) : null
                    ) : (
                      <span className="sheet-header-badge muted">（無注音版）</span>
                    )}
                  </div>
                </div>
                <div className="sheet-info-row">
                  <span className="sheet-info-item">____ 年 ____ 班</span>
                  <span className="sheet-info-item">座號：____</span>
                  <span className="sheet-info-item">姓名：____________</span>
                  <span className="sheet-info-item">得分：______</span>
                </div>
              </header>

              <main className="sheet-content">
                {renderContentByTemplate(page.sections)}
              </main>

              <footer className="sheet-footer">
                <span>國小本機學習單生成器（Local-First 免費教師版）· {templateNameMap[activeTemplate]}</span>
                <span>第 {page.pageNumber} 頁 / 共 {pages.length} 頁</span>
              </footer>
            </article>
          ))}
      </div>
    </div>
  )
}

