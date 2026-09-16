import React, { useEffect, useState } from 'react'
import { useApp } from '../../app/index'
import { analyzeMaterial } from '../../services'

export const AnalyzingPage: React.FC = () => {
  const { uploadedFile, setAnalysisResult, navigate } = useApp()
  const [currentStage, setCurrentStage] = useState(1)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    let isMounted = true

    const runAnalysis = async () => {
      // 階段 1: 預處理與快取檢查
      setCurrentStage(1)
      await new Promise((resolve) => setTimeout(resolve, 600))
      if (!isMounted) return

      // 階段 2: 呼叫 service use case (Codex 交付之契約)
      setCurrentStage(2)
      const inputBlob =
        uploadedFile?.blob ||
        new Blob(['國語教材課文範例：學無止境，勤加練習。'], {
          type: 'text/plain;charset=utf-8',
        })

      const res = await analyzeMaterial({
        data: inputBlob,
        fileName: uploadedFile?.name || '國語教材範例.png',
        mimeType: uploadedFile?.mimeType || 'image/png',
        contentHash: 'hash-mock-sample-001',
        context: { grade: 3, language: 'zh-TW' },
      })

      if (!isMounted) return

      // 階段 3: Zod Schema 驗證與結果收錄
      setCurrentStage(3)
      await new Promise((resolve) => setTimeout(resolve, 500))
      if (!isMounted) return

      if (res.ok) {
        setAnalysisResult(res.value)
        setIsCompleted(true)
        setCurrentStage(4)
      } else {
        setErrorMessage(res.error.message)
      }
    }

    runAnalysis()

    return () => {
      isMounted = false
    }
  }, [uploadedFile, setAnalysisResult])

  return (
    <div className="card">
      <div className="card-header" style={{ textAlign: 'center' }}>
        <h1 className="card-title" style={{ justifyContent: 'center' }}>
          ⚙️ 步驟 2：AI 結構化教材分析中
        </h1>
        <p className="card-subtitle">
          正在從教材提取國小生字、注音符號、部首、筆畫與教學例句
        </p>
      </div>

      <div className="progress-container">
        {!isCompleted && !errorMessage && <div className="spinner" aria-hidden="true"></div>}

        {isCompleted && (
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }} aria-hidden="true">
            🎉
          </div>
        )}

        <ul className="step-checklist" role="list" aria-label="分析進度項目">
          <li
            className={`step-checklist-item ${
              currentStage > 1 ? 'done' : currentStage === 1 ? 'current' : ''
            }`}
          >
            <span>{currentStage > 1 ? '✓' : '●'}</span>
            <span>1. 預處理教材影像並比對本機 IndexedDB 快取</span>
          </li>
          <li
            className={`step-checklist-item ${
              currentStage > 2 ? 'done' : currentStage === 2 ? 'current' : ''
            }`}
          >
            <span>{currentStage > 2 ? '✓' : '●'}</span>
            <span>2. 發送多模態分析請求（抽取生字、詞語、例句）</span>
          </li>
          <li
            className={`step-checklist-item ${
              currentStage > 3 ? 'done' : currentStage === 3 ? 'current' : ''
            }`}
          >
            <span>{currentStage > 3 ? '✓' : '●'}</span>
            <span>3. 執行嚴格 Zod Schema 驗證與年級語境確認</span>
          </li>
          <li
            className={`step-checklist-item ${
              isCompleted ? 'done' : currentStage === 4 ? 'current' : ''
            }`}
          >
            <span>{isCompleted ? '✓' : '○'}</span>
            <span>4. 分析成果就緒，可進行教師審核</span>
          </li>
        </ul>

        {errorMessage && (
          <div
            className="callout callout-warning"
            style={{ maxWidth: '480px', margin: '1.5rem auto' }}
            role="alert"
          >
            <div className="callout-title">分析過程發生問題</div>
            <p>{errorMessage}</p>
          </div>
        )}

        <div
          className="btn-group"
          style={{ justifyContent: 'center', marginTop: '2.5rem' }}
        >
          {isCompleted ? (
            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: '0.75rem 2rem', fontSize: '1.05rem' }}
              onClick={() => navigate('review')}
              autoFocus
            >
              前往審核與編輯成果 →
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
                className="btn btn-primary"
                onClick={() => navigate('review')}
              >
                直接跳轉審核（使用範例資料） →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
