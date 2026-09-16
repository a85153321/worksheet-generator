import type { AppError, Result } from '../domain'

export const DEFAULT_GEMINI_IMAGE_MODEL = 'gemini-3.1-flash-image'
export const GEMINI_IMAGE_GENERATE_CONTENT_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1/models'

export function buildGeminiImageGenerateContentUrl(
  model = DEFAULT_GEMINI_IMAGE_MODEL,
  endpoint = GEMINI_IMAGE_GENERATE_CONTENT_ENDPOINT,
): string {
  const modelId = model.replace(/^models\//, '')
  return `${endpoint.replace(/\/+$/, '')}/${modelId}:generateContent`
}

interface GeminiImageResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        inlineData?: { data?: string; mimeType?: string }
        inline_data?: { data?: string; mime_type?: string }
      }>
    }
  }>
}

export interface GeneratedImageData {
  data: Blob
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp'
}

export interface GeminiImageClientOptions {
  apiKey: string
  fetch?: typeof globalThis.fetch
  model?: string
  endpoint?: string
}

function classifyError(status: number, responseBody: string): AppError {
  if (status === 401 || status === 403 || responseBody.includes('API_KEY_INVALID')) {
    return { type: 'authentication', message: 'Gemini API Key 無效或沒有權限。', retryable: false }
  }
  if (status === 429) {
    return { type: 'quota', message: 'Gemini 圖片生成配額已達上限。', retryable: false }
  }
  if (status === 408 || status >= 500) {
    return {
      type: 'network',
      message: 'Gemini 圖片服務暫時無法使用。',
      retryable: true,
      statusCode: status,
    }
  }
  return {
    type: 'validation',
    message: `Gemini 拒絕了圖片生成請求（HTTP ${status}）。`,
    retryable: false,
  }
}

function decodeBase64Image(
  encoded: string,
  mimeType: string,
): Result<GeneratedImageData, AppError> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(mimeType)) {
    return {
      ok: false,
      error: { type: 'validation', message: 'Gemini 回傳了不支援的圖片格式。', retryable: false },
    }
  }

  try {
    const binary = atob(encoded)
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
    return {
      ok: true,
      value: {
        data: new Blob([bytes], { type: mimeType }),
        mimeType: mimeType as GeneratedImageData['mimeType'],
      },
    }
  } catch {
    return {
      ok: false,
      error: { type: 'validation', message: 'Gemini 回傳的圖片資料無法解碼。', retryable: false },
    }
  }
}

export function createGeminiImageClient(options: GeminiImageClientOptions) {
  const request = options.fetch ?? globalThis.fetch
  const model = options.model ?? DEFAULT_GEMINI_IMAGE_MODEL
  const endpoint = options.endpoint ?? GEMINI_IMAGE_GENERATE_CONTENT_ENDPOINT
  const generateContentUrl = buildGeminiImageGenerateContentUrl(model, endpoint)

  return {
    async generateImage(prompt: string): Promise<Result<GeneratedImageData, AppError>> {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const response = await request(generateContentUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': options.apiKey,
            },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: {
                responseModalities: ['IMAGE'],
              },
            }),
          })

          if (!response.ok) {
            const appError = classifyError(response.status, await response.text())
            if (appError.type === 'network' && attempt === 0) continue
            return { ok: false, error: appError }
          }

          const payload = (await response.json()) as GeminiImageResponse
          const parts = payload.candidates?.[0]?.content?.parts ?? []
          for (const part of parts) {
            const inlineData = part.inlineData ?? (part.inline_data
              ? { data: part.inline_data.data, mimeType: part.inline_data.mime_type }
              : undefined)
            if (inlineData?.data && inlineData.mimeType) {
              return decodeBase64Image(inlineData.data, inlineData.mimeType)
            }
          }

          return {
            ok: false,
            error: {
              type: 'validation',
              message: 'Gemini 未回傳可用的圖片，請調整圖片建議後重試。',
              retryable: false,
            },
          }
        } catch {
          if (attempt === 1) {
            return {
              ok: false,
              error: { type: 'network', message: '無法連線至 Gemini 圖片服務。', retryable: true },
            }
          }
        }
      }

      return {
        ok: false,
        error: { type: 'network', message: 'Gemini 圖片服務暫時無法使用。', retryable: true },
      }
    },
  }
}
