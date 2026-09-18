import { z } from 'zod'

export const sourceLocationSchema = z
  .object({
    page: z.number().int().positive().nullable(),
    block: z.string().trim().min(1).nullable(),
  })
  .refine(({ page, block }) => page !== null || block !== null, {
    message: '來源頁面與區塊至少需要提供一項',
  })

export const characterAnalysisSchema = z.object({
  character: z.string().refine((value) => [...value].length === 1, {
    message: 'character 必須是單一字元',
  }),
  zhuyin: z.string().trim().min(1),
  zhuyinCandidates: z.array(z.string().trim().min(1)).min(1),
  radical: z.string().trim().min(1),
  strokeCount: z.number().int().positive(),
  wordCandidates: z.array(z.string().trim().min(1)),
  sentenceCandidates: z.array(z.string().trim().min(1)),
  source: sourceLocationSchema,
}).refine(({ zhuyin, zhuyinCandidates }) => zhuyinCandidates.includes(zhuyin), {
  message: 'zhuyin 必須是 zhuyinCandidates 中的其中一個讀音',
  path: ['zhuyin'],
})

export const analysisResultSchema = z.object({
  characters: z.array(characterAnalysisSchema),
})

export type SourceLocation = z.infer<typeof sourceLocationSchema>
export type CharacterAnalysis = z.infer<typeof characterAnalysisSchema>
export type AnalysisResult = z.infer<typeof analysisResultSchema>
