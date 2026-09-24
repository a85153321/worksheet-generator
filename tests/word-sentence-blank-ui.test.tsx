import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import { AppContext, type AppContextType } from '../src/app/app-context'
import { ReviewPage } from '../src/features/review/ReviewPage'
import { TemplateSelectionPage } from '../src/features/templates/TemplateSelectionPage'
import {
  buildWorksheet,
  generateDocxBlob,
  WORD_TEMPLATE_REGISTRY,
} from '../src/services'
import type { AnalysisResult } from '../src/domain'

const sampleAnalysisWithBlank: AnalysisResult = {
  characters: [
    {
      character: '學',
      zhuyin: 'ㄒㄩㄝˊ',
      zhuyinCandidates: ['ㄒㄩㄝˊ'],
      radical: '子',
      strokeCount: 16,
      wordCandidates: ['學校', '學習', '學生'],
      sentenceCandidates: ['我每天到學校學習新知識。'],
      wordSentenceBlank: {
        targetWord: '學校',
        originalSentence: '我每天到學校學習新知識。',
        sentenceBeforeBlank: '我每天到',
        sentenceAfterBlank: '學習新知識。',
      },
      source: { page: 1, block: '第一段' },
    },
    {
      character: '習',
      zhuyin: 'ㄒㄧˊ',
      zhuyinCandidates: ['ㄒㄧˊ'],
      radical: '羽',
      strokeCount: 11,
      wordCandidates: ['學習', '練習', '習慣'],
      sentenceCandidates: ['多練習可以讓生字寫得更漂亮。'],
      // 故意不預設 targetWord，驗證手動選取前為 undefined
      wordSentenceBlank: undefined,
      source: { page: 1, block: '第一段' },
    },
  ],
}

function createMockContext(
  overrides: Partial<AppContextType> = {},
): AppContextType {
  return {
    currentRoute: 'review',
    navigate: vi.fn(),
    analysisResult: sampleAnalysisWithBlank,
    setAnalysisResult: vi.fn(),
    analysisError: null,
    setAnalysisError: vi.fn(),
    selectedGrade: 3,
    setSelectedGrade: vi.fn(),
    worksheetImages: {},
    setWorksheetImages: vi.fn(),
    selectedTemplate: 'reference-character-practice',
    setSelectedTemplate: vi.fn(),
    selectedDocxTemplateId: '語詞例句填空學習單雙欄版',
    setSelectedDocxTemplateId: vi.fn(),
    worksheetDoc: null,
    setWorksheetDoc: vi.fn(),
    typedCharacters: ['學', '習'],
    runTypedAnalysis: vi.fn(),
    ...overrides,
  }
}

describe('word-sentence-blank UI and targetWord workflow', () => {
  it('renders targetWord selection buttons and status preview in ReviewPage', () => {
    const html = renderToString(
      <AppContext.Provider value={createMockContext()}>
        <ReviewPage />
      </AppContext.Provider>,
    )

    // 檢查語詞候選有按鈕
    expect(html).toContain('設為填空')
    expect(html).toContain('✓ 已設為填空')

    // 第 1 題已選「學校」，應有填空題提示區塊
    expect(html).toContain('🎯 填空題：')
    expect(html).toContain('【學校】')
    expect(html).toContain('我每天到')
    expect(html).toContain('取消填空')

    // 第 2 題未選，不應顯示填空題指示
    expect(html).not.toContain('【學習】')
  })

  it('correctly maps 語詞例句填空學習單雙欄版 to word-sentence-blank in TemplateSelectionPage', () => {
    const doubleColumnTemplate = WORD_TEMPLATE_REGISTRY.find((tpl) =>
      tpl.fileName.includes('語詞例句填空學習單雙欄版'),
    )
    expect(doubleColumnTemplate).toBeDefined()

    const html = renderToString(
      <AppContext.Provider
        value={createMockContext({
          currentRoute: 'templates',
          selectedTemplate: 'word-sentence-blank',
          selectedDocxTemplateId: doubleColumnTemplate?.id ?? null,
        })}
      >
        <TemplateSelectionPage />
      </AppContext.Provider>,
    )

    expect(html).toContain('語詞例句填空學習單雙欄版')
    expect(html).toContain('橫式雙欄範本')
    expect(html).toContain('橫式 A4 雙欄排版・每頁 8 題')
  })

  it('exports Word docx with 9 questions for word-sentence-blank', async () => {
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

    const built = await buildWorksheet(nineCharsAnalysis, 'word-sentence-blank', {
      docxTemplateId: '語詞例句填空學習單雙欄版',
    })

    expect(built.ok).toBe(true)
    if (!built.ok) return

    expect(built.value.pages).toHaveLength(2)
    expect(built.value.pageSetup.orientation).toBe('landscape')

    const blob = await generateDocxBlob(built.value)
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.size).toBeGreaterThan(1000)
    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
  })
})
