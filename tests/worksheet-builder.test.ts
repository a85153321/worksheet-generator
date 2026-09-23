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
      expect(section?.item.character).toBe(analysis.characters[0]?.character)
      expect(section?.item.wordSentenceBlank).toEqual(
        analysis.characters[0]?.wordSentenceBlank,
      )
    }
    expect(networkRequest).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
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
