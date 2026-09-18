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
  type WorksheetFont,
} from '../../services'

const WORKSHEET_FONT_LABELS: Record<WorksheetFont, string> = {
  'standard-kai': '標楷體',
  'zihi-kai-zhuyin': '標楷有注音',
  'zihi-only-zhuyin': '純注音',
}

export const PrintPreviewPage: React.FC = () => {
  const {
    worksheetDoc,
    setWorksheetDoc,
    analysisResult,
    worksheetImages,
    selectedTemplate,
    navigate,
    selectedGrade,
  } = useApp()

  const [previewFont, setPreviewFont] = useState<WorksheetFont>(
    (selectedGrade ?? 3) <= 2 ? 'zihi-kai-zhuyin' : 'standard-kai'
  )
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isExportingDocx, setIsExportingDocx] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [exportSuccess, setExportSuccess] = useState<string | null>(null)
  const [isFontReminderExpanded, setIsFontReminderExpanded] = useState(false)
  const sheetsContainerRef = useRef<HTMLDivElement>(null)

  const activeTemplate: WorksheetTemplate = worksheetDoc?.template || selectedTemplate

  const templateNameMap: Record<WorksheetTemplate, string> = {
    'character-practice': '生字田字格練習單',
    'reference-character-practice': '範例注音生字學習單',
    'word-practice': '語詞積木擴展單',
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
        : templateNameMap[activeTemplate] || '學習單'

  // 取得 WorksheetDoc 中組裝之頁面陣列（支援多頁），若為空則預設 1 頁
  const pages: WorksheetPage[] = worksheetDoc?.pages && worksheetDoc.pages.length > 0
    ? worksheetDoc.pages
    : [{ pageNumber: 1, blocks: [], sections: [] }]

  // 備用 characters（若 sections 尚未建立或非同步中）
  const fallbackCharacters: CharacterAnalysis[] = analysisResult?.characters || [
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
      sentenceCandidates: ['我們一起到公園玩耍。', '只要努力練習，一定能把字寫好。', '大家都有著一樣的愛心。'],
      source: { page: null, block: '教育部《國語辭典簡編本》' },
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
          先讀注音與部首，再依正確筆順在田字格內端正書寫。
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
              {Boolean(item.zhuyin && item.zhuyin.trim()) && (
                <div style={{ fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>讀音：</span>
                  <VerticalZhuyin character={item.character} zhuyin={item.zhuyin} size="md" />
                </div>
              )}
            </div>

            <div className="sheet-char-grid-row">
              {/* 示範大格（國字在田字格內，標準直式注音位於右側注音欄） */}
              <TianzigeWithZhuyin
                character={item.character}
                zhuyin={item.zhuyin}
                isDemonstration
                showZhuyin
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
              <strong>【常用語詞造詞參考】：</strong>
              <span>
                {item.wordCandidates && item.wordCandidates.length > 0
                  ? item.wordCandidates.slice(0, 3).join('、')
                  : '________________、________________'}
              </span>
            </div>
          </section>
        ))}
      </div>
    )
  }

  // 1b. 渲染範例注音生字學習單 (reference-character-practice: 教師提供 Word 原稿母版，每頁固定 5 題)
  const renderReferenceCharacterPractice = (pageSections: WorksheetSection[], pageNumber: number) => {
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div className="sheet-instruction-banner" style={{ borderLeftColor: '#7030a0' }}>
          <strong>【壹、範例注音生字學習單】</strong>（教師 Word 範本原稿母版·每頁五題） 先讀注音與部首，再依正確筆順在田字格內端正書寫。
        </div>

        {items.map((item, idx) => {
          const qNum = (pageNumber - 1) * 5 + idx + 1
          const uploadedImg = worksheetImages[item.character]
          return (
            <section
              key={`${item.character}-${idx}`}
              className="sheet-char-card"
              style={{ padding: '8px 12px', gap: '6px' }}
            >
              <div className="sheet-char-card-header" style={{ paddingBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
                    第 {qNum} 題：【 {item.character} 】
                  </span>
                  <span className="tag tag-info" style={{ fontSize: '11px', padding: '1px 7px' }}>
                    部首：{item.radical || '—'}
                  </span>
                  <span className="tag tag-info" style={{ fontSize: '11px', padding: '1px 7px' }}>
                    筆畫：{item.strokeCount || '—'} 畫
                  </span>
                </div>
                {Boolean(item.zhuyin && item.zhuyin.trim()) && (
                  <div style={{ fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>讀音：</span>
                    <VerticalZhuyin character={item.character} zhuyin={item.zhuyin} size="md" />
                  </div>
                )}
              </div>

              {/* 5 格排版母版群組：示範格、描字格、練習格1、練習格2、原稿專屬紫色部首格 + 配圖 */}
              <div className="sheet-char-grid-row" style={{ gap: '6px' }}>
                {/* 1. 示範大格（國字在田字格內，標準直式注音位於右側注音欄） */}
                <TianzigeWithZhuyin
                  character={item.character}
                  zhuyin={item.zhuyin}
                  isDemonstration
                  showZhuyin
                />

                {/* 2. 1 格描字格 */}
                <TianzigeWithZhuyin
                  character={item.character}
                  zhuyin={item.zhuyin}
                  isTracing
                  showZhuyin={false}
                />

                {/* 3. 空白田字格練習 1 */}
                <TianzigeWithZhuyin
                  character=""
                  zhuyin=""
                  practiceNumber={1}
                />

                {/* 4. 空白田字格練習 2 */}
                <TianzigeWithZhuyin
                  character=""
                  zhuyin=""
                  practiceNumber={2}
                />

                {/* 5. 原稿專屬紫色粗框部首格 */}
                <div className="tianzige-block-item" title={`原稿紫色部首格：${item.radical || '—'}`}>
                  <div className="tianzige-box-with-zhuyin no-zhuyin">
                    <div
                      className="sheet-tian-grid sm"
                      style={{
                        borderColor: '#7030a0',
                        borderWidth: '2.5px',
                        color: '#7030a0',
                        backgroundColor: '#faf5ff',
                        opacity: 0.85,
                        fontWeight: 700,
                      }}
                      aria-label={`部首：${item.radical}`}
                    >
                      {item.radical || '—'}
                    </div>
                  </div>
                  <span className="tianzige-bottom-label" style={{ color: '#7030a0', fontWeight: 600 }}>
                    部首
                  </span>
                </div>

                {/* 若有自備配圖則在右側呈現 */}
                {uploadedImg && (
                  <div
                    style={{
                      marginLeft: 'auto',
                      width: '68px',
                      height: '54px',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f8fafc',
                      padding: '2px',
                    }}
                    title={`教師配圖：${item.character}`}
                  >
                    <img
                      src={uploadedImg.url}
                      alt={item.character}
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                  </div>
                )}
              </div>

              <div style={{ fontSize: '12.5px', color: '#334155', borderTop: '1px solid #f1f5f9', paddingTop: '4px' }}>
                <strong>【常用語詞造詞參考】：</strong>
                <span>
                  {item.wordCandidates && item.wordCandidates.length > 0
                    ? item.wordCandidates.slice(0, 3).join('、')
                    : '________________、________________'}
                </span>
              </div>
            </section>
          )
        })}
      </div>
    )
  }

  // 2. 渲染語詞積木擴展單 (word-practice)
  const renderWordPractice = (pageSections: WorksheetSection[]) => {
    const wordSections = pageSections.filter((s): s is WordWorksheetSection => s.kind === 'word')
    const items = wordSections.length > 0
      ? wordSections.map((s) => {
          const detail = findCharacterData(s.item.character)
          return {
            character: s.item.character,
            zhuyin: detail?.zhuyin || '',
            words: s.item.words.slice(0, 3),
          }
        })
      : fallbackCharacters.map((c) => ({
          character: c.character,
          zhuyin: c.zhuyin,
          words: (c.wordCandidates || []).slice(0, 3).map((text) => ({ text, practiceLineCount: 1 })),
        }))

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="sheet-instruction-banner">
          <strong>【貳、語詞積木擴展與習寫】</strong> 讀一讀語詞積木，在書寫格端正寫一次，並完成延伸造詞。
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
                  生字核心：【 {item.character} 】{item.zhuyin && item.zhuyin.trim() ? `（${item.zhuyin}）` : ''}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  請依序練習以下生詞，並在右側空白橫線練習擴詞：
                </div>
              </div>
            </div>

            <div className="sheet-word-list">
              {item.words.slice(0, 3).map((w, wIdx) => (
                <div key={wIdx} className="sheet-word-item">
                  <div className="sheet-word-badge">
                    {w.text}
                  </div>

                  {/* 為語詞中的每個字提供習寫田字格 */}
                  <div className="sheet-word-boxes">
                    {Array.from(w.text).map((c, cIdx) => (
                      <div
                        key={cIdx}
                        className="sheet-tian-grid sm"
                        style={{ width: '42px', height: '42px' }}
                        aria-label={`語詞習寫格：${c}`}
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
          sentences: s.item.sentences.slice(0, 2),
        }))
      : fallbackCharacters.map((c) => ({
          character: c.character,
          sentences: (c.sentenceCandidates || []).slice(0, 2).map((text) => ({ text, answerLineCount: 2 })),
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

            {item.sentences.slice(0, 2).map((s, sIdx) => (
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
                    （注音：________ ｜ 部首：________）
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
  const renderContentByTemplate = (pageSections: WorksheetSection[], pageNumber = 1) => {
    switch (activeTemplate) {
      case 'character-practice':
        return renderCharacterPractice(pageSections)
      case 'reference-character-practice':
        return renderReferenceCharacterPractice(pageSections, pageNumber)
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
              （已套用「{WORKSHEET_FONT_LABELS[previewFont]}」）
              ；本步驟由純前端引擎執行，不會傳送資料到外部服務
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
              {/* 直接選擇字體控制 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <label htmlFor="preview-font-select" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#334155' }}>
                  🔤 學習單字體：
                </label>
                <select
                  id="preview-font-select"
                  value={previewFont}
                  onChange={(e) => setPreviewFont(e.target.value as WorksheetFont)}
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
                  <option value="standard-kai">標楷體（標準字體，不顯示注音）</option>
                  <option value="zihi-kai-zhuyin">標楷有注音</option>
                  <option value="zihi-only-zhuyin">純注音</option>
                </select>
              </div>

              <span style={{ fontSize: '0.82rem', color: previewFont === 'standard-kai' ? '#3b82f6' : '#0d9488', fontWeight: 600 }}>
                {`✨ 已套用標準「${WORKSHEET_FONT_LABELS[previewFont]}」排版`}
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
      </div>

      {/* A4 紙張預覽區（支援多頁依序呈現） */}
      <div ref={sheetsContainerRef} className="a4-preview-container">
          {pages.map((page) => (
            <article
              key={page.pageNumber}
              className={`a4-sheet worksheet-font-${previewFont}`}
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
                    {previewFont !== 'standard-kai' ? (
                      <span className="sheet-header-badge">（{WORKSHEET_FONT_LABELS[previewFont]}）</span>
                    ) : null}
                  </div>
                </div>
                <div className="sheet-info-row">
                  <span className="sheet-info-item">____ 年 ____ 班</span>
                  <span className="sheet-info-item">座號：____</span>
                  <span className="sheet-info-item">姓名：____________</span>
                  {activeTemplate !== 'reference-character-practice' && (
                    <span className="sheet-info-item">得分：______</span>
                  )}
                </div>
              </header>

              <main className="sheet-content">
                {renderContentByTemplate(page.sections, page.pageNumber)}
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

