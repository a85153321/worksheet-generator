import type { AppError, ElementaryGrade, Result } from '../domain'

export const DEFAULT_GEMINI_READING_MODEL = 'gemini-3.5-flash'
export const GEMINI_READING_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models'

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
}

interface PassagePayload {
  title: string
  text: string
}

export interface GeminiReadingClientOptions {
  apiKey: string
  fetch?: typeof globalThis.fetch
  model?: string
  endpoint?: string
}

export interface GeminiReadingPassageInput {
  prompt: string
  grade: ElementaryGrade
  maxCharacters: number
  requiredCharacters: readonly string[]
}

function url(options: GeminiReadingClientOptions): string {
  const model = (options.model ?? DEFAULT_GEMINI_READING_MODEL).replace(/^models\//, '')
  return `${(options.endpoint ?? GEMINI_READING_ENDPOINT).replace(/\/+$/, '')}/${model}:generateContent`
}

function classifyError(status: number, body: string): AppError {
  if (status === 401 || status === 403 || body.includes('API_KEY_INVALID')) {
    return { type: 'authentication', message: 'Gemini API Key 無效或沒有權限。', retryable: false }
  }
  if (status === 429) {
    return { type: 'quota', message: 'Gemini 短文生成配額或速率限制已達上限。', retryable: false }
  }
  if (status === 408 || status >= 500) {
    return { type: 'network', message: 'Gemini 短文生成服務暫時無法使用。', retryable: true, statusCode: status }
  }
  return { type: 'validation', message: `Gemini 拒絕了短文生成請求（HTTP ${status}）。`, retryable: false }
}

function textLength(text: string): number {
  return [...text.replace(/\s/gu, '')].length
}

function parsePayload(
  response: GeminiResponse,
  input: GeminiReadingPassageInput,
): Result<PassagePayload, AppError> {
  const raw = response.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? '')
    .join('')
    .trim()
  if (!raw) {
    return { ok: false, error: { type: 'validation', message: 'Gemini 未回傳閱讀短文。', retryable: false } }
  }
  try {
    const payload = JSON.parse(raw) as Partial<PassagePayload>
    const title = payload.title?.trim() ?? ''
    const text = payload.text?.trim() ?? ''
    const missing = input.requiredCharacters.filter((character) => !text.includes(character))
    if (!title || !text || textLength(text) > input.maxCharacters || missing.length > 0) {
      return {
        ok: false,
        error: {
          type: 'validation',
          message: 'Gemini 產生的短文未符合字數或必含生字限制。',
          retryable: false,
          details: { missingCharacters: missing, actualCharacters: textLength(text) },
        },
      }
    }
    return { ok: true, value: { title, text } }
  } catch {
    return { ok: false, error: { type: 'validation', message: 'Gemini 短文回覆不是有效 JSON。', retryable: false } }
  }
}

export function createGeminiReadingClient(options: GeminiReadingClientOptions) {
  const request = options.fetch ?? globalThis.fetch

  async function send(body: unknown): Promise<Result<GeminiResponse, AppError>> {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await request(url(options), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': options.apiKey },
          body: JSON.stringify(body),
        })
        if (response.ok) return { ok: true, value: await response.json() as GeminiResponse }
        const error = classifyError(response.status, await response.text())
        if (error.type !== 'network' || attempt === 1) return { ok: false, error }
      } catch {
        if (attempt === 1) {
          return { ok: false, error: { type: 'network', message: '無法連線至 Gemini 短文生成服務。', retryable: true } }
        }
      }
    }
    return { ok: false, error: { type: 'network', message: 'Gemini 短文生成服務暫時無法使用。', retryable: true } }
  }

  return {
    async generatePassage(input: GeminiReadingPassageInput): Promise<Result<PassagePayload, AppError>> {
      const schema = {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'text'],
        properties: { title: { type: 'string' }, text: { type: 'string' } },
      }
      const body = {
        systemInstruction: {
          parts: [{ text: '你是臺灣國小閱讀教材編寫助手。短文必須連貫、自然、有完整情境與邏輯，不可只是把例句依序拼接。只回傳 JSON。' }],
        },
        contents: [{ role: 'user', parts: [{ text: input.prompt }] }],
        generationConfig: { responseMimeType: 'application/json', responseJsonSchema: schema, temperature: 0.5 },
      }
      const initial = await send(body)
      if (!initial.ok) return initial
      const parsed = parsePayload(initial.value, input)
      if (parsed.ok) return parsed

      const repair = await send({
        contents: [{ role: 'user', parts: [{ text: `${input.prompt}\n上次結果不符合字數或必含生字限制。請重新生成一次，只回傳 title 與 text。` }] }],
        generationConfig: { responseMimeType: 'application/json', responseJsonSchema: schema, temperature: 0.2 },
      })
      return repair.ok ? parsePayload(repair.value, input) : repair
    },
  }
}
