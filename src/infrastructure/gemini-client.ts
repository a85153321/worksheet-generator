import { z } from 'zod'
import type { AppError, Result } from '../domain'

export const DEFAULT_GEMINI_ANALYSIS_MODEL = 'gemini-3.5-flash'
export const GEMINI_GENERATE_CONTENT_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models'

export function buildGeminiGenerateContentUrl(
  model = DEFAULT_GEMINI_ANALYSIS_MODEL,
  endpoint = GEMINI_GENERATE_CONTENT_ENDPOINT,
): string {
  const modelId = model.replace(/^models\//, '')
  return `${endpoint.replace(/\/+$/, '')}/${modelId}:generateContent`
}

const analysisDraftItemSchema = z.object({
  character: z.string().refine((value) => [...value].length === 1),
  words: z.array(z.string().trim().min(1)),
  exampleSentences: z.array(z.string().trim().min(1)),
  confidence: z.number().min(0).max(1),
  reviewReasons: z.array(z.enum(['low-confidence', 'ambiguous-ocr'])).optional(),
  source: z.object({
    page: z.number().int().positive().nullable(),
    block: z.string().trim().min(1).nullable(),
  }),
})

const analysisDraftSchema = z.object({ characters: z.array(analysisDraftItemSchema) })
export type GeminiAnalysisDraft = z.infer<typeof analysisDraftSchema>

const analysisDraftJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['characters'],
  properties: {
    characters: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['character', 'words', 'exampleSentences', 'confidence', 'source'],
        properties: {
          character: { type: 'string' },
          words: { type: 'array', items: { type: 'string' } },
          exampleSentences: { type: 'array', items: { type: 'string' } },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          reviewReasons: {
            type: 'array',
            items: { type: 'string', enum: ['low-confidence', 'ambiguous-ocr'] },
          },
          source: {
            type: 'object',
            additionalProperties: false,
            required: ['page', 'block'],
            properties: {
              page: { type: ['integer', 'null'], minimum: 1 },
              block: { type: ['string', 'null'] },
            },
          },
        },
      },
    },
  },
} as const

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
}

export interface GeminiAnalysisInput {
  data: Blob
  mimeType: string
  fileName: string
  selectedPages?: readonly number[]
  grade?: number
  language?: 'zh-TW'
}

export interface GeminiTypedCharactersInput {
  characters: readonly string[]
  grade?: number
  language?: 'zh-TW'
}

export interface GeminiClientOptions {
  apiKey: string
  fetch?: typeof globalThis.fetch
  model?: string
  endpoint?: string
}

export function buildGradeAdaptationInstruction(grade?: number): string {
  if (grade === 1) return '一年級：只使用日常生活中的基礎二字詞；避免成語、抽象詞和修辭；例句使用單一主詞與動作，約 8～12 個中文字。'
  if (grade === 2) return '二年級：使用常見生活詞語；避免艱深成語；例句採單一事件，約 10～16 個中文字。'
  if (grade === 3) return '三年級：可使用課堂常見複合詞與簡單因果、轉折連接詞；例句約 15～22 個中文字。'
  if (grade === 4) return '四年級：使用較完整的書面詞彙，可加入常用成語與簡單譬喻；例句約 18～28 個中文字。'
  if (grade === 5) return '五年級：使用進階書面詞彙、常用成語與適量修辭，呈現較完整的情境和因果；例句約 22～35 個中文字。'
  if (grade === 6) return '六年級：使用進階書面語、成語、同反義詞與合宜修辭，詞語可涵蓋抽象概念；例句可包含複句、轉折或因果，約 28～45 個中文字。'
  return '年級未指定：使用臺灣國小中年級程度的常用詞語與清楚完整的例句。'
}

function validationError(message: string): Result<never, AppError> {
  return { ok: false, error: { type: 'validation', message, retryable: false } }
}

async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000))
  }
  return btoa(binary)
}

function responseText(response: GeminiResponse): string | null {
  const text = response.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? '')
    .join('')
    .trim()
  return text || null
}

function classifyHttpError(status: number, body: string): AppError {
  if (status === 401 || status === 403 || body.includes('API_KEY_INVALID')) {
    return { type: 'authentication', message: 'Gemini API Key 無效或沒有權限。', retryable: false }
  }
  if (status === 429) {
    return { type: 'quota', message: 'Gemini 配額或速率限制已達上限。', retryable: false }
  }
  if (status === 408 || status >= 500) {
    return { type: 'network', message: 'Gemini 服務暫時無法使用。', retryable: true, statusCode: status }
  }
  if (status >= 400 && status < 500) {
    return { type: 'validation', message: `Gemini 拒絕了請求（HTTP ${status}）。`, retryable: false }
  }
  return { type: 'network', message: 'Gemini 服務暫時無法使用。', retryable: true, statusCode: status }
}

export function createGeminiClient(options: GeminiClientOptions) {
  const request = options.fetch ?? globalThis.fetch
  const generateContentUrl = buildGeminiGenerateContentUrl(
    options.model ?? DEFAULT_GEMINI_ANALYSIS_MODEL,
    options.endpoint ?? GEMINI_GENERATE_CONTENT_ENDPOINT,
  )

  async function send(body: unknown): Promise<Result<GeminiResponse, AppError>> {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await request(generateContentUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': options.apiKey },
          body: JSON.stringify(body),
        })
        if (response.ok) return { ok: true, value: (await response.json()) as GeminiResponse }
        const error = classifyHttpError(response.status, await response.text())
        if (error.type !== 'network' || attempt === 1) return { ok: false, error }
      } catch {
        if (attempt === 1) {
          return { ok: false, error: { type: 'network', message: '無法連線至 Gemini。', retryable: true } }
        }
      }
    }
    return validationError('Gemini 請求未產生結果。')
  }

  async function parse(response: GeminiResponse): Promise<Result<GeminiAnalysisDraft, AppError>> {
    const text = responseText(response)
    if (!text) return validationError('Gemini 未回傳可用內容。')
    try {
      const parsed = analysisDraftSchema.safeParse(JSON.parse(text))
      return parsed.success ? { ok: true, value: parsed.data } : validationError('Gemini 回傳格式不符合分析契約。')
    } catch {
      return validationError('Gemini 回傳的內容不是有效 JSON。')
    }
  }

  async function requestDraft(body: unknown): Promise<Result<GeminiAnalysisDraft, AppError>> {
    const initialResponse = await send(body)
    if (!initialResponse.ok) return initialResponse
    const initialParsed = await parse(initialResponse.value)
    if (initialParsed.ok) return initialParsed
    const invalidOutput = responseText(initialResponse.value)
    if (!invalidOutput) return initialParsed
    const repairResponse = await send({
      contents: [{ role: 'user', parts: [{ text: `以下 JSON 未通過既定 schema。只修正格式，不新增教材事實：\n${invalidOutput}` }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseJsonSchema: analysisDraftJsonSchema,
        temperature: 0,
      },
    })
    if (!repairResponse.ok) return repairResponse
    return parse(repairResponse.value)
  }

  const generationConfig = {
    responseMimeType: 'application/json',
    responseJsonSchema: analysisDraftJsonSchema,
    temperature: 0.2,
  }

  return {
    async analyzeMaterial(input: GeminiAnalysisInput): Promise<Result<GeminiAnalysisDraft, AppError>> {
      const encodedData = await blobToBase64(input.data)
      const gradeInstruction = buildGradeAdaptationInstruction(input.grade)
      const context = `年級：${input.grade ?? '未指定'}；語言：${input.language ?? 'zh-TW'}；檔名：${input.fileName}；頁面：${input.selectedPages?.join(', ') || '整份'}`
      return requestDraft({
        systemInstruction: { parts: [{ text: `你是臺灣國小教材分析助手。只負責辨識圖片中的生字，並為每個字產生適齡詞語與情境例句。不要輸出注音、部首或筆畫，這些資料由本機官方字庫補入。只回傳 schema 指定欄位。${gradeInstruction} 若 OCR 有歧義，加入 ambiguous-ocr 到 reviewReasons、降低 confidence；不可猜成確定答案。` }] },
        contents: [{
          role: 'user',
          parts: [
            { text: `辨識教材中的生字，並產生 words 與 exampleSentences。${context} 教學分級要求：${gradeInstruction}` },
            { inlineData: { mimeType: input.mimeType, data: encodedData } },
          ],
        }],
        generationConfig,
      })
    },

    async analyzeTypedCharacters(input: GeminiTypedCharactersInput): Promise<Result<GeminiAnalysisDraft, AppError>> {
      const gradeInstruction = buildGradeAdaptationInstruction(input.grade)
      return requestDraft({
        systemInstruction: { parts: [{ text: `你是臺灣國小國語教學助手。輸入字元已由教師確認，不需 OCR。只為每個指定生字產生適齡 words 與 exampleSentences；不得新增、刪除或替換字元，也不要輸出注音、部首或筆畫。confidence 固定為 1，reviewReasons 省略，source 固定為 {"page":null,"block":"直接輸入"}。${gradeInstruction}` }] },
        contents: [{ role: 'user', parts: [{ text: `請依原順序處理這些生字：${JSON.stringify(input.characters)}。語言：${input.language ?? 'zh-TW'}。教學分級要求：${gradeInstruction}` }] }],
        generationConfig,
      })
    },
  }
}
