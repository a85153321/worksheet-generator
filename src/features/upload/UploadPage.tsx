import React, { useState, useRef } from 'react'
import { useApp } from '../../app/index'
import type { UploadedFileInfo } from '../../app/app-context'

// 簡易從 PDF 二進位資料偵測頁數
async function detectPdfPageCount(file: Blob): Promise<number> {
  try {
    const slice = file.slice(0, 400000)
    const buffer = await slice.arrayBuffer()
    const text = new TextDecoder('latin1').decode(buffer)
    const countMatch =
      text.match(/\/Type\s*\/Pages[^>]*\/Count\s+(\d+)/i) ||
      text.match(/\/Count\s+(\d+)/i)
    if (countMatch && parseInt(countMatch[1], 10) > 0) {
      return Math.min(parseInt(countMatch[1], 10), 20)
    }
    const pageMatches = text.match(/\/Type\s*\/Page[^s]/gi)
    if (pageMatches && pageMatches.length > 0) {
      return Math.min(pageMatches.length, 20)
    }
  } catch {
    // 容錯處理
  }
  return 3 // 預設 3 頁供選頁
}

export const UploadPage: React.FC = () => {
  const {
    uploadedFile,
    setUploadedFile,
    setSelectedPages,
    analysisScope,
    analysisError,
    setAnalysisError,
    isAnalyzing,
    runAnalysis,
    runTypedAnalysis,
    analysisInputMode,
    typedCharacters,
    navigate,
    hasApiKey,
  } = useApp()

  const [activeTab, setActiveTab] = useState<'upload' | 'typed'>(
    analysisInputMode === 'typed' ? 'typed' : 'upload'
  )
  const [isDragging, setIsDragging] = useState(false)
  const [typedInput, setTypedInput] = useState(
    typedCharacters && typedCharacters.length > 0 ? typedCharacters.join('、') : ''
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parsedCharacters = React.useMemo(() => {
    return Array.from(new Set([...typedInput].filter((c) => /\p{Script=Han}/u.test(c))))
  }, [typedInput])

  const handleTabKeyDown = (e: React.KeyboardEvent, currentTab: 'upload' | 'typed') => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      const nextTab = currentTab === 'upload' ? 'typed' : 'upload'
      setActiveTab(nextTab)
      setAnalysisError(null)
    } else if (e.key === 'Home') {
      e.preventDefault()
      setActiveTab('upload')
      setAnalysisError(null)
    } else if (e.key === 'End') {
      e.preventDefault()
      setActiveTab('typed')
      setAnalysisError(null)
    }
  }

  const handleFileProcess = async (file: File) => {
    setAnalysisError(null)
    const isPdf =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')

    let previewUrl: string | undefined
    let pageCount: number
    const initialSelectedPages = [1]

    if (isPdf) {
      pageCount = await detectPdfPageCount(file)
    } else {
      previewUrl = URL.createObjectURL(file)
      pageCount = 1
    }

    setUploadedFile({
      name: file.name,
      size: file.size,
      mimeType: file.type || (isPdf ? 'application/pdf' : 'image/png'),
      blob: file,
      previewUrl,
      isPdf,
      pageCount,
      selectedPages: initialSelectedPages,
    })
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0])
    }
  }

  // 載入示範圖片教材
  const handleLoadSampleImage = () => {
    setAnalysisError(null)
    // 建立簡易示範 SVG 圖片 Blob
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="260" viewBox="0 0 400 260">
      <rect width="100%" height="100%" fill="#fef9c3"/>
      <text x="50%" y="30%" font-size="24" text-anchor="middle" fill="#854d0e" font-family="sans-serif">國小國語三上 第一課</text>
      <text x="50%" y="55%" font-size="36" text-anchor="middle" fill="#1e293b" font-family="serif">【學】與【習】</text>
      <text x="50%" y="80%" font-size="16" text-anchor="middle" fill="#475569">教材圖片示範樣本</text>
    </svg>`
    const sampleBlob = new Blob([svgContent], { type: 'image/svg+xml' })
    const previewUrl = URL.createObjectURL(sampleBlob)

    setUploadedFile({
      name: '國語三上_第一課_教材圖片.png',
      size: 1024 * 180,
      mimeType: 'image/png',
      blob: sampleBlob,
      previewUrl,
      isPdf: false,
      pageCount: 1,
      selectedPages: [1],
    })
  }

  // 測試驗證失敗路徑
  const handleLoadEmptyFileError = () => {
    const emptyBlob = new Blob([], { type: 'image/png' })
    const invalidFile: UploadedFileInfo = {
      name: '',
      size: 0,
      mimeType: '',
      blob: emptyBlob,
      pageCount: 1,
      selectedPages: [1],
    }
    setUploadedFile(invalidFile)
    runAnalysis(invalidFile)
  }

  // PDF 切換單頁勾選
  const togglePageSelection = (pageNum: number) => {
    if (!uploadedFile) return
    const currentSelected = uploadedFile.selectedPages || []
    let nextSelected: number[]
    if (currentSelected.includes(pageNum)) {
      nextSelected = currentSelected.filter((p) => p !== pageNum)
    } else {
      nextSelected = [...currentSelected, pageNum].sort((a, b) => a - b)
    }
    setSelectedPages(nextSelected)
  }

  // PDF 快速選擇功能
  const selectAllPages = () => {
    if (!uploadedFile || !uploadedFile.pageCount) return
    const all = Array.from({ length: uploadedFile.pageCount }, (_, i) => i + 1)
    setSelectedPages(all)
  }

  const selectFirstPageOnly = () => {
    setSelectedPages([1])
  }

  const clearPageSelection = () => {
    setSelectedPages([])
  }

  // 昂貴操作：點擊時才觸發 runAnalysis
  const handleTriggerAnalysis = async () => {
    if (!uploadedFile) return
    navigate('analyzing')
    runAnalysis()
  }

  const handleTypedAnalysis = () => {
    if (parsedCharacters.length === 0) return
    navigate('analyzing')
    void runTypedAnalysis(parsedCharacters)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B (空檔案)'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const selectedPages = uploadedFile?.selectedPages || []
  const hasPagesSelected = selectedPages.length > 0

  return (
    <div className="card">
      <div className="card-header">
        <h1 className="card-title">📁 步驟 1：教材生字來源</h1>
        <p className="card-subtitle">
          支援上傳課文圖片／PDF 文件進行 AI 辨識，或直接輸入欲練習之生字清單
        </p>
      </div>

      {/* 分頁切換列：上傳檔案 vs 直接輸入生字 */}
      <div className="input-mode-tabs" role="tablist" aria-label="教材輸入方式切換">
        <button
          type="button"
          role="tab"
          id="tab-upload"
          aria-selected={activeTab === 'upload'}
          aria-controls="tabpanel-upload"
          tabIndex={activeTab === 'upload' ? 0 : -1}
          className={`input-mode-tab ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('upload')
            setAnalysisError(null)
          }}
          onKeyDown={(e) => handleTabKeyDown(e, 'upload')}
        >
          <span>📄 上傳圖片／PDF 教材</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-typed"
          aria-selected={activeTab === 'typed'}
          aria-controls="tabpanel-typed"
          tabIndex={activeTab === 'typed' ? 0 : -1}
          className={`input-mode-tab ${activeTab === 'typed' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('typed')
            setAnalysisError(null)
          }}
          onKeyDown={(e) => handleTabKeyDown(e, 'typed')}
        >
          <span>⌨️ 直接輸入生字</span>
          <span className="tab-badge">免檔案</span>
        </button>
      </div>

      {/* API Key 狀態提醒 */}
      {!hasApiKey && (
        <div className="callout callout-warning" role="region" aria-label="API Key 提醒">
          <div className="callout-title">⚠️ 尚未設定 Gemini API Key</div>
          <p>
            您目前尚未輸入個人 API Key。您仍可選取或載入示範教材體驗流程；若需進行真實 AI 分析，請至{' '}
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0.2rem 0.55rem', fontSize: '0.85rem' }}
              onClick={() => navigate('settings')}
            >
              設定頁面
            </button>{' '}
            輸入。
          </p>
        </div>
      )}

      {/* 錯誤狀態呈現 */}
      {analysisError && (
        <div
          className="callout callout-warning"
          style={{ borderColor: 'var(--color-danger)', backgroundColor: 'var(--color-danger-light)' }}
          role="alert"
        >
          <div className="callout-title" style={{ color: 'var(--color-danger)' }}>
            ❌ 分析驗證未通過（{analysisError.type}）
          </div>
          <p style={{ color: '#7f1d1d' }}>{analysisError.message}</p>
        </div>
      )}

      {/* 模式一：上傳圖片／PDF 教材 */}
      <div
        role="tabpanel"
        id="tabpanel-upload"
        aria-labelledby="tab-upload"
        hidden={activeTab !== 'upload'}
      >
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
        aria-label="點擊或拖曳教材圖片或 PDF 檔案至此上傳"
      >
        <div className="dropzone-icon" aria-hidden="true">
          {uploadedFile ? (uploadedFile.isPdf ? '📑' : '🖼️') : '📤'}
        </div>
        <p style={{ fontWeight: 700, fontSize: '1.15rem', marginBottom: '0.35rem' }}>
          {uploadedFile ? `已選取：${uploadedFile.name}（點擊可重選）` : '拖曳教材圖片／PDF 至此，或點擊瀏覽檔案'}
        </p>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
          支援 JPG、PNG、WebP 圖片，或多頁 PDF 教材講義（PDF 於上傳後可直接選頁）
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,application/pdf"
          style={{ display: 'none' }}
          onChange={handleFileChange}
          aria-hidden="true"
        />
      </div>

      {/* 快速載入示範教材 */}
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
          onClick={handleLoadSampleImage}
          disabled={isAnalyzing}
          aria-label="載入單頁圖片教材示範"
        >
          🖼️ 載入示範圖片教材（學、習）
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}
          onClick={handleLoadEmptyFileError}
          disabled={isAnalyzing}
          title="測試驗證失敗路徑"
        >
          🧪 測試空檔案錯誤
        </button>
      </div>

      {/* 已選取檔案詳情與縮圖／選頁控制區 */}
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>{uploadedFile.isPdf ? '📑' : '🖼️'}</span>
                <span>{uploadedFile.name || '（未命名檔案）'}</span>
                <span className="tag tag-info">
                  {uploadedFile.isPdf ? `PDF 共 ${uploadedFile.pageCount || 1} 頁` : '單頁圖片'}
                </span>
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                大小：{formatFileSize(uploadedFile.size)} ｜ 格式：{uploadedFile.mimeType}
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
              aria-label="移除目前檔案"
            >
              移除檔案
            </button>
          </div>

          <hr style={{ margin: '1rem 0', borderColor: 'var(--color-border)', opacity: 0.5 }} />

          {/* 圖片預覽縮圖 */}
          {!uploadedFile.isPdf && uploadedFile.previewUrl && (
            <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.5rem', textAlign: 'left' }}>
                📷 圖片教材預覽：
              </p>
              <img
                src={uploadedFile.previewUrl}
                alt="教材預覽圖"
                className="image-preview-thumb"
              />
            </div>
          )}

          {/* PDF 多頁縮圖選頁網格 (Requirement 1) */}
          {uploadedFile.isPdf && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <p style={{ fontSize: '0.92rem', fontWeight: 700 }}>
                  📄 PDF 頁面縮圖選頁（已勾選 {selectedPages.length} / {uploadedFile.pageCount || 1} 頁）：
                </p>
                <div className="btn-group">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}
                    onClick={selectAllPages}
                    aria-label="全選所有頁面"
                  >
                    全選
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}
                    onClick={selectFirstPageOnly}
                    aria-label="僅選取第 1 頁"
                  >
                    僅選第 1 頁
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}
                    onClick={clearPageSelection}
                    aria-label="清空所有頁面選取"
                  >
                    清空
                  </button>
                </div>
              </div>

              {/* 頁面縮圖列表 */}
              <div className="pdf-page-grid" role="group" aria-label="PDF 頁面勾選">
                {Array.from({ length: uploadedFile.pageCount || 1 }, (_, i) => i + 1).map((pageNum) => {
                  const isSelected = selectedPages.includes(pageNum)
                  return (
                    <div
                      key={`pdf-page-${pageNum}`}
                      className={`pdf-page-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => togglePageSelection(pageNum)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          togglePageSelection(pageNum)
                        }
                      }}
                      role="checkbox"
                      aria-checked={isSelected}
                      tabIndex={0}
                      aria-label={`PDF 第 ${pageNum} 頁，${isSelected ? '已選取' : '未選取'}`}
                    >
                      {/* 模擬課文頁面視覺縮圖 */}
                      <div className="pdf-mock-thumb" aria-hidden="true">
                        <div className="pdf-mock-title"></div>
                        <div className="pdf-mock-line" style={{ width: '90%' }}></div>
                        <div className="pdf-mock-line"></div>
                        <div className="pdf-mock-img">🖼️</div>
                        <div className="pdf-mock-line" style={{ width: '75%' }}></div>
                        <div className="pdf-mock-line" style={{ width: '85%' }}></div>
                      </div>

                      <div className="pdf-page-badge">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // 由外層 div 處理 click
                          style={{ pointerEvents: 'none', cursor: 'pointer' }}
                          aria-hidden="true"
                        />
                        <span>第 {pageNum} 頁</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {!hasPagesSelected && (
                <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginTop: '0.6rem', fontWeight: 600 }}>
                  ⚠️ 目前尚未選取任何頁面，請至少勾選 1 頁 PDF 才能發起分析。
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* 本次動作的預估處理範圍卡片 (Requirement 2 & PROJECT.md 第 6 節) */}
      {uploadedFile && (
        <div className="scope-card" role="region" aria-label="本次動作的預估處理範圍">
          <div className="scope-card-header">
            <strong style={{ color: 'var(--color-primary-dark)', fontSize: '1.02rem' }}>
              📊 本次動作的預估處理範圍
            </strong>
            <span className="tag tag-info">依 PROJECT.md 第 6 節規範</span>
          </div>

          <div className="scope-grid">
            <div>
              <strong>處理檔案：</strong> {uploadedFile.name}（{uploadedFile.isPdf ? 'PDF 文件' : '圖片'}）
            </div>
            <div>
              <strong>處理頁數：</strong>{' '}
              {uploadedFile.isPdf
                ? `${analysisScope.pageCount} 頁（第 ${analysisScope.selectedPages.join('、')} 頁）`
                : '1 頁'}
            </div>
            <div>
              <strong>預估提取項目：</strong> 將依教材內容辨識生字數量
            </div>
          </div>

          <p className="scope-disclaimer">
            ℹ️ 守則提醒：此處明確顯示已選取之教材頁數，供教師評估本次分析規模；本系統絕不承諾或猜測第三方 AI 之實際 Quota / Token 費用。
          </p>
        </div>
      )}

      {/* 底部明確觸發按鈕 (Requirement 3: 只能由使用者按鈕觸發) */}
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
            ? hasPagesSelected
              ? `已選取 ${uploadedFile.isPdf ? `${selectedPages.length} 頁 PDF` : '1 張圖片'}，點擊按鈕明確啟動分析`
              : '⚠️ 請至少選取 1 個頁面'
            : '⚠️ 請先選擇教材檔案或載入示範教材'}
        </span>

        <button
          type="button"
          className="btn btn-primary"
          style={{ padding: '0.75rem 2rem', fontSize: '1.05rem' }}
          disabled={!uploadedFile || !hasPagesSelected || isAnalyzing}
          onClick={handleTriggerAnalysis}
          aria-label="明確發起 AI 結構化教材分析"
        >
          {isAnalyzing ? (
            <>
              <span className="spinner-sm" aria-hidden="true"></span>
              <span>分析處理中...</span>
            </>
          ) : (
            '🚀 開始 AI 結構化分析 →'
          )}
        </button>
      </div>
      </div>

      {/* 模式二：直接輸入生字 */}
      <div
        role="tabpanel"
        id="tabpanel-typed"
        aria-labelledby="tab-typed"
        hidden={activeTab !== 'typed'}
        className="typed-panel"
      >
        {/* 指引說明卡片 */}
        <div className="typed-guide-box">
          <div className="typed-guide-box-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>⌨️</span>
              <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>直接輸入欲練習之生字</strong>
            </div>
            <span className="tag tag-success">本機離線字典 0 Quota</span>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', margin: '0.3rem 0 0' }}>
            輸入格式極具彈性：可直接連續輸入（例如：<strong>學習快樂</strong>）、以逗號或頓號分隔（例如：<strong>學、習、快、樂</strong> 或 <strong>學, 習, 快, 樂</strong>）、或是以空格或換行分隔（每行一字）。系統將自動過濾標點符號並去除重複字。
          </p>
        </div>

        {/* 輸入框與範例按鈕 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <label htmlFor="typed-characters-input" style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--color-text-main)' }}>
              請輸入或貼上生字清單：
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}
                onClick={() => setTypedInput('學、習、春、暖')}
              >
                💡 填入範例：學、習、春、暖
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}
                onClick={() => setTypedInput('山、水、風、雨')}
              >
                💡 填入範例：山、水、風、雨
              </button>
              {typedInput && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                  onClick={() => setTypedInput('')}
                  aria-label="清空輸入內容"
                >
                  ✕ 清空
                </button>
              )}
            </div>
          </div>

          <textarea
            id="typed-characters-input"
            value={typedInput}
            onChange={(e) => setTypedInput(e.target.value)}
            rows={4}
            placeholder="請在此輸入生字，例如：&#10;學、習、快、樂&#10;或是每行一個字：&#10;春&#10;暖&#10;花&#10;開"
            aria-label="直接輸入生字"
            className="typed-textarea"
          />
        </div>

        {/* 即時解析與預覽生字徽章卡片 */}
        <div className="typed-preview-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#334155' }}>
              {parsedCharacters.length > 0 ? (
                <span>
                  ✓ 即時解析：已識別出 <strong>{parsedCharacters.length}</strong> 個生字（已去除重複字與標點符號）：
                </span>
              ) : (
                <span style={{ color: '#94a3b8' }}>
                  ℹ️ 尚未偵測到有效中文字元，請在上方輸入框輸入生字。
                </span>
              )}
            </div>
          </div>

          {parsedCharacters.length > 0 && (
            <div className="typed-char-chips" aria-label="已識別之生字清單">
              {parsedCharacters.map((char, index) => (
                <span key={`${char}-${index}`} className="typed-char-chip" title={`生字第 ${index + 1} 個：${char}`}>
                  {char}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Quota 與 AI 處理說明 */}
        <div className="callout callout-info" style={{ marginTop: '0.5rem' }}>
          <div className="callout-title" style={{ fontSize: '0.9rem' }}>💡 處理範圍與 Quota 說明</div>
          <ul style={{ fontSize: '0.85rem', color: '#334155', paddingLeft: '1.2rem', margin: '0.3rem 0 0' }}>
            <li><strong>本機 CNS11643 查表（0 Quota）</strong>：標準注音、部首與筆畫由內建教育部標準字庫離線查出，完全不消耗 API 配額。</li>
            <li><strong>Gemini 純文字輔助</strong>：僅在按下「開始分析生字」後發送 1 次純文字請求生成各生字之常用詞語與課文情境例句（不含圖片 token，成本極低）。</li>
            <li><strong>明確觸發原則</strong>：輸入過程中絕不發送網路請求，僅在點擊下方按鈕後才開始執行分析。</li>
          </ul>
        </div>

        {/* 底部明確觸發按鈕 */}
        <div
          style={{
            marginTop: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            {parsedCharacters.length > 0
              ? `已就緒 ${parsedCharacters.length} 個生字，點擊按鈕啟動分析`
              : '⚠️ 請先在上方輸入至少 1 個國字生字'}
          </span>

          <button
            type="button"
            className="btn btn-primary"
            style={{ padding: '0.75rem 2rem', fontSize: '1.05rem', fontWeight: 700 }}
            disabled={parsedCharacters.length === 0 || isAnalyzing}
            onClick={handleTypedAnalysis}
            aria-label="明確發起直接輸入生字分析"
          >
            {isAnalyzing ? (
              <>
                <span className="spinner-sm" aria-hidden="true"></span>
                <span>分析處理中...</span>
              </>
            ) : (
              `🚀 開始分析生字 ${parsedCharacters.length > 0 ? `(${parsedCharacters.length} 字) ` : ''}→`
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
