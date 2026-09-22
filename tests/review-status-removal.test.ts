import { describe, expect, it } from 'vitest'
import { analysisResultSchema, type AnalysisResult } from '../src/domain'
import {
  buildWorksheet,
  updateAnalysisResult,
} from '../src/services'

const analysisWithoutReviewStatus: AnalysisResult = {
  characters: [
    {
      character: '學',
      zhuyin: 'ㄒㄩㄝˊ',
      zhuyinCandidates: ['ㄒㄩㄝˊ'],
      radical: '子',
      strokeCount: 16,
      wordCandidates: ['學習', '學生'],
      sentenceCandidates: ['學生在學校認真學習。'],
      source: { page: null, block: '教育部《國語辭典簡編本》' },
    },
  ],
}

describe('analysis without review status', () => {
  it('strips legacy review fields from persisted records', () => {
    const legacyRecord = {
      characters: analysisWithoutReviewStatus.characters.map((item) => ({
        ...item,
        confidence: 0.5,
        reviewReasons: ['low-confidence'],
        editableState: { status: 'confirmed', isEditable: true, needsReview: false },
      })),
    }

    const parsed = analysisResultSchema.parse(legacyRecord)

    expect(parsed.characters[0]).not.toHaveProperty('confidence')
    expect(parsed.characters[0]).not.toHaveProperty('reviewReasons')
    expect(parsed.characters[0]).not.toHaveProperty('editableState')
  })

  it('validates, saves teacher edits, and builds the reference worksheet', async () => {
    expect(analysisResultSchema.safeParse(analysisWithoutReviewStatus).success).toBe(true)

    const edited: AnalysisResult = {
      characters: analysisWithoutReviewStatus.characters.map((item) => ({
        ...item,
        wordCandidates: [...item.wordCandidates, '學校'],
      })),
    }
    const updateResult = await updateAnalysisResult(edited)
    expect(updateResult).toEqual({ ok: true, value: edited })
    if (!updateResult.ok) return

    const worksheetResult = await buildWorksheet(updateResult.value, 'reference-character-practice')
    expect(worksheetResult.ok).toBe(true)
  })

  it('stores no more than three words and two sentences after teacher confirmation', async () => {
    const overLimit = {
      characters: analysisWithoutReviewStatus.characters.map((item) => ({
        ...item,
        wordCandidates: ['一', '二', '三', '四', '五'],
        sentenceCandidates: ['句一', '句二', '句三'],
      })),
    }
    const result = await updateAnalysisResult(overLimit)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.characters[0].wordCandidates).toEqual(['一', '二', '三'])
    expect(result.value.characters[0].sentenceCandidates).toEqual(['句一', '句二'])
  })
})
