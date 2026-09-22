import type { DocxExportOptions, WorksheetDoc } from './contracts'

export { DOCX_FONT_FULL_NAMES } from './worksheet-font'

/**
 * 使用建置時收集的 Word 範本與 easy-template-x 產生文件。
 * 專案不再保留以 docx 套件程式化組版的備援路徑。
 */
export async function generateDocxBlob(
  doc: WorksheetDoc,
  options: DocxExportOptions = {},
): Promise<Blob> {
  const { generateReferenceTemplateDocxBlob } = await import('./reference-template-docx')
  return generateReferenceTemplateDocxBlob(doc, options)
}

/** 瀏覽器端純前端直接觸發 Word (.docx) 下載。 */
export async function exportWorksheetToDocx(
  doc: WorksheetDoc,
  filename?: string,
  options: DocxExportOptions = {},
): Promise<void> {
  const blob = await generateDocxBlob(doc, options)
  const downloadName =
    filename || `${(doc.title || '國語學習單').replace(/[\\/:*?"<>|]/g, '_')}.docx`

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = downloadName
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
