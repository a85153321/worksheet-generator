import { z } from 'zod'

export const elementaryGradeSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
])

export const analysisContextSchema = z.object({
  grade: z.number().int().min(1).max(6).optional(),
  language: z.literal('zh-TW').default('zh-TW'),
})

export type AnalysisContext = z.infer<typeof analysisContextSchema>
export type AnalysisContextInput = z.input<typeof analysisContextSchema>
export type ElementaryGrade = z.infer<typeof elementaryGradeSchema>
