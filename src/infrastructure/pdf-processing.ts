import type {
  AppError,
  ImageProcessingOptions,
  PdfDocumentInfo,
  ProcessedPdfSelection,
  Result,
} from '../domain'
import { pdfDocumentInfoSchema, processedPdfSelectionSchema } from '../domain'
import { preprocessImage } from './image-processing'

const PDF_MIME_TYPE = 'application/pdf'

function error(message: string, code: string): Result<never, AppError> {
  return {
    ok: false,
    error: { type: 'validation', message, retryable: false, details: { code } },
  }
}

async function loadPdfLibrary() {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString()
  return pdfjs
}

async function openPdf(data: Blob) {
  const pdfjs = await loadPdfLibrary()
  const bytes = new Uint8Array(await data.arrayBuffer())
  const loadingTask = pdfjs.getDocument({ data: bytes })
  return {
    document: await loadingTask.promise,
    destroy: () => loadingTask.destroy(),
  }
}

async function validatePdf(data: Blob): Promise<Result<true, AppError>> {
  if (data.type !== PDF_MIME_TYPE) {
    return error('不支援此文件格式，請上傳 PDF。', 'UNSUPPORTED_PDF_TYPE')
  }
  if (data.size === 0) return error('PDF 檔案不可為空。', 'EMPTY_PDF')
  const signature = new TextDecoder('ascii').decode(await data.slice(0, 5).arrayBuffer())
  if (signature !== '%PDF-') {
    return error('無法讀取 PDF，檔案可能已損毀或格式不完整。', 'CORRUPTED_PDF')
  }
  return { ok: true, value: true }
}

function pdfReadError(reason: unknown): Result<never, AppError> {
  const name = reason instanceof Error ? reason.name : ''
  if (name === 'PasswordException') {
    return error('此 PDF 受密碼保護，目前無法讀取。', 'PDF_PASSWORD_REQUIRED')
  }
  return error('無法讀取 PDF，檔案可能已損毀或格式不完整。', 'CORRUPTED_PDF')
}

export async function inspectPdf(
  data: Blob,
  fileName: string,
): Promise<Result<PdfDocumentInfo, AppError>> {
  const validation = await validatePdf(data)
  if (!validation.ok) return validation

  try {
    const opened = await openPdf(data)
    const pdfDocument = opened.document
    try {
      const pages = []
      for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
        const page = await pdfDocument.getPage(pageNumber)
        const viewport = page.getViewport({ scale: 1 })
        pages.push({
          pageNumber,
          width: viewport.width,
          height: viewport.height,
          rotation: viewport.rotation,
        })
        page.cleanup()
      }
      const result = pdfDocumentInfoSchema.safeParse({
        fileName,
        pageCount: pdfDocument.numPages,
        pages,
      })
      return result.success
        ? { ok: true, value: result.data }
        : error('PDF 頁面資訊不完整。', 'INVALID_PDF_METADATA')
    } finally {
      await opened.destroy()
    }
  } catch (reason) {
    return pdfReadError(reason)
  }
}

export async function renderSelectedPdfPages(
  data: Blob,
  fileName: string,
  selectedPages: readonly number[],
  options: ImageProcessingOptions = {},
): Promise<Result<ProcessedPdfSelection, AppError>> {
  const validation = await validatePdf(data)
  if (!validation.ok) return validation
  const pageNumbers = [...new Set(selectedPages)]
  if (pageNumbers.length === 0) return error('請至少選擇一個 PDF 頁面。', 'NO_PDF_PAGES_SELECTED')

  try {
    const opened = await openPdf(data)
    const pdfDocument = opened.document
    try {
      if (pageNumbers.some((page) => !Number.isInteger(page) || page < 1 || page > pdfDocument.numPages)) {
        return error('選擇的頁碼超出 PDF 頁面範圍。', 'PDF_PAGE_OUT_OF_RANGE')
      }

      const pages = []
      for (const pageNumber of pageNumbers) {
        const page = await pdfDocument.getPage(pageNumber)
        const viewport = page.getViewport({ scale: 2 })
        const canvas = globalThis.document.createElement('canvas')
        canvas.width = Math.ceil(viewport.width)
        canvas.height = Math.ceil(viewport.height)
        const context = canvas.getContext('2d')
        if (!context) return error('瀏覽器無法建立 PDF 頁面畫布。', 'CANVAS_UNAVAILABLE')

        await page.render({ canvas, canvasContext: context, viewport }).promise
        const renderedBlob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/png'),
        )
        page.cleanup()
        if (!renderedBlob) return error('無法輸出 PDF 頁面圖片。', 'PDF_RENDER_FAILED')

        const processed = await preprocessImage(
          renderedBlob,
          `${fileName.replace(/\.pdf$/i, '')}-page-${pageNumber}.png`,
          options,
        )
        if (!processed.ok) return processed
        pages.push({ pageNumber, image: processed.value })
      }

      const result = processedPdfSelectionSchema.safeParse({ fileName, pages })
      return result.success
        ? { ok: true, value: result.data }
        : error('處理後的 PDF 頁面未通過資料驗證。', 'INVALID_PDF_RESULT')
    } finally {
      await opened.destroy()
    }
  } catch (reason) {
    return pdfReadError(reason)
  }
}
