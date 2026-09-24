import { resolveBopomofoDisplayCharacter } from '../infrastructure'
import type {
  ScopeDataResolver,
  TemplateContent,
  TemplateData,
} from 'easy-template-x'
import {
  MAX_SENTENCE_CANDIDATES,
  MAX_WORD_CANDIDATES,
  type CharacterAnalysis,
} from '../domain'
import { WORD_SENTENCE_BLANK_TOP_ITEM_LIMIT } from './word-sentence-blank-layout'
import type {
  DocxExportOptions,
  WorksheetDoc,
  WorksheetFont,
  WorksheetImage,
} from './contracts'
import {
  findWordTemplate,
  getDefaultWordTemplateId,
  loadWordTemplateBytes,
} from './word-template-registry'
import { DOCX_FONT_FULL_NAMES, resolveWorksheetFont } from './worksheet-font'

export const WORKSHEET_CHARACTER_STYLE = 'WorksheetCharacter'

export type TemplateImageMimeType = 'image/png' | 'image/jpeg' | 'image/svg+xml'

type TemplateImage = {
  _type: 'image'
  source: ArrayBuffer
  format: TemplateImageMimeType
  width: number
  height: number
  altText: string
}

export interface WordCandidateTemplateItem {
  text: string
}

export interface SentenceCandidateTemplateItem {
  text: string
}

export interface WorksheetTemplateItem {
  questionNumber: number
  character: string
  zhuyin: string
  radical: string
  strokeCount: number | string
  wordCandidatesText: string
  wordCandidates: WordCandidateTemplateItem[]
  sentenceCandidatesText: string
  sentenceCandidates: SentenceCandidateTemplateItem[]
  targetWord: string
  originalSentence: string
  sentenceBeforeBlank: string
  sentenceAfterBlank: string
  image?: TemplateImage
}

export interface WorksheetTemplateItemRow {
  left: WorksheetTemplateItem
  right?: WorksheetTemplateItem
}

export interface WorksheetTemplateData extends WorksheetTemplateItem {
  title: string
  items: WorksheetTemplateItem[]
  topItems: WorksheetTemplateItem[]
  itemRows: WorksheetTemplateItemRow[]
}

function valueAtPath(value: unknown, path: readonly string[]): unknown {
  let current = value
  for (const key of path) {
    if (current === null || current === undefined || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

/** 支援 itemRows 版型的 left.*／right.*，並讓 optional right 可作為條件迴圈。 */
export const resolveWorksheetTemplateScope: ScopeDataResolver = ({ data, strPath }) => {
  const tagName = strPath.at(-1) ?? ''
  const tagPath = tagName.split('.')
  const scopePath = strPath.slice(0, -1)
  for (let length = scopePath.length; length >= 0; length -= 1) {
    const value = valueAtPath(data, [...scopePath.slice(0, length), ...tagPath])
    if (value === undefined) continue
    if ((tagName === 'left' || tagName === 'right') && typeof value === 'object') return true
    return value as TemplateContent | TemplateData[]
  }
  return undefined as unknown as TemplateContent
}

async function convertWebpToPng(file: Blob): Promise<ArrayBuffer> {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') {
    throw new Error('目前執行環境無法將 WebP 圖片轉換成 Word 支援的 PNG。')
  }
  const bitmap = await createImageBitmap(file)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('無法建立圖片轉換畫布。')
    context.drawImage(bitmap, 0, 0)
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => result ? resolve(result) : reject(new Error('WebP 圖片轉換失敗。')),
        'image/png',
      )
    })
    return blob.arrayBuffer()
  } finally {
    bitmap.close()
  }
}

async function templateImage(image: WorksheetImage | undefined): Promise<TemplateImage | undefined> {
  if (!image?.file) return undefined
  const isWebp = image.mimeType === 'image/webp'
  return {
    _type: 'image',
    source: isWebp ? await convertWebpToPng(image.file) : await image.file.arrayBuffer(),
    format: isWebp
      ? 'image/png'
      : image.mimeType === 'image/jpeg'
        ? 'image/jpeg'
        : image.mimeType === 'image/svg+xml'
          ? 'image/svg+xml'
          : 'image/png',
    width: 105,
    height: 80,
    altText: `教師為「${image.character}」上傳的教學圖片`,
  }
}

function displayCharacter(item: CharacterAnalysis, font: WorksheetFont): string {
  return font === 'standard-kai'
    ? item.character
    : resolveBopomofoDisplayCharacter(item.character, item.zhuyin)
}

async function templateItem(
  item: CharacterAnalysis,
  questionNumber: number,
  font: WorksheetFont,
  image: WorksheetImage | undefined,
): Promise<WorksheetTemplateItem> {
  const wordCandidates = item.wordCandidates.slice(0, MAX_WORD_CANDIDATES)
  const sentenceCandidates = item.sentenceCandidates.slice(0, MAX_SENTENCE_CANDIDATES)
  return {
    questionNumber,
    character: displayCharacter(item, font),
    zhuyin: item.zhuyin,
    radical: item.radical || '—',
    strokeCount: item.strokeCount || '—',
    wordCandidatesText: wordCandidates.join('、'),
    wordCandidates: wordCandidates.map((text) => ({ text })),
    sentenceCandidatesText: sentenceCandidates.join('；'),
    sentenceCandidates: sentenceCandidates.map((text) => ({ text })),
    targetWord: item.wordSentenceBlank?.targetWord ?? '',
    originalSentence: item.wordSentenceBlank?.originalSentence ?? '',
    sentenceBeforeBlank: item.wordSentenceBlank?.sentenceBeforeBlank ?? '',
    sentenceAfterBlank: item.wordSentenceBlank?.sentenceAfterBlank ?? '',
    image: await templateImage(image),
  }
}

export async function createWorksheetTemplateData(
  doc: WorksheetDoc,
  font: WorksheetFont,
): Promise<WorksheetTemplateData> {
  const imagesByCharacter = new Map((doc.images ?? []).map((image) => [image.character, image]))
  const items = await Promise.all(doc.sourceAnalysis.characters.map(
    (item, index) => templateItem(item, index + 1, font, imagesByCharacter.get(item.character)),
  ))
  const first: WorksheetTemplateItem = items[0] ?? {
    questionNumber: 1,
    character: '',
    zhuyin: '',
    radical: '',
    strokeCount: '',
    wordCandidatesText: '',
    wordCandidates: [],
    sentenceCandidatesText: '',
    sentenceCandidates: [],
    targetWord: '',
    originalSentence: '',
    sentenceBeforeBlank: '',
    sentenceAfterBlank: '',
  }
  const itemsByQuestionNumber = new Map(items.map((item) => [item.questionNumber, item]))
  const wordSentenceSections = doc.pages
    .flatMap((page) => page.sections)
    .filter((section) => section.kind === 'word-sentence-blank')
  const topItems = (wordSentenceSections[0]?.topItems.flatMap((item) => {
    const templateItem = itemsByQuestionNumber.get(item.questionNumber)
    return templateItem ? [templateItem] : []
  }) ?? []).slice(0, WORD_SENTENCE_BLANK_TOP_ITEM_LIMIT)
  const itemRows = wordSentenceSections.flatMap((section) => section.itemRows.flatMap((row) => {
    const left = itemsByQuestionNumber.get(row.left.questionNumber)
    if (!left) return []
    const right = row.right
      ? itemsByQuestionNumber.get(row.right.questionNumber)
      : undefined
    return [right ? { left, right } : { left }]
  }))
  return {
    title: doc.title,
    ...first,
    items,
    topItems,
    itemRows,
  }
}

function replaceStyleFonts(styleXml: string, fontName: string): string {
  const escapedFont = fontName
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
  const fonts = `<w:rFonts w:ascii="${escapedFont}" w:hAnsi="${escapedFont}" w:eastAsia="${escapedFont}" w:cs="${escapedFont}"/>`
  const stylePattern = new RegExp(
    `(<w:style[^>]*w:styleId="${WORKSHEET_CHARACTER_STYLE}"[^>]*>)([\\s\\S]*?)(</w:style>)`,
  )
  const match = styleXml.match(stylePattern)
  if (!match) throw new Error(`Word 範本缺少字元樣式「${WORKSHEET_CHARACTER_STYLE}」。`)
  const body = match[2]
  const nextBody = /<w:rPr[\s>]/.test(body)
    ? body.replace(/(<w:rPr[^>]*>)([\s\S]*?)(<\/w:rPr>)/, (_all, open, content, close) => {
        const nextContent = /<w:rFonts[\s>]/.test(content)
          ? content.replace(/<w:rFonts[^>]*\/?>(?:<\/w:rFonts>)?/, fonts)
          : `${fonts}${content}`
        return `${open}${nextContent}${close}`
      })
    : `${body}<w:rPr>${fonts}</w:rPr>`
  return styleXml.replace(match[0], `${match[1]}${nextBody}${match[3]}`)
}

export async function patchWorksheetCharacterStyle(
  templateBytes: ArrayBuffer,
  font: WorksheetFont,
): Promise<ArrayBuffer> {
  const { default: JSZip } = await import('jszip')
  const zip = await JSZip.loadAsync(templateBytes)
  const styles = await zip.file('word/styles.xml')?.async('string')
  if (!styles) throw new Error('Word 範本缺少 word/styles.xml。')
  zip.file('word/styles.xml', replaceStyleFonts(styles, DOCX_FONT_FULL_NAMES[font]))
  return zip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' })
}

export async function createReferenceTemplateDocxBuffer(
  templateBytes: ArrayBuffer,
  doc: WorksheetDoc,
  options: DocxExportOptions = {},
): Promise<ArrayBuffer> {
  const font = resolveWorksheetFont(doc.grade, options.font)
  const styledTemplate = await patchWorksheetCharacterStyle(templateBytes, font)
  const data = await createWorksheetTemplateData(doc, font)
  const { TemplateHandler } = await import('easy-template-x')
  const handler = new TemplateHandler({
    maxXmlDepth: 100,
    scopeDataResolver: resolveWorksheetTemplateScope,
  })
  const result = await handler.process(
    styledTemplate,
    data as never,
  )
  return result as ArrayBuffer
}

export async function generateReferenceTemplateDocxBlob(
  doc: WorksheetDoc,
  options: DocxExportOptions = {},
): Promise<Blob> {
  const templateId = doc.docxTemplateId ?? getDefaultWordTemplateId()
  if (!templateId) throw new Error('目前沒有可用的 Word 範本，請先加入 .docx 範本檔。')
  const descriptor = findWordTemplate(templateId)
  if (!descriptor) throw new Error(`找不到已選取的 Word 範本「${templateId}」。`)
  const output = await createReferenceTemplateDocxBuffer(
    loadWordTemplateBytes(descriptor.id),
    doc,
    options,
  )
  return new Blob([output], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
}
