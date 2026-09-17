import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import type { AnalysisResult } from '../src/domain'
import {
  clearAnalysisCache,
  clearReadingPassageCache,
  deleteReadingPassageCache,
  getReadingPassageCache,
  putAnalysisCache,
  putReadingPassageCache,
} from '../src/infrastructure'
import { analyzeMaterial, buildAnalysisCacheKey, getCachedAnalysis } from '../src/services'

const cachedAnalysis: AnalysisResult = {
  characters: [
    {
      character: '快',
      zhuyin: 'ㄎㄨㄞˋ',
      radical: '心',
      strokeCount: 7,
      words: ['快樂'],
      exampleSentences: ['我快樂地學習。'],
      confidence: 0.95,
      source: { page: 1, block: null },
      imageSuggestion: null,
      editableState: { status: 'draft', isEditable: true, needsReview: false },
    },
  ],
}

beforeEach(async () => {
  await clearAnalysisCache()
  await clearReadingPassageCache()
})

describe('analysis cache', () => {
  it('returns an IndexedDB cache hit', async () => {
    await putAnalysisCache('known-hash', cachedAnalysis)
    await expect(getCachedAnalysis('known-hash')).resolves.toEqual(cachedAnalysis)
  })

  it('uses the cache before requiring an API key or calling Gemini', async () => {
    await putAnalysisCache(buildAnalysisCacheKey('known-hash'), cachedAnalysis)

    const result = await analyzeMaterial({
      data: new Blob(['processed']),
      fileName: 'material.png',
      mimeType: 'image/png',
      contentHash: 'known-hash',
    })

    expect(result).toEqual({ ok: true, value: cachedAnalysis })
  })

  it('uses separate cache entries for different grade contexts', () => {
    expect(buildAnalysisCacheKey('same-material', { grade: 1, language: 'zh-TW' }))
      .not.toBe(buildAnalysisCacheKey('same-material', { grade: 6, language: 'zh-TW' }))
  })

  it('uses separate cache entries for zhuyin preference', () => {
    const base = { language: 'zh-TW' as const }
    expect(buildAnalysisCacheKey('same-material', {
      ...base,
      includeZhuyin: true,
    })).not.toBe(buildAnalysisCacheKey('same-material', {
      ...base,
      includeZhuyin: false,
    }))
  })
})

describe('reading passage cache', () => {
  it('stores and deletes a generated reading passage', async () => {
    const passage = {
      id: 'reading-key',
      title: '上學日',
      text: '小明到學校學習。',
      grade: 3 as const,
      maxCharacters: 50,
      includedCharacters: ['學'],
      createdAt: '2026-09-17T00:00:00.000Z',
    }
    await putReadingPassageCache('reading-key', passage)
    await expect(getReadingPassageCache('reading-key')).resolves.toEqual(passage)
    await deleteReadingPassageCache('reading-key')
    await expect(getReadingPassageCache('reading-key')).resolves.toBeNull()
  })
})
