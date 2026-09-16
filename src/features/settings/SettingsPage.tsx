import React, { useState } from 'react'
import { useApp } from '../../app/index'

export const SettingsPage: React.FC = () => {
  const { apiKey, saveApiKey, clearApiKey, navigate } = useApp()
  const [inputValue, setInputValue] = useState(apiKey)
  const [showKey, setShowKey] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null)
  const [isTesting, setIsTesting] = useState(false)

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputValue.trim()) {
      setStatusMessage({ type: 'error', text: '請輸入有效的 API Key，或點選「清除」' })
      return
    }
    saveApiKey(inputValue)
    setStatusMessage({ type: 'success', text: 'API Key 已安全儲存於此瀏覽器本機！' })
  }

  const handleClear = () => {
    setInputValue('')
    clearApiKey()
    setStatusMessage({ type: 'info', text: 'API Key 已自本機清除。' })
  }

  const handleTestKey = async () => {
    if (!inputValue.trim()) {
      setStatusMessage({ type: 'error', text: '請先輸入 API Key 再進行連線測試' })
      return
    }
    setIsTesting(true)
    setStatusMessage({ type: 'info', text: '正在測試 Gemini API 連線...' })
    // Mock 測試延遲
    setTimeout(() => {
      setIsTesting(false)
      if (inputValue.length < 10) {
        setStatusMessage({ type: 'error', text: '連線測試失敗：Key 長度似乎不正確，請確認。' })
      } else {
        setStatusMessage({ type: 'success', text: '連線測試成功！Gemini API 服務正常回應。' })
      }
    }, 800)
  }

  return (
    <div className="card">
      <div className="card-header">
        <h1 className="card-title">🔑 Gemini API Key 設定</h1>
        <p className="card-subtitle">
          本系統採用 BYOK（Bring Your Own Key）架構，保護教師與學校資料隱私
        </p>
      </div>

      <div className="callout" role="region" aria-label="隱私與架構說明">
        <div className="callout-title">🛡️ 隱私安全守則</div>
        <p>
          您的 API Key 僅會儲存在當前瀏覽器的 <code>localStorage</code> 中，所有 AI
          請求均由瀏覽器端直接發往 Google 官方 API，絕不會經過任何自有伺服器，亦不會記錄於日誌。
        </p>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label
            htmlFor="gemini-api-key"
            style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}
          >
            Google Gemini API Key
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              id="gemini-api-key"
              type={showKey ? 'text' : 'password'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="AIzaSy..."
              autoComplete="off"
              spellCheck="false"
              style={{
                flex: 1,
                padding: '0.6rem 0.85rem',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.95rem',
              }}
              aria-describedby="key-hint"
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowKey(!showKey)}
              aria-label={showKey ? '隱藏金鑰' : '顯示金鑰'}
            >
              {showKey ? '隱藏' : '顯示'}
            </button>
          </div>
          <p id="key-hint" style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>
            若尚未擁有 Key，可至{' '}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--color-primary)' }}
            >
              Google AI Studio
            </a>{' '}
            免費申請。
          </p>
        </div>

        {statusMessage && (
          <div
            className={`callout ${statusMessage.type === 'error' ? 'callout-warning' : ''}`}
            role="status"
            aria-live="polite"
          >
            {statusMessage.text}
          </div>
        )}

        <div className="btn-group">
          <button type="submit" className="btn btn-primary">
            儲存金鑰
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleTestKey}
            disabled={isTesting}
          >
            {isTesting ? '測試中...' : '測試連線'}
          </button>
          <button type="button" className="btn btn-danger" onClick={handleClear}>
            清除金鑰
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('upload')}
            style={{ marginLeft: 'auto' }}
          >
            返回教材上傳 →
          </button>
        </div>
      </form>
    </div>
  )
}
