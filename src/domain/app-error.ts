import { z } from 'zod'

const errorDetailsSchema = z.record(z.string(), z.unknown()).optional()

export const validationErrorSchema = z.object({
  type: z.literal('validation'),
  message: z.string().min(1),
  retryable: z.literal(false),
  details: errorDetailsSchema,
})

export const dictionaryNotFoundErrorSchema = z.object({
  type: z.literal('dictionary-not-found'),
  message: z.string().min(1),
  retryable: z.literal(false),
  missingCharacters: z.array(z.string().min(1)).min(1),
})

export const appErrorSchema = z.discriminatedUnion('type', [
  validationErrorSchema,
  dictionaryNotFoundErrorSchema,
])

export type AppError = z.infer<typeof appErrorSchema>

export type Result<T, E = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E }
