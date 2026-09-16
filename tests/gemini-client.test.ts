import { describe, expect, it, vi } from 'vitest'
import { createGeminiClient } from '../src/infrastructure/gemini-client'

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
