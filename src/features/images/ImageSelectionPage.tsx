import React, { useState, useRef, useEffect } from 'react'
import { useApp } from '../../app/index'
import { generateSelectedImage, type ImageResult } from '../../services'
import type { CharacterAnalysis } from '../../domain'

export const ImageSelectionPage: React.FC = () => {
  const {
    analysisResult,
    setAnalysisResult,
    generatedImages,
    setGeneratedImages,
    hasApiKey,
    navigate,
  } = useApp()

  // 批次與個別生成狀態
  const [isBatchGenerating, setIsBatchGenerating] = useState(false)
  const [generatingCharacter, setGeneratingCharacter] = useState<string | null>(null)
  const [progressInfo, setProgressInfo] = useState<{ current: number; total: number; char: string } | null>(null)

  // 錯誤與提示狀態
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isQuotaError, setIsQuotaError] = useState(false)
  const [successNotice, setSuccessNotice] = useState<string | null>(null)

  // 放大預覽 Modal
  const [previewModalImage, setPreviewModalImage] = useState<ImageResult | null>(null)

  // 提示詞即時自訂編輯
  const [editingPromptChar, setEditingPromptChar] = useState<string | null>(null)
  const [tempPrompt, setTempPrompt] = useState<string>('')

  // 隱藏的自訂圖片上傳 input ref
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const characters = analysisResult?.characters || []
  const isEmpty = characters.length === 0

  // 監聽 ESC 關閉預覽彈窗
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreviewModalImage(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // 1. 空狀態處理 (Requirement 3)
  if (isEmpty) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon" aria-hidden="true">
            📭
          </div>
          <h2 className="empty-state-title">目前尚無生字資料可供配圖</h2>
          <p className="empty-state-desc">
            尚未進行教材分析，或生字清單已被全部移除。請先返回教材上傳頁上傳內容，或在審核編輯頁載入生字。
          </p>
          <div className="btn-group" style={{ justifyContent: 'center' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('upload')}>
              ← 返回教材上傳
            </button>
            <button type="button" className="btn btn-primary" onClick={() => navigate('review')}>
              前往生字審核編輯 →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 統計數字
  const totalCount = characters.length
  const selectedCount = characters.filter((c) => c.imageSuggestion?.selected).length
  const generatedCount = characters.filter((c) => Boolean(generatedImages[c.character])).length
  const ungeneratedCount = totalCount - generatedCount
  const isAnyGenerating = isBatchGenerating || Boolean(generatingCharacter)

  // 勾選切換
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

  // 批量全選／全取消／僅勾選未生成者
  const handleSelectAll = (select: boolean) => {
    if (!analysisResult) return
    const updated = analysisResult.characters.map((item) => {
      if (!item.imageSuggestion) {
        return {
          ...item,
          imageSuggestion: {
            prompt: `生字「${item.character}」之國小教學情境插畫，風格溫馨活潑、筆觸清晰`,
            rationale: '提供視覺輔助，加強字義聯想',
            selected: select,
          },
        }
      }
      return {
        ...item,
        imageSuggestion: {
          ...item.imageSuggestion,
          selected: select,
        },
      }
    })
    setAnalysisResult({ characters: updated })
  }

  const handleSelectUngeneratedOnly = () => {
    if (!analysisResult) return
    const updated = analysisResult.characters.map((item) => {
      const hasImg = Boolean(generatedImages[item.character])
      if (!item.imageSuggestion) {
        return {
          ...item,
          imageSuggestion: {
            prompt: `生字「${item.character}」之國小教學情境插畫`,
            rationale: '視覺圖像輔助',
            selected: !hasImg,
          },
        }
      }
      return {
        ...item,
        imageSuggestion: {
          ...item.imageSuggestion,
          selected: !hasImg,
        },
      }
    })
    setAnalysisResult({ characters: updated })
  }

  // 編輯建議 Prompt
  const handleStartEditPrompt = (char: string, currentPrompt: string) => {
    setEditingPromptChar(char)
    setTempPrompt(currentPrompt)
  }

  const handleSavePrompt = (index: number) => {
    if (!analysisResult) return
    const trimmed = tempPrompt.trim()
    if (!trimmed) return
    const updated = [...analysisResult.characters]
    const item = updated[index]
    if (item.imageSuggestion) {
      updated[index] = {
        ...item,
        imageSuggestion: {
          ...item.imageSuggestion,
          prompt: trimmed,
        },
      }
      setAnalysisResult({ characters: updated })
    }
    setEditingPromptChar(null)
    setSuccessNotice(`已更新生字「${item.character}」的配圖 Prompt！`)
    setTimeout(() => setSuccessNotice(null), 3000)
  }

  // 刪除已生成的圖片 (Requirement 1)
  const handleDeleteImage = (character: string) => {
    if (window.confirm(`確定要刪除生字「${character}」已生成的配圖嗎？刪除後仍可重新生成或上傳。`)) {
      setGeneratedImages((prev) => {
        const next = { ...prev }
        delete next[character]
        return next
      })
      if (previewModalImage?.character === character) {
        setPreviewModalImage(null)
      }
      setSuccessNotice(`已刪除生字「${character}」的配圖。`)
      setTimeout(() => setSuccessNotice(null), 3000)
    }
  }

  // 本機自訂圖片上傳替換 (Requirement 1: 替換已生成的圖片)
  const handleTriggerUpload = (character: string) => {
    fileInputRefs.current[character]?.click()
  }

  const handleFileChange = (character: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('請選取有效的圖檔（PNG、JPEG、SVG、WebP 等）。')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const customImg: ImageResult = {
        id: `local-custom-${encodeURIComponent(character)}-${Date.now()}`,
        character,
        prompt: '教師手動上傳之自訂教學插圖',
        url: dataUrl,
        mimeType: (file.type as ImageResult['mimeType']) || 'image/png',
        source: 'generated',
        createdAt: new Date().toISOString(),
      }
      setGeneratedImages((prev) => ({
        ...prev,
        [character]: customImg,
      }))
      setSuccessNotice(`已成功為生字「${character}」更換為自訂上傳圖片！`)
      setTimeout(() => setSuccessNotice(null), 3000)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // 單張生成／重新生成 (Requirement 1 & 2: 明確按鈕觸發)
  const handleSingleGenerate = async (item: CharacterAnalysis, index: number) => {
    if (isAnyGenerating) return
    setErrorMessage(null)
    setIsQuotaError(false)
    setGeneratingCharacter(item.character)

    // 確保 item.imageSuggestion.selected 為 true 以符合 service 契約
    let itemToGenerate = item
    if (!item.imageSuggestion?.selected) {
      if (analysisResult) {
        const updated = [...analysisResult.characters]
        itemToGenerate = {
          ...item,
          imageSuggestion: {
            ...(item.imageSuggestion || {
              prompt: `生字「${item.character}」之國小教學情境插畫`,
              rationale: '提供視覺輔助',
            }),
            selected: true,
          },
        }
        updated[index] = itemToGenerate
        setAnalysisResult({ characters: updated })
      }
    }

    try {
      const res = await generateSelectedImage(itemToGenerate)
      if (res.ok) {
        setGeneratedImages((prev) => ({
          ...prev,
          [item.character]: res.value,
        }))
        setSuccessNotice(`生字「${item.character}」配圖已順利生成！`)
        setTimeout(() => setSuccessNotice(null), 3000)
      } else {
        setErrorMessage(`生成「${item.character}」配圖失敗：${res.error.message}`)
        if (res.error.type === 'quota' || res.error.message.toLowerCase().includes('quota')) {
          setIsQuotaError(true)
        }
      }
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : '圖片生成時發生非預期錯誤。')
    } finally {
      setGeneratingCharacter(null)
    }
  }

  // 批量生成已勾選配圖 (Requirement 2: 明確按鈕觸發，且只送出已勾選項目)
  const handleBatchGenerate = async () => {
    const selectedItems = characters.filter((c) => c.imageSuggestion?.selected)
    if (selectedItems.length === 0 || isAnyGenerating) return

    setIsBatchGenerating(true)
    setErrorMessage(null)
    setIsQuotaError(false)
    setSuccessNotice(null)

    let successCount = 0
    let failedCount = 0

    try {
      for (let i = 0; i < selectedItems.length; i++) {
        const item = selectedItems[i]
        setGeneratingCharacter(item.character)
        setProgressInfo({ current: i + 1, total: selectedItems.length, char: item.character })

        const res = await generateSelectedImage(item)
        if (res.ok) {
          setGeneratedImages((prev) => ({
            ...prev,
            [item.character]: res.value,
          }))
          successCount++
        } else {
          failedCount++
          setErrorMessage(`生成「${item.character}」配圖失敗：${res.error.message}`)
          if (res.error.type === 'quota' || res.error.message.toLowerCase().includes('quota')) {
            setIsQuotaError(true)
            break // Quota 耗盡時中斷後續請求
          }
        }
      }

      if (failedCount === 0) {
        setSuccessNotice(`已順利完成 ${successCount} 張配圖生成！`)
        setTimeout(() => setSuccessNotice(null), 3500)
      }
    } catch {
      setErrorMessage('圖片生成過程中發生非預期錯誤。')
    } finally {
      setIsBatchGenerating(false)
      setGeneratingCharacter(null)
      setProgressInfo(null)
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="card-title">🎨 步驟 4：生字教學配圖選擇</h1>
            <p className="card-subtitle">
              為生字挑選情境插圖以強化圖像記憶；圖片生成為昂貴操作，系統只會為您已勾選的項目送出請求
            </p>
          </div>
          <div className="tag tag-info" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
            已生成完成：{generatedCount} / {totalCount} 張
          </div>
        </div>
      </div>

      {/* Quota / 額度與費用提示橫幅 (Requirement 3 & PROJECT.md 第 6 節) */}
      <div className="callout callout-warning" role="region" aria-label="配額與費用提示">
        <div className="callout-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span>⚠️ 費用與 API 配額提示</span>
        </div>
        <div style={{ fontSize: '0.9rem', lineHeight: 1.5, marginTop: '0.25rem' }}>
          <p>
            • <strong>本次動作預估處理範圍</strong>：已勾選 <strong>{selectedCount}</strong> 個生字項目（預計送出 <strong>{selectedCount}</strong> 次圖片生成請求）。
          </p>
          <p style={{ marginTop: '0.3rem' }}>
            • 依 PROJECT.md 第 6 節規範，圖片生成為高消耗操作，建議優先勾選低年級或難字。未勾選配圖之生字將以標準田字格與筆順呈現，學習單功能依然完整，排版輸出不受影響。
          </p>
          <p style={{ marginTop: '0.3rem', color: '#92400e' }}>
            • 本系統不會亦無法猜測或承諾實際費用，實際用量請以 Google AI Studio 官方後台為主。
          </p>
          {!hasApiKey && (
            <div
              style={{
                marginTop: '0.6rem',
                padding: '0.5rem 0.75rem',
                backgroundColor: '#fef3c7',
                borderRadius: '4px',
                border: '1px dashed #d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <span>🔑 <strong>目前為 Mock 模式</strong>：未設定個人 Gemini API Key，生成圖片將以本機 SVG 向量預覽呈現，不消耗真實配額。</span>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
                onClick={() => navigate('settings')}
              >
                前往金鑰設定
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 成功狀態通知 */}
      {successNotice && (
        <div
          className="callout"
          style={{
            borderColor: 'var(--color-success)',
            backgroundColor: 'var(--color-success-light)',
            color: '#065f46',
            marginBottom: '1rem',
          }}
          role="status"
          aria-live="polite"
        >
          ✅ {successNotice}
        </div>
      )}

      {/* 錯誤與 Quota 超額狀態呈現 (Requirement 3: error/quota 清楚呈現) */}
      {errorMessage && (
        <div
          className="callout callout-warning"
          style={{
            borderColor: 'var(--color-danger)',
            backgroundColor: 'var(--color-danger-light)',
            marginBottom: '1rem',
          }}
          role="alert"
        >
          <div className="callout-title" style={{ color: 'var(--color-danger)' }}>
            {isQuotaError ? '🚨 API 配額已達上限 (Quota Exceeded)' : '❌ 圖片生成失敗'}
          </div>
          <p style={{ color: '#7f1d1d', marginTop: '0.25rem' }}>{errorMessage}</p>
          {isQuotaError && (
            <p style={{ color: '#991b1b', fontSize: '0.88rem', marginTop: '0.4rem' }}>
              💡 建議：可稍後再試、更換 API Key，或直接使用「📁 自訂上傳」使用您自備的教材圖片，無須消耗任何 AI 配額。
            </p>
          )}
        </div>
      )}

      {/* 生成中進度條與狀態呈現 (Requirement 3: loading 狀態清楚呈現) */}
      {isBatchGenerating && progressInfo && (
        <div
          style={{
            border: '2px solid var(--color-primary)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            backgroundColor: 'var(--color-primary-light)',
            marginBottom: '1.5rem',
            textAlign: 'center',
          }}
          role="status"
          aria-live="polite"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span className="spinner-sm" style={{ width: '1.25rem', height: '1.25rem' }} aria-hidden="true"></span>
            <strong style={{ color: 'var(--color-primary-dark)', fontSize: '1.05rem' }}>
              正在生成第 {progressInfo.current} / {progressInfo.total} 張：生字「{progressInfo.char}」...
            </strong>
          </div>
          <div
            style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#e2e8f0',
              borderRadius: '4px',
              overflow: 'hidden',
              marginTop: '0.75rem',
            }}
          >
            <div
              style={{
                width: `${(progressInfo.current / progressInfo.total) * 100}%`,
                height: '100%',
                backgroundColor: 'var(--color-primary)',
                transition: 'width 0.3s ease',
              }}
            ></div>
          </div>
        </div>
      )}

      {/* 工具列：批次勾選控制與生成按鈕 (Requirement 1 & 2) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '0.85rem 1.15rem',
          backgroundColor: 'var(--color-bg)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, marginRight: '0.25rem' }}>
            勾選操作：
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '0.3rem 0.65rem', fontSize: '0.85rem' }}
            onClick={() => handleSelectAll(true)}
            disabled={isAnyGenerating}
          >
            ☑️ 全選配圖 ({totalCount})
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '0.3rem 0.65rem', fontSize: '0.85rem' }}
            onClick={() => handleSelectAll(false)}
            disabled={isAnyGenerating}
          >
            ◻️ 全部取消
          </button>
          {ungeneratedCount > 0 && (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0.3rem 0.65rem', fontSize: '0.85rem' }}
              onClick={handleSelectUngeneratedOnly}
              disabled={isAnyGenerating}
            >
              🎯 僅勾選未生成 ({ungeneratedCount})
            </button>
          )}
        </div>

        {/* 明確按鈕觸發生成 (Requirement 2) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleBatchGenerate}
            disabled={selectedCount === 0 || isAnyGenerating}
            aria-label="批次生成已勾選項目的配圖"
          >
            {isBatchGenerating ? (
              <>
                <span className="spinner-sm" aria-hidden="true"></span>
                <span>生成處理中...</span>
              </>
            ) : (
              `🖼️ 批量生成已勾選配圖 (${selectedCount} 張)`
            )}
          </button>
        </div>
      </div>

      {/* 生字配圖卡片清單 (Requirement 1: 勾選、預覽、替換或刪除) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {characters.map((item: CharacterAnalysis, idx: number) => {
          const suggestion = item.imageSuggestion
          const isSelected = Boolean(suggestion?.selected)
          const imageObj = generatedImages[item.character]
          const hasImage = Boolean(imageObj)
          const isItemGenerating = generatingCharacter === item.character
          const isEditingThisPrompt = editingPromptChar === item.character

          return (
            <article
              key={`${item.character}-${idx}`}
              style={{
                border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                backgroundColor: isSelected ? 'var(--color-primary-light)' : 'var(--color-surface)',
                boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.2s ease',
              }}
              aria-label={`生字「${item.character}」配圖選項`}
            >
              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* 1. 勾選 Checkbox (Requirement 1) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '160px' }}>
                  <input
                    id={`check-image-${item.character}`}
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleImageSelect(idx)}
                    disabled={isAnyGenerating}
                    style={{
                      width: '1.35rem',
                      height: '1.35rem',
                      cursor: isAnyGenerating ? 'not-allowed' : 'pointer',
                      accentColor: 'var(--color-primary)',
                    }}
                    aria-label={`勾選生字「${item.character}」需生成配圖`}
                  />

                  <div>
                    <label
                      htmlFor={`check-image-${item.character}`}
                      style={{
                        fontSize: '1.75rem',
                        fontWeight: 700,
                        cursor: isAnyGenerating ? 'not-allowed' : 'pointer',
                        color: 'var(--color-primary-dark)',
                        fontFamily: "'DFKai-SB', 'BiauKai', 'KaiTi', serif",
                        display: 'block',
                        lineHeight: 1,
                      }}
                    >
                      {item.character}
                    </label>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                      {item.zhuyin} ｜ {item.radical}部 {item.strokeCount}畫
                    </div>
                  </div>
                </div>

                {/* 2. 預覽建議內容（Prompt 與教學用意） (Requirement 1: 預覽建議圖片) */}
                <div style={{ flex: '1 1 320px' }}>
                  {suggestion ? (
                    <div>
                      {isEditingThisPrompt ? (
                        <div style={{ backgroundColor: '#ffffff', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                          <label htmlFor={`edit-prompt-${item.character}`} style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                            ✏️ 自訂配圖 Prompt（生成提示詞）：
                          </label>
                          <textarea
                            id={`edit-prompt-${item.character}`}
                            rows={3}
                            value={tempPrompt}
                            onChange={(e) => setTempPrompt(e.target.value)}
                            style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.88rem' }}
                            placeholder="輸入情境插畫提示詞..."
                          />
                          <div className="btn-group" style={{ marginTop: '0.5rem' }}>
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ padding: '0.25rem 0.65rem', fontSize: '0.82rem' }}
                              onClick={() => handleSavePrompt(idx)}
                            >
                              💾 儲存提示詞
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '0.25rem 0.65rem', fontSize: '0.82rem' }}
                              onClick={() => setEditingPromptChar(null)}
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                              🎨 建議 Prompt（生成指令）：
                            </span>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.78rem' }}
                              onClick={() => handleStartEditPrompt(item.character, suggestion.prompt)}
                              disabled={isAnyGenerating}
                              aria-label={`編輯生字「${item.character}」配圖提示詞`}
                            >
                              ✏️ 修改提示詞
                            </button>
                          </div>
                          <p style={{ fontSize: '0.9rem', color: '#334155', marginTop: '0.25rem', backgroundColor: '#f8fafc', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                            {suggestion.prompt}
                          </p>
                          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>
                            💡 <strong>教學用意：</strong>{suggestion.rationale}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      此字目前暫無 AI 配圖建議，可手動上傳本機圖片或啟用配圖選項。
                    </p>
                  )}
                </div>

                {/* 3. 圖片顯示、替換或刪除操作區 (Requirement 1 & 3) */}
                <div
                  style={{
                    flex: '0 0 220px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderLeft: '1px dashed var(--color-border)',
                    paddingLeft: '1.25rem',
                    minHeight: '130px',
                  }}
                >
                  {/* 隱藏的本機圖檔選擇 input */}
                  <input
                    type="file"
                    accept="image/*"
                    ref={(el) => { fileInputRefs.current[item.character] = el }}
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileChange(item.character, e)}
                  />

                  {isItemGenerating ? (
                    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                      <div className="spinner-sm" style={{ width: '2rem', height: '2rem', margin: '0 auto 0.5rem' }} aria-hidden="true"></div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-primary-dark)', fontWeight: 600 }}>
                        圖片生成中...
                      </span>
                    </div>
                  ) : hasImage && imageObj ? (
                    <div style={{ textAlign: 'center', width: '100%' }}>
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img
                          src={imageObj.url}
                          alt={`生字「${item.character}」教學配圖`}
                          className="image-preview-thumb"
                          style={{
                            cursor: 'pointer',
                            display: 'block',
                            margin: '0 auto',
                          }}
                          onClick={() => setPreviewModalImage(imageObj)}
                          title="點擊放大預覽"
                        />
                        <span
                          className="tag tag-success"
                          style={{
                            position: 'absolute',
                            bottom: '6px',
                            right: '6px',
                            fontSize: '0.7rem',
                            padding: '0.15rem 0.4rem',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                          }}
                        >
                          ✓ 已生成
                        </span>
                      </div>

                      {/* 替換或刪除按鈕組 (Requirement 1) */}
                      <div className="btn-group" style={{ marginTop: '0.65rem', justifyContent: 'center', gap: '0.4rem' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.55rem', fontSize: '0.8rem' }}
                          onClick={() => setPreviewModalImage(imageObj)}
                          aria-label={`放大預覽生字「${item.character}」配圖`}
                        >
                          🔍 預覽
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.55rem', fontSize: '0.8rem' }}
                          onClick={() => handleSingleGenerate(item, idx)}
                          disabled={isAnyGenerating}
                          title="使用 AI 重新生成配圖"
                          aria-label={`重新生成生字「${item.character}」配圖`}
                        >
                          🔄 重新生成
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.55rem', fontSize: '0.8rem' }}
                          onClick={() => handleTriggerUpload(item.character)}
                          disabled={isAnyGenerating}
                          title="自本機上傳圖片替換"
                          aria-label={`自訂上傳替換生字「${item.character}」配圖`}
                        >
                          📁 替換
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger"
                          style={{ padding: '0.25rem 0.55rem', fontSize: '0.8rem' }}
                          onClick={() => handleDeleteImage(item.character)}
                          disabled={isAnyGenerating}
                          title="刪除此生字配圖"
                          aria-label={`刪除生字「${item.character}」配圖`}
                        >
                          🗑️ 刪除
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* 尚未生成配圖的狀態 */
                    <div style={{ textAlign: 'center', width: '100%' }}>
                      <div
                        style={{
                          width: '130px',
                          height: '80px',
                          border: '1px dashed #cbd5e1',
                          borderRadius: '4px',
                          backgroundColor: '#f8fafc',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 0.5rem',
                          color: '#94a3b8',
                        }}
                      >
                        <span style={{ fontSize: '1.5rem' }} aria-hidden="true">🖼️</span>
                        <span style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>尚未生成</span>
                      </div>

                      <div className="btn-group" style={{ justifyContent: 'center', gap: '0.4rem' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '0.3rem 0.65rem', fontSize: '0.82rem' }}
                          onClick={() => handleSingleGenerate(item, idx)}
                          disabled={isAnyGenerating}
                          aria-label={`單獨生成生字「${item.character}」配圖`}
                        >
                          🖼️ 單張生成
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '0.3rem 0.65rem', fontSize: '0.82rem' }}
                          onClick={() => handleTriggerUpload(item.character)}
                          disabled={isAnyGenerating}
                          title="手動上傳本機插圖，免消耗 API Quota"
                          aria-label={`上傳本機圖檔給生字「${item.character}」`}
                        >
                          📁 上傳圖片
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {/* 底部導引按鈕 */}
      <div className="btn-group" style={{ marginTop: '2.5rem', justifyContent: 'space-between' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate('review')}
          disabled={isAnyGenerating}
        >
          ← 上一步：審核編輯
        </button>
        <button
          type="button"
          className="btn btn-primary"
          style={{ padding: '0.65rem 1.6rem', fontSize: '1rem' }}
          onClick={() => navigate('templates')}
          disabled={isAnyGenerating}
          aria-label="前往下一步：挑選學習單模板"
        >
          下一步：選擇學習單模板 →
        </button>
      </div>

      {/* 放大預覽 Modal Lightbox (Requirement 1: 預覽建議圖片) */}
      {previewModalImage && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-preview-title"
          onClick={() => setPreviewModalImage(null)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            role="document"
          >
            <div className="modal-header">
              <h2 id="modal-preview-title" className="modal-title">
                🖼️ 生字「{previewModalImage.character}」教學配圖預覽
              </h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setPreviewModalImage(null)}
                aria-label="關閉預覽彈窗"
              >
                ✕
              </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <img
                src={previewModalImage.url}
                alt={`生字「${previewModalImage.character}」放大配圖`}
                style={{
                  maxWidth: '100%',
                  maxHeight: '380px',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--shadow-md)',
                  border: '1px solid var(--color-border)',
                }}
              />
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '6px', fontSize: '0.88rem' }}>
              <p>
                <strong>生字：</strong>{previewModalImage.character}
              </p>
              <p style={{ marginTop: '0.35rem' }}>
                <strong>Prompt：</strong>{previewModalImage.prompt}
              </p>
              <p style={{ marginTop: '0.35rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                來源：{previewModalImage.source === 'mock' ? '本機 Mock 向量圖' : 'AI 模型生成／本機自訂'} ｜ 檔案格式：{previewModalImage.mimeType}
              </p>
            </div>

            <div className="btn-group" style={{ marginTop: '1.25rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-danger"
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
                onClick={() => handleDeleteImage(previewModalImage.character)}
              >
                🗑️ 刪除此配圖
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                onClick={() => setPreviewModalImage(null)}
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

