import { describe, expect, it } from 'vitest'
import type { AnalysisResult, CharacterAnalysis } from '../src/domain'
import { applyCharacterReviewRules } from '../src/domain'
import { updateAnalysisResult } from '../src/services'

function character(overrides: Partial<CharacterAnalysis> = {}): CharacterAnalysis {
  return {
    character: '學',
    zhuyin: 'ㄒㄩㄝˊ',
    radical: '子',
    strokeCount: 16,
    wordCandidates: ['學習'],
    sentenceCandidates: ['我喜歡學習。'],
    confidence: 0.95,
    source: { page: 1, block: '第一段' },
    editableState: { status: 'draft', isEditable: true, needsReview: false },
    ...overrides,
  }
}

describe('needsReview rules', () => {
  it('marks confidence below 0.8 for review', () => {
    const result = applyCharacterReviewRules(character({ confidence: 0.79 }))

    expect(result.editableState.needsReview).toBe(true)
    expect(result.reviewReasons).toContain('low-confidence')
  })

  it.each([
    'ambiguous-ocr',
    'uncertain-radical',
    'uncertain-stroke-count',
  ] as const)('marks %s uncertainty for review', (reason) => {
    const result = applyCharacterReviewRules(character({ reviewReasons: [reason] }))

    expect(result.editableState.needsReview).toBe(true)
    expect(result.reviewReasons).toContain(reason)
  })

  it('allows a teacher-confirmed item to clear review state', () => {
    const result = applyCharacterReviewRules(
      character({
        confidence: 0.5,
        reviewReasons: ['ambiguous-ocr'],
        editableState: { status: 'confirmed', isEditable: true, needsReview: true },
      }),
    )

    expect(result.editableState.needsReview).toBe(false)
    expect(result.reviewReasons).toEqual([])
  })
})

describe('updateAnalysisResult', () => {
  it('validates and normalizes teacher edits', async () => {
    const analysis: AnalysisResult = { characters: [character({ confidence: 0.6 })] }

    const result = await updateAnalysisResult(analysis)

    expect(result).toMatchObject({
      ok: true,
      value: { characters: [{ editableState: { needsReview: true } }] },
    })
  })

  it('rejects edits that violate the Zod schema', async () => {
    const result = await updateAnalysisResult({
      characters: [{ ...character(), strokeCount: 0 }],
    })

    expect(result).toMatchObject({
      ok: false,
      error: { type: 'validation', retryable: false },
    })
  })
})
