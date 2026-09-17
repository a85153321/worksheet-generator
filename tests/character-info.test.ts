import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearAnalysisCache,
  lookupCharacterInfo,
} from '../src/infrastructure'
import {
  analyzeTypedCharacters,
  saveApiKey,
} from '../src/services'

class MemoryStorage implements Storage {
  private values = new Map<string, string>()
  get length(): number { return this.values.size }
  clear(): void { this.values.clear() }
  getItem(key: string): string | null { return this.values.get(key) ?? null }
  key(index: number): string | null { return [...this.values.keys()][index] ?? null }
  removeItem(key: string): void { this.values.delete(key) }
  setItem(key: string, value: string): void { this.values.set(key, value) }
}

function geminiDraft(characters: readonly string[]): Response {
  return Response.json({
    candidates: [{
      content: {
        parts: [{
          text: JSON.stringify({
            characters: characters.map((character) => ({
              character,
              words: [`${character}詞`],
              exampleSentences: [`這是${character}的例句。`],
              confidence: 1,
              source: { page: null, block: '直接輸入' },
            })),
          }),
        }],
      },
    }],
  })
}

beforeEach(async () => {
  vi.stubGlobal('localStorage', new MemoryStorage())
  await clearAnalysisCache()
})

describe('CNS11643 local character lookup', () => {
  it('returns Taiwan zhuyin, radical and stroke count for common characters', () => {
    expect(lookupCharacterInfo('學')).toEqual({
      radical: '子',
      strokeCount: 16,
      zhuyin: ['ㄒㄩㄝˊ'],
    })
    expect(lookupCharacterInfo('行')?.zhuyin).toEqual(expect.arrayContaining(['ㄒㄧㄥˊ', 'ㄏㄤˊ']))
  })

  it('returns null for invalid or out-of-bundle characters', () => {
    expect(lookupCharacterInfo('學習')).toBeNull()
    expect(lookupCharacterInfo('𠀀')).toBeNull()
  })
})

describe('analyzeTypedCharacters', () => {
  it('makes one compact request and enriches the result from local data', async () => {
    saveApiKey('typed-test-key')
    const request = vi.fn<typeof fetch>().mockResolvedValue(geminiDraft(['學', '習']))
    vi.stubGlobal('fetch', request)

    const result = await analyzeTypedCharacters({
      characters: ['學', '習'],
      context: { grade: 3, language: 'zh-TW', includeZhuyin: true },
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.characters[0]).toMatchObject({
      character: '學', zhuyin: 'ㄒㄩㄝˊ', radical: '子', strokeCount: 16,
    })
    expect(result.value.characters[1]).toMatchObject({
      character: '習', zhuyin: 'ㄒㄧˊ', radical: '羽', strokeCount: 11,
    })
    expect(request).toHaveBeenCalledTimes(1)
    expect(String(request.mock.calls[0]?.[1]?.body)).not.toContain('inlineData')
  })

  it('uses cache and makes no second Gemini request for the same input', async () => {
    saveApiKey('typed-test-key')
    const request = vi.fn<typeof fetch>().mockResolvedValue(geminiDraft(['學']))
    vi.stubGlobal('fetch', request)
    const input = { characters: ['學'], context: { language: 'zh-TW' as const } }

    expect((await analyzeTypedCharacters(input)).ok).toBe(true)
    expect((await analyzeTypedCharacters(input)).ok).toBe(true)
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('does not call Gemini when a character is missing from local data', async () => {
    saveApiKey('typed-test-key')
    const request = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', request)

    const result = await analyzeTypedCharacters({ characters: ['𠀀'] })

    expect(result).toMatchObject({ ok: false, error: { type: 'validation' } })
    expect(request).not.toHaveBeenCalled()
  })
})
