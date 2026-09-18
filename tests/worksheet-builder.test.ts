import { describe, expect, it, vi } from 'vitest'
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
      zhuyinCandidates: ['ㄋㄧㄠˇ'],
      radical: '鳥',
      strokeCount: 11,
      wordCandidates: ['小鳥', '飛鳥'],
      sentenceCandidates: ['小鳥在天空中飛翔。'],
      source: { page: 1, block: '第二段' },
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
    ['reference-character-practice', ['character']],
    ['word-practice', ['word']],
    ['sentence-practice', ['sentence']],
    ['picture-practice', ['picture']],
  ])('builds the %s template locally', async (template, expectedKinds) => {
    const networkRequest = vi.fn(() => {
      throw new Error('buildWorksheet must not make network requests')
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

  it('requires a teacher-uploaded image for picture practice', async () => {
    const result = await buildWorksheet(analysis, 'picture-practice')

    expect(result).toMatchObject({
      ok: false,
      error: { type: 'validation' },
    })
  })

  it('rejects a template when the analysis has no matching material', async () => {
    const noWords: AnalysisResult = {
      characters: [{ ...analysis.characters[0], wordCandidates: [] }],
    }

    const result = await buildWorksheet(noWords, 'word-practice')

    expect(result).toMatchObject({ ok: false, error: { type: 'validation' } })
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
