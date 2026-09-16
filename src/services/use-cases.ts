import type { AnalysisResult, AppError, CharacterAnalysis, Result } from '../domain'
import {
  calculateInputHash,
  createGeminiClient,
  getAnalysisCache,
  getGeminiApiKey,
  putAnalysisCache,
} from '../infrastructure'
import type {
  AnalyzeMaterialInput,
  ImageResult,
  WorksheetDoc,
  WorksheetTemplate,
} from './contracts'

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

  const hash = input.contentHash ?? (await calculateInputHash(input.data))
  const cached = await getAnalysisCache(hash)
  if (cached) return { ok: true, value: cached }

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

  if (result.ok) await putAnalysisCache(hash, result.value)
  return result
}

export async function getCachedAnalysis(hash: string): Promise<AnalysisResult | null> {
  return getAnalysisCache(hash)
}

export async function generateSelectedImage(
  item: CharacterAnalysis,
): Promise<Result<ImageResult, AppError>> {
  const suggestion = item.imageSuggestion
  if (!suggestion?.selected) {
    return {
      ok: false,
      error: {
        type: 'validation',
        message: '必須先勾選圖片建議才能生成圖片。',
        retryable: false,
      },
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="100%" height="100%" fill="#f4ead7"/><text x="50%" y="48%" text-anchor="middle" font-size="120" fill="#315b52">${item.character}</text><text x="50%" y="70%" text-anchor="middle" font-size="28" fill="#315b52">圖片預覽（Mock）</text></svg>`

  return {
    ok: true,
    value: {
      id: `mock-image-${encodeURIComponent(item.character)}`,
      character: item.character,
      prompt: suggestion.prompt,
      url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
      mimeType: 'image/svg+xml',
      source: 'mock',
      createdAt: new Date().toISOString(),
    },
  }
}

export async function buildWorksheet(
  analysis: AnalysisResult,
  template: WorksheetTemplate,
): Promise<Result<WorksheetDoc, AppError>> {
  if (analysis.characters.length === 0) {
    return {
      ok: false,
      error: {
        type: 'validation',
        message: '至少需要一個生字才能建立學習單。',
        retryable: false,
      },
    }
  }

  return {
    ok: true,
    value: {
      id: `worksheet-${Date.now()}`,
      title: '生字學習單',
      template,
      status: 'draft',
      pages: [
        {
          pageNumber: 1,
          blocks: analysis.characters.map(
            ({ character, zhuyin, words, exampleSentences }) => ({
              character,
              zhuyin,
              words,
              exampleSentences,
            }),
          ),
        },
      ],
      sourceAnalysis: analysis,
      createdAt: new Date().toISOString(),
    },
  }
}
