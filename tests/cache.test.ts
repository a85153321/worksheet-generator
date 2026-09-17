import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import type { AnalysisResult } from '../src/domain'
import {
  clearAnalysisCache,
  putAnalysisCache,
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
