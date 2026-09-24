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
  /** 原始上傳檔，供 Word 匯出讀取二進位內容；url 僅供瀏覽器預覽。 */
  file?: Blob
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
  | 'reference-character-practice'
  | 'word-sentence-blank'

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
    wordSentenceBlank?: CharacterAnalysis['wordSentenceBlank']
  }
}

export interface WordSentenceBlankWorksheetItem {
  questionNumber: number
  character: string
  targetWord: string
  originalSentence: string
  sentenceBeforeBlank: string
  sentenceAfterBlank: string
}

export interface WordSentenceBlankWorksheetItemRow {
  left: WordSentenceBlankWorksheetItem
  right?: WordSentenceBlankWorksheetItem
}

export interface WordSentenceBlankWorksheetSection extends WorksheetSectionBase {
  kind: 'word-sentence-blank'
  topItems: WordSentenceBlankWorksheetItem[]
  itemRows: WordSentenceBlankWorksheetItemRow[]
}

export type WorksheetSection =
  | CharacterWorksheetSection
  | WordSentenceBlankWorksheetSection

export interface WorksheetPage {
  pageNumber: number
  blocks: WorksheetBlock[]
  sections: WorksheetSection[]
}

export interface BuildWorksheetOptions {
  title?: string
  images?: readonly WorksheetImage[]
  grade?: ElementaryGrade
  docxTemplateId?: string
}

export interface WorksheetDoc {
  id: string
  title: string
  template: WorksheetTemplate
  templateLabel: '範例生字' | '語詞例句填空'
  grade: ElementaryGrade
  locale: 'zh-TW'
  pageSetup: {
    size: 'A4'
    orientation: 'portrait' | 'landscape'
  }
  status: 'draft' | 'ready'
  pages: WorksheetPage[]
  sourceAnalysis: AnalysisResult
  images?: WorksheetImage[]
  /** 建置時由離線 Word 範本 registry 選取的範本。 */
  docxTemplateId?: string
  createdAt: string
}
