import { describe, expect, it, vi } from 'vitest'
import { createGeminiReadingClient } from '../src/infrastructure'

const input = {
  prompt: '生成短文',
  grade: 3 as const,
  maxCharacters: 50,
  requiredCharacters: ['學'],
}

function response(payload: unknown): Response {
  return Response.json({
    candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }],
  })
}

describe('Gemini reading client', () => {
  it('returns a structured passage that contains every required character', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(
      response({ title: '上學日', text: '小明開心到學校學習。' }),
    )

    const result = await createGeminiReadingClient({ apiKey: 'key', fetch: request })
      .generatePassage(input)

    expect(result).toEqual({ ok: true, value: { title: '上學日', text: '小明開心到學校學習。' } })
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('performs only one controlled repair for an invalid passage', async () => {
    const request = vi.fn<typeof fetch>()
      .mockImplementation(async () => response({ title: '無效短文', text: '沒有必要的字。' }))

    const result = await createGeminiReadingClient({ apiKey: 'key', fetch: request })
      .generatePassage(input)

    expect(result).toMatchObject({ ok: false, error: { type: 'validation' } })
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('retries a transient network error once', async () => {
    const request = vi.fn<typeof fetch>()
      .mockRejectedValueOnce(new TypeError('offline'))
      .mockResolvedValueOnce(response({ title: '上學日', text: '小明開心到學校學習。' }))

    const result = await createGeminiReadingClient({ apiKey: 'key', fetch: request })
      .generatePassage(input)

    expect(result.ok).toBe(true)
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('never retries authentication or quota errors', async () => {
    for (const status of [401, 429]) {
      const request = vi.fn<typeof fetch>().mockResolvedValue(new Response('error', { status }))
      const result = await createGeminiReadingClient({ apiKey: 'key', fetch: request })
        .generatePassage(input)

      expect(result.ok).toBe(false)
      expect(request).toHaveBeenCalledTimes(1)
    }
  })
})
