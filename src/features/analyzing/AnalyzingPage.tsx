import React from 'react'
import { useApp } from '../../app/index'

export const AnalyzingPage: React.FC = () => {
  const {
    uploadedFile,
    analysisScope,
    analysisResult,
    analysisError,
    isAnalyzing,
    runAnalysis,
    runTypedAnalysis,
    analysisInputMode,
    typedCharacters,
    navigate,
  } = useApp()

  const isEmpty = !uploadedFile && !analysisResult && !isAnalyzing && !analysisError

  // 1. 空狀態：尚未上傳任何檔案
  if (isEmpty) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon" aria-hidden="true">
            📂
          </div>
          <h2 className="empty-state-title">尚未選取任何教材檔案</h2>
          <p className="empty-state-desc">
            分析引擎需要教材圖片或 PDF 文件才能進行解析。請先返回上傳頁選取課文或載入示範教材。
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('upload')}
          >
            ← 前往教材上傳頁面
          </button>
        </div>
      </div>
    )
  }

  // 2. 錯誤狀態
  if (analysisError && !isAnalyzing) {
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
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => analysisInputMode === 'typed'
              ? runTypedAnalysis(typedCharacters)
              : runAnalysis()}
            aria-label="再次重試分析請求"
          >
            🔄 再次重試分析
          </button>
        </div>
      </div>
    )
  }

  const isCompleted = Boolean(analysisResult) && !isAnalyzing

  return (
    <div className="card">
      <div className="card-header" style={{ textAlign: 'center' }}>
        <h1 className="card-title" style={{ justifyContent: 'center' }}>
          {isCompleted
            ? '🎉 AI 結構化教材分析完成！'
            : isAnalyzing
            ? '⚙️ 步驟 2：AI 結構化分析處理中'
            : '📋 步驟 2：確認處理範圍並發起分析'}
        </h1>
        <p className="card-subtitle">
          {isCompleted
            ? '生字、注音、部首、筆畫與詞句已依年級結構化收錄'
            : isAnalyzing
            ? '系統正在進行影像預處理、比對本機快取並呼叫多模態分析服務...'
            : '本操作屬於昂貴 AI 調用，系統不自動發起；請確認預估處理範圍後點選啟動'}
        </p>
      </div>

      {/* 本次動作的預估處理範圍卡片 (Requirement 2: 依 PROJECT.md 第 6 節規範) */}
      <div className="scope-card" style={{ maxWidth: '640px', margin: '0 auto 1.5rem' }} role="region" aria-label="本次動作的預估處理範圍">
        <div className="scope-card-header">
          <strong style={{ color: 'var(--color-primary-dark)', fontSize: '1rem' }}>
            📊 本次動作的預估處理範圍
          </strong>
          <span className="tag tag-info">依 PROJECT.md 第 6 節規範</span>
        </div>

        <div className="scope-grid">
          <div>
            <strong>教材來源：</strong>{' '}
            {analysisInputMode === 'typed' ? `直接輸入（${typedCharacters.join('、')}）` : uploadedFile?.name || '國語教材'}
          </div>
          <div>
            <strong>預估處理頁數：</strong>{' '}
            {analysisInputMode === 'typed'
              ? '不需影像處理'
              : uploadedFile?.isPdf
              ? `${analysisScope.pageCount} 頁（第 ${analysisScope.selectedPages.join('、')} 頁）`
              : '1 頁（單頁圖片）'}
          </div>
          <div>
            <strong>預估提取項目：</strong> 約 {analysisScope.estimatedItemsMin} ~ {analysisScope.estimatedItemsMax} 個國語生字及教學例句
          </div>
          <div>
            <strong>年級目標：</strong> 國小 {analysisScope.grade} 年級
          </div>
        </div>

        <p className="scope-disclaimer">
          ℹ️ 規範聲明：此處僅明確顯示預估處理之頁數與選取項目數量，供教師掌握本次呼叫規模；本系統嚴格遵守規範，絕不猜測或承諾第三方 API 之實際 Token / Quota 費用。
        </p>
      </div>

      {/* 分析進行中：明確的 loading 動態與階段檢核 */}
      {isAnalyzing && (
        <div className="progress-container">
          <div className="spinner" aria-hidden="true" role="status"></div>
          <p style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: '1.25rem' }}>
            正在分析選取的 {analysisScope.pageCount} 頁教材內容，請稍候...
          </p>

          <ul className="step-checklist" role="list" aria-label="分析進度階段">
            <li className="step-checklist-item done">
              <span>✓</span>
              <span>1. 預處理教材影像（旋轉裁切壓縮）並計算雜湊特徵碼</span>
            </li>
            <li className="step-checklist-item done">
              <span>✓</span>
              <span>2. 查詢 IndexedDB 快取記錄（避免重複消耗配額）</span>
            </li>
            <li className="step-checklist-item current">
              <span>●</span>
              <span>3. 呼叫 analyzeMaterial 提取生字、注音、部首、筆畫與例句</span>
            </li>
            <li className="step-checklist-item">
              <span>○</span>
              <span>4. Zod Schema 嚴格型別驗證與結構化草稿產出</span>
            </li>
          </ul>
        </div>
      )}

      {/* 完成狀態 */}
      {isCompleted && (
        <div className="progress-container">
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }} aria-hidden="true">
            ✨
          </div>
          <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-primary-dark)', marginBottom: '0.5rem' }}>
            成功提取 {analysisResult?.characters.length || 0} 個生字學習單元！
          </p>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            包含注音符號、部首筆畫、生詞延伸與造句仿寫，您可以立即進行教師審核與編輯。
          </p>

          <button
            type="button"
            className="btn btn-primary"
            style={{ padding: '0.75rem 2.25rem', fontSize: '1.05rem' }}
            onClick={() => navigate('review')}
            autoFocus
          >
            前往審核與編輯成果 →
          </button>
        </div>
      )}

      {/* 尚未發起分析：Requirement 3: 絕不在 mount 自動執行，需點擊按鈕明確觸發 */}
      {!isAnalyzing && !isCompleted && (
        <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
          <div className="callout" style={{ maxWidth: '640px', margin: '0 auto 1.5rem', textAlign: 'left' }}>
            <div className="callout-title">⚠️ 昂貴操作確認提示</div>
            <p>
              依據 AGENT_COLLABORATION.md 協作規範，AI 分析屬於高消耗動作，系統不會在頁面載入（mount）或切換時自動發出請求。請確認上方預估處理範圍無誤後，點擊下方按鈕啟動。
            </p>
          </div>

          <div className="btn-group" style={{ justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('upload')}
            >
              ← 返回重選頁面／檔案
            </button>
            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: '0.75rem 2.25rem', fontSize: '1.05rem' }}
              onClick={() => runAnalysis()}
              aria-label="確認預估範圍並啟動 AI 分析"
            >
              🚀 確認範圍並開始 AI 分析 →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
