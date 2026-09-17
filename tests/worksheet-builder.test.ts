import { describe, expect, it, vi } from 'vitest'
import { appErrorSchema, characterAnalysisSchema } from '../src/domain'
import type { AnalysisResult } from '../src/domain'
import type { WorksheetImage, WorksheetSection, WorksheetTemplate } from '../src/services'
import {
  buildWorksheet,
  findCharacterPaginationIssues,
} from '../src/services/worksheet-builder'

const analysis: AnalysisResult = {
  characters: [
    {
      character: '鳥',
      zhuyin: 'ㄋㄧㄠˇ',
      radical: '鳥',
      strokeCount: 11,
      words: ['小鳥', '飛鳥'],
      exampleSentences: ['小鳥在天空中飛翔。'],
      confidence: 0.98,
      source: { page: 1, block: '第二段' },
      imageSuggestion: {
        prompt: '小鳥在藍天下飛翔',
        rationale: '配合例句理解情境',
        selected: true,
      },
      editableState: { status: 'confirmed', isEditable: true, needsReview: false },
    },
  ],
}

const image: WorksheetImage = {
  id: 'image-bird',
  character: '鳥',
  url: 'data:image/png;base64,aW1hZ2U=',
  mimeType: 'image/png',
  source: 'upload',
  createdAt: '2026-09-16T00:00:00.000Z',
}

function sectionKinds(sections: WorksheetSection[]): string[] {
  return sections.map((section) => section.kind)
}

describe('buildWorksheet', () => {
  it.each<[WorksheetTemplate, string[]]>([
    ['character-practice', ['character']],
    ['word-practice', ['word']],
    ['sentence-practice', ['sentence']],
    ['picture-practice', ['picture']],
  ])('builds the %s template locally', async (template, expectedKinds) => {
    const networkRequest = vi.fn(() => {
      throw new Error('buildWorksheet must not call AI')
    })
    vi.stubGlobal('fetch', networkRequest)

    const result = await buildWorksheet(analysis, template, { images: [image] })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(sectionKinds(result.value.pages.flatMap((page) => page.sections))).toEqual(
        expectedKinds,
      )
      expect(result.value.pages[0]?.blocks[0]?.character).toBe('鳥')
    }
    expect(networkRequest).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('marks a selected picture exercise that has no generated image', async () => {
    const result = await buildWorksheet(analysis, 'picture-practice')

    expect(result).toMatchObject({
      ok: true,
      value: {
        pages: [{ sections: [{ kind: 'picture', item: { image: null, needsImage: true } }] }],
      },
    })
  })

  it('rejects a template when the analysis has no matching material', async () => {
    const noWords: AnalysisResult = {
      characters: [{ ...analysis.characters[0], words: [] }],
    }

    const result = await buildWorksheet(noWords, 'word-practice')

    expect(result).toMatchObject({ ok: false, error: { type: 'validation' } })
  })

  it('detects duplicated or omitted characters in assembled pages', () => {
    const duplicatedPage = {
      pageNumber: 1,
      blocks: [
        { character: '鳥', zhuyin: 'ㄋㄧㄠˇ', words: [], exampleSentences: [] },
        { character: '鳥', zhuyin: 'ㄋㄧㄠˇ', words: [], exampleSentences: [] },
      ],
      sections: [],
    }

    expect(findCharacterPaginationIssues(analysis.characters, [duplicatedPage])).toEqual(['鳥'])
    expect(findCharacterPaginationIssues(analysis.characters, [])).toEqual(['鳥'])
  })

  it('accepts optional lookalike and multiple-pronunciation data in the character schema', () => {
    const parsed = characterAnalysisSchema.parse({
      ...analysis.characters[0],
      lookalikeCandidates: [{ character: '烏', radical: '火', strokeCount: 10 }],
      multiPronunciations: [{ pronunciation: 'ㄉㄧㄠˇ', word: '鳥了' }],
    })

    expect(parsed.lookalikeCandidates?.[0]?.character).toBe('烏')
    expect(parsed.multiPronunciations?.[0]?.pronunciation).toBe('ㄉㄧㄠˇ')
  })

  it('builds independent lookalike and pronunciation fallbacks without calling AI', async () => {
    const networkRequest = vi.fn()
    vi.stubGlobal('fetch', networkRequest)
    const discriminationAnalysis: AnalysisResult = {
      characters: [
        {
          ...analysis.characters[0],
          lookalikeCandidates: [{ character: '烏', radical: '火', strokeCount: 10 }],
        },
        {
          ...analysis.characters[0],
          character: '行',
          multiPronunciations: [
            { pronunciation: 'ㄒㄧㄥˊ', word: '行走' },
            { pronunciation: 'ㄏㄤˊ', word: '銀行' },
          ],
        },
        { ...analysis.characters[0], character: '天' },
      ],
    }

    const result = await buildWorksheet(discriminationAnalysis, 'character-discrimination')

    expect(result.ok).toBe(true)
    if (result.ok) {
      const sections = result.value.pages.flatMap((page) => page.sections)
      expect(sections).toHaveLength(2)
      expect(sections[0]).toMatchObject({
        kind: 'character-discrimination',
        item: { character: '鳥', multiPronunciations: [], handwritingLineCount: 3 },
      })
      expect(sections[1]).toMatchObject({
        kind: 'character-discrimination',
        item: { character: '行', lookalikeCandidates: [], handwritingLineCount: 3 },
      })
    }
    expect(networkRequest).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('returns no-eligible-characters when discrimination data is entirely absent', async () => {
    const result = await buildWorksheet(analysis, 'character-discrimination')

    expect(result).toMatchObject({
      ok: false,
      error: { type: 'no-eligible-characters', template: 'character-discrimination' },
    })
    if (!result.ok) expect(appErrorSchema.safeParse(result.error).success).toBe(true)
  })

})
