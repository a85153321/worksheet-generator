import React, { useState, useRef } from 'react'
import { useApp } from '../../app/index'

export const UploadPage: React.FC = () => {
  const {
    uploadedFile,
    setUploadedFile,
    analysisError,
    setAnalysisError,
    isAnalyzing,
    selectedGrade,
    setSelectedGrade,
    runAnalysis,
    navigate,
    hasApiKey,
  } = useApp()

  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    setAnalysisError(null)
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
    setAnalysisError(null)
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

  // 測試錯誤情境：故意注入 0 byte 空檔案以驗證 validation error
  const handleLoadEmptyFileError = () => {
    const emptyBlob = new Blob([], { type: 'image/png' })
    const invalidFile = {
      name: '',
      size: 0,
      mimeType: '',
      blob: emptyBlob,
    }
    setUploadedFile(invalidFile)
    runAnalysis(invalidFile)
  }

  const handleStartAnalysis = async () => {
    // 導向分析進度頁以獲得完整視覺體驗，或直接在當前頁執行
    navigate('analyzing')
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B (空檔案)'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="card">
      <div className="card-header">
        <h1 className="card-title">📁 步驟 1：教材上傳與設定</h1>
        <p className="card-subtitle">
          上傳國小國語教材圖片或講義，系統將協助提取生字、注音、部首、筆畫與詞句
        </p>
      </div>

      {/* API Key 狀態提示 */}
      {!hasApiKey && (
        <div className="callout callout-warning" role="region" aria-label="API Key 提醒">
          <div className="callout-title">⚠️ 尚未設定 Gemini API Key</div>
          <p>
            您目前尚未輸入個人 API Key。您可使用「示範教材」先行體驗完整排版流程；或點此{' '}
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0.2rem 0.55rem', fontSize: '0.85rem' }}
              onClick={() => navigate('settings')}
            >
              設定 API Key
            </button>
            。
          </p>
        </div>
      )}

      {/* 錯誤狀態呈現 (Error State) */}
      {analysisError && (
        <div
          className="callout callout-warning"
          style={{ borderColor: 'var(--color-danger)', backgroundColor: 'var(--color-danger-light)' }}
          role="alert"
        >
          <div className="callout-title" style={{ color: 'var(--color-danger)' }}>
            ❌ 分析請求失敗（{analysisError.type} 錯誤）
          </div>
          <p style={{ color: '#7f1d1d' }}>{analysisError.message}</p>
          {analysisError.retryable && (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}
              onClick={() => runAnalysis()}
            >
              🔄 重新嘗試
            </button>
          )}
        </div>
      )}

      {/* 上傳區域：未選取時為 Empty State，已選取時高亮 */}
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
          {uploadedFile ? '📄' : '📤'}
        </div>
        <p style={{ fontWeight: 700, fontSize: '1.15rem', marginBottom: '0.35rem' }}>
          {uploadedFile ? '已選取檔案，點擊可重新更換' : '拖曳教材檔案至此，或點擊此處瀏覽檔案'}
        </p>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
          支援 JPG、PNG、WebP 或 PDF 文件（單頁掃描或課本翻拍）
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

      {/* 快速載入與測試輔助按鈕 */}
      <div
        style={{
          marginTop: '1.25rem',
          display: 'flex',
          justifyContent: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleLoadSample}
          disabled={isAnalyzing}
          aria-label="載入內建範例教材"
        >
          ✨ 載入三上示範教材（學、習）
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}
          onClick={handleLoadEmptyFileError}
          disabled={isAnalyzing}
          title="測試分析服務驗證失敗路徑"
        >
          🧪 測試無效檔案（驗證失敗路徑）
        </button>
      </div>

      {/* 已選檔案資訊與年級 Context 設定 */}
      {uploadedFile && (
        <div
          style={{
            marginTop: '1.5rem',
            padding: '1.25rem',
            backgroundColor: 'var(--color-bg)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <p style={{ fontWeight: 700, fontSize: '1rem' }}>
                {uploadedFile.name || '（未命名檔案）'}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                檔案大小：{formatFileSize(uploadedFile.size)} ｜ 格式：
                {uploadedFile.mimeType || '未知格式'}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-danger"
              style={{ padding: '0.35rem 0.8rem', fontSize: '0.85rem' }}
              onClick={() => {
                setUploadedFile(null)
                setAnalysisError(null)
              }}
              disabled={isAnalyzing}
              aria-label="移除目前選取的檔案"
            >
              移除檔案
            </button>
          </div>

          <hr style={{ margin: '1rem 0', borderColor: 'var(--color-border)', opacity: 0.5 }} />

          {/* 教材語境：國小年級選擇 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <label htmlFor="grade-select" style={{ fontSize: '0.9rem', fontWeight: 600 }}>
              🎯 適用年級語境：
            </label>
            <select
              id="grade-select"
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(Number(e.target.value))}
              disabled={isAnalyzing}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                fontSize: '0.9rem',
                backgroundColor: 'var(--color-surface)',
              }}
            >
              <option value={1}>國小一年級（簡易字、拼音描紅）</option>
              <option value={2}>國小二年級（基礎部件、造詞）</option>
              <option value={3}>國小三年級（生字練習、例句仿寫）</option>
              <option value={4}>國小四年級（部首辨析、成語擴展）</option>
              <option value={5}>國小五年級（進階修辭、短文應用）</option>
              <option value={6}>國小六年級（深度鑑賞、閱讀素養）</option>
            </select>
          </div>
        </div>
      )}

      {/* 底部發起按鈕 */}
      <div
        style={{
          marginTop: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          {uploadedFile
            ? '點選按鈕後將發送請求並驗證資料'
            : '⚠️ 請先選擇教材檔案或載入範例教材'}
        </span>
        <button
          type="button"
          className="btn btn-primary"
          style={{ padding: '0.75rem 1.85rem', fontSize: '1.05rem' }}
          disabled={!uploadedFile || isAnalyzing}
          onClick={handleStartAnalysis}
          aria-label="前往分析進度並開始 AI 結構化分析"
        >
          {isAnalyzing ? (
            <>
              <span className="spinner-sm" aria-hidden="true"></span>
              <span>分析中...</span>
            </>
          ) : (
            '開始 AI 結構化分析 →'
          )}
        </button>
      </div>
    </div>
  )
}
