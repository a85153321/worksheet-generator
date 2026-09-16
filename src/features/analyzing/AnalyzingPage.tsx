import React, { useEffect, useState, useRef } from 'react'
import { useApp } from '../../app/index'

export const AnalyzingPage: React.FC = () => {
  const {
    uploadedFile,
    analysisResult,
    analysisError,
    runAnalysis,
    navigate,
  } = useApp()

  const [currentStage, setCurrentStage] = useState(1)
  const [stageDesc, setStageDesc] = useState('正在計算檔案特徵雜湊值...')
  const [hasStarted, setHasStarted] = useState(false)
  const hasTriggeredRef = useRef(false)

  // 空狀態判斷：如果連 uploadedFile 都沒有
  const isEmpty = !uploadedFile && !analysisResult

  useEffect(() => {
    if (isEmpty || hasTriggeredRef.current) return
    hasTriggeredRef.current = true
    setHasStarted(true)

    let isCancelled = false

    const execute = async () => {
      // 階段 1: 影像預處理與特徵雜湊
      setCurrentStage(1)
      setStageDesc('正在進行教材影像預處理並計算特徵雜湊值...')
      await new Promise((r) => setTimeout(r, 450))
      if (isCancelled) return

      // 階段 2: 快取比對
      setCurrentStage(2)
      setStageDesc('比對本機 IndexedDB 快取記錄...')
      await new Promise((r) => setTimeout(r, 400))
      if (isCancelled) return

      // 階段 3: 呼叫 analyzeMaterial use case
      setCurrentStage(3)
      setStageDesc('呼叫多模態結構化分析服務，提取生字、注音、部首、筆畫與詞句...')
      const success = await runAnalysis()
      if (isCancelled) return

      // 階段 4: 驗證完成
      if (success) {
        setCurrentStage(4)
        setStageDesc('Zod Schema 結構驗證通過，生字教材資料結構化收錄完成！')
      }
    }

    execute()

    return () => {
      isCancelled = true
    }
  }, [isEmpty, runAnalysis])

  const handleRetry = async () => {
    setCurrentStage(1)
    setStageDesc('重新發起分析流程...')
    await runAnalysis()
  }

  // 1. 空狀態 (Empty State)
  if (isEmpty) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon" aria-hidden="true">
            📂
          </div>
          <h2 className="empty-state-title">尚未選取任何教材檔案</h2>
          <p className="empty-state-desc">
            分析引擎需要教材圖片或 PDF 文件才能進行結構化解析。請先返回上傳頁面選取課文或載入示範教材。
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('upload')}
          >
            ← 返回教材上傳頁面
          </button>
        </div>
      </div>
    )
  }

  // 2. 錯誤狀態 (Error State)
  if (analysisError) {
    return (
      <div className="card">
        <div className="card-header" style={{ textAlign: 'center' }}>
          <h1 className="card-title" style={{ justifyContent: 'center', color: 'var(--color-danger)' }}>
            ⚠️ 教材分析遇到問題
          </h1>
          <p className="card-subtitle">
            錯誤類型：{analysisError.type} ｜ 請根據下方訊息修正後重新嘗試
          </p>
        </div>

        <div
          className="callout callout-warning"
          style={{
            maxWidth: '560px',
            margin: '1rem auto 2rem',
            borderColor: 'var(--color-danger)',
            backgroundColor: 'var(--color-danger-light)',
          }}
          role="alert"
        >
          <div className="callout-title" style={{ color: 'var(--color-danger)' }}>
            {analysisError.message}
          </div>
          {analysisError.details && (
            <pre style={{ fontSize: '0.8rem', marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(analysisError.details, null, 2)}
            </pre>
          )}
        </div>

        <div className="btn-group" style={{ justifyContent: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('upload')}
          >
            ← 返回重新選擇檔案
          </button>
          {analysisError.retryable ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRetry}
            >
              🔄 再次重試分析
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                navigate('upload')
              }}
            >
              更換檔案並重新分析
            </button>
          )}
        </div>
      </div>
    )
  }

  const isCompleted = currentStage === 4 && Boolean(analysisResult)

  // 3. 正常分析／完成狀態 (Loading & Success State)
  return (
    <div className="card">
      <div className="card-header" style={{ textAlign: 'center' }}>
        <h1 className="card-title" style={{ justifyContent: 'center' }}>
          {isCompleted ? '🎉 AI 結構化教材分析完成！' : '⚙️ 步驟 2：AI 結構化教材分析中'}
        </h1>
        <p className="card-subtitle">
          {stageDesc}
        </p>
      </div>

      <div className="progress-container">
        {!isCompleted && (
          <div className="spinner" aria-hidden="true" role="status"></div>
        )}

        {isCompleted && (
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }} aria-hidden="true">
            ✨
          </div>
        )}

        <ul className="step-checklist" role="list" aria-label="分析進度項目">
          <li
            className={`step-checklist-item ${
              currentStage > 1 ? 'done' : currentStage === 1 && hasStarted ? 'current' : ''
            }`}
          >
            <span>{currentStage > 1 ? '✓' : '●'}</span>
            <span>1. 預處理教材影像並計算特徵雜湊值</span>
          </li>
          <li
            className={`step-checklist-item ${
              currentStage > 2 ? 'done' : currentStage === 2 ? 'current' : ''
            }`}
          >
            <span>{currentStage > 2 ? '✓' : '●'}</span>
            <span>2. 查詢 IndexedDB 快取記錄</span>
          </li>
          <li
            className={`step-checklist-item ${
              currentStage > 3 ? 'done' : currentStage === 3 ? 'current' : ''
            }`}
          >
            <span>{currentStage > 3 ? '✓' : '●'}</span>
            <span>3. 呼叫 analyzeMaterial 提取生字、詞語與例句</span>
          </li>
          <li
            className={`step-checklist-item ${
              isCompleted ? 'done' : currentStage === 4 ? 'current' : ''
            }`}
          >
            <span>{isCompleted ? '✓' : '○'}</span>
            <span>4. Zod Schema 驗證通過，產出結構化草稿</span>
          </li>
        </ul>

        <div
          className="btn-group"
          style={{ justifyContent: 'center', marginTop: '2.5rem' }}
        >
          {isCompleted ? (
            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: '0.75rem 2.25rem', fontSize: '1.05rem' }}
              onClick={() => navigate('review')}
              autoFocus
            >
              前往審核與編輯成果 ({analysisResult?.characters.length} 個生字) →
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('upload')}
              >
                ← 放棄並返回上傳
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('review')}
                title="若快取或先期已有結果，可直接跳轉審核"
              >
                直接查看目前結果 →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
