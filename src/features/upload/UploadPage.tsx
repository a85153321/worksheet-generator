import React, { useState, useRef } from 'react'
import { useApp } from '../../app/index'

export const UploadPage: React.FC = () => {
  const { uploadedFile, setUploadedFile, navigate, hasApiKey } = useApp()
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    setUploadedFile({
      name: file.name,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      blob: file,
    })
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0])
    }
  }

  const handleLoadSample = () => {
    const sampleBlob = new Blob(['國語教材課文範例：學無止境，勤加練習。'], {
      type: 'text/plain;charset=utf-8',
    })
    setUploadedFile({
      name: '國語三上_第一課_教材範例.png',
      size: 1024 * 350,
      mimeType: 'image/png',
      blob: sampleBlob,
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="card">
      <div className="card-header">
        <h1 className="card-title">📁 步驟 1：上傳國語教材</h1>
        <p className="card-subtitle">
          支援課本掃描圖、講義拍照或 PDF 檔案（系統會於本機預先縮放與最佳化）
        </p>
      </div>

      {!hasApiKey && (
        <div className="callout callout-warning" role="region" aria-label="API Key 提醒">
          <div className="callout-title">⚠️ 尚未設定 Gemini API Key</div>
          <p>
            您尚未儲存個人的 API Key。若要實際呼叫 AI 分析真實課文，請先至{' '}
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0.2rem 0.5rem', fontSize: '0.85rem' }}
              onClick={() => navigate('settings')}
            >
              設定頁面
            </button>{' '}
            輸入；或者您可直接使用內建示範教材體驗流程。
          </p>
        </div>
      )}

      <div
        className={`dropzone ${isDragging ? 'active' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            fileInputRef.current?.click()
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="點擊或拖曳檔案至此以上傳教材"
      >
        <div className="dropzone-icon" aria-hidden="true">
          📄
        </div>
        <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.35rem' }}>
          點擊選擇檔案，或將教材圖片／PDF 拖曳至此
        </p>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
          支援 JPG、PNG、WebP 或 PDF 檔案（建議單頁清晰翻拍）
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          style={{ display: 'none' }}
          onChange={handleFileChange}
          aria-hidden="true"
        />
      </div>

      <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleLoadSample}
          aria-label="載入範例教材：國語三上第一課"
        >
          ✨ 或直接載入範例教材體驗
        </button>
      </div>

      {uploadedFile && (
        <div
          style={{
            marginTop: '1.75rem',
            padding: '1rem 1.25rem',
            backgroundColor: 'var(--color-bg)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.98rem' }}>{uploadedFile.name}</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                大小：{formatFileSize(uploadedFile.size)} ｜ 格式：{uploadedFile.mimeType}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-danger"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
              onClick={() => setUploadedFile(null)}
              aria-label="移除目前選取的檔案"
            >
              移除
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          className="btn btn-primary"
          style={{ padding: '0.75rem 1.75rem', fontSize: '1.05rem' }}
          disabled={!uploadedFile}
          onClick={() => navigate('analyzing')}
          aria-label="前往下一步：開始 AI 分析"
        >
          開始 AI 結構化分析 →
        </button>
      </div>
    </div>
  )
}
