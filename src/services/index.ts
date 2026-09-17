export {
  analyzeMaterial,
  analyzeTypedCharacters,
  buildAnalysisCacheKey,
  getCachedAnalysis,
  updateAnalysisResult,
} from './use-cases'
export { buildWorksheet } from './worksheet-builder'
export {
  createDocxDocument,
  generateDocxBlob,
  exportWorksheetToDocx,
} from './docx-builder'
export {
  buildStandardizedReadingPrompt,
  createGenerateReadingPassageUseCase,
  generateReadingPassage,
} from './reading-passage-generation'
export { clearApiKey, getApiKey, isApiKeyConfigured, saveApiKey } from './key-settings'
export {
  inspectUploadedPdf,
  processSelectedPdfPages,
  processUploadedImage,
} from './material-processing'
export type {
  AnalysisContext,
  AnalysisContextInput,
} from '../domain'
export type {
  AnalyzeMaterialInput,
  AnalyzeTypedCharactersInput,
  BuildWorksheetOptions,
  CharacterWorksheetSection,
  CharacterDiscriminationWorksheetSection,
  GeneratedReadingPassageResult,
  GenerateReadingPassageInput,
  InspectUploadedPdfInput,
  ProcessSelectedPdfPagesInput,
  ProcessUploadedImageInput,
  PictureWorksheetSection,
  ReadingComprehensionWorksheetSection,
  ReadingMultipleChoiceQuestion,
  SentenceWorksheetSection,
  WordWorksheetSection,
  WorksheetBlock,
  WorksheetDoc,
  WorksheetPage,
  WorksheetSection,
  WorksheetTemplate,
  WorksheetImage,
} from './contracts'
export type { ElementaryGrade, ReadingPassage, ReadingPassageLength } from '../domain'
export type {
  CropRect,
  ImageProcessingOptions,
  PdfDocumentInfo,
  PdfPageInfo,
  ProcessedImage,
  ProcessedPdfPage,
  ProcessedPdfSelection,
  SupportedImageMimeType,
} from '../domain'
