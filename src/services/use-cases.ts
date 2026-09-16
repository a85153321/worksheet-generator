import type {
  AnalysisResult,
  AppError,
  CharacterAnalysis,
  Result,
} from '../domain'
import type {
  AnalyzeMaterialInput,
  ImageResult,
  WorksheetDoc,
  WorksheetTemplate,
} from './contracts'

const analysisCache = new Map<string, AnalysisResult>()

const mockAnalysis: AnalysisResult = {
  characters: [
    {
      character: '學',
      zhuyin: 'ㄒㄩㄝˊ',
      radical: '子',
      strokeCount: 16,
      words: ['學校', '學習'],
      exampleSentences: ['我每天到學校學習新知識。'],
      confidence: 0.96,
      source: { page: 1, block: '第一段' },
      imageSuggestion: {
        prompt: '小學生在明亮的教室裡專心學習，兒童教材插畫風格',
        rationale: '用熟悉的校園情境幫助理解「學」。',
        selected: false,
      },
      editableState: {
        status: 'draft',
        isEditable: true,
        needsReview: false,
      },
    },
    {
      character: '習',
      zhuyin: 'ㄒㄧˊ',
      radical: '羽',
      strokeCount: 11,
      words: ['學習', '練習'],
      exampleSentences: ['多練習可以讓生字寫得更漂亮。'],
      confidence: 0.88,
      source: { page: 1, block: '第一段' },
      imageSuggestion: null,
      editableState: {
        status: 'draft',
        isEditable: true,
        needsReview: true,
      },
    },
  ],
}

export async function analyzeMaterial(
  input: AnalyzeMaterialInput,
): Promise<Result<AnalysisResult, AppError>> {
  if (input.data.size === 0 || input.fileName.trim() === '' || input.mimeType.trim() === '') {
    return {
      ok: false,
      error: {
        type: 'validation',
        message: '教材檔案不可為空，且必須提供檔名與 MIME type。',
        retryable: false,
      },
    }
  }

  const result = structuredClone(mockAnalysis)
  if (input.contentHash) analysisCache.set(input.contentHash, result)

  return { ok: true, value: result }
}

export async function getCachedAnalysis(hash: string): Promise<AnalysisResult | null> {
  const cached = analysisCache.get(hash)
  return cached ? structuredClone(cached) : null
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
      id: `mock-worksheet-${Date.now()}`,
      title: '生字學習單',
      template,
      status: 'draft',
      pages: [
        {
          pageNumber: 1,
          blocks: analysis.characters.map((item) => ({
            character: item.character,
            zhuyin: item.zhuyin,
            words: [...item.words],
            exampleSentences: [...item.exampleSentences],
          })),
        },
      ],
      sourceAnalysis: structuredClone(analysis),
      createdAt: new Date().toISOString(),
    },
  }
}
