import React, { useRef, useState } from 'react'
import { useApp } from '../../app/index'
import type { WorksheetImage } from '../../services'
import { resolveBopomofoDisplayCharacter } from '../../infrastructure'

export const ImageSelectionPage: React.FC = () => {
  const { analysisResult, worksheetImages, setWorksheetImages, navigate, readingFontMode } = useApp()
  const [notice, setNotice] = useState<string | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const characters = analysisResult?.characters ?? []

  const handleUpload = (character: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      setNotice('請選擇 PNG、JPEG、WebP 或 SVG 圖片。')
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const image: WorksheetImage = {
        id: `upload-${encodeURIComponent(character)}-${Date.now()}`,
        character,
        url: String(reader.result),
        file,
        mimeType: file.type as WorksheetImage['mimeType'],
        source: 'upload',
        createdAt: new Date().toISOString(),
      }
      setWorksheetImages((current) => ({ ...current, [character]: image }))
      setNotice(`已上傳生字「${character}」的配圖。`)
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const removeImage = (character: string) => {
    setWorksheetImages((current) => {
      const next = { ...current }
      delete next[character]
      return next
    })
    setNotice(`已移除生字「${character}」的配圖。`)
  }

  if (characters.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <h2 className="empty-state-title">目前尚無生字資料可供配圖</h2>
          <button className="btn btn-primary" onClick={() => navigate('review')}>
            返回生字審核
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <h1 className="card-title">🖼️ 步驟 4：上傳教學配圖</h1>
        <p className="card-subtitle">
          如需配圖，請從本機上傳；圖片只保留在目前瀏覽器工作階段，不會送往外部服務。
        </p>
      </div>

      {notice && <div className="callout" role="status">{notice}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {characters.map((item) => {
          const image = worksheetImages[item.character]
          return (
            <article key={item.character} className="sheet-char-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <strong style={{ fontSize: '1.8rem' }}>{item.character}</strong>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                  <span className="zhuyin-text single-reading-display">
                    {readingFontMode === 'vertical'
                      ? resolveBopomofoDisplayCharacter(item.character, item.zhuyin)
                      : item.zhuyin}
                  </span>
                  <span>｜{item.radical}部 {item.strokeCount}畫</span>
                </span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                  <input
                    ref={(element) => { fileInputRefs.current[item.character] = element }}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    hidden
                    onChange={(event) => handleUpload(item.character, event)}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => fileInputRefs.current[item.character]?.click()}
                  >
                    📁 {image ? '替換圖片' : '上傳圖片'}
                  </button>
                  {image && (
                    <button type="button" className="btn btn-danger" onClick={() => removeImage(item.character)}>
                      🗑️ 移除
                    </button>
                  )}
                </div>
              </div>
              {image && (
                <img
                  src={image.url}
                  alt={`生字「${item.character}」的教師上傳配圖`}
                  className="image-preview-thumb"
                  style={{ marginTop: '0.75rem' }}
                />
              )}
            </article>
          )
        })}
      </div>

      <div className="btn-group" style={{ marginTop: '2rem', justifyContent: 'space-between' }}>
        <button className="btn btn-secondary" onClick={() => navigate('review')}>← 上一步：審核編輯</button>
        <button className="btn btn-primary" onClick={() => navigate('templates')}>下一步：選擇模板 →</button>
      </div>
    </div>
  )
}
