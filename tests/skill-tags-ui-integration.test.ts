import { describe, expect, it } from 'vitest'
import {
  ANALYSIS_SKILL_TAGS,
  analysisContextSchema,
} from '../src/domain'
import { DEFAULT_SKILL_TAGS } from '../src/app/app-context'
import { buildAnalysisCacheKey } from '../src/services'

describe('Skill Tags and Zhuyin Toggle Integration', () => {
  it('has exactly the 6 refined skill tags defined in domain without brackets', () => {
    expect(ANALYSIS_SKILL_TAGS).toHaveLength(6)
    const expectedTags = [
      '生字練習',
      '語詞練習',
      '句型練習',
      '字音字形',
      '造句練習',
      '閱讀理解',
    ]
    expect(ANALYSIS_SKILL_TAGS).toEqual(expectedTags)

    // 確認無附加括號說明文字
    for (const tag of ANALYSIS_SKILL_TAGS) {
      expect(tag).not.toContain('(')
      expect(tag).not.toContain(')')
      expect(tag).not.toContain('（')
      expect(tag).not.toContain('）')
    }
  })

  it('provides sensible DEFAULT_SKILL_TAGS in app-context matching core templates', () => {
    expect(DEFAULT_SKILL_TAGS).toEqual(['生字練習', '語詞練習', '句型練習'])
    for (const tag of DEFAULT_SKILL_TAGS) {
      expect(ANALYSIS_SKILL_TAGS).toContain(tag)
    }
  })

  it('validates analysis context schema with tags and zhuyin toggle', () => {
    const parsed = analysisContextSchema.parse({
      grade: 2,
      language: 'zh-TW',
      skillTags: ['生字', '造詞'],
      includeZhuyin: true,
    })
    expect(parsed.includeZhuyin).toBe(true)
    expect(parsed.skillTags).toEqual(['生字', '造詞'])

    const noZhuyin = analysisContextSchema.parse({
      grade: 4,
      language: 'zh-TW',
      skillTags: ['成語運用', '句型仿寫'],
      includeZhuyin: false,
    })
    expect(noZhuyin.includeZhuyin).toBe(false)
  })

  it('builds unique cache keys differentiating skill tags and includeZhuyin', () => {
    const keyWithZhuyin = buildAnalysisCacheKey('content-hash-1', {
      grade: 2,
      language: 'zh-TW',
      skillTags: ['生字', '造詞'],
      includeZhuyin: true,
    })

    const keyWithoutZhuyin = buildAnalysisCacheKey('content-hash-1', {
      grade: 2,
      language: 'zh-TW',
      skillTags: ['生字', '造詞'],
      includeZhuyin: false,
    })

    expect(keyWithZhuyin).not.toEqual(keyWithoutZhuyin)
    expect(keyWithZhuyin).toContain('zhuyin=true')
    expect(keyWithoutZhuyin).toContain('zhuyin=false')

    const keyDifferentSkills = buildAnalysisCacheKey('content-hash-1', {
      grade: 2,
      language: 'zh-TW',
      skillTags: ['生字', '部件'],
      includeZhuyin: true,
    })
    expect(keyWithZhuyin).not.toEqual(keyDifferentSkills)
  })
})
