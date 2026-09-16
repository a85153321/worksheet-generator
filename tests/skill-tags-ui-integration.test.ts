import { describe, expect, it } from 'vitest'
import {
  ANALYSIS_SKILL_TAGS,
  analysisContextSchema,
  type AnalysisSkillTag,
} from '../src/domain'
import { DEFAULT_SKILL_TAGS } from '../src/app/app-context'
import { buildAnalysisCacheKey } from '../src/services'

describe('Skill Tags and Zhuyin Toggle Integration', () => {
  it('has all 19 required skill tags defined in domain', () => {
    expect(ANALYSIS_SKILL_TAGS).toHaveLength(19)
    const requiredTags: AnalysisSkillTag[] = [
      '生字',
      '部件',
      '造詞',
      '注音符號拼讀',
      '筆順識字',
      '詞語搭配',
      '看圖造句',
      '句型仿寫',
      '段落寫作',
      '關聯詞運用',
      '形音義辨析',
      '成語運用',
      '語病修改',
      '修辭技巧',
      '長文閱讀理解',
      '摘要',
      '多元文本閱讀',
      '觀點思辨',
      '短文論述',
    ]
    for (const tag of requiredTags) {
      expect(ANALYSIS_SKILL_TAGS).toContain(tag)
    }
  })

  it('provides sensible DEFAULT_SKILL_TAGS in app-context', () => {
    expect(DEFAULT_SKILL_TAGS.length).toBeGreaterThan(0)
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
