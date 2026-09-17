import { describe, expect, it, vi } from 'vitest'
import type { AnalysisResult } from '../src/domain'
import {
  buildStandardizedReadingPrompt,
  createGenerateReadingPassageUseCase,
  readingPassageCharacterLimit,
} from '../src/services'

const analysis: AnalysisResult = {
  characters: [
    {
      character: '學',
      zhuyin: 'ㄒㄩㄝˊ',
      radical: '子',
      strokeCount: 16,
      words: ['學習'],
      exampleSentences: ['我喜歡學習。'],
      confidence: 0.95,
      source: { page: 1, block: '第一段' },
      imageSuggestion: null,
      editableState: { status: 'confirmed', isEditable: true, needsReview: false },
    },
    {
      character: '習',
      zhuyin: 'ㄒㄧˊ',
      radical: '羽',
      strokeCount: 11,
      words: ['練習'],
      exampleSentences: ['每天練習。'],
      confidence: 0.92,
      source: { page: 1, block: '第一段' },
      imageSuggestion: null,
      editableState: { status: 'edited', isEditable: true, needsReview: false },
    },
  ],
}

function dependencies() {
  return {
    calculateHash: vi.fn(async () => 'passage-key'),
    getApiKey: vi.fn(() => 'api-key'),
    getCachedPassage: vi.fn(async () => null),
    putCachedPassage: vi.fn(async () => undefined),
    generate: vi.fn(async () => ({
      ok: true as const,
      value: { title: '快樂學習', text: '小明到學校開心學習。' },
    })),
    now: vi.fn(() => '2026-09-17T00:00:00.000Z'),
  }
}

describe('generateReadingPassage', () => {
  it.each([[1, 30], [2, 30], [3, 50], [4, 60], [5, 60], [6, 60]])(
    'uses the grade %i character limit',
    (grade, expected) => expect(readingPassageCharacterLimit(grade)).toBe(expected),
  )

  it('uses only teacher-confirmed characters in the standardized prompt', () => {
    const prompt = buildStandardizedReadingPrompt({ analysis, grade: 3 })
    expect(prompt).toContain('必須自然包含全部生字：學')
    expect(prompt).not.toContain('生字：學、習')
    expect(prompt).toContain('50字')
  })

  it('returns a cache hit without reading the API key or calling Gemini', async () => {
    const deps = dependencies()
    deps.getCachedPassage.mockResolvedValue({
      id: 'reading-passage-key',
      title: '快樂學習',
      text: '小明到學校開心學習。',
      grade: 3,
      maxCharacters: 50,
      includedCharacters: ['學'],
      createdAt: '2026-09-17T00:00:00.000Z',
    })
    const generate = createGenerateReadingPassageUseCase(deps)

    const result = await generate({ analysis, grade: 3 })

    expect(result).toMatchObject({ ok: true, value: { source: 'cache' } })
    expect(deps.getApiKey).not.toHaveBeenCalled()
    expect(deps.generate).not.toHaveBeenCalled()
  })

  it('generates and caches a passage after a cache miss', async () => {
    const deps = dependencies()
    const generate = createGenerateReadingPassageUseCase(deps)

    const result = await generate({ analysis, grade: 3 })

    expect(result).toMatchObject({
      ok: true,
      value: {
        source: 'generated',
        passage: { grade: 3, maxCharacters: 50, includedCharacters: ['學'] },
      },
    })
    expect(deps.generate).toHaveBeenCalledTimes(1)
    expect(deps.putCachedPassage).toHaveBeenCalledTimes(1)
  })

  it('does not call Gemini without teacher-confirmed characters', async () => {
    const deps = dependencies()
    const generate = createGenerateReadingPassageUseCase(deps)
    const unconfirmed: AnalysisResult = {
      characters: analysis.characters.map((item) => ({
        ...item,
        editableState: { ...item.editableState, status: 'edited' as const },
      })),
    }

    const result = await generate({ analysis: unconfirmed, grade: 3 })

    expect(result).toMatchObject({ ok: false, error: { type: 'no-eligible-characters' } })
    expect(deps.calculateHash).not.toHaveBeenCalled()
    expect(deps.generate).not.toHaveBeenCalled()
  })
})
