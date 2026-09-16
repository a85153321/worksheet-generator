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

  it('does not retry authentication, quota, or other 4xx responses', async () => {
    for (const status of [400, 401, 403, 429]) {
      const request = vi.fn<typeof fetch>().mockResolvedValue(
        new Response('{"error":{"status":"API_KEY_INVALID"}}', { status }),
      )
      await createGeminiClient({ apiKey: 'secret-key', fetch: request }).analyzeMaterial(input)
      expect(request).toHaveBeenCalledTimes(1)
    }
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
