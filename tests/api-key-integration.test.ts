import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearAnalysisCache } from '../src/infrastructure'
import { analyzeMaterial, getApiKey, isApiKeyConfigured, saveApiKey } from '../src/services'

class MemoryStorage implements Storage {
  private values = new Map<string, string>()

  get length(): number {
    return this.values.size
  }

  clear(): void {
    this.values.clear()
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }
}

const validAnalysis = {
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
      editableState: { status: 'draft', isEditable: true, needsReview: false },
    },
  ],
}

beforeEach(async () => {
  vi.stubGlobal('localStorage', new MemoryStorage())
  await clearAnalysisCache()
})

describe('API Key storage integration', () => {
  it('uses the same stored key for readiness and analyzeMaterial', async () => {
    saveApiKey('saved-gemini-key')
    const request = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        candidates: [{ content: { parts: [{ text: JSON.stringify(validAnalysis) }] } }],
      }),
    )
    vi.stubGlobal('fetch', request)

    expect(isApiKeyConfigured()).toBe(true)
    expect(getApiKey()).toBe('saved-gemini-key')

    const result = await analyzeMaterial({
      data: new Blob(['processed material'], { type: 'image/png' }),
      fileName: 'material.png',
      mimeType: 'image/png',
      contentHash: 'api-key-integration-test',
    })

    expect(result.ok).toBe(true)
    expect(request).toHaveBeenCalledTimes(1)
    expect(request.mock.calls[0]?.[1]?.headers).toMatchObject({
      'x-goog-api-key': 'saved-gemini-key',
    })
  })

  it('migrates the legacy UI storage key to the canonical key', () => {
    localStorage.setItem('ws_gemini_api_key', 'legacy-key')

    expect(getApiKey()).toBe('legacy-key')
    expect(localStorage.getItem('worksheet-generator.gemini-api-key')).toBe('legacy-key')
    expect(localStorage.getItem('ws_gemini_api_key')).toBeNull()
  })
})
