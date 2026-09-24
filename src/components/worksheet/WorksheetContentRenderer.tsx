import React from 'react'
import type { CharacterAnalysis } from '../../domain'
import { VerticalZhuyin, TianzigeWithZhuyin } from '../VerticalZhuyin'
import type {
  WorksheetSection,
  CharacterWorksheetSection,
  WordSentenceBlankWorksheetSection,
  WordSentenceBlankWorksheetItem,
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
  template,
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

  // 語詞例句填空學習單 (word-sentence-blank: 橫式雙欄排版、上方 5 欄摘要、下方雙欄題目)
  const renderWordSentenceBlank = (section: WordSentenceBlankWorksheetSection) => {
    const hasAnyTargetWord = section.itemRows.some(
      (row) => Boolean(row.left.targetWord) || Boolean(row.right?.targetWord),
    )

    if (!hasAnyTargetWord) {
      return (
        <div className="word-sentence-blank-empty" role="region" aria-label="未設定填空語詞提示">
          <div
            className="callout callout-warning"
            style={{
              margin: '2rem auto',
              maxWidth: '620px',
              textAlign: 'center',
              padding: '1.5rem',
              backgroundColor: '#fffbeb',
              borderColor: '#f59e0b',
              borderRadius: '8px',
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📝</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#b45309', marginBottom: '0.5rem' }}>
              尚未設定填空語詞題目
            </h3>
            <p style={{ color: '#92400e', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
              目前所有生字題目均未指定填空目標語詞。<br />
              請返回「<strong>步驟 2：生字審查</strong>」，在生字卡片的「語詞候選」中點選「<strong>設為填空</strong>」，系統將自動擷取專屬例句並產出挖空練習題。
            </p>
          </div>
        </div>
      )
    }

    const renderQuestionCard = (item: WordSentenceBlankWorksheetItem) => (
      <div className="wsb-question-card">
        <div className="wsb-question-header">
          {`${item.questionNumber}. 生字「${item.character}」`}
        </div>
        <div className="wsb-question-body">
          {item.targetWord ? (
            <span>
              {item.sentenceBeforeBlank}
              <span className="wsb-blank-line">______</span>
              {item.sentenceAfterBlank}
            </span>
          ) : (
            <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
              （尚未指定填空語詞）
            </span>
          )}
        </div>
        <div className="wsb-question-answer-line">
          答案：____________
        </div>
      </div>
    )

    return (
      <div className="word-sentence-blank-container">
        {pageNumber === 1 && section.topItems.length > 0 && (
          <div className="wsb-top-section">
            <div className="wsb-section-title">一、生字與語詞</div>
            <table className="wsb-top-table">
              <tbody>
                <tr className="wsb-top-row-char">
                  {section.topItems.map((item) => (
                    <td key={item.questionNumber} className="wsb-top-cell-char">
                      {item.character}
                    </td>
                  ))}
                </tr>
                <tr className="wsb-top-row-word">
                  {section.topItems.map((item) => (
                    <td key={item.questionNumber} className="wsb-top-cell-word">
                      {item.targetWord || '—'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div className="wsb-questions-section">
          {pageNumber === 1 && (
            <div className="wsb-section-title">二、把正確語詞填入例句</div>
          )}
          <div className="wsb-questions-grid">
            {section.itemRows.map((row, rIdx) => (
              <div key={`row-${rIdx}`} className="wsb-question-row">
                <div className="wsb-question-col">
                  {renderQuestionCard(row.left)}
                </div>
                <div className="wsb-question-col">
                  {row.right ? (
                    renderQuestionCard(row.right)
                  ) : (
                    <div className="wsb-question-empty-col" aria-hidden="true" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const wordSentenceSection = pageSections.find(
    (s): s is WordSentenceBlankWorksheetSection => s.kind === 'word-sentence-blank',
  )

  if (template === 'word-sentence-blank' || wordSentenceSection) {
    if (!wordSentenceSection) {
      return (
        <div className="word-sentence-blank-empty" role="region" aria-label="未設定填空語詞提示">
          <div
            className="callout callout-warning"
            style={{
              margin: '2rem auto',
              maxWidth: '620px',
              textAlign: 'center',
              padding: '1.5rem',
              backgroundColor: '#fffbeb',
              borderColor: '#f59e0b',
              borderRadius: '8px',
            }}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#b45309', marginBottom: '0.5rem' }}>
              尚未設定填空語詞題目
            </h3>
            <p style={{ color: '#92400e', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
              目前尚未為生字指定填空目標語詞。請返回「<strong>步驟 2：生字審查</strong>」進行設定。
            </p>
          </div>
        </div>
      )
    }
    return renderWordSentenceBlank(wordSentenceSection)
  }

  return renderReferenceCharacterPractice()
}
