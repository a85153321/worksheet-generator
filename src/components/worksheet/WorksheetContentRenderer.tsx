import React from 'react'
import type { CharacterAnalysis } from '../../domain'
import { VerticalZhuyin, TianzigeWithZhuyin } from '../VerticalZhuyin'
import type {
  WorksheetSection,
  CharacterWorksheetSection,
  WordWorksheetSection,
  SentenceWorksheetSection,
  PictureWorksheetSection,
  WorksheetTemplate,
  WorksheetImage,
} from '../../services'

export interface WorksheetContentRendererProps {
  template: WorksheetTemplate
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

  // 1. 生字田字格練習單 (character-practice)
  const renderCharacterPractice = () => {
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

  // 1b. 範例注音生字學習單 (reference-character-practice: 教師提供 Word 原稿母版，每頁固定 5 題)
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

  // 2. 語詞積木擴展單 (word-practice)
  const renderWordPractice = () => {
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
      : characters.map((c) => ({
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

  // 3. 句型仿寫應用單 (sentence-practice)
  const renderSentencePractice = () => {
    const sentenceSections = pageSections.filter((s): s is SentenceWorksheetSection => s.kind === 'sentence')
    const items = sentenceSections.length > 0
      ? sentenceSections.map((s) => ({
          character: s.item.character,
          sentences: s.item.sentences.slice(0, 2),
        }))
      : characters.map((c) => ({
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

  // 4. 看圖識字練習單 (picture-practice)
  const renderPicturePractice = () => {
    const picSections = pageSections.filter((s): s is PictureWorksheetSection => s.kind === 'picture')
    const displayList = picSections.length > 0
      ? picSections.map((s) => ({
          character: s.item.character,
          img: s.item.image,
        }))
      : characters.map((c) => ({
          character: c.character,
          img: images[c.character],
        }))

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="sheet-instruction-banner">
          <strong>【伍、看圖識字與表達】</strong> 觀察圖片中的情境，寫出對應的生字，並造出一個完整的句子。
        </div>

        {displayList.map((c, idx) => {
          const img = c.img || images[c.character]

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

  switch (template) {
    case 'character-practice':
      return renderCharacterPractice()
    case 'reference-character-practice':
      return renderReferenceCharacterPractice()
    case 'word-practice':
      return renderWordPractice()
    case 'sentence-practice':
      return renderSentencePractice()
    case 'picture-practice':
      return renderPicturePractice()
    default:
      return renderCharacterPractice()
  }
}
