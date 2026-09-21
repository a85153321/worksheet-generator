import React from 'react'
import type { CharacterAnalysis } from '../../domain'
import type {
  WorksheetPage,
  WorksheetTemplate,
  WorksheetFont,
  WorksheetImage,
} from '../../services'
import {
  WorksheetContentRenderer,
  TEMPLATE_NAMES,
  WORKSHEET_FONT_LABELS,
} from './WorksheetContentRenderer'

export interface WorksheetSheetProps {
  page: WorksheetPage
  totalPages?: number
  template: WorksheetTemplate
  title?: string
  previewFont?: WorksheetFont
  characters?: CharacterAnalysis[]
  images?: Record<string, WorksheetImage>
  className?: string
  style?: React.CSSProperties
}

export const WorksheetSheet: React.FC<WorksheetSheetProps> = ({
  page,
  totalPages = 1,
  template,
  title,
  previewFont = 'standard-kai',
  characters = [],
  images = {},
  className = '',
  style,
}) => {
  const displayTitle =
    title && title !== '範例生字學習單'
      ? title
      : template === 'reference-character-practice'
        ? '生字注音學習單'
        : TEMPLATE_NAMES[template] || '學習單'

  return (
    <article
      className={`a4-sheet worksheet-font-${previewFont} ${className}`}
      role="region"
      aria-label={`A4 學習單第 ${page.pageNumber} 頁預覽`}
      style={style}
    >
      <header className="sheet-header">
        <div className="sheet-header-top">
          <h2 className="sheet-title">{displayTitle}</h2>
          <div className="sheet-header-meta">
            <span>國語單元評量</span>
            <span className="sheet-header-meta-sep">｜</span>
            <span>{TEMPLATE_NAMES[template] || '生字練習單'}</span>
            {previewFont !== 'standard-kai' ? (
              <span className="sheet-header-badge">（{WORKSHEET_FONT_LABELS[previewFont]}）</span>
            ) : null}
          </div>
        </div>
        <div className="sheet-info-row">
          <span className="sheet-info-item">____ 年 ____ 班</span>
          <span className="sheet-info-item">座號：____</span>
          <span className="sheet-info-item">姓名：____________</span>
          {template !== 'reference-character-practice' && (
            <span className="sheet-info-item">得分：______</span>
          )}
        </div>
      </header>

      <main className="sheet-content">
        <WorksheetContentRenderer
          template={template}
          pageSections={page.sections}
          pageNumber={page.pageNumber}
          characters={characters}
          images={images}
        />
      </main>

      <footer className="sheet-footer">
        <span>國小本機學習單生成器（Local-First 免費教師版）· {TEMPLATE_NAMES[template]}</span>
        <span>第 {page.pageNumber} 頁 / 共 {totalPages} 頁</span>
      </footer>
    </article>
  )
}
