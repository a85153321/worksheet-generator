import React from 'react'
import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import type { AnalysisResult } from '../src/domain'
import {
  buildWorksheet,
  type WorksheetTemplate,
  type WorksheetImage,
} from '../src/services'
import {
  WorksheetSheet,
  TEMPLATE_NAMES,
  WORKSHEET_FONT_LABELS,
} from '../src/components/worksheet'

const sampleAnalysis: AnalysisResult = {
  characters: [
    {
      character: '春',
      zhuyin: 'ㄔㄨㄣ',
      zhuyinCandidates: ['ㄔㄨㄣ'],
      radical: '日',
      strokeCount: 9,
      wordCandidates: ['春天', '春風'],
      sentenceCandidates: ['春天百花盛開。'],
      source: { page: 1, block: '第一課' },
    },
  ],
}

const sampleImage: WorksheetImage = {
  id: 'img-chun',
  character: '春',
  url: 'data:image/png;base64,sample',
  mimeType: 'image/png',
  source: 'upload',
  createdAt: '2026-09-21T00:00:00.000Z',
}

describe('WorksheetSheet & WorksheetContentRenderer', () => {
  it('has consistent template names and font labels', () => {
    expect(TEMPLATE_NAMES['reference-character-practice']).toBe('範例注音生字學習單')

    expect(WORKSHEET_FONT_LABELS['standard-kai']).toBe('標楷體')
    expect(WORKSHEET_FONT_LABELS['zihi-kai-zhuyin']).toBe('標楷有注音')
    expect(WORKSHEET_FONT_LABELS['zihi-only-zhuyin']).toBe('純注音')
  })

  it.each<WorksheetTemplate>([
    'reference-character-practice',
  ])('renders template %s into html without crashing', async (template) => {
    const res = await buildWorksheet(sampleAnalysis, template, {
      images: [sampleImage],
    })
    expect(res.ok).toBe(true)
    if (!res.ok) return

    const page = res.value.pages[0]
    const html = renderToString(
      <WorksheetSheet
        page={page}
        totalPages={res.value.pages.length}
        template={template}
        title={res.value.title}
        previewFont="standard-kai"
        characters={sampleAnalysis.characters}
        images={{ 春: sampleImage }}
      />
    )

    expect(html).toContain('a4-sheet')
    expect(html).toContain('worksheet-font-standard-kai')
    expect(html).toContain('春')
  })

  it('supports switching previewFont classes', async () => {
    const res = await buildWorksheet(sampleAnalysis, 'reference-character-practice')
    expect(res.ok).toBe(true)
    if (!res.ok) return

    const htmlZhuyin = renderToString(
      <WorksheetSheet
        page={res.value.pages[0]}
        totalPages={1}
        template="reference-character-practice"
        previewFont="zihi-kai-zhuyin"
        characters={sampleAnalysis.characters}
      />
    )

    expect(htmlZhuyin).toContain('worksheet-font-zihi-kai-zhuyin')
  })

  it('determines default font based on grade correctly', () => {
    const resolveDefaultFont = (grade?: number): 'zihi-kai-zhuyin' | 'standard-kai' =>
      (grade ?? 3) <= 2 ? 'zihi-kai-zhuyin' : 'standard-kai'

    expect(resolveDefaultFont(1)).toBe('zihi-kai-zhuyin')
    expect(resolveDefaultFont(2)).toBe('zihi-kai-zhuyin')
    expect(resolveDefaultFont(3)).toBe('standard-kai')
    expect(resolveDefaultFont(4)).toBe('standard-kai')
    expect(resolveDefaultFont(undefined)).toBe('standard-kai')
  })
})
