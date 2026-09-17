import { z } from 'zod'

export const analysisContextSchema = z.object({
  grade: z.number().int().min(1).max(6).optional(),
  language: z.literal('zh-TW').default('zh-TW'),
  includeZhuyin: z.boolean().default(true),
})

export type AnalysisContext = z.infer<typeof analysisContextSchema>
export type AnalysisContextInput = z.input<typeof analysisContextSchema>
