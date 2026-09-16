import { analysisResultSchema } from '../domain'
import type {
  AnalysisResult,
  AnalysisSkillTag,
  AppError,
  Result,
} from '../domain'

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
          lookalikeCandidates: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['character', 'radical', 'strokeCount'],
              properties: {
                character: { type: 'string' },
                radical: { type: 'string' },
                strokeCount: { type: 'integer', minimum: 1 },
              },
            },
          },
          multiPronunciations: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['pronunciation', 'word'],
              properties: {
                pronunciation: { type: 'string' },
                word: { type: 'string' },
              },
            },
          },
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
  skillTags?: readonly AnalysisSkillTag[]
  includeZhuyin?: boolean
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

const SKILL_INSTRUCTIONS: Record<AnalysisSkillTag, string> = {
  生字練習: '辨識教材中的核心生字，提供適合教學的字義與筆順筆畫線索。',
  語詞練習: '每個生字提供具教學價值且符合語境的常用生詞與詞語搭配。',
  句型練習: '提供結構清楚、可替換關鍵成分的示範句型與仿寫引導。',
  字音字形: '強調正確注音讀音、部件拆解、形近字辨析與部首關係。',
  造句練習: '例句需具體生活化，提供完整的造句情境與仿寫範例。',
  閱讀理解: '內容需能連結課文或語段主旨、細節推論與篇章理解。',
  生字: '辨識教材中的核心生字，提供適合教學的字義線索。',
  部件: '強調字形拆解、部件位置與部首關係。',
  造詞: '每個生字提供具教學價值且符合語境的造詞。',
  注音符號拼讀: '強調聲符、韻符、聲調與拼讀提示。',
  筆順識字: '強調筆畫數、基本筆順與易錯字形。',
  詞語搭配: '提供自然常用的詞語搭配與搭配限制。',
  看圖造句: '例句需具體可視覺化，適合作為看圖造句題材。',
  句型仿寫: '提供結構清楚、可替換關鍵成分的示範句型。',
  段落寫作: '例句之間應能延伸成有開頭、發展與結尾的短段落。',
  關聯詞運用: '使用並凸顯合宜的因果、轉折、條件或並列關聯詞。',
  形音義辨析: '指出容易混淆的字形、字音或字義，避免混用。',
  成語運用: '優先提供含目標字或語義相關的常用成語及正確語境。',
  語病修改: '提供可用於辨識或修改語病的句子線索，注意搭配與語序。',
  修辭技巧: '在例句中適度運用譬喻、擬人、排比等修辭。',
  長文閱讀理解: '內容需能連結長文主旨、細節推論與篇章理解。',
  摘要: '聚焦核心資訊與主旨，避免枝節，利於摘要練習。',
  多元文本閱讀: '兼顧敘事、說明或應用文本的語境與閱讀目的。',
  觀點思辨: '例句或問題情境需容納理由、證據與不同觀點。',
  短文論述: '提供可延伸為主張、理由與例證的短文論述素材。',
}

export function buildSkillTagInstruction(tags: readonly AnalysisSkillTag[] = []): string {
  const uniqueTags = [...new Set(tags)]
  if (uniqueTags.length === 0) return '未勾選特定功能：只產出核心生字分析資料。'
  return uniqueTags
    .map((tag) => `【${tag}】${SKILL_INSTRUCTIONS[tag]}`)
    .join(' ')
}

export function buildZhuyinInstruction(includeZhuyin = true): string {
  return includeZhuyin
    ? '需要注音：每個生字的 zhuyin 必須填入正確的臺灣注音符號，不可留空。'
    : '不需要注音：不要花費 token 解說或產生注音；仍須保留 zhuyin 欄位，但一律回傳空字串 ""。'
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
      const skillInstruction = buildSkillTagInstruction(input.skillTags)
      const zhuyinInstruction = buildZhuyinInstruction(input.includeZhuyin)
      const initialBody = {
        systemInstruction: {
          parts: [{ text: `你是臺灣國小教材分析助手。只回傳符合 schema 的繁體中文資料。必須依指定年級與勾選功能調整 words、exampleSentences、字形分析及圖片建議，不可忽略功能標籤。${gradeInstruction} ${skillInstruction} ${zhuyinInstruction} 若 OCR 有歧義、部首不確定或筆畫數不確定，必須分別加入 ambiguous-ocr、uncertain-radical 或 uncertain-stroke-count 到 reviewReasons，降低 confidence，並將 needsReview 設為 true；不可猜測成確定答案。` }],
        },
        contents: [
          {
            role: 'user',
            parts: [
              { text: `請用一次完整分析擷取生字、部首、筆畫、詞語、例句、信心值、來源與圖片建議。${context} 功能標籤：${input.skillTags?.join('、') || '無'}。功能要求：${skillInstruction} 注音要求：${zhuyinInstruction} 教學分級要求：${gradeInstruction}` },
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
