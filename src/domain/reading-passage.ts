import { z } from 'zod'

export const elementaryGradeSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
])

export const readingPassageSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1),
  text: z.string().trim().min(1),
  grade: elementaryGradeSchema,
  maxCharacters: z.number().int().positive(),
  includedCharacters: z.array(z.string().refine((value) => [...value].length === 1)),
  createdAt: z.string().datetime(),
})

export type ElementaryGrade = z.infer<typeof elementaryGradeSchema>
export type ReadingPassage = z.infer<typeof readingPassageSchema>
