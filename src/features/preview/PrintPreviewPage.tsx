import React, { useEffect } from 'react'
import { useApp } from '../../app/index'
import type { CharacterAnalysis } from '../../domain'
import {
  buildWorksheet,
  type WorksheetBlock,
  type WorksheetSection,
  type CharacterWorksheetSection,
  type WordWorksheetSection,
  type SentenceWorksheetSection,
  type WorksheetTemplate,
} from '../../services'

export const PrintPreviewPage: React.FC = () => {
  const {
    worksheetDoc,
    setWorksheetDoc,
    analysisResult,
    generatedImages,
    selectedTemplate,
    navigate,
  } = useApp()

  const activeTemplate: WorksheetTemplate = worksheetDoc?.template || selectedTemplate

  const templateNameMap: Record<WorksheetTemplate, string> = {
    'character-practice': '生字田字格練習單',
    'word-practice': '詞語積木擴展單',
    'sentence-practice': '句型仿寫應用單',
    'picture-practice': '看圖識字練習單',
    mixed: '生字語文綜合單',
  }

  // 自動同步：若尚未由 buildWorksheet 組裝，或當前 worksheetDoc 與已選 selectedTemplate 不一致時，自動呼叫 buildWorksheet
  useEffect(() => {
    if (analysisResult && analysisResult.characters.length > 0) {
      if (!worksheetDoc || worksheetDoc.template !== selectedTemplate) {
        const imageList = Object.values(generatedImages)
        buildWorksheet(analysisResult, selectedTemplate, { images: imageList }).then((res) => {
          if (res.ok) {
            setWorksheetDoc(res.value)
          }
        })
      }
    }
  }, [selectedTemplate, analysisResult, worksheetDoc, generatedImages, setWorksheetDoc])

  const handlePrint = () => {
    window.print()
  }

  const activeTitle = worksheetDoc?.title || templateNameMap[activeTemplate] || '學習單'
  const sections: WorksheetSection[] = worksheetDoc?.pages[0]?.sections || []

  // 備用 characters（若 sections 尚未建立或非同步中）
  const fallbackCharacters: CharacterAnalysis[] = analysisResult?.characters || [
    {
      character: '學',
      zhuyin: 'ㄒㄩㄝˊ',
      radical: '子',
      strokeCount: 16,
      words: ['學校', '學習', '學生'],
      exampleSentences: ['我每天到學校學習新知識。'],
      confidence: 0.96,
      source: { page: 1, block: '第一段' },
      imageSuggestion: null,
      editableState: { status: 'confirmed', isEditable: true, needsReview: false },
    },
    {
      character: '習',
      zhuyin: 'ㄒㄧˊ',
      radical: '羽',
      strokeCount: 11,
      words: ['學習', '練習', '習慣'],
      exampleSentences: ['多練習可以讓生字寫得更漂亮。'],
      confidence: 0.92,
      source: { page: 1, block: '第一段' },
      imageSuggestion: null,
      editableState: { status: 'confirmed', isEditable: true, needsReview: false },
    },
  ]

  // 輔助函式：取得生字的完整資訊
  const findCharacterData = (char: string): CharacterAnalysis | undefined => {
    return fallbackCharacters.find((c) => c.character === char)
  }

  // 1. 渲染生字田字格練習單 (character-practice)
  const renderCharacterPractice = () => {
    const charSections = sections.filter((s): s is CharacterWorksheetSection => s.kind === 'character')
    const items = charSections.length > 0
      ? charSections.map((s) => {
          const detail = findCharacterData(s.item.character)
          return {
            character: s.item.character,
            zhuyin: s.item.zhuyin,
            radical: s.item.radical,
            strokeCount: s.item.strokeCount,
            words: detail?.words || [],
          }
        })
      : fallbackCharacters.map((c) => ({
          character: c.character,
          zhuyin: c.zhuyin,
          radical: c.radical,
          strokeCount: c.strokeCount,
          words: c.words,
        }))

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="sheet-instruction-banner">
          <strong>【壹、生字筆順與田字格習寫】</strong> 先讀注音與部首，再依正確筆順在田字格內端正書寫。
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
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                讀音：<strong>{item.zhuyin}</strong>
              </div>
            </div>

            <div className="sheet-char-grid-row">
              {/* 示範大格 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <div style={{ fontSize: '11px', color: '#475569' }}>{item.zhuyin}</div>
                <div className="sheet-tian-grid sm" style={{ borderColor: '#ef4444', color: '#b91c1c', fontWeight: 700 }}>
                  {item.character}
                </div>
                <span style={{ fontSize: '9px', color: '#dc2626' }}>示範</span>
              </div>

              {/* 1 格描紅格 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <div style={{ fontSize: '11px', color: 'transparent' }}>·</div>
                <div className="sheet-tian-grid sm" style={{ opacity: 0.35 }} aria-label="描紅格">
                  {item.character}
                </div>
                <span style={{ fontSize: '9px', color: '#94a3b8' }}>描紅</span>
              </div>

              {/* 6 格空白田字格練習 */}
              {Array.from({ length: 6 }).map((_, boxIdx) => (
                <div key={boxIdx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <div style={{ fontSize: '11px', color: 'transparent' }}>·</div>
                  <div className="sheet-tian-grid sm" aria-label={`習寫格 ${boxIdx + 1}`}></div>
                  <span style={{ fontSize: '9px', color: '#94a3b8' }}>{boxIdx + 1}</span>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '13px', color: '#334155', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
              <strong>【常用詞語造詞參考】：</strong>
              <span>
                {item.words && item.words.length > 0
                  ? item.words.join('、')
                  : '________________、________________'}
              </span>
            </div>
          </section>
        ))}
      </div>
    )
  }

  // 2. 渲染詞語積木擴展單 (word-practice)
  const renderWordPractice = () => {
    const wordSections = sections.filter((s): s is WordWorksheetSection => s.kind === 'word')
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
          words: c.words.map((text) => ({ text, practiceLineCount: 1 })),
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
                  fontFamily: "'DFKai-SB', 'BiauKai', 'KaiTi', serif",
                }}
              >
                {item.character}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                  生字核心：【 {item.character} 】（{item.zhuyin}）
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
  const renderSentencePractice = () => {
    const sentenceSections = sections.filter((s): s is SentenceWorksheetSection => s.kind === 'sentence')
    const items = sentenceSections.length > 0
      ? sentenceSections.map((s) => ({
          character: s.item.character,
          sentences: s.item.sentences,
        }))
      : fallbackCharacters.map((c) => ({
          character: c.character,
          sentences: c.exampleSentences.map((text) => ({ text, answerLineCount: 2 })),
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

  // 4. 渲染生字語文綜合單 (mixed)
  const renderMixedPractice = () => {
    const blocks: WorksheetBlock[] = worksheetDoc?.pages[0]?.blocks ||
      fallbackCharacters.map((c) => ({
        character: c.character,
        zhuyin: c.zhuyin,
        words: c.words,
        exampleSentences: c.exampleSentences,
      }))

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="sheet-instruction-banner">
          <strong>【肆、生字語文綜合評量】</strong> 整合生字書寫、生詞造詞、看圖寫字與情境造句。
        </div>

        {blocks.map((item, idx) => {
          const img = generatedImages[item.character]
          const charDetail = findCharacterData(item.character)

          return (
            <section key={`${item.character}-${idx}`} className="sheet-char-row">
              {/* 田字格與注音 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                  {item.zhuyin}
                </div>
                <div className="sheet-tian-grid sm">{item.character}</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>
                  部首：{charDetail?.radical || '—'}
                </div>
              </div>

              {/* 習寫田字格 (3格空白練習) */}
              <div style={{ display: 'flex', gap: '4px' }}>
                <div className="sheet-tian-grid sm" style={{ opacity: 0.35 }} aria-label="描紅格">
                  {item.character}
                </div>
                <div className="sheet-tian-grid sm" aria-label="練習格 1"></div>
                <div className="sheet-tian-grid sm" aria-label="練習格 2"></div>
              </div>

              {/* 語詞與造句練習區 */}
              <div style={{ flex: 1, paddingLeft: '6px' }}>
                <div style={{ fontSize: '13px', marginBottom: '6px' }}>
                  <strong>【生詞造詞】</strong>
                  <span style={{ marginLeft: '6px' }}>
                    {item.words && item.words.length > 0
                      ? item.words.join('、')
                      : '_____________、_____________'}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#1e293b' }}>
                  <strong>【情境造句】</strong>
                  <div
                    style={{
                      marginTop: '4px',
                      padding: '4px 6px',
                      borderBottom: '1px dashed #94a3b8',
                      fontSize: '12px',
                      color: '#475569',
                    }}
                  >
                    {item.exampleSentences && item.exampleSentences.length > 0
                      ? `例：${item.exampleSentences[0]}`
                      : '請用生詞造出一個完整的句子。'}
                  </div>
                </div>
              </div>

              {/* 教學插圖（若有產生） */}
              {img && (
                <div
                  style={{
                    width: '90px',
                    textAlign: 'center',
                    borderLeft: '1px solid #e2e8f0',
                    paddingLeft: '8px',
                  }}
                >
                  <img
                    src={img.url}
                    alt={`插圖：${item.character}`}
                    style={{
                      width: '76px',
                      height: '56px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                    }}
                  />
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                    看圖識字
                  </div>
                </div>
              )}
            </section>
          )
        })}
      </div>
    )
  }

  // 5. 渲染看圖識字練習單 (picture-practice)
  const renderPicturePractice = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="sheet-instruction-banner">
          <strong>【伍、看圖識字與表達】</strong> 觀察圖片中的情境，寫出對應的生字，並造出一個完整的句子。
        </div>

        {fallbackCharacters.map((c, idx) => {
          const img = generatedImages[c.character]

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

  // 根據模板分流渲染內容
  const renderContentByTemplate = () => {
    switch (activeTemplate) {
      case 'character-practice':
        return renderCharacterPractice()
      case 'word-practice':
        return renderWordPractice()
      case 'sentence-practice':
        return renderSentencePractice()
      case 'picture-practice':
        return renderPicturePractice()
      case 'mixed':
      default:
        return renderMixedPractice()
    }
  }

  return (
    <div>
      {/* 畫面控制列（列印時自動隱藏） */}
      <div className="card no-print" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="card-title">🖨️ 步驟 6：A4 學習單預覽與列印</h1>
            <p className="card-subtitle">
              已套用「{templateNameMap[activeTemplate] || '標準模板'}」；本步驟由本機排版引擎執行，不消耗任何 AI Quota
            </p>
          </div>
          <div className="btn-group">
            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: '0.65rem 1.4rem', fontSize: '1rem' }}
              onClick={handlePrint}
              aria-label="開啟系統列印視窗，可直接列印或另存為 PDF"
            >
              🖨️ 列印 / 另存為 PDF
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
      </div>

      {/* A4 紙張預覽區 */}
      <div className="a4-preview-container">
        <article className="a4-sheet" role="region" aria-label="A4 學習單紙張預覽">
          <header className="sheet-header">
            <div>
              <h2 className="sheet-title">{activeTitle}</h2>
              <p style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>
                國小國語單元評量 ｜ {templateNameMap[activeTemplate] || '生字練習單'}
              </p>
            </div>
            <div className="sheet-info-row">
              <span>____ 年 ____ 班</span>
              <span>座號：____</span>
              <span>姓名：____________</span>
              <span>得分：______</span>
            </div>
          </header>

          <main className="sheet-content">
            {renderContentByTemplate()}
          </main>

          <footer
            style={{
              borderTop: '1px solid #cbd5e1',
              paddingTop: '6px',
              fontSize: '11px',
              color: '#94a3b8',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>國小 AI 學習單生成器（Local-First 免費教師版）· {templateNameMap[activeTemplate]}</span>
            <span>第 1 頁 / 共 1 頁</span>
          </footer>
        </article>
      </div>
    </div>
  )
}
