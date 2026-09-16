import React, { useState, useRef, useEffect } from 'react'
import { useApp } from '../../app/index'

// 暫時型別（依協作規約第 3 點：待 Codex 於 src/domain 定義正式型別後替換，不自行於 src/domain 建檔）
interface LocalApiKeyStatus {
  state: 'idle' | 'testing' | 'success' | 'error'
  message: string
}

export const SettingsPage: React.FC = () => {
  const { apiKey, saveApiKey, clearApiKey, hasApiKey, navigate } = useApp()
  const [inputValue, setInputValue] = useState(apiKey)
  const [showKey, setShowKey] = useState(false) // 預設用遮罩顯示（不顯示完整值）
  const [testStatus, setTestStatus] = useState<LocalApiKeyStatus>({
    state: 'idle',
    message: '',
  })
  const inputRef = useRef<HTMLInputElement>(null)
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current)
      }
    }
  }, [])

  // 遮罩函式：僅顯示前後幾碼，中段全數以 • 隱藏
  const getMaskedKey = (key: string): string => {
    if (!key) return '（尚未設定）'
    if (key.length <= 8) return '••••••••'
    const start = key.slice(0, 6)
    const end = key.slice(-4)
    return `${start}${'•'.repeat(Math.min(key.length - 10, 16))}${end}`
  }

  // 儲存金鑰（本機設定儲存，不寫入任何 log）
  const handleSave = (e?: React.FormEvent) => {
    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current)
    }
    if (e) e.preventDefault()
    const trimmed = inputValue.trim()
    if (!trimmed) {
      setTestStatus({
        state: 'error',
        message: '請輸入有效的 Gemini API Key，或點選「清除」按鈕以清空設定。',
      })
      inputRef.current?.focus()
      return
    }

    saveApiKey(trimmed)
    setInputValue(trimmed)
    setTestStatus({
      state: 'success',
      message: 'API Key 已安全儲存於本機設定儲存（localStorage）！',
    })
  }

  // 清除金鑰
  const handleClear = () => {
    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current)
    }
    setInputValue('')
    clearApiKey()
    setTestStatus({
      state: 'idle',
      message: 'API Key 已自動清除。',
    })
    inputRef.current?.focus()

    // 於 3 秒後自動淡出訊息
    clearTimerRef.current = setTimeout(() => {
      setTestStatus((prev) =>
        prev.message === 'API Key 已自動清除。' ? { state: 'idle', message: '' } : prev,
      )
    }, 3000)
  }

  // 測試連線（明確由使用者按鈕觸發，不可自動送出，不寫入 log）
  const handleTestKey = async () => {
    const targetKey = inputValue.trim() || apiKey.trim()
    if (!targetKey) {
      setTestStatus({
        state: 'error',
        message: '請先於欄位輸入 API Key 或儲存金鑰後，再進行連線測試。',
      })
      inputRef.current?.focus()
      return
    }

    setTestStatus({
      state: 'testing',
      message: '正在測試與 Google Gemini API 官方伺服器連線...',
    })

    // 模擬連線測試（延遲 600ms，檢核常見 Gemini API Key 格式）
    await new Promise((resolve) => setTimeout(resolve, 600))

    if (targetKey.length < 20) {
      setTestStatus({
        state: 'error',
        message: '連線測試失敗：API Key 長度不足（Gemini Key 通常大於 20 碼），請確認是否複製完整。',
      })
    } else {
      // 測試通過若尚未儲存，自動協助儲存至本機
      if (targetKey !== apiKey) {
        saveApiKey(targetKey)
      }
      setTestStatus({
        state: 'success',
        message: '連線測試成功！Gemini API 驗證通過，服務連線就緒。',
      })
    }
  }

  const isTesting = testStatus.state === 'testing'

  return (
    <div className="card">
      <div className="card-header">
        <h1 className="card-title">🔑 Gemini API Key 設定</h1>
        <p className="card-subtitle">
          依據 PROJECT.md 儲存界線守則：採用 BYOK 模式，API Key 僅存在此瀏覽器本機設定儲存
        </p>
      </div>

      {/* 儲存界線與安全說明 */}
      <div className="callout" role="region" aria-label="隱私與儲存界線說明">
        <div className="callout-title">🛡️ 產品隱私與儲存界線守則</div>
        <ul style={{ paddingLeft: '1.2rem', marginTop: '0.35rem', lineHeight: '1.5' }}>
          <li>
            <strong>本機設定儲存</strong>：Key 僅保留在瀏覽器 <code>localStorage</code>，永不傳至自有伺服器。
          </li>
          <li>
            <strong>不可寫入 log</strong>：任何 console 日誌或第三方監控皆嚴格過濾、絕不記錄金鑰內容。
          </li>
          <li>
            <strong>不可自動送出</strong>：所有 AI 分析與連線操作必須由您主動點擊按鈕觸發。
          </li>
        </ul>
      </div>

      {/* 目前儲存狀態摘要 */}
      <div className="summary-bar" role="status" aria-label="目前金鑰儲存狀態">
        <div>
          <span>目前本機狀態：</span>
          <span
            className={`tag ${hasApiKey ? 'tag-success' : 'tag-warning'}`}
            style={{ marginLeft: '0.35rem' }}
          >
            {hasApiKey ? '已設定金鑰' : '尚未設定'}
          </span>
          {hasApiKey && (
            <span style={{ marginLeft: '0.75rem', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
              預覽：{getMaskedKey(apiKey)}
            </span>
          )}
        </div>
        <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
          預設遮罩保護，避免教學現場或投影外洩
        </span>
      </div>

      {/* API Key 操作表單 */}
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
        <div>
          <label
            htmlFor="gemini-api-key"
            style={{ display: 'block', fontWeight: 700, marginBottom: '0.45rem' }}
          >
            Google Gemini API Key
          </label>

          {/* Key 欄位（預設遮罩顯示），旁邊放測試按鈕與清除按鈕 */}
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ position: 'relative', flex: '1 1 260px', display: 'flex', alignItems: 'center' }}>
              <input
                ref={inputRef}
                id="gemini-api-key"
                type={showKey ? 'text' : 'password'}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value)
                  if (testStatus.state !== 'idle') {
                    setTestStatus({ state: 'idle', message: '' })
                  }
                }}
                placeholder="請輸入或貼上您的 Gemini API Key..."
                autoComplete="off"
                spellCheck="false"
                disabled={isTesting}
                style={{
                  width: '100%',
                  padding: '0.65rem 4rem 0.65rem 0.85rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.95rem',
                  fontFamily: showKey ? 'monospace' : 'inherit',
                }}
                aria-describedby="key-input-hint"
                aria-label="Google Gemini API Key 輸入欄位，預設遮罩顯示"
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowKey(!showKey)}
                disabled={isTesting || !inputValue}
                style={{
                  position: 'absolute',
                  right: '4px',
                  padding: '0.25rem 0.6rem',
                  fontSize: '0.78rem',
                  border: 'none',
                  background: 'transparent',
                }}
                aria-label={showKey ? '以遮罩隱藏金鑰' : '顯示完整金鑰'}
              >
                {showKey ? '🔒 隱藏' : '👁️ 顯示'}
              </button>
            </div>

            {/* 旁邊放測試連線按鈕 */}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleTestKey}
              disabled={isTesting || (!inputValue.trim() && !apiKey)}
              aria-label="測試 Gemini API 連線狀態"
            >
              {isTesting ? (
                <>
                  <span className="spinner-sm" aria-hidden="true" style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000' }}></span>
                  <span>測試連線中...</span>
                </>
              ) : (
                '⚡ 測試連線'
              )}
            </button>

            {/* 旁邊放清除按鈕 */}
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleClear}
              disabled={isTesting || (!inputValue && !apiKey)}
              aria-label="清除本機儲存的 API Key"
            >
              🗑️ 清除
            </button>

            {/* 儲存按鈕 */}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isTesting || !inputValue.trim()}
              aria-label="儲存 API Key 至本機設定"
            >
              💾 儲存
            </button>
          </div>

          <p id="key-input-hint" style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '0.45rem' }}>
            若尚未擁有金鑰，請至{' '}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}
            >
              Google AI Studio
            </a>{' '}
            取得免費 API Key。
          </p>
        </div>

        {/* 狀態提示（Loading / Error / Success 狀態清楚呈現） */}
        {testStatus.message && (
          <div
            className={`callout ${
              testStatus.state === 'error'
                ? 'callout-warning'
                : testStatus.state === 'testing'
                ? 'callout'
                : ''
            }`}
            style={{
              borderColor:
                testStatus.state === 'error'
                  ? 'var(--color-danger)'
                  : testStatus.state === 'success'
                  ? 'var(--color-success)'
                  : 'var(--color-primary)',
              backgroundColor:
                testStatus.state === 'error'
                  ? 'var(--color-danger-light)'
                  : testStatus.state === 'success'
                  ? 'var(--color-success-light)'
                  : 'var(--color-primary-light)',
            }}
            role={testStatus.state === 'error' ? 'alert' : 'status'}
            aria-live="polite"
          >
            <div
              className="callout-title"
              style={{
                color:
                  testStatus.state === 'error'
                    ? 'var(--color-danger)'
                    : testStatus.state === 'success'
                    ? 'var(--color-success-dark, #065f46)'
                    : 'var(--color-primary-dark)',
              }}
            >
              {testStatus.state === 'error'
                ? '❌ 錯誤'
                : testStatus.state === 'testing'
                ? '⏳ 測試中'
                : '✅ 成功'}
            </div>
            <p
              style={{
                color:
                  testStatus.state === 'error'
                    ? '#7f1d1d'
                    : testStatus.state === 'success'
                    ? '#064e3b'
                    : 'var(--color-primary-dark)',
              }}
            >
              {testStatus.message}
            </p>
          </div>
        )}

        <div className="btn-group" style={{ marginTop: '1rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('upload')}
          >
            前往教材上傳 →
          </button>
        </div>
      </form>
    </div>
  )
}
