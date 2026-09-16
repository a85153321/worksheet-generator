import { z } from 'zod'

export const sourceLocationSchema = z
  .object({
    page: z.number().int().positive().nullable(),
    block: z.string().trim().min(1).nullable(),
  })
  .refine(({ page, block }) => page !== null || block !== null, {
    message: '來源頁面與區塊至少需要提供一項',
  })

export const imageSuggestionSchema = z.object({
  prompt: z.string().trim().min(1),
  rationale: z.string().trim().min(1),
  selected: z.boolean().default(false),
})

export const editableStateSchema = z.object({
  status: z.enum(['draft', 'edited', 'confirmed']),
  isEditable: z.boolean(),
  needsReview: z.boolean(),
})

export const reviewReasonSchema = z.enum([
  'low-confidence',
  'ambiguous-ocr',
  'uncertain-radical',
  'uncertain-stroke-count',
])

export const characterAnalysisSchema = z.object({
  character: z.string().refine((value) => [...value].length === 1, {
    message: 'character 必須是單一字元',
  }),
  zhuyin: z.string().trim().min(1),
  radical: z.string().trim().min(1),
  strokeCount: z.number().int().positive(),
  words: z.array(z.string().trim().min(1)),
  exampleSentences: z.array(z.string().trim().min(1)),
  confidence: z.number().min(0).max(1),
  reviewReasons: z.array(reviewReasonSchema).optional(),
  source: sourceLocationSchema,
  imageSuggestion: imageSuggestionSchema.nullable(),
  editableState: editableStateSchema,
})

export const analysisResultSchema = z.object({
  characters: z.array(characterAnalysisSchema),
})

export type SourceLocation = z.infer<typeof sourceLocationSchema>
export type ImageSuggestion = z.infer<typeof imageSuggestionSchema>
export type EditableState = z.infer<typeof editableStateSchema>
export type ReviewReason = z.infer<typeof reviewReasonSchema>
export type CharacterAnalysis = z.infer<typeof characterAnalysisSchema>
export type AnalysisResult = z.infer<typeof analysisResultSchema>
