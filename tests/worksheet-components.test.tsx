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
    expect(TEMPLATE_NAMES['word-sentence-blank']).toBe('語詞例句填空')

    expect(WORKSHEET_FONT_LABELS['standard-kai']).toBe('標楷體')
    expect(WORKSHEET_FONT_LABELS['zihi-kai-zhuyin']).toBe('標楷有注音')
    expect(WORKSHEET_FONT_LABELS['zihi-only-zhuyin']).toBe('純注音')
  })

  it.each<WorksheetTemplate>([
    'reference-character-practice',
    'word-sentence-blank',
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
  })

  it('renders word-sentence-blank empty state when no targetWord is set', async () => {
    const res = await buildWorksheet(sampleAnalysis, 'word-sentence-blank')
    expect(res.ok).toBe(true)
    if (!res.ok) return

    const html = renderToString(
      <WorksheetSheet
        page={res.value.pages[0]}
        totalPages={1}
        template="word-sentence-blank"
        characters={sampleAnalysis.characters}
      />
    )

    expect(html).toContain('尚未設定填空語詞題目')
    expect(html).toContain('word-sentence-blank-empty')
  })

  it('renders word-sentence-blank with topItems and 2-column itemRows for 9 questions', async () => {
    const entries = [
      ['看', '觀看', '小明仔細', '天空中的飛鳥。'],
      ['學', '學習', '我們努力', '新的知識。'],
      ['習', '複習', '考試前要認真', '課堂內容。'],
      ['會', '機會', '我把握每一次', '展現自己。'],
      ['鳥', '小鳥', '枝頭上的', '唱著清脆的歌。'],
      ['山', '高山', '遠方的', '被白雲環繞。'],
      ['三', '三角形', '老師在黑板上畫了一個', '。'],
      ['槍', '水槍', '孩子們拿著', '開心玩耍。'],
      ['書', '圖書', '我從', '館借了一本書。'],
    ] as const

    const nineCharsAnalysis: AnalysisResult = {
      characters: entries.map(([character, word, before, after]) => ({
        character,
        zhuyin: 'ㄅ',
        zhuyinCandidates: ['ㄅ'],
        radical: '一',
        strokeCount: 5,
        wordCandidates: [word],
        sentenceCandidates: [`${before}${word}${after}`],
        wordSentenceBlank: {
          targetWord: word,
          originalSentence: `${before}${word}${after}`,
          sentenceBeforeBlank: before,
          sentenceAfterBlank: after,
        },
        source: { page: 1, block: '測試' },
      })),
    }

    const res = await buildWorksheet(nineCharsAnalysis, 'word-sentence-blank')
    expect(res.ok).toBe(true)
    if (!res.ok) return

    expect(res.value.pages).toHaveLength(2)

    // Page 1: 5 top items, 4 rows (8 questions)
    const page1Html = renderToString(
      <WorksheetSheet
        page={res.value.pages[0]}
        totalPages={2}
        template="word-sentence-blank"
        characters={nineCharsAnalysis.characters}
      />
    )
    expect(page1Html).toContain('wsb-top-table')
    expect(page1Html).toContain('觀看')
    expect(page1Html).toContain('學習')
    expect(page1Html).toContain('複習')
    expect(page1Html).toContain('機會')
    expect(page1Html).toContain('小鳥')
    // 6th item should not be in topItems
    expect(page1Html).not.toContain('<td class="wsb-top-cell-word">高山</td>')
    // Page 1 should contain questions 1 through 8
    expect(page1Html).toContain('1. 生字「看」')
    expect(page1Html).toContain('8. 生字「槍」')
    expect(page1Html).not.toContain('undefined')

    // Page 2: question 9 on left, empty column on right
    const page2Html = renderToString(
      <WorksheetSheet
        page={res.value.pages[1]}
        totalPages={2}
        template="word-sentence-blank"
        characters={nineCharsAnalysis.characters}
      />
    )
    expect(page2Html).toContain('9. 生字「書」')
    expect(page2Html).toContain('wsb-question-empty-col')
    expect(page2Html).not.toContain('undefined')
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
