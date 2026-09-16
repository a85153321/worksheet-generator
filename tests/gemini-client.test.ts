import { describe, expect, it, vi } from 'vitest'
import {
  buildGeminiGenerateContentUrl,
  buildGradeAdaptationInstruction,
  buildSkillTagInstruction,
  buildZhuyinInstruction,
  createGeminiClient,
  DEFAULT_GEMINI_ANALYSIS_MODEL,
} from '../src/infrastructure/gemini-client'

const input = {
  data: new Blob(['processed material'], { type: 'image/png' }),
  fileName: 'material.png',
  mimeType: 'image/png',
} as const

const validAnalysis = {
  characters: [
    {
      character: '學',
      zhuyin: 'ㄒㄩㄝˊ',
      radical: '子',
      strokeCount: 16,
      words: ['學習'],
      exampleSentences: ['我喜歡學習。'],
      confidence: 0.9,
      source: { page: 1, block: '第一段' },
      imageSuggestion: null,
      editableState: { status: 'draft', isEditable: true, needsReview: false },
    },
  ],
}

function geminiResponse(value: unknown): Response {
  return Response.json({
    candidates: [{ content: { parts: [{ text: JSON.stringify(value) }] } }],
  })
}

describe('Gemini client retry policy', () => {
  it('changes both prompt and observable output for different skill tags', async () => {
    const request = vi.fn<typeof fetch>().mockImplementation(async (_url, init) => {
      const prompt = String(init?.body)
      return geminiResponse({
        ...validAnalysis,
        characters: [{
          ...validAnalysis.characters[0],
          words: prompt.includes('【成語運用】') ? ['學以致用'] : ['學習', '學生'],
          exampleSentences: prompt.includes('【句型仿寫】')
            ? ['因為我每天認真學習，所以進步很快。']
            : ['我喜歡學習。'],
        }],
      })
    })
    const client = createGeminiClient({ apiKey: 'secret-key', fetch: request })

    const wordResult = await client.analyzeMaterial({ ...input, skillTags: ['造詞'] })
    const advancedResult = await client.analyzeMaterial({
      ...input,
      skillTags: ['成語運用', '句型仿寫'],
    })

    expect(wordResult.ok && wordResult.value.characters[0].words).toEqual(['學習', '學生'])
    expect(advancedResult.ok && advancedResult.value.characters[0].words).toEqual(['學以致用'])
    expect(advancedResult.ok && advancedResult.value.characters[0].exampleSentences[0])
      .toContain('因為')
    expect(buildSkillTagInstruction(['造詞'])).toContain('符合語境的造詞')
  })

  it('requires populated zhuyin when enabled and accepts an empty field when disabled', async () => {
    const request = vi.fn<typeof fetch>().mockImplementation(async (_url, init) => {
      const includeZhuyin = String(init?.body).includes('zhuyin 必須填入')
      return geminiResponse({
        ...validAnalysis,
        characters: [{ ...validAnalysis.characters[0], zhuyin: includeZhuyin ? 'ㄒㄩㄝˊ' : '' }],
      })
    })
    const client = createGeminiClient({ apiKey: 'secret-key', fetch: request })

    const withZhuyin = await client.analyzeMaterial({ ...input, includeZhuyin: true })
    const withoutZhuyin = await client.analyzeMaterial({ ...input, includeZhuyin: false })

    expect(withZhuyin.ok && withZhuyin.value.characters[0].zhuyin).toBe('ㄒㄩㄝˊ')
    expect(withoutZhuyin.ok && withoutZhuyin.value.characters[0].zhuyin).toBe('')
    expect(buildZhuyinInstruction(true)).toContain('不可留空')
    expect(buildZhuyinInstruction(false)).toContain('空字串')
  })

  it('adds observably different vocabulary and sentence guidance for grades 1 and 6', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(geminiResponse(validAnalysis))
    const client = createGeminiClient({ apiKey: 'secret-key', fetch: request })

    await client.analyzeMaterial({ ...input, grade: 1 })
    await client.analyzeMaterial({ ...input, grade: 6 })

    const gradeOneBody = JSON.parse(String(request.mock.calls[0]?.[1]?.body))
    const gradeSixBody = JSON.parse(String(request.mock.calls[1]?.[1]?.body))
    const gradeOnePrompt = JSON.stringify(gradeOneBody)
    const gradeSixPrompt = JSON.stringify(gradeSixBody)
    expect(gradeOnePrompt).toContain('基礎二字詞')
    expect(gradeOnePrompt).toContain('避免成語')
    expect(gradeOnePrompt).toContain('8～12')
    expect(gradeSixPrompt).toContain('進階書面語')
    expect(gradeSixPrompt).toContain('成語')
    expect(gradeSixPrompt).toContain('複句')
    expect(gradeSixPrompt).toContain('28～45')
    expect(gradeOneBody).not.toEqual(gradeSixBody)
    expect(buildGradeAdaptationInstruction(1)).not.toBe(buildGradeAdaptationInstruction(6))
  })

  it('uses the current stable analysis model and exact v1beta generateContent URL', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(geminiResponse(validAnalysis))

    await createGeminiClient({ apiKey: 'secret-key', fetch: request }).analyzeMaterial(input)

    expect(DEFAULT_GEMINI_ANALYSIS_MODEL).toBe('gemini-3.5-flash')
    expect(buildGeminiGenerateContentUrl()).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent',
    )
    expect(request).toHaveBeenCalledWith(buildGeminiGenerateContentUrl(), expect.any(Object))
  })

  it('retries a transient network failure at most once', async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new TypeError('offline'))
      .mockResolvedValueOnce(geminiResponse(validAnalysis))

    const result = await createGeminiClient({ apiKey: 'secret-key', fetch: request }).analyzeMaterial(input)

    expect(result.ok).toBe(true)
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('stops after one retry when the network remains unavailable', async () => {
    const request = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('offline'))

    const result = await createGeminiClient({ apiKey: 'secret-key', fetch: request }).analyzeMaterial(input)

    expect(result).toMatchObject({ ok: false, error: { type: 'network' } })
    expect(request).toHaveBeenCalledTimes(2)
  })

  it.each([408, 500, 503])('retries transient HTTP %i at most once', async (status) => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('temporary', { status }))
      .mockResolvedValueOnce(geminiResponse(validAnalysis))

    const result = await createGeminiClient({ apiKey: 'secret-key', fetch: request }).analyzeMaterial(input)

    expect(result.ok).toBe(true)
    expect(request).toHaveBeenCalledTimes(2)
  })

  it.each([401, 403])('never retries authentication HTTP %i', async (status) => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('{"error":{"status":"UNAUTHENTICATED"}}', { status }),
    )

    const result = await createGeminiClient({ apiKey: 'secret-key', fetch: request }).analyzeMaterial(input)

    expect(result).toMatchObject({ ok: false, error: { type: 'authentication' } })
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('never retries quota errors', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('{"error":{"status":"RESOURCE_EXHAUSTED"}}', { status: 429 }),
    )

    const result = await createGeminiClient({ apiKey: 'secret-key', fetch: request }).analyzeMaterial(input)

    expect(result).toMatchObject({ ok: false, error: { type: 'quota' } })
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('does not retry other 4xx errors', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('{"error":{"status":"INVALID_ARGUMENT"}}', { status: 400 }),
    )

    const result = await createGeminiClient({ apiKey: 'secret-key', fetch: request }).analyzeMaterial(input)

    expect(result).toMatchObject({ ok: false, error: { type: 'validation' } })
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('performs only one controlled format repair', async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => geminiResponse({ characters: [{ character: '格式錯誤' }] }))

    const result = await createGeminiClient({ apiKey: 'secret-key', fetch: request }).analyzeMaterial(input)

    expect(result.ok).toBe(false)
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('never exposes the API key in returned errors', async () => {
    const apiKey = 'top-secret-api-key'
    const request = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ error: { message: `invalid ${apiKey}` } }), { status: 401 }),
    )

    const result = await createGeminiClient({ apiKey, fetch: request }).analyzeMaterial(input)

    expect(JSON.stringify(result)).not.toContain(apiKey)
  })
})
