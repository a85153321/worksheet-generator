import {
  readingPassageSchema,
  type AppError,
  type ReadingPassage,
  type Result,
} from '../domain'
import {
  calculateInputHash,
  createGeminiReadingClient,
  getGeminiApiKey,
  getReadingPassageCache,
  putReadingPassageCache,
} from '../infrastructure'
import type {
  GeneratedReadingPassageResult,
  GenerateReadingPassageInput,
} from './contracts'

const PROMPT_VERSION = 'reading-passage-v1'

export function buildStandardizedReadingPrompt(input: GenerateReadingPassageInput): string {
  const characters = input.analysis.characters
    .filter((item) => item.editableState.status === 'confirmed')
    .map((item) => ({ character: item.character, words: item.words }))
  const requiredCharacters = characters.map((item) => item.character)
  const maxCharacters = input.targetCharacters
  return [
    '請生成一篇臺灣國小閱讀理解短文。',
    `年級：國小${input.grade}年級。`,
    `正文上限：${maxCharacters}字（不計空白）。`,
    `必須自然包含全部生字：${requiredCharacters.join('、')}。`,
    `可參考詞語：${characters.flatMap((item) => item.words).join('、') || '無'}。`,
    '文章需有連貫情境、合理事件順序與完整語意；不得把既有例句直接拼接，不得列點。',
    '只回傳 JSON：{"title":"短標題","text":"短文正文"}。',
  ].join('\n')
}

interface ReadingPassageDependencies {
  calculateHash: (value: string) => Promise<string>
  getApiKey: () => string | null
  getCachedPassage: (key: string) => Promise<ReadingPassage | null>
  putCachedPassage: (key: string, passage: ReadingPassage) => Promise<void>
  generate: (
    apiKey: string,
    prompt: string,
    grade: GenerateReadingPassageInput['grade'],
    maxCharacters: number,
    requiredCharacters: readonly string[],
  ) => Promise<Result<{ title: string; text: string }, AppError>>
  now: () => string
}

const defaultDependencies: ReadingPassageDependencies = {
  calculateHash: calculateInputHash,
  getApiKey: getGeminiApiKey,
  getCachedPassage: getReadingPassageCache,
  putCachedPassage: putReadingPassageCache,
  generate: (apiKey, prompt, grade, maxCharacters, requiredCharacters) =>
    createGeminiReadingClient({ apiKey }).generatePassage({
      prompt,
      grade,
      maxCharacters,
      requiredCharacters,
    }),
  now: () => new Date().toISOString(),
}

export function createGenerateReadingPassageUseCase(
  dependencies: ReadingPassageDependencies = defaultDependencies,
) {
  return async function generateReadingPassage(
    input: GenerateReadingPassageInput,
  ): Promise<Result<GeneratedReadingPassageResult, AppError>> {
    const confirmedCharacters = input.analysis.characters.filter(
      (item) => item.editableState.status === 'confirmed',
    )
    if (confirmedCharacters.length === 0) {
      return {
        ok: false,
        error: {
          type: 'no-eligible-characters',
          template: 'reading-comprehension',
          message: '沒有教師確認保留的生字，無法生成閱讀短文。',
          retryable: false,
        },
      }
    }

    const requiredCharacters = [...new Set(confirmedCharacters.map((item) => item.character))]
    const maxCharacters = input.targetCharacters
    if (requiredCharacters.length > maxCharacters) {
      return {
        ok: false,
        error: {
          type: 'validation',
          message: `確認保留的生字數量超過${maxCharacters}字的短文上限，請減少生字後再試。`,
          retryable: false,
        },
      }
    }

    const prompt = buildStandardizedReadingPrompt(input)
    const cacheKey = await dependencies.calculateHash(`${PROMPT_VERSION}\n${prompt}`)
    const cached = await dependencies.getCachedPassage(cacheKey)
    const parsedCached = readingPassageSchema.safeParse(cached)
    if (parsedCached.success) {
      return { ok: true, value: { passage: parsedCached.data, source: 'cache' } }
    }

    const apiKey = dependencies.getApiKey()
    if (!apiKey) {
      return {
        ok: false,
        error: { type: 'authentication', message: '請先設定 Gemini API Key。', retryable: false },
      }
    }

    const generated = await dependencies.generate(
      apiKey,
      prompt,
      input.grade,
      maxCharacters,
      requiredCharacters,
    )
    if (!generated.ok) return generated

    const candidate = {
      id: `reading-${cacheKey}`,
      title: generated.value.title,
      text: generated.value.text,
      grade: input.grade,
      maxCharacters,
      includedCharacters: requiredCharacters,
      createdAt: dependencies.now(),
    }
    const parsedPassage = readingPassageSchema.safeParse(candidate)
    const actualLength = [...generated.value.text.replace(/\s/gu, '')].length
    const missingCharacters = requiredCharacters.filter(
      (character) => !generated.value.text.includes(character),
    )
    if (!parsedPassage.success || actualLength > maxCharacters || missingCharacters.length > 0) {
      return {
        ok: false,
        error: {
          type: 'validation',
          message: '生成的閱讀短文未符合資料契約、字數上限或必含生字限制。',
          retryable: false,
          details: { actualLength, missingCharacters },
        },
      }
    }
    const passage = parsedPassage.data
    await dependencies.putCachedPassage(cacheKey, passage)
    return { ok: true, value: { passage, source: 'generated' } }
  }
}

export const generateReadingPassage = createGenerateReadingPassageUseCase()
