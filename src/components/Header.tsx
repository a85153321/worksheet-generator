import React from 'react'
import { useApp } from '../app/index'

export const Header: React.FC = () => {
  const { navigate, readingFontMode, setReadingFontMode } = useApp()

  return (
    <header className="app-header" role="banner">
      <div className="header-container">
        <a
          href="#/upload"
          className="brand"
          onClick={(e) => {
            e.preventDefault()
            navigate('upload')
          }}
          aria-label="國小本機學習單生成器 首頁"
        >
          <span>📝 國小學習單生成器</span>
          <span className="brand-badge">Local-First</span>
        </a>

        {/* 切換讀音字型按鈕組 */}
        <div className="header-reading-font-control" role="group" aria-label="讀音字型樣式切換">
          <span className="header-reading-font-label">🔤 讀音字型：</span>
          <div className="header-toggle-buttons">
            <button
              type="button"
              className={`header-toggle-btn ${readingFontMode === 'kai' ? 'active' : ''}`}
              onClick={() => setReadingFontMode('kai')}
              title="使用國小課本標準「標楷注音」（橫排毛筆楷書筆鋒）"
              aria-pressed={readingFontMode === 'kai'}
            >
              標楷注音
            </button>
            <button
              type="button"
              className={`header-toggle-btn ${readingFontMode === 'vertical' ? 'active' : ''}`}
              onClick={() => setReadingFontMode('vertical')}
              title="使用「直立注音」（直立垂直排列）"
              aria-pressed={readingFontMode === 'vertical'}
            >
              直立注音
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
