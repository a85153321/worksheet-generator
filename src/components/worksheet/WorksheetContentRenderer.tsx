import React from 'react'
import type { CharacterAnalysis } from '../../domain'
import { VerticalZhuyin, TianzigeWithZhuyin } from '../VerticalZhuyin'
import type {
  WorksheetSection,
  CharacterWorksheetSection,
  WorksheetTemplate,
  WorksheetImage,
} from '../../services'

export interface WorksheetContentRendererProps {
  template?: WorksheetTemplate
  pageSections: WorksheetSection[]
  pageNumber?: number
  characters?: CharacterAnalysis[]
  images?: Record<string, WorksheetImage>
}

export const WorksheetContentRenderer: React.FC<WorksheetContentRendererProps> = ({
  pageSections,
  pageNumber = 1,
  characters = [],
  images = {},
}) => {
  const findCharacterData = (char: string): CharacterAnalysis | undefined => {
    return characters.find((c) => c.character === char)
  }

  // 範例注音生字學習單 (reference-character-practice: 教師提供 Word 原稿母版，每頁固定 5 題)
  const renderReferenceCharacterPractice = () => {
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
      : characters.map((c) => ({
          character: c.character,
          zhuyin: c.zhuyin,
          radical: c.radical,
          strokeCount: c.strokeCount,
          wordCandidates: c.wordCandidates,
        }))

    return (
      <div className="reference-question-list">
        {items.map((item, idx) => {
          const qNum = (pageNumber - 1) * 5 + idx + 1
          const uploadedImg = images[item.character]
          return (
            <section
              key={`${item.character}-${idx}`}
              className="reference-question"
            >
              <div className="reference-question-header">
                <div className="reference-question-meta">
                  <span className="reference-question-number">
                    第 {qNum} 題：【 {item.character} 】
                  </span>
                  <span>
                    部首：{item.radical || '—'}
                  </span>
                  <span>
                    筆畫：{item.strokeCount || '—'} 畫
                  </span>
                </div>
                {Boolean(item.zhuyin && item.zhuyin.trim()) && (
                  <div className="reference-question-reading">
                    <span>讀音：</span>
                    <VerticalZhuyin character={item.character} zhuyin={item.zhuyin} size="md" />
                  </div>
                )}
              </div>

              {/* 5 格排版母版群組：示範格、描字格、練習格1、練習格2、原稿專屬紫色部首格 + 配圖 */}
              <div className="reference-character-grid">
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
                <div className="tianzige-block-item reference-radical-box" title={`原稿紫色部首格：${item.radical || '—'}`}>
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

              <div className="reference-word-candidates">
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

  return renderReferenceCharacterPractice()
}
