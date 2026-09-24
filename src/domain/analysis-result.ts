import { z } from 'zod'

export const MAX_WORD_CANDIDATES = 3
export const MAX_SENTENCE_CANDIDATES = 2

export const sourceLocationSchema = z
  .object({
    page: z.number().int().positive().nullable(),
    block: z.string().trim().min(1).nullable(),
  })
  .refine(({ page, block }) => page !== null || block !== null, {
    message: '來源頁面與區塊至少需要提供一項',
  })

export const wordSentenceBlankSchema = z.object({
  targetWord: z.string().min(1),
  originalSentence: z.string().min(1),
  sentenceBeforeBlank: z.string(),
  sentenceAfterBlank: z.string(),
})

export const lookalikeGroupSchema = z.object({
  id: z.string().trim().min(1),
  characters: z.array(z.string().refine((value) => [...value].length === 1, {
    message: '形近字分組成員必須是單一字元',
  })).min(2).max(6),
})

export const characterAnalysisSchema = z.object({
  character: z.string().refine((value) => [...value].length === 1, {
    message: 'character 必須是單一字元',
  }),
  zhuyin: z.string().trim().min(1),
  zhuyinCandidates: z.array(z.string().trim().min(1)).min(1),
  radical: z.string().trim().min(1),
  strokeCount: z.number().int().positive(),
  // AnalysisResult 是教師確認後、會一路傳到預覽與匯出的 canonical 資料。
  // 辭典 lookup 可保留完整候選供「換一批」使用，但不得把全量候選存進這裡。
  wordCandidates: z.array(z.string().trim().min(1))
    .transform((candidates) => candidates.slice(0, MAX_WORD_CANDIDATES)),
  sentenceCandidates: z.array(z.string().trim().min(1))
    .transform((candidates) => candidates.slice(0, MAX_SENTENCE_CANDIDATES)),
  // 僅保存教師最終選定的一組挖空；完整語詞例句關聯仍留在 lookup-only pool。
  wordSentenceBlank: wordSentenceBlankSchema.nullable().optional(),
  source: sourceLocationSchema,
}).refine(({ zhuyin, zhuyinCandidates }) => zhuyinCandidates.includes(zhuyin), {
  message: 'zhuyin 必須是 zhuyinCandidates 中的其中一個讀音',
  path: ['zhuyin'],
})

export const analysisResultSchema = z.object({
  characters: z.array(characterAnalysisSchema),
  lookalikeGroups: z.array(lookalikeGroupSchema).optional(),
}).superRefine(({ characters, lookalikeGroups }, context) => {
  if (!lookalikeGroups) return
  const availableCharacters = new Set(characters.map((item) => item.character))
  const assignedGroupByCharacter = new Map<string, number>()
  lookalikeGroups.forEach((group, groupIndex) => {
    group.characters.forEach((character, characterIndex) => {
      if (!availableCharacters.has(character)) {
        context.addIssue({
          code: 'custom',
          message: `形近字分組字元「${character}」不在 AnalysisResult.characters 中`,
          path: ['lookalikeGroups', groupIndex, 'characters', characterIndex],
        })
      }
      const previousGroup = assignedGroupByCharacter.get(character)
      if (previousGroup !== undefined) {
        context.addIssue({
          code: 'custom',
          message: `字元「${character}」最多只能屬於一個形近字分組`,
          path: ['lookalikeGroups', groupIndex, 'characters', characterIndex],
        })
      } else {
        assignedGroupByCharacter.set(character, groupIndex)
      }
    })
  })
})

export type SourceLocation = z.infer<typeof sourceLocationSchema>
export type WordSentenceBlank = z.infer<typeof wordSentenceBlankSchema>
export type LookalikeGroup = z.infer<typeof lookalikeGroupSchema>
export type CharacterAnalysis = z.infer<typeof characterAnalysisSchema>
export type AnalysisResult = z.infer<typeof analysisResultSchema>
