import React, { useState } from 'react'
import { useApp } from '../../app/index'
import { generateSelectedImage } from '../../services'
import type { CharacterAnalysis } from '../../domain'

export const ImageSelectionPage: React.FC = () => {
  const { analysisResult, setAnalysisResult, generatedImages, setGeneratedImages, navigate } =
    useApp()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

  const characters = analysisResult?.characters || []

  const toggleImageSelect = (index: number) => {
    if (!analysisResult) return
    const updated = [...analysisResult.characters]
    const item = updated[index]
    if (item.imageSuggestion) {
      updated[index] = {
        ...item,
        imageSuggestion: {
          ...item.imageSuggestion,
          selected: !item.imageSuggestion.selected,
        },
      }
      setAnalysisResult({ characters: updated })
    }
  }

  const selectedCount = characters.filter((c) => c.imageSuggestion?.selected).length

  const handleGenerateImages = async () => {
    if (selectedCount === 0) return
    setIsGenerating(true)
    setGenerateError(null)

    try {
      const selectedItems = characters.filter((c) => c.imageSuggestion?.selected)
      for (const item of selectedItems) {
        const res = await generateSelectedImage(item)
        if (res.ok) {
          setGeneratedImages((prev) => ({
            ...prev,
            [item.character]: res.value,
          }))
        } else {
          setGenerateError(`生成「${item.character}」配圖失敗：${res.error.message}`)
        }
      }
    } catch {
      setGenerateError('圖片生成過程中發生非預期錯誤。')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h1 className="card-title">🎨 步驟 4：生字教學配圖選擇</h1>
        <p className="card-subtitle">
          為生字配上情境插畫，強化學童圖像記憶；圖片生成屬於 AI 額外呼叫，僅生成您勾選的項目
        </p>
      </div>

      <div className="callout callout-warning" role="region" aria-label="費用與 Quota 提示">
        <div className="callout-title">⚠️ 節省額度提示</div>
        <p>
          生成圖片為高耗能操作。請僅針對難字或低年級核心字彙進行勾選；未勾選的字將以田字格與例句呈現，依然具備完整學習單功能。
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
        {characters.map((item: CharacterAnalysis, idx: number) => {
          const suggestion = item.imageSuggestion
          const hasImage = Boolean(generatedImages[item.character])
          const imageObj = generatedImages[item.character]

          return (
            <div
              key={item.character}
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                backgroundColor: suggestion?.selected ? 'var(--color-primary-light)' : 'var(--color-surface)',
                display: 'flex',
                gap: '1.25rem',
                alignItems: 'flex-start',
                transition: 'background-color 0.15s ease',
              }}
            >
              <input
                id={`check-image-${item.character}`}
                type="checkbox"
                checked={Boolean(suggestion?.selected)}
                onChange={() => toggleImageSelect(idx)}
                style={{
                  width: '1.25rem',
                  height: '1.25rem',
                  marginTop: '0.25rem',
                  cursor: 'pointer',
                }}
                aria-label={`勾選生成生字「${item.character}」之配圖`}
              />

              <div style={{ flex: 1 }}>
                <label
                  htmlFor={`check-image-${item.character}`}
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span>生字「{item.character}」</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>
                    ({item.zhuyin})
                  </span>
                </label>

                {suggestion ? (
                  <div style={{ marginTop: '0.4rem', fontSize: '0.9rem' }}>
                    <p>
                      <strong>建議 Prompt：</strong>
                      {suggestion.prompt}
                    </p>
                    <p style={{ color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                      <strong>教學用意：</strong>
                      {suggestion.rationale}
                    </p>
                  </div>
                ) : (
                  <p style={{ marginTop: '0.4rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    此字目前暫無 AI 配圖建議
                  </p>
                )}
              </div>

              {hasImage && imageObj && (
                <div style={{ textAlign: 'center' }}>
                  <img
                    src={imageObj.url}
                    alt={`生字 ${item.character} 配圖`}
                    style={{
                      width: '120px',
                      height: '75px',
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                    }}
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-primary-dark)', fontWeight: 600 }}>
                    ✓ 生成完成
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {generateError && (
        <div className="callout callout-warning" style={{ marginTop: '1rem' }} role="alert">
          {generateError}
        </div>
      )}

      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleGenerateImages}
          disabled={selectedCount === 0 || isGenerating}
          aria-label="生成已勾選的配圖"
        >
          {isGenerating ? '生成中...' : `🖼️ 生成已勾選配圖 (${selectedCount} 張)`}
        </button>
        <span style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
          （可不生成配圖直接製作純文字／田字格學習單）
        </span>
      </div>

      <div className="btn-group" style={{ marginTop: '2.5rem', justifyContent: 'space-between' }}>
        <button type="button" className="btn btn-secondary" onClick={() => navigate('review')}>
          ← 上一步：審核編輯
        </button>
        <button
          type="button"
          className="btn btn-primary"
          style={{ padding: '0.65rem 1.6rem', fontSize: '1rem' }}
          onClick={() => navigate('templates')}
        >
          下一步：選擇學習單模板 →
        </button>
      </div>
    </div>
  )
}
