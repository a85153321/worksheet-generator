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
      : (template === 'word-sentence-blank' ? '語詞例句填空學習單' : '生字注音學習單')

  return (
    <article
      className={`a4-sheet worksheet-font-${previewFont} template-${template} ${className}`}
      role="region"
      aria-label={`A4 學習單第 ${page.pageNumber} 頁預覽`}
      style={style}
    >
      <header className="sheet-header">
        <div className="sheet-header-top">
          <h2 className="sheet-title">{displayTitle}</h2>
        </div>
        <div className="sheet-info-row">
          <span className="sheet-info-item">____ 年 ____ 班</span>
          <span className="sheet-info-item">座號：____</span>
          <span className="sheet-info-item">姓名：____________</span>
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

    </article>
  )
}
