export {
  analyzeTypedCharacters,
  getCandidatesForCharacterReading,
  lookupCharacterFromDictionary,
  lookupDictionaryEntriesByTerm,
  resolveSentenceCandidatesForWords,
  resolveOwnSentencesForWord,
  updateAnalysisResult,
} from './use-cases'
export type { CharacterDictionaryLookup, DictionaryEntry, WordCandidateDetail } from '../infrastructure'
export { buildWorksheet } from './worksheet-builder'
export {
  DOCX_FONT_FULL_NAMES,
  generateDocxBlob,
  exportWorksheetToDocx,
} from './docx-builder'
export type {
  WorksheetTemplateData,
  WorksheetTemplateItem,
} from './reference-template-docx'
export {
  WORD_TEMPLATE_REGISTRY,
  findWordTemplate,
  getDefaultWordTemplateId,
  loadWordTemplateBytes,
} from './word-template-registry'
export { resolveWorksheetFont } from './worksheet-font'
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
