import { describe, expect, it, vi } from 'vitest'
import {
  buildGeminiGenerateContentUrl,
  buildGradeAdaptationInstruction,
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
      words: ['學習'],
      exampleSentences: ['我喜歡學習。'],
      confidence: 0.9,
      source: { page: 1, block: '第一段' },
    },
  ],
}

function geminiResponse(value: unknown): Response {
  return Response.json({
    candidates: [{ content: { parts: [{ text: JSON.stringify(value) }] } }],
  })
}

describe('Gemini client retry policy', () => {
  it('asks Gemini only for OCR, words and sentences, leaving local fields out', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(geminiResponse(validAnalysis))

    await createGeminiClient({ apiKey: 'secret-key', fetch: request }).analyzeMaterial(input)

    const body = JSON.parse(String(request.mock.calls[0]?.[1]?.body))
    const prompt = JSON.stringify(body)
    expect(prompt).toContain('辨識圖片中的生字')
    expect(prompt).toContain('不要輸出注音、部首或筆畫')
    expect(prompt).not.toContain('strokeCount')
    expect(prompt).not.toContain('zhuyin')
  })

  it('uses a compact text-only request for directly typed characters', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(geminiResponse(validAnalysis))
    const client = createGeminiClient({ apiKey: 'secret-key', fetch: request })

    const result = await client.analyzeTypedCharacters({ characters: ['學'], grade: 1 })

    expect(result.ok).toBe(true)
    const body = JSON.parse(String(request.mock.calls[0]?.[1]?.body))
    const prompt = JSON.stringify(body)
    expect(prompt).toContain('[\\"學\\"]')
    expect(prompt).toContain('不需 OCR')
    expect(prompt).not.toContain('inlineData')
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
