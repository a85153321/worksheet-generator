import { z } from 'zod'

export const ANALYSIS_SKILL_TAGS = [
  '生字練習',
  '語詞練習',
  '句型練習',
  '字音字形',
  '造句練習',
  '閱讀理解',
] as const

export const LEGACY_ANALYSIS_SKILL_TAGS = [
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
] as const

export const SUPPORTED_SKILL_TAGS = [
  ...ANALYSIS_SKILL_TAGS,
  ...LEGACY_ANALYSIS_SKILL_TAGS,
] as const

export const analysisSkillTagSchema = z.enum(SUPPORTED_SKILL_TAGS)

export const analysisContextSchema = z.object({
  grade: z.number().int().min(1).max(6).optional(),
  language: z.literal('zh-TW').default('zh-TW'),
  skillTags: z.array(analysisSkillTagSchema).default([]),
  includeZhuyin: z.boolean().default(true),
})

export type AnalysisSkillTag = z.infer<typeof analysisSkillTagSchema>
export type AnalysisContext = z.infer<typeof analysisContextSchema>
export type AnalysisContextInput = z.input<typeof analysisContextSchema>
