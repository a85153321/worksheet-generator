import React from 'react'
import { useApp } from '../app/index'

export const Header: React.FC = () => {
  const { navigate } = useApp()

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
      </div>
    </header>
  )
}
