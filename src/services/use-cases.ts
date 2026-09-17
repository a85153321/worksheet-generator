import {
  analysisResultSchema,
  applyAnalysisReviewRules,
  type AnalysisResult,
  type AppError,
  type Result,
} from '../domain'
import {
  calculateInputHash,
  createGeminiClient,
  formatCharacterZhuyin,
  getAnalysisCache,
  getGeminiApiKey,
  lookupCharacterInfo,
  putAnalysisCache,
  type GeminiAnalysisDraft,
} from '../infrastructure'
import type {
  AnalyzeMaterialInput,
  AnalyzeTypedCharactersInput,
} from './contracts'

export function buildAnalysisCacheKey(
  contentHash: string,
  context?: AnalyzeMaterialInput['context'],
): string {
  return `analysis-v5:${contentHash}:grade=${context?.grade ?? 'unspecified'}:language=${context?.language ?? 'zh-TW'}:zhuyin=${context?.includeZhuyin ?? true}`
}

function enrichDraftWithLocalCharacterData(
  draft: GeminiAnalysisDraft,
  includeZhuyin: boolean,
): Result<AnalysisResult, AppError> {
  const missingCharacters = draft.characters
    .map(({ character }) => character)
    .filter((character) => lookupCharacterInfo(character) === null)

  if (missingCharacters.length > 0) {
    return {
      ok: false,
      error: {
        type: 'validation',
        message: `本機 CNS11643 字庫查不到以下字元：${[...new Set(missingCharacters)].join('、')}。請人工確認或改用可查得的字元。`,
        retryable: false,
        details: { missingCharacters: [...new Set(missingCharacters)] },
      },
    }
  }

  const enriched = {
    characters: draft.characters.map((item) => {
      const local = lookupCharacterInfo(item.character)
      if (!local) throw new Error('Character lookup changed during enrichment')
      return {
        ...item,
        zhuyin: includeZhuyin ? formatCharacterZhuyin(local) : '',
        radical: local.radical,
        strokeCount: local.strokeCount,
        imageSuggestion: null,
        editableState: {
          status: 'draft' as const,
          isEditable: true,
          needsReview: (item.reviewReasons?.length ?? 0) > 0,
        },
      }
    }),
  }
  const parsed = analysisResultSchema.safeParse(enriched)
  return parsed.success
    ? { ok: true, value: parsed.data }
    : {
        ok: false,
        error: {
          type: 'validation',
          message: '本機字庫與 Gemini 結果合併後不符合分析契約。',
          retryable: false,
          details: { issues: parsed.error.issues },
        },
      }
}

export async function analyzeMaterial(
  input: AnalyzeMaterialInput,
): Promise<Result<AnalysisResult, AppError>> {
  if (input.data.size === 0 || !input.fileName.trim() || !input.mimeType.trim()) {
    return {
      ok: false,
      error: {
        type: 'validation',
        message: '教材檔案不可為空，且必須提供檔名與 MIME type。',
        retryable: false,
      },
    }
  }

  const contentHash = input.contentHash ?? (await calculateInputHash(input.data))
  const cacheKey = buildAnalysisCacheKey(contentHash, input.context)
  const cached = await getAnalysisCache(cacheKey)
  if (cached) {
    const parsedCached = analysisResultSchema.safeParse(cached)
    if (parsedCached.success) {
      return { ok: true, value: applyAnalysisReviewRules(parsedCached.data) }
    }
  }

  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    return {
      ok: false,
      error: {
        type: 'authentication',
        message: '請先設定 Gemini API Key。',
        retryable: false,
      },
    }
  }

  const result = await createGeminiClient({ apiKey }).analyzeMaterial({
    data: input.data,
    fileName: input.fileName,
    mimeType: input.mimeType,
    selectedPages: input.selectedPages,
    grade: input.context?.grade,
    language: input.context?.language,
  })

  if (!result.ok) return result

  const enriched = enrichDraftWithLocalCharacterData(
    result.value,
    input.context?.includeZhuyin ?? true,
  )
  if (!enriched.ok) return enriched

  const reviewedResult = applyAnalysisReviewRules(enriched.value)
  await putAnalysisCache(cacheKey, reviewedResult)
  return { ok: true, value: reviewedResult }
}

export async function analyzeTypedCharacters(
  input: AnalyzeTypedCharactersInput,
): Promise<Result<AnalysisResult, AppError>> {
  const characters = [...new Set(input.characters.map((character) => character.trim()).filter(Boolean))]
  const invalidCharacters = characters.filter(
    (character) => [...character].length !== 1 || !/\p{Script=Han}/u.test(character),
  )
  if (characters.length === 0 || invalidCharacters.length > 0) {
    return {
      ok: false,
      error: {
        type: 'validation',
        message: characters.length === 0
          ? '請至少輸入一個生字。'
          : `直接輸入只接受單一漢字：${invalidCharacters.join('、')}`,
        retryable: false,
        details: invalidCharacters.length > 0 ? { invalidCharacters } : undefined,
      },
    }
  }

  const missingCharacters = characters.filter((character) => lookupCharacterInfo(character) === null)
  if (missingCharacters.length > 0) {
    return {
      ok: false,
      error: {
        type: 'validation',
        message: `本機 CNS11643 字庫查不到以下字元：${missingCharacters.join('、')}。請人工確認後再試。`,
        retryable: false,
        details: { missingCharacters },
      },
    }
  }

  const contentHash = await calculateInputHash(JSON.stringify(characters))
  const cacheKey = buildAnalysisCacheKey(`typed:${contentHash}`, input.context)
  const cached = await getAnalysisCache(cacheKey)
  if (cached) {
    const parsedCached = analysisResultSchema.safeParse(cached)
    if (parsedCached.success) return { ok: true, value: applyAnalysisReviewRules(parsedCached.data) }
  }

  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    return {
      ok: false,
      error: {
        type: 'authentication',
        message: '請先設定 Gemini API Key。',
        retryable: false,
      },
    }
  }

  const result = await createGeminiClient({ apiKey }).analyzeTypedCharacters({
    characters,
    grade: input.context?.grade,
    language: input.context?.language,
  })
  if (!result.ok) return result

  const returnedCharacters = result.value.characters.map(({ character }) => character)
  if (returnedCharacters.length !== characters.length ||
      returnedCharacters.some((character, index) => character !== characters[index])) {
    return {
      ok: false,
      error: {
        type: 'validation',
        message: 'Gemini 回傳的生字與教師輸入不一致，已停止合併以避免誤用。',
        retryable: false,
        details: { expected: characters, received: returnedCharacters },
      },
    }
  }

  const enriched = enrichDraftWithLocalCharacterData(
    result.value,
    input.context?.includeZhuyin ?? true,
  )
  if (!enriched.ok) return enriched
  const reviewedResult = applyAnalysisReviewRules(enriched.value)
  await putAnalysisCache(cacheKey, reviewedResult)
  return { ok: true, value: reviewedResult }
}

export async function getCachedAnalysis(hash: string): Promise<AnalysisResult | null> {
  const cached = await getAnalysisCache(hash)
  if (!cached) return null
  const parsed = analysisResultSchema.safeParse(cached)
  return parsed.success ? applyAnalysisReviewRules(parsed.data) : null
}

export async function updateAnalysisResult(
  teacherEditedResult: unknown,
  contentHash?: string,
): Promise<Result<AnalysisResult, AppError>> {
  const parsed = analysisResultSchema.safeParse(teacherEditedResult)
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        type: 'validation',
        message: '教師修改後的分析資料格式不正確，請檢查欄位內容。',
        retryable: false,
        details: { issues: parsed.error.issues },
      },
    }
  }

  const reviewedResult = applyAnalysisReviewRules(parsed.data)
  if (contentHash) await putAnalysisCache(contentHash, reviewedResult)
  return { ok: true, value: reviewedResult }
}
