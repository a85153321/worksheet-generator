import { analysisResultSchema } from '../domain'
import type { AnalysisResult, AppError, Result } from '../domain'

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

const analysisJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['characters'],
  properties: {
    characters: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'character',
          'zhuyin',
          'radical',
          'strokeCount',
          'words',
          'exampleSentences',
          'confidence',
          'source',
          'imageSuggestion',
          'editableState',
        ],
        properties: {
          character: { type: 'string' },
          zhuyin: { type: 'string' },
          radical: { type: 'string' },
          strokeCount: { type: 'integer', minimum: 1 },
          words: { type: 'array', items: { type: 'string' } },
          exampleSentences: { type: 'array', items: { type: 'string' } },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          reviewReasons: {
            type: 'array',
            items: {
              type: 'string',
              enum: [
                'low-confidence',
                'ambiguous-ocr',
                'uncertain-radical',
                'uncertain-stroke-count',
              ],
            },
          },
          source: {
            type: 'object',
            required: ['page', 'block'],
            properties: {
              page: { type: ['integer', 'null'], minimum: 1 },
              block: { type: ['string', 'null'] },
            },
          },
          imageSuggestion: {
            anyOf: [
              { type: 'null' },
              {
                type: 'object',
                required: ['prompt', 'rationale', 'selected'],
                properties: {
                  prompt: { type: 'string' },
                  rationale: { type: 'string' },
                  selected: { type: 'boolean' },
                },
              },
            ],
          },
          editableState: {
            type: 'object',
            required: ['status', 'isEditable', 'needsReview'],
            properties: {
              status: { type: 'string', enum: ['draft', 'edited', 'confirmed'] },
              isEditable: { type: 'boolean' },
              needsReview: { type: 'boolean' },
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

export interface GeminiClientOptions {
  apiKey: string
  fetch?: typeof globalThis.fetch
  model?: string
  endpoint?: string
}

export function buildGradeAdaptationInstruction(grade?: number): string {
  if (grade === 1) {
    return '一年級：只使用日常生活中的基礎二字詞與常見部首；避免成語、抽象詞和修辭；例句使用單一主詞與動作，約 8～12 個中文字。'
  }
  if (grade === 2) {
    return '二年級：使用常見生活詞語與基礎部件概念；避免艱深成語；例句採單一事件，約 10～16 個中文字。'
  }
  if (grade === 3) {
    return '三年級：可使用課堂常見複合詞與簡單因果、轉折連接詞；例句約 15～22 個中文字。'
  }
  if (grade === 4) {
    return '四年級：使用較完整的書面詞彙，可加入常用成語與簡單譬喻；例句約 18～28 個中文字。'
  }
  if (grade === 5) {
    return '五年級：使用進階書面詞彙、常用成語與適量修辭，呈現較完整的情境和因果；例句約 22～35 個中文字。'
  }
  if (grade === 6) {
    return '六年級：使用進階書面語、成語、同反義詞與合宜修辭，詞語可涵蓋抽象概念；例句可包含複句、轉折或因果，約 28～45 個中文字。'
  }
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
    return {
      type: 'network',
      message: 'Gemini 服務暫時無法使用。',
      retryable: true,
      statusCode: status,
    }
  }
  if (status >= 400 && status < 500) {
    return {
      type: 'validation',
      message: `Gemini 拒絕了請求（HTTP ${status}）。`,
      retryable: false,
    }
  }
  return {
    type: 'network',
    message: 'Gemini 服務暫時無法使用。',
    retryable: true,
    statusCode: status,
  }
}

export function createGeminiClient(options: GeminiClientOptions) {
  const request = options.fetch ?? globalThis.fetch
  const model = options.model ?? DEFAULT_GEMINI_ANALYSIS_MODEL
  const endpoint = options.endpoint ?? GEMINI_GENERATE_CONTENT_ENDPOINT
  const generateContentUrl = buildGeminiGenerateContentUrl(model, endpoint)

  async function send(body: unknown): Promise<Result<GeminiResponse, AppError>> {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await request(generateContentUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': options.apiKey,
          },
          body: JSON.stringify(body),
        })

        if (response.ok) return { ok: true, value: (await response.json()) as GeminiResponse }

        const bodyText = await response.text()
        const error = classifyHttpError(response.status, bodyText)
        if (error.type !== 'network' || attempt === 1) return { ok: false, error }
      } catch {
        if (attempt === 1) {
          return {
            ok: false,
            error: { type: 'network', message: '無法連線至 Gemini。', retryable: true },
          }
        }
      }
    }

    return validationError('Gemini 請求未產生結果。')
  }

  async function parse(response: GeminiResponse): Promise<Result<AnalysisResult, AppError>> {
    const text = responseText(response)
    if (!text) return validationError('Gemini 未回傳可用內容。')
    try {
      const parsed = analysisResultSchema.safeParse(JSON.parse(text))
      return parsed.success
        ? { ok: true, value: parsed.data }
        : validationError('Gemini 回傳格式不符合分析契約。')
    } catch {
      return validationError('Gemini 回傳的內容不是有效 JSON。')
    }
  }

  return {
    async analyzeMaterial(input: GeminiAnalysisInput): Promise<Result<AnalysisResult, AppError>> {
      const encodedData = await blobToBase64(input.data)
      const context = `年級：${input.grade ?? '未指定'}；語言：${input.language ?? 'zh-TW'}；檔名：${input.fileName}；頁面：${input.selectedPages?.join(', ') || '整份'}`
      const gradeInstruction = buildGradeAdaptationInstruction(input.grade)
      const initialBody = {
        systemInstruction: {
          parts: [{ text: `你是臺灣國小教材分析助手。只回傳符合 schema 的繁體中文資料。必須依指定年級調整 words 的造詞選字範圍、詞語難度與 exampleSentences 的句型複雜度，不可對所有年級使用同一套內容。${gradeInstruction} 若 OCR 有歧義、部首不確定或筆畫數不確定，必須分別加入 ambiguous-ocr、uncertain-radical 或 uncertain-stroke-count 到 reviewReasons，降低 confidence，並將 needsReview 設為 true；不可猜測成確定答案。` }],
        },
        contents: [
          {
            role: 'user',
            parts: [
              { text: `請用一次完整分析擷取生字、注音、部首、筆畫、詞語、例句、信心值、來源與圖片建議。${context} 教學分級要求：${gradeInstruction}` },
              { inlineData: { mimeType: input.mimeType, data: encodedData } },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseJsonSchema: analysisJsonSchema,
          temperature: 0.2,
        },
      }

      const initialResponse = await send(initialBody)
      if (!initialResponse.ok) return initialResponse
      const initialParsed = await parse(initialResponse.value)
      if (initialParsed.ok) return initialParsed

      const invalidOutput = responseText(initialResponse.value)
      if (!invalidOutput) return initialParsed

      const repairResponse = await send({
        contents: [
          {
            role: 'user',
            parts: [{ text: `以下 JSON 未通過既定 schema。只修正格式，不新增教材事實：\n${invalidOutput}` }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseJsonSchema: analysisJsonSchema,
          temperature: 0,
        },
      })
      if (!repairResponse.ok) return repairResponse
      return parse(repairResponse.value)
    },
  }
}
