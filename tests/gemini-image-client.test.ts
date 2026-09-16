import { describe, expect, it, vi } from 'vitest'
import {
  buildGeminiImageGenerateContentUrl,
  createGeminiImageClient,
  DEFAULT_GEMINI_IMAGE_MODEL,
} from '../src/infrastructure/gemini-image-client'

const onePixelPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

function imageResponse(): Response {
  return new Response(JSON.stringify({
    candidates: [{
      content: {
        parts: [{ inlineData: { data: onePixelPng, mimeType: 'image/png' } }],
      },
    }],
  }), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

describe('Gemini image client', () => {
  it('uses the stable image model and official generateContent request body', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(imageResponse())

    const result = await createGeminiImageClient({
      apiKey: 'secret-key',
      fetch: request,
    }).generateImage('一隻小鳥在天空飛翔')

    expect(result).toMatchObject({ ok: true, value: { mimeType: 'image/png' } })
    expect(DEFAULT_GEMINI_IMAGE_MODEL).toBe('gemini-3.1-flash-image')
    expect(buildGeminiImageGenerateContentUrl()).toBe(
      'https://generativelanguage.googleapis.com/v1/models/gemini-3.1-flash-image:generateContent',
    )
    expect(request).toHaveBeenCalledTimes(1)
    const [url, init] = request.mock.calls[0]
    expect(url).toBe(buildGeminiImageGenerateContentUrl())
    expect(JSON.parse(String(init?.body))).toEqual({
      contents: [{ role: 'user', parts: [{ text: '一隻小鳥在天空飛翔' }] }],
      generationConfig: { responseModalities: ['IMAGE'] },
    })
  })
})
