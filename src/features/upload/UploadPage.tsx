import React, { useMemo, useState } from 'react'
import { useApp } from '../../app/index'

export const UploadPage: React.FC = () => {
  const {
    analysisError,
    includeZhuyin,
    navigate,
    runTypedAnalysis,
    setAnalysisError,
    setIncludeZhuyin,
    typedCharacters,
  } = useApp()
  const [typedInput, setTypedInput] = useState(typedCharacters.join('、'))
  const parsedCharacters = useMemo(
    () => [...new Set([...typedInput].filter((character) => /\p{Script=Han}/u.test(character)))],
    [typedInput],
  )

  const handleLookup = () => {
    if (runTypedAnalysis(parsedCharacters)) navigate('analyzing')
  }

  return (
    <div className="card">
      <div className="card-header">
        <h1 className="card-title">步驟 1：直接輸入生字</h1>
        <p className="card-subtitle">
          資料完全來自教育部《國語辭典簡編本》，查詢過程不會連線到外部服務。
        </p>
      </div>

      {analysisError && (
        <div className="callout callout-warning" role="alert">
          <div className="callout-title">{analysisError.message}</div>
        </div>
      )}

      <label htmlFor="typed-characters-input" style={{ fontWeight: 700 }}>
        生字清單
      </label>
      <textarea
        id="typed-characters-input"
        value={typedInput}
        onChange={(event) => {
          setTypedInput(event.target.value)
          setAnalysisError(null)
        }}
        rows={5}
        placeholder="例如：學、習、春、暖"
        className="typed-textarea"
      />

      <div className="typed-preview-card">
        <strong>已識別 {parsedCharacters.length} 個生字：</strong>
        <div className="typed-char-chips">
          {parsedCharacters.map((character) => (
            <span key={character} className="typed-char-chip">{character}</span>
          ))}
        </div>
      </div>

      <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '1rem' }}>
        <input
          type="checkbox"
          checked={includeZhuyin}
          onChange={(event) => setIncludeZhuyin(event.target.checked)}
        />
        學習單顯示注音
      </label>

      <div className="callout callout-info" style={{ marginTop: '1rem' }}>
        <div className="callout-title">本機辭典查詢</div>
        <p>部首、筆畫、注音、語詞候選與例句候選均由隨專案提供的辭典資料查出，全程離線執行。</p>
      </div>

      <div className="btn-group" style={{ justifyContent: 'flex-end', marginTop: '1.5rem' }}>
        <button
          type="button"
          className="btn btn-primary"
          disabled={parsedCharacters.length === 0}
          onClick={handleLookup}
        >
          查詢生字資料 →
        </button>
      </div>
    </div>
  )
}
