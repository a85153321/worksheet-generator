import { describe, expect, it, vi } from 'vitest'
import type { AnalysisResult } from '../src/domain'
import type { WorksheetSection } from '../src/services'
import {
  buildWorksheet,
  findCharacterPaginationIssues,
} from '../src/services/worksheet-builder'

const analysis: AnalysisResult = {
  characters: [
    {
      character: '鳥',
      zhuyin: 'ㄋㄧㄠˇ',
      zhuyinCandidates: ['ㄋㄧㄠˇ'],
      radical: '鳥',
      strokeCount: 11,
      wordCandidates: ['小鳥', '飛鳥'],
      sentenceCandidates: ['小鳥在天空中飛翔。'],
      wordSentenceBlank: {
        targetWord: '小鳥',
        originalSentence: '小鳥在天空中飛翔。',
        sentenceBeforeBlank: '',
        sentenceAfterBlank: '在天空中飛翔。',
      },
      source: { page: 1, block: '第二段' },
    },
  ],
}

function sectionKinds(sections: WorksheetSection[]): string[] {
  return sections.map((section) => section.kind)
}

describe('buildWorksheet', () => {
  it('builds the reference template locally', async () => {
    const networkRequest = vi.fn(() => {
      throw new Error('buildWorksheet must not make network requests')
    })
    vi.stubGlobal('fetch', networkRequest)

    const result = await buildWorksheet(analysis, 'reference-character-practice')

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(sectionKinds(result.value.pages.flatMap((page) => page.sections))).toEqual(
        ['character'],
      )
      expect(result.value.pages[0]?.blocks[0]?.character).toBe('鳥')
      const section = result.value.pages[0]?.sections[0]
      expect(section?.kind).toBe('character')
      if (!section || section.kind !== 'character') throw new Error('missing character section')
      expect(section.item.character).toBe(analysis.characters[0]?.character)
      expect(section.item.wordSentenceBlank).toEqual(
        analysis.characters[0]?.wordSentenceBlank,
      )
    }
    expect(networkRequest).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('builds word sentence blank pages with shared top items and paired rows', async () => {
    const characters = Array.from({ length: 9 }, (_, index) => {
      const number = index + 1
      return {
        ...analysis.characters[0]!,
        character: String.fromCharCode(0x4e00 + index),
        wordSentenceBlank: {
          targetWord: `語詞${number}`,
          originalSentence: `前${number}語詞${number}後${number}`,
          sentenceBeforeBlank: `前${number}`,
          sentenceAfterBlank: `後${number}`,
        },
      }
    })
    const result = await buildWorksheet({ characters }, 'word-sentence-blank')
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.error.message)
    expect(result.value.templateLabel).toBe('語詞例句填空')
    expect(result.value.pageSetup.orientation).toBe('landscape')
    expect(result.value.pages).toHaveLength(2)

    const first = result.value.pages[0]?.sections[0]
    const second = result.value.pages[1]?.sections[0]
    expect(first?.kind).toBe('word-sentence-blank')
    expect(second?.kind).toBe('word-sentence-blank')
    if (!first || first.kind !== 'word-sentence-blank') throw new Error('missing first section')
    if (!second || second.kind !== 'word-sentence-blank') throw new Error('missing second section')
    expect(first.topItems.map((item) => item.questionNumber)).toEqual([1, 2, 3, 4, 5])
    expect(first.itemRows.map((row) => [row.left.questionNumber, row.right?.questionNumber])).toEqual([
      [1, 2], [3, 4], [5, 6], [7, 8],
    ])
    expect(second.topItems.map((item) => item.questionNumber)).toEqual([9])
    expect(second.itemRows).toEqual([{ left: second.topItems[0] }])
  })

  it('detects duplicated or omitted characters in assembled pages', () => {
    const duplicatedPage = {
      pageNumber: 1,
      blocks: [
        { character: '鳥', zhuyin: 'ㄋㄧㄠˇ', wordCandidates: [], sentenceCandidates: [] },
        { character: '鳥', zhuyin: 'ㄋㄧㄠˇ', wordCandidates: [], sentenceCandidates: [] },
      ],
      sections: [],
    }

    expect(findCharacterPaginationIssues(analysis.characters, [duplicatedPage])).toEqual(['鳥'])
    expect(findCharacterPaginationIssues(analysis.characters, [])).toEqual(['鳥'])
  })

})
