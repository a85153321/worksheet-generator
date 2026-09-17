import { z } from 'zod'

const errorDetailsSchema = z.record(z.string(), z.unknown()).optional()

export const validationErrorSchema = z.object({
  type: z.literal('validation'),
  message: z.string().min(1),
  retryable: z.literal(false),
  details: errorDetailsSchema,
})

export const networkErrorSchema = z.object({
  type: z.literal('network'),
  message: z.string().min(1),
  retryable: z.boolean(),
  statusCode: z.number().int().optional(),
  details: errorDetailsSchema,
})

export const authenticationErrorSchema = z.object({
  type: z.literal('authentication'),
  message: z.string().min(1),
  retryable: z.literal(false),
  details: errorDetailsSchema,
})

export const quotaErrorSchema = z.object({
  type: z.literal('quota'),
  message: z.string().min(1),
  retryable: z.literal(false),
  retryAfterSeconds: z.number().nonnegative().optional(),
  details: errorDetailsSchema,
})

export const noEligibleCharactersErrorSchema = z.object({
  type: z.literal('no-eligible-characters'),
  template: z.literal('character-discrimination'),
  message: z.string().min(1),
  retryable: z.literal(false),
  details: errorDetailsSchema,
})

export const appErrorSchema = z.discriminatedUnion('type', [
  validationErrorSchema,
  networkErrorSchema,
  authenticationErrorSchema,
  quotaErrorSchema,
  noEligibleCharactersErrorSchema,
])

export type AppError = z.infer<typeof appErrorSchema>

export type Result<T, E = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E }
