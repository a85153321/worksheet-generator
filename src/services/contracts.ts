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
  | 'picture-practice'
  | 'mixed'

export type WorksheetBlock = Pick<
  CharacterAnalysis,
  'character' | 'zhuyin' | 'words' | 'exampleSentences'
>

interface WorksheetSectionBase {
  id: string
  instructions: string
}

export interface CharacterWorksheetSection extends WorksheetSectionBase {
  kind: 'character'
  item: Pick<CharacterAnalysis, 'character' | 'zhuyin' | 'radical' | 'strokeCount'> & {
    practiceBoxCount: number
  }
}

export interface WordWorksheetSection extends WorksheetSectionBase {
  kind: 'word'
  item: {
    character: CharacterAnalysis['character']
    words: Array<{ text: string; practiceLineCount: number }>
  }
}

export interface SentenceWorksheetSection extends WorksheetSectionBase {
  kind: 'sentence'
  item: {
    character: CharacterAnalysis['character']
    sentences: Array<{ text: string; answerLineCount: number }>
  }
}

export interface PictureWorksheetSection extends WorksheetSectionBase {
  kind: 'picture'
  item: {
    character: CharacterAnalysis['character']
    prompt: string
    rationale: string
    image: Pick<ImageResult, 'id' | 'url' | 'mimeType'> | null
    needsImage: boolean
  }
}

export type WorksheetSection =
  | CharacterWorksheetSection
  | WordWorksheetSection
  | SentenceWorksheetSection
  | PictureWorksheetSection

export interface WorksheetPage {
  pageNumber: number
  blocks: WorksheetBlock[]
  sections: WorksheetSection[]
}

export interface BuildWorksheetOptions {
  title?: string
  images?: readonly ImageResult[]
}

export interface WorksheetDoc {
  id: string
  title: string
  template: WorksheetTemplate
  templateLabel: '生字' | '詞語' | '句子' | '看圖' | '綜合'
  status: 'draft' | 'ready'
  pages: WorksheetPage[]
  sourceAnalysis: AnalysisResult
  createdAt: string
}
