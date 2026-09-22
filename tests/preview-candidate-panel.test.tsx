import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import { AppContext, type AppContextType } from '../src/app/app-context'
import { PrintPreviewPage } from '../src/features/preview/PrintPreviewPage'
import type { AnalysisResult } from '../src/domain'

const sampleAnalysis7: AnalysisResult = {
  characters: ['春', '暖', '花', '開', '學', '習', '好'].map((character, index) => ({
    character,
    zhuyin: 'ㄔㄨㄣ',
    zhuyinCandidates: ['ㄔㄨㄣ'],
    radical: '日',
    strokeCount: 9,
    wordCandidates: [`${character}天`, `${character}風`],
    sentenceCandidates: [`這是${character}的例句。`],
    source: { page: index + 1, block: '第一課' },
  })),
}

function createMockContext(analysisResult: AnalysisResult | null = sampleAnalysis7): AppContextType {
  return {
    currentRoute: 'preview',
    navigate: vi.fn(),
    analysisResult,
    setAnalysisResult: vi.fn(),
    analysisError: null,
    setAnalysisError: vi.fn(),
    selectedGrade: 3,
    setSelectedGrade: vi.fn(),
    worksheetImages: {},
    setWorksheetImages: vi.fn(),
    selectedTemplate: 'character-practice',
    setSelectedTemplate: vi.fn(),
    selectedDocxTemplateId: null,
    setSelectedDocxTemplateId: vi.fn(),
    worksheetDoc: null,
    setWorksheetDoc: vi.fn(),
    typedCharacters: ['春', '暖', '花', '開', '學', '習', '好'],
    runTypedAnalysis: vi.fn(),
  }
}

describe('PrintPreviewPage candidate panel collapsible header', () => {
  it('renders candidate panel with collapsible header showing total character count', () => {
    const html = renderToString(
      <AppContext.Provider value={createMockContext(sampleAnalysis7)}>
        <PrintPreviewPage />
      </AppContext.Provider>,
    )

    expect(html).toContain('preview-candidate-panel')
    expect(html).toMatch(/匯出前候選內容確認.*7.*個生字/)
    expect(html).toContain('語詞最多 3 個・例句最多 2 則')
    expect(html).toContain('點擊展開')
    expect(html).toContain('▶')
    expect(html).toContain('is-collapsed')
    // When collapsed by default, inner candidate items are not rendered to save height
    expect(html).not.toContain('preview-candidate-panel__body')
    expect(html).not.toContain('preview-candidate-list')
  })

  it('handles dynamic character counts accurately', () => {
    const sampleAnalysis3: AnalysisResult = {
      characters: sampleAnalysis7.characters.slice(0, 3),
    }

    const html = renderToString(
      <AppContext.Provider value={createMockContext(sampleAnalysis3)}>
        <PrintPreviewPage />
      </AppContext.Provider>,
    )

    expect(html).toMatch(/匯出前候選內容確認.*3.*個生字/)
  })
})
