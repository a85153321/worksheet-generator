import {
  analysisResultSchema,
  type AnalysisResult,
  type AppError,
  type Result,
} from '../domain'
import {
  lookupCharacterFromDictionary as lookupLocalDictionary,
  putAnalysisCache,
} from '../infrastructure'
import type { CharacterDictionaryLookup } from '../infrastructure'
import type { AnalyzeTypedCharactersInput } from './contracts'

export function lookupCharacterFromDictionary(
  character: string,
): CharacterDictionaryLookup | null {
  return lookupLocalDictionary(character)
}

export function analyzeTypedCharacters(
  input: AnalyzeTypedCharactersInput,
): Result<AnalysisResult, AppError> {
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

  const lookups = characters.map((character) => ({
    character,
    dictionary: lookupLocalDictionary(character),
  }))
  const missingCharacters = lookups
    .filter(({ dictionary }) => dictionary === null)
    .map(({ character }) => character)
  if (missingCharacters.length > 0) {
    return {
      ok: false,
      error: {
        type: 'dictionary-not-found',
        message: `《國語辭典簡編本》查無此字：${missingCharacters.join('、')}。`,
        retryable: false,
        missingCharacters,
      },
    }
  }

  const result = {
    characters: lookups.map(({ dictionary }) => {
      if (!dictionary) throw new Error('Dictionary lookup changed during analysis')
      return {
        character: dictionary.character,
        zhuyin: dictionary.zhuyin,
        zhuyinCandidates: dictionary.zhuyinCandidates,
        radical: dictionary.radical,
        strokeCount: dictionary.strokeCount,
        wordCandidates: dictionary.wordCandidates,
        sentenceCandidates: dictionary.sentenceCandidates,
        source: { page: null, block: '教育部《國語辭典簡編本》' },
      }
    }),
  }
  const parsed = analysisResultSchema.safeParse(result)
  return parsed.success
    ? { ok: true, value: parsed.data }
    : {
        ok: false,
        error: {
          type: 'validation',
          message: '辭典查詢結果不符合分析契約。',
          retryable: false,
          details: { issues: parsed.error.issues },
        },
      }
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

  if (contentHash) await putAnalysisCache(contentHash, parsed.data)
  return { ok: true, value: parsed.data }
}
