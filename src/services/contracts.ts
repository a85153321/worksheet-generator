import type {
  AnalysisResult,
  CharacterAnalysis,
  ImageProcessingOptions,
} from '../domain'

export interface AnalyzeMaterialInput {
  data: Blob
  fileName: string
  mimeType: string
  contentHash?: string
  selectedPages?: readonly number[]
  context?: { grade?: number; language?: 'zh-TW' }
}

export interface ImageResult {
  id: string
  character: string
  prompt: string
  url: string
  mimeType: 'image/svg+xml' | 'image/png' | 'image/jpeg' | 'image/webp'
  source: 'mock' | 'generated' | 'cache'
  createdAt: string
}

export interface ProcessUploadedImageInput {
  file: Blob
  fileName: string
  options?: ImageProcessingOptions
}

export interface InspectUploadedPdfInput {
  file: Blob
  fileName: string
}

export interface ProcessSelectedPdfPagesInput extends InspectUploadedPdfInput {
  selectedPages: readonly number[]
  options?: ImageProcessingOptions
}

export type WorksheetTemplate =
  | 'character-practice'
  | 'word-practice'
  | 'sentence-practice'
  | 'mixed'

export type WorksheetBlock = Pick<
  CharacterAnalysis,
  'character' | 'zhuyin' | 'words' | 'exampleSentences'
>

export interface WorksheetPage {
  pageNumber: number
  blocks: WorksheetBlock[]
}

export interface WorksheetDoc {
  id: string
  title: string
  template: WorksheetTemplate
  status: 'draft' | 'ready'
  pages: WorksheetPage[]
  sourceAnalysis: AnalysisResult
  createdAt: string
}
