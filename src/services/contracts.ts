import type {
  AnalysisResult,
  AnalysisContextInput,
  CharacterAnalysis,
  ImageProcessingOptions,
  LookalikeCandidate,
  MultiPronunciation,
  ElementaryGrade,
  ReadingPassage,
  ReadingPassageLength,
} from '../domain'

export interface AnalyzeMaterialInput {
  data: Blob
  fileName: string
  mimeType: string
  contentHash?: string
  selectedPages?: readonly number[]
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

export interface GenerateReadingPassageInput {
  analysis: AnalysisResult
  grade: ElementaryGrade
  targetCharacters: ReadingPassageLength
}

export interface GeneratedReadingPassageResult {
  passage: ReadingPassage
  source: 'generated' | 'cache'
}

export type WorksheetTemplate =
  | 'character-practice'
  | 'word-practice'
  | 'sentence-practice'
  | 'picture-practice'
  | 'character-discrimination'
  | 'reading-comprehension'

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
    image: Pick<WorksheetImage, 'id' | 'url' | 'mimeType'> | null
    needsImage: boolean
  }
}

export interface CharacterDiscriminationWorksheetSection extends WorksheetSectionBase {
  kind: 'character-discrimination'
  item: {
    character: CharacterAnalysis['character']
    zhuyin: CharacterAnalysis['zhuyin']
    lookalikeCandidates: LookalikeCandidate[]
    multiPronunciations: MultiPronunciation[]
    handwritingLineCount: number
  }
}

export interface ReadingMultipleChoiceQuestion {
  id: string
  character: string
  prompt: string
  options: string[]
  correctAnswer: string
}

export interface ReadingComprehensionWorksheetSection extends WorksheetSectionBase {
  kind: 'reading-comprehension'
  item: {
    passage: ReadingPassage
    multipleChoiceQuestions: ReadingMultipleChoiceQuestion[]
  }
}

export type WorksheetSection =
  | CharacterWorksheetSection
  | WordWorksheetSection
  | SentenceWorksheetSection
  | PictureWorksheetSection
  | CharacterDiscriminationWorksheetSection
  | ReadingComprehensionWorksheetSection

export interface WorksheetPage {
  pageNumber: number
  blocks: WorksheetBlock[]
  sections: WorksheetSection[]
}

export interface BuildWorksheetOptions {
  title?: string
  images?: readonly WorksheetImage[]
  grade?: ElementaryGrade
  readingPassage?: ReadingPassage
}

export interface WorksheetDoc {
  id: string
  title: string
  template: WorksheetTemplate
  templateLabel: '生字' | '詞語' | '句子' | '看圖' | '字音字形辨析' | '閱讀理解'
  grade: ElementaryGrade
  locale: 'zh-TW'
  pageSetup: {
    size: 'A4'
    orientation: 'portrait'
  }
  status: 'draft' | 'ready'
  pages: WorksheetPage[]
  sourceAnalysis: AnalysisResult
  createdAt: string
}
