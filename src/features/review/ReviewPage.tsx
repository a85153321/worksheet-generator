import React, { useState } from 'react'
import { useApp } from '../../app/index'
import type { AnalysisResult, CharacterAnalysis } from '../../domain'

const defaultMockAnalysis: AnalysisResult = {
  characters: [
    {
      character: '學',
      zhuyin: 'ㄒㄩㄝˊ',
      radical: '子',
      strokeCount: 16,
      words: ['學校', '學習', '學生'],
      exampleSentences: ['我每天到學校學習新知識。'],
      confidence: 0.96,
      source: { page: 1, block: '第一段' },
      imageSuggestion: {
        prompt: '小學生在明亮的教室裡專心學習，兒童教材插畫風格',
        rationale: '用熟悉的校園情境幫助理解「學」。',
        selected: false,
      },
      editableState: {
        status: 'draft',
        isEditable: true,
        needsReview: false,
      },
    },
    {
      character: '習',
      zhuyin: 'ㄒㄧˊ',
      radical: '羽',
      strokeCount: 11,
      words: ['學習', '練習', '習慣'],
      exampleSentences: ['多練習可以讓生字寫得更漂亮。'],
      confidence: 0.88,
      source: { page: 1, block: '第一段' },
      imageSuggestion: {
        prompt: '小朋友手握鉛筆在作業本上認真習字練習，特寫溫馨插畫',
        rationale: '對應習字、練習的生活經驗。',
        selected: false,
      },
      editableState: {
        status: 'draft',
        isEditable: true,
        needsReview: true,
      },
    },
  ],
}

export const ReviewPage: React.FC = () => {
  const { analysisResult, setAnalysisResult, navigate } = useApp()

  // 若無目前結果，預設載入示範結果
  const currentResult: AnalysisResult = analysisResult || defaultMockAnalysis

  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const handleUpdateItem = (index: number, updated: Partial<CharacterAnalysis>) => {
    const updatedChars = [...currentResult.characters]
    const item = updatedChars[index]
    updatedChars[index] = {
      ...item,
      ...updated,
      editableState: {
        ...item.editableState,
        status: 'edited',
        needsReview: false,
      },
    }
    setAnalysisResult({ characters: updatedChars })
  }

  const handleConfirmItem = (index: number) => {
    const updatedChars = [...currentResult.characters]
    const item = updatedChars[index]
    updatedChars[index] = {
      ...item,
      editableState: {
        ...item.editableState,
        status: 'confirmed',
        needsReview: false,
      },
    }
    setAnalysisResult({ characters: updatedChars })
  }

  return (
    <div className="card">
      <div className="card-header">
        <h1 className="card-title">🔍 步驟 3：分析結果審核與編輯</h1>
        <p className="card-subtitle">
          教師擁有最終審核權：請檢視生字、注音、部首、筆畫與詞句，可隨時手動修正
        </p>
      </div>

      <div className="callout" role="region" aria-label="審核指引">
        <div className="callout-title">💡 審核小提醒</div>
        <p>
          標示為「⚠️ 需確認」的項目為 AI 信心值較低或字形辨識存疑處，建議特別核對注音與部首。確認無誤後即可點選確認。
        </p>
      </div>

      <div className="char-grid">
        {currentResult.characters.map((item, idx) => {
          const isEditing = editingIndex === idx
          const isConfirmed = item.editableState.status === 'confirmed'
          const needsReview = item.editableState.needsReview

          return (
            <article
              key={`${item.character}-${idx}`}
              className="char-card"
              style={{
                borderColor: needsReview
                  ? 'var(--color-accent)'
                  : isConfirmed
                  ? 'var(--color-success)'
                  : 'var(--color-border)',
              }}
            >
              <div className="char-card-header">
                <div>
                  <span className="char-big">{item.character}</span>
                  <div className="char-meta-row">
                    <span>
                      注音：<strong>{item.zhuyin}</strong>
                    </span>
                    <span>
                      部首：<strong>{item.radical}</strong>
                    </span>
                    <span>
                      筆畫：<strong>{item.strokeCount}</strong> 畫
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {needsReview && (
                    <span className="tag tag-warning" style={{ display: 'block', marginBottom: '4px' }}>
                      ⚠️ 待審核
                    </span>
                  )}
                  {isConfirmed && (
                    <span className="tag tag-success" style={{ display: 'block', marginBottom: '4px' }}>
                      ✓ 已確認
                    </span>
                  )}
                  <span className="tag tag-info">信心度 {(item.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>

              {isEditing ? (
                <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>注音：</label>
                    <input
                      type="text"
                      defaultValue={item.zhuyin}
                      onBlur={(e) => handleUpdateItem(idx, { zhuyin: e.target.value })}
                      style={{ width: '100%', padding: '0.35rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>部首：</label>
                    <input
                      type="text"
                      defaultValue={item.radical}
                      onBlur={(e) => handleUpdateItem(idx, { radical: e.target.value })}
                      style={{ width: '100%', padding: '0.35rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>筆畫：</label>
                    <input
                      type="number"
                      defaultValue={item.strokeCount}
                      onBlur={(e) =>
                        handleUpdateItem(idx, { strokeCount: parseInt(e.target.value, 10) || item.strokeCount })
                      }
                      style={{ width: '100%', padding: '0.35rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>詞語（逗號分隔）：</label>
                    <input
                      type="text"
                      defaultValue={item.words.join('、')}
                      onBlur={(e) =>
                        handleUpdateItem(idx, {
                          words: e.target.value.split(/[,、]/).map((w) => w.trim()).filter(Boolean),
                        })
                      }
                      style={{ width: '100%', padding: '0.35rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}
                    onClick={() => {
                      setEditingIndex(null)
                      handleConfirmItem(idx)
                    }}
                  >
                    儲存並完成審核
                  </button>
                </div>
              ) : (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.88rem', marginBottom: '0.35rem' }}>
                    <strong>詞語：</strong> {item.words.join('、')}
                  </div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                    <strong>例句：</strong> {item.exampleSentences[0] || '無'}
                  </div>
                  <div className="btn-group">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.82rem' }}
                      onClick={() => setEditingIndex(idx)}
                      aria-label={`編輯「${item.character}」的資料`}
                    >
                      ✏️ 編輯內容
                    </button>
                    {!isConfirmed && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.82rem' }}
                        onClick={() => handleConfirmItem(idx)}
                        aria-label={`確認「${item.character}」無誤`}
                      >
                        ✓ 確認無誤
                      </button>
                    )}
                  </div>
                </div>
              )}
            </article>
          )
        })}
      </div>

      <div className="btn-group" style={{ marginTop: '2.5rem', justifyContent: 'space-between' }}>
        <button type="button" className="btn btn-secondary" onClick={() => navigate('upload')}>
          ← 返回重新上傳
        </button>
        <button
          type="button"
          className="btn btn-primary"
          style={{ padding: '0.65rem 1.6rem', fontSize: '1rem' }}
          onClick={() => {
            if (!analysisResult) {
              setAnalysisResult(defaultMockAnalysis)
            }
            navigate('images')
          }}
        >
          下一步：配圖選擇 →
        </button>
      </div>
    </div>
  )
}
