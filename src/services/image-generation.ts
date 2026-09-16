import type { AppError, CharacterAnalysis, Result } from '../domain'
import {
  calculateInputHash,
  createGeminiImageClient,
  getGeminiApiKey,
  getImageCache,
  putImageCache,
} from '../infrastructure'
import type { CachedImage, GeneratedImageData } from '../infrastructure'
import type { ImageResult } from './contracts'

export const WORKSHEET_IMAGE_STYLE =
  '臺灣國小教材插畫風格，主體清楚，構圖簡潔，友善明亮，純色淺背景，不含文字、注音、浮水印或商標'

interface ImageGenerationDependencies {
  calculateHash: (value: string) => Promise<string>
  getApiKey: () => string | null
  getCachedImage: (key: string) => Promise<CachedImage | null>
  putCachedImage: (image: CachedImage) => Promise<void>
  generateImage: (
    apiKey: string,
    prompt: string,
  ) => Promise<Result<GeneratedImageData, AppError>>
}

const defaultDependencies: ImageGenerationDependencies = {
  calculateHash: calculateInputHash,
  getApiKey: getGeminiApiKey,
  getCachedImage: getImageCache,
  putCachedImage: putImageCache,
  generateImage: (apiKey, prompt) => createGeminiImageClient({ apiKey }).generateImage(prompt),
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return blob.arrayBuffer().then((buffer) => {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let index = 0; index < bytes.length; index += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000))
    }
    return `data:${blob.type};base64,${btoa(binary)}`
  })
}

export function buildStandardizedImagePrompt(item: CharacterAnalysis): string {
  const suggestion = item.imageSuggestion
  const subject = suggestion?.prompt.replace(/\s+/g, ' ').trim() ?? ''
  return `教學字詞「${item.character}」的配圖。${subject}。風格：${WORKSHEET_IMAGE_STYLE}。`
}

export function createGenerateSelectedImageUseCase(
  dependencies: ImageGenerationDependencies = defaultDependencies,
) {
  return async function generateSelectedImage(
    item: CharacterAnalysis,
  ): Promise<Result<ImageResult, AppError>> {
    if (!item.imageSuggestion?.selected) {
      return {
        ok: false,
        error: {
          type: 'validation',
          message: '必須先勾選圖片建議才能生成圖片。',
          retryable: false,
        },
      }
    }

    const prompt = buildStandardizedImagePrompt(item)
    const cacheKey = await dependencies.calculateHash(`worksheet-image-v1\n${prompt}`)
    const cached = await dependencies.getCachedImage(cacheKey)
    if (cached) {
      return {
        ok: true,
        value: {
          id: `image-${cacheKey}`,
          character: item.character,
          prompt,
          url: await blobToDataUrl(cached.data),
          mimeType: cached.mimeType as ImageResult['mimeType'],
          source: 'cache',
          createdAt: cached.createdAt,
        },
      }
    }

    const apiKey = dependencies.getApiKey()
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

    const generated = await dependencies.generateImage(apiKey, prompt)
    if (!generated.ok) return generated

    const createdAt = new Date().toISOString()
    await dependencies.putCachedImage({
      key: cacheKey,
      data: generated.value.data,
      mimeType: generated.value.mimeType,
      createdAt,
    })

    return {
      ok: true,
      value: {
        id: `image-${cacheKey}`,
        character: item.character,
        prompt,
        url: await blobToDataUrl(generated.value.data),
        mimeType: generated.value.mimeType,
        source: 'generated',
        createdAt,
      },
    }
  }
}

export const generateSelectedImage = createGenerateSelectedImageUseCase()
