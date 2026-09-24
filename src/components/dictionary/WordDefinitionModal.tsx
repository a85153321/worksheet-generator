import React from 'react'

export interface WordDefinitionEntry {
  wordName: string
  wordNumber?: string | number
  definition: string
}

export interface WordDefinitionData {
  word: string
  entries: WordDefinitionEntry[]
}

export interface WordDefinitionModalProps {
  definition: WordDefinitionData | null
  onClose: () => void
}

export const WordDefinitionModal: React.FC<WordDefinitionModalProps> = ({
  definition,
  onClose,
}) => {
  if (!definition) return null

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="word-def-title"
      onClick={onClose}
    >
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="word-def-title" className="modal-title">
            📖 語詞釋義：{definition.word}
          </h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="關閉語詞釋義"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          {definition.entries.length > 0 ? (
            definition.entries.map((entry, eIdx) => (
              <div key={entry.wordNumber || eIdx} className="word-def-entry">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                    {entry.wordName}
                  </span>
                </div>
                <div className="word-def-text">
                  {entry.definition}
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '1rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
              《國語辭典簡編本》暫無「{definition.word}」之詳細釋義條目。
            </div>
          )}
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', textAlign: 'right' }}>
            資料來源：教育部《國語辭典簡編本》
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-primary"
            style={{ fontSize: '0.85rem', padding: '0.35rem 1rem' }}
            onClick={onClose}
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  )
}
