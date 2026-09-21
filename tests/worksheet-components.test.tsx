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
    expect(TEMPLATE_NAMES['character-practice']).toBe('生字田字格練習單')
    expect(TEMPLATE_NAMES['reference-character-practice']).toBe('範例注音生字學習單')
    expect(TEMPLATE_NAMES['word-practice']).toBe('語詞積木擴展單')
    expect(TEMPLATE_NAMES['sentence-practice']).toBe('句型仿寫應用單')
    expect(TEMPLATE_NAMES['picture-practice']).toBe('看圖識字練習單')

    expect(WORKSHEET_FONT_LABELS['standard-kai']).toBe('標楷體')
    expect(WORKSHEET_FONT_LABELS['zihi-kai-zhuyin']).toBe('標楷有注音')
    expect(WORKSHEET_FONT_LABELS['zihi-only-zhuyin']).toBe('純注音')
  })

  it.each<WorksheetTemplate>([
    'character-practice',
    'reference-character-practice',
    'word-practice',
    'sentence-practice',
    'picture-practice',
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
    const res = await buildWorksheet(sampleAnalysis, 'character-practice')
    expect(res.ok).toBe(true)
    if (!res.ok) return

    const htmlZhuyin = renderToString(
      <WorksheetSheet
        page={res.value.pages[0]}
        totalPages={1}
        template="character-practice"
        previewFont="zihi-kai-zhuyin"
        characters={sampleAnalysis.characters}
      />
    )

    expect(htmlZhuyin).toContain('worksheet-font-zihi-kai-zhuyin')
    expect(htmlZhuyin).toContain('標楷有注音')
  })
})
