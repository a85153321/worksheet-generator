import React from 'react'
import { useApp } from '../app/index'

export const Header: React.FC = () => {
  const { currentRoute, navigate, hasApiKey } = useApp()

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
          aria-label="國小 AI 學習單生成器 首頁"
        >
          <span>📝 國小 AI 學習單生成器</span>
          <span className="brand-badge">Local-First</span>
        </a>

        <div className="header-actions">
          <button
            type="button"
            className={`btn ${currentRoute === 'settings' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => navigate('settings')}
            aria-label={`API Key 設定，目前狀態：${hasApiKey ? '已設定' : '尚未設定'}`}
          >
            <span>🔑 API Key</span>
            <span
              className={`tag ${hasApiKey ? 'tag-success' : 'tag-warning'}`}
              style={{ marginLeft: '4px' }}
            >
              {hasApiKey ? '已就緒' : '未設定'}
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}
