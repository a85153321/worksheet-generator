export {
  analyzeMaterial,
  buildAnalysisCacheKey,
  getCachedAnalysis,
  updateAnalysisResult,
} from './use-cases'
export { buildWorksheet } from './worksheet-builder'
export {
  buildStandardizedReadingPrompt,
  createGenerateReadingPassageUseCase,
  generateReadingPassage,
  readingPassageCharacterLimit,
} from './reading-passage-generation'
export {
  buildStandardizedImagePrompt,
  createGenerateSelectedImageUseCase,
  generateSelectedImage,
  WORKSHEET_IMAGE_STYLE,
} from './image-generation'
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
  BuildWorksheetOptions,
  CharacterWorksheetSection,
  CharacterDiscriminationWorksheetSection,
  GeneratedReadingPassageResult,
  GenerateReadingPassageInput,
  ImageResult,
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
} from './contracts'
export type { ElementaryGrade, ReadingPassage } from '../domain'
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
