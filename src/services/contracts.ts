import type {
  AnalysisResult,
  AnalysisContextInput,
  CharacterAnalysis,
  ImageProcessingOptions,
  ElementaryGrade,
} from '../domain'

export interface AnalyzeTypedCharactersInput {
  characters: readonly string[]
  context?: AnalysisContextInput
}

export interface WorksheetImage {
  id: string
  character: string
  url: string
  mimeType: 'image/svg+xml' | 'image/png' | 'image/jpeg' | 'image/webp'
  source: 'upload'
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
  | 'reference-character-practice'
  | 'word-practice'
  | 'sentence-practice'
  | 'picture-practice'

export type WorksheetFont =
  | 'standard-kai'
  | 'zihi-kai-zhuyin'
  | 'zihi-only-zhuyin'

export interface DocxExportOptions {
  font?: WorksheetFont
}

export type WorksheetBlock = Pick<
  CharacterAnalysis,
  'character' | 'zhuyin' | 'wordCandidates' | 'sentenceCandidates'
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
    image: Pick<WorksheetImage, 'id' | 'url' | 'mimeType'> | null
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
  images?: readonly WorksheetImage[]
  grade?: ElementaryGrade
}

export interface WorksheetDoc {
  id: string
  title: string
  template: WorksheetTemplate
  templateLabel: '生字' | '範例生字' | '語詞' | '句子' | '看圖'
  grade: ElementaryGrade
  locale: 'zh-TW'
  pageSetup: {
    size: 'A4'
    orientation: 'portrait'
  }
  status: 'draft' | 'ready'
  pages: WorksheetPage[]
  sourceAnalysis: AnalysisResult
  images?: WorksheetImage[]
  createdAt: string
}
