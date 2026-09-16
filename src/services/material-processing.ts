import type {
  AppError,
  PdfDocumentInfo,
  ProcessedImage,
  ProcessedPdfSelection,
  Result,
} from '../domain'
import { inspectPdf, preprocessImage, renderSelectedPdfPages } from '../infrastructure'
import type {
  InspectUploadedPdfInput,
  ProcessSelectedPdfPagesInput,
  ProcessUploadedImageInput,
} from './contracts'

export async function processUploadedImage(
  input: ProcessUploadedImageInput,
): Promise<Result<ProcessedImage, AppError>> {
  return preprocessImage(input.file, input.fileName, input.options)
}

export async function inspectUploadedPdf(
  input: InspectUploadedPdfInput,
): Promise<Result<PdfDocumentInfo, AppError>> {
  return inspectPdf(input.file, input.fileName)
}

export async function processSelectedPdfPages(
  input: ProcessSelectedPdfPagesInput,
): Promise<Result<ProcessedPdfSelection, AppError>> {
  return renderSelectedPdfPages(
    input.file,
    input.fileName,
    input.selectedPages,
    input.options,
  )
}
