import React from 'react'
import { useApp } from '../../app/index'
import type { CharacterAnalysis } from '../../domain'
import type { WorksheetBlock } from '../../services'

export const PrintPreviewPage: React.FC = () => {
  const { worksheetDoc, analysisResult, generatedImages, selectedTemplate, navigate } = useApp()

  const characters: WorksheetBlock[] = worksheetDoc?.pages[0]?.blocks ||
    analysisResult?.characters.map((c: CharacterAnalysis) => ({
      character: c.character,
      zhuyin: c.zhuyin,
      words: c.words,
      exampleSentences: c.exampleSentences,
    })) || [
      {
        character: '學',
        zhuyin: 'ㄒㄩㄝˊ',
        words: ['學校', '學習', '學生'],
        exampleSentences: ['我每天到學校學習新知識。'],
      },
      {
        character: '習',
        zhuyin: 'ㄒㄧˊ',
        words: ['學習', '練習', '習慣'],
        exampleSentences: ['多練習可以讓生字寫得更漂亮。'],
      },
    ]

  const handlePrint = () => {
    window.print()
  }

  const templateNameMap: Record<string, string> = {
    'character-practice': '生字田字格練習單',
    'word-practice': '詞語積木擴展單',
    'sentence-practice': '句型仿寫應用單',
    mixed: '生字語文綜合單',
  }

  return (
    <div>
      {/* 畫面控制列（列印時自動隱藏） */}
      <div className="card no-print" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="card-title">🖨️ 步驟 6：A4 學習單預覽與列印</h1>
            <p className="card-subtitle">
              已套用「{templateNameMap[selectedTemplate] || '標準模板'}」；本步驟由本機排版引擎執行，不消耗任何 AI Quota
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
              <h2 className="sheet-title">國小國語生字語文學習單</h2>
              <p style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>
                單元評量 ｜ {templateNameMap[selectedTemplate] || '生字練習單'}
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
            {characters.map((item: WorksheetBlock, idx: number) => {
              const img = generatedImages[item.character]

              return (
                <section key={`${item.character}-${idx}`} className="sheet-char-row">
                  {/* 田字格與注音 */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                      {item.zhuyin}
                    </div>
                    <div className="sheet-tian-grid">{item.character}</div>
                  </div>

                  {/* 習寫田字格 (3格空白練習) */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <div
                      className="sheet-tian-grid"
                      style={{ opacity: 0.35 }}
                      aria-label="描紅格"
                    >
                      {item.character}
                    </div>
                    <div className="sheet-tian-grid" aria-label="練習格 1"></div>
                    <div className="sheet-tian-grid" aria-label="練習格 2"></div>
                  </div>

                  {/* 語詞與造句練習區 */}
                  <div style={{ flex: 1, paddingLeft: '8px' }}>
                    <div style={{ fontSize: '14px', marginBottom: '6px' }}>
                      <strong>【生詞造詞】</strong>
                      <span style={{ marginLeft: '6px' }}>
                        {item.words && item.words.length > 0
                          ? item.words.join('、')
                          : '_____________、_____________'}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', color: '#1e293b' }}>
                      <strong>【造句練習】</strong>
                      <div
                        style={{
                          marginTop: '4px',
                          padding: '6px 8px',
                          borderBottom: '1px dashed #94a3b8',
                          fontSize: '13px',
                          color: '#475569',
                        }}
                      >
                        {item.exampleSentences && item.exampleSentences.length > 0
                          ? `例：${item.exampleSentences[0]}`
                          : '請用生詞造出一個完整的句子。'}
                      </div>
                    </div>
                  </div>

                  {/* 若有選用圖片，在此呈現圖文 */}
                  {img && (
                    <div
                      style={{
                        width: '85px',
                        textAlign: 'center',
                        borderLeft: '1px solid #e2e8f0',
                        paddingLeft: '8px',
                      }}
                    >
                      <img
                        src={img.url}
                        alt={`插圖：${item.character}`}
                        style={{
                          width: '72px',
                          height: '52px',
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
            <span>國小 AI 學習單生成器（Local-First 免費教師版）</span>
            <span>第 1 頁 / 共 1 頁</span>
          </footer>
        </article>
      </div>
    </div>
  )
}
