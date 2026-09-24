import React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { AppContext, type AppContextType } from '../src/app/app-context'
import type { AnalysisResult } from '../src/domain'
import { WorksheetContentRenderer } from '../src/components/worksheet'
import { PrintPreviewPage } from '../src/features/preview/PrintPreviewPage'
import { ReviewPage } from '../src/features/review/ReviewPage'
import { TemplateSelectionPage } from '../src/features/templates/TemplateSelectionPage'
import { buildWorksheet } from '../src/services'

const characters = ['堅', '賢', '腎', '緊', '竪'].map((character, index) => ({
  character,
  zhuyin: `ㄐㄧㄢ${index}`,
  zhuyinCandidates: [`ㄐㄧㄢ${index}`],
  radical: '土',
  strokeCount: 10 + index,
  wordCandidates: [`${character}定`, `${character}強`],
  sentenceCandidates: [`包含${character}的例句。`],
  source: { page: 1, block: '測試' },
}))

const analysis: AnalysisResult = {
  characters,
  lookalikeGroups: [
    { id: 'group-a', characters: ['堅', '賢', '腎'] },
    { id: 'group-b', characters: ['緊', '竪'] },
  ],
}

function context(overrides: Partial<AppContextType> = {}): AppContextType {
  return {
    currentRoute: 'preview',
    navigate: vi.fn(),
    analysisResult: analysis,
    setAnalysisResult: vi.fn(),
    analysisError: null,
    setAnalysisError: vi.fn(),
    selectedGrade: 3,
    setSelectedGrade: vi.fn(),
    worksheetImages: {},
    setWorksheetImages: vi.fn(),
    selectedTemplate: 'character-lookalike-practice',
    setSelectedTemplate: vi.fn(),
    selectedDocxTemplateId: null,
    setSelectedDocxTemplateId: vi.fn(),
    worksheetDoc: null,
    setWorksheetDoc: vi.fn(),
    typedCharacters: characters.map((item) => item.character),
    runTypedAnalysis: vi.fn(),
    readingFontMode: 'kai',
    setReadingFontMode: vi.fn(),
    ...overrides,
  }
}

describe('manual lookalike grouping UI', () => {
  it('shows the step 6 grouping controls and assigned state', () => {
    const html = renderToString(
      <AppContext.Provider value={context()}><PrintPreviewPage /></AppContext.Provider>,
    )
    expect(html).toContain('形近字分組')
    expect(html).toContain('每組 2–6 字・由教師確認')
    expect(html).toContain('確認建立分組')
    expect(html).toContain('解散此組')
    expect(html).toContain('第 1 組')
    expect(html).toContain('disabled=""')
  })

  it('renders grouped section data without recalculating suggestions', async () => {
    const result = await buildWorksheet(analysis, 'character-lookalike-practice')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const html = renderToString(
      <WorksheetContentRenderer
        template="character-lookalike-practice"
        pageSections={result.value.pages[0].sections}
        characters={analysis.characters}
      />,
    )
    expect(html).toContain('堅')
    expect(html).toContain('賢')
    expect(html).toContain('腎')
    expect(html).toContain('部首：')
    expect(html).toContain('土')
    expect(html).toContain('堅定、堅強')
    expect(html).not.toContain('undefined')
  })

  it('adds a selectable template card while leaving step 3 untouched', () => {
    const templateHtml = renderToString(
      <AppContext.Provider value={context({ currentRoute: 'templates' })}><TemplateSelectionPage /></AppContext.Provider>,
    )
    expect(templateHtml).toContain('形近字辨析')
    expect(templateHtml).toContain('目前尚未提供 Word 範本')

    const reviewHtml = renderToString(
      <AppContext.Provider value={context({ currentRoute: 'review' })}><ReviewPage /></AppContext.Provider>,
    )
    expect(reviewHtml).not.toContain('形近字分組')
    expect(reviewHtml).not.toContain('你可能還想加')
  })
})
