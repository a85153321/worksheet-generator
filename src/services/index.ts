export {
  analyzeTypedCharacters,
  lookupCharacterFromDictionary,
  updateAnalysisResult,
} from './use-cases'
export { buildWorksheet } from './worksheet-builder'
export {
  DOCX_FONT_FULL_NAMES,
  createDocxDocument,
  generateDocxBlob,
  exportWorksheetToDocx,
} from './docx-builder'
export {
  REFERENCE_QUESTIONS_PER_PAGE,
  REFERENCE_TEMPLATE_URL,
  createReferenceTemplateDocxBuffer,
  generateReferenceTemplateDocxBlob,
} from './reference-template-docx'
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
  AnalyzeTypedCharactersInput,
  BuildWorksheetOptions,
  DocxExportOptions,
  CharacterWorksheetSection,
  InspectUploadedPdfInput,
  ProcessSelectedPdfPagesInput,
  ProcessUploadedImageInput,
  PictureWorksheetSection,
  SentenceWorksheetSection,
  WordWorksheetSection,
  WorksheetBlock,
  WorksheetDoc,
  WorksheetPage,
  WorksheetSection,
  WorksheetTemplate,
  WorksheetImage,
  WorksheetFont,
} from './contracts'
export type { ElementaryGrade } from '../domain'
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
