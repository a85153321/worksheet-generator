import type { AnalysisResult, CharacterAnalysis } from '../domain'

export interface AnalyzeMaterialInput {
  data: Blob
  fileName: string
  mimeType: string
  contentHash?: string
  selectedPages?: readonly number[]
  context?: {
    grade?: number
    language?: 'zh-TW'
  }
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

export type WorksheetTemplate =
  | 'character-practice'
  | 'word-practice'
  | 'sentence-practice'
  | 'mixed'

export interface WorksheetBlock {
  character: CharacterAnalysis['character']
  zhuyin: CharacterAnalysis['zhuyin']
  words: CharacterAnalysis['words']
  exampleSentences: CharacterAnalysis['exampleSentences']
}

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
