import JSZip from 'jszip'
import { resolveBopomofoDisplayCharacter } from '../infrastructure'
import type { CharacterAnalysis } from '../domain'
import type { DocxExportOptions, WorksheetDoc, WorksheetImage } from './contracts'

export const REFERENCE_TEMPLATE_URL = 'templates/%E7%94%9F%E5%AD%97%E5%AD%B8%E7%BF%92%E5%96%AE%E6%B3%A8%E9%9F%B3%E7%89%88.docx'
export const REFERENCE_QUESTIONS_PER_PAGE = 5

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function directParagraphs(bodyXml: string): string[] {
  const paragraphs: string[] = []
  const tagPattern = /<\/?w:p(?=[\s>])[^>]*>/g
  let depth = 0
  let start = -1
  for (let match = tagPattern.exec(bodyXml); match; match = tagPattern.exec(bodyXml)) {
    const closing = match[0].startsWith('</')
    if (!closing) {
      if (match[0].endsWith('/>')) {
        if (depth === 0) paragraphs.push(match[0])
        continue
      }
      if (depth === 0) start = match.index
      depth += 1
    } else {
      depth -= 1
      if (depth === 0 && start >= 0) {
        paragraphs.push(bodyXml.slice(start, tagPattern.lastIndex))
        start = -1
      }
    }
  }
  return paragraphs
}

function questionCharacter(item: CharacterAnalysis, options: DocxExportOptions): string {
  return options.font === 'standard-kai'
    ? item.character
    : resolveBopomofoDisplayCharacter(item.character, item.zhuyin)
}

function replaceQuestionText(
  paragraphXml: string,
  item: CharacterAnalysis,
  questionNumber: number,
  options: DocxExportOptions,
): string {
  const display = questionCharacter(item, options)
  return paragraphXml
    .replace(/(<w:t(?:\s[^>]*)?>)([\s\S]*?)(<\/w:t>)/g, (_match, open, text, close) => {
      let next = text
      if (text === '看') next = display
      else if (text === '目') next = item.radical || '—'
      else if (text === '9') next = String(item.strokeCount || '—')
      else if (text.includes('第 1 題')) next = text.replace('第 1 題', `第 ${questionNumber} 題`)
      return `${open}${escapeXml(next)}${close}`
    })
    .replace(/wp:docPr id="\d+"/g, `wp:docPr id="${1000 + questionNumber}"`)
    .replace(/pic:cNvPr id="\d+"/g, `pic:cNvPr id="${2000 + questionNumber}"`)
    .replace(/_x0000_s\d+/g, `_x0000_s${3000 + questionNumber}`)
}

function fillWords(paragraphXml: string, item: CharacterAnalysis): string {
  const words = item.wordCandidates.slice(0, 3).join('、') || '________________、________________'
  const run = `<w:r><w:rPr><w:rFonts w:ascii="標楷體" w:eastAsia="標楷體" w:hAnsi="標楷體"/><w:sz w:val="20"/></w:rPr><w:t xml:space="preserve"> ${escapeXml(words)}</w:t></w:r>`
  return paragraphXml.replace('</w:p>', `${run}</w:p>`)
}

function imageAnchor(rId: string, questionNumber: number, image: WorksheetImage): string {
  const name = escapeXml(`題目${questionNumber}-${image.character}`)
  return `<w:r><w:drawing><wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="251658240" behindDoc="0" locked="0" layoutInCell="1" allowOverlap="1"><wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="column"><wp:posOffset>5700000</wp:posOffset></wp:positionH><wp:positionV relativeFrom="paragraph"><wp:posOffset>920000</wp:posOffset></wp:positionV><wp:extent cx="1000000" cy="760000"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:wrapSquare wrapText="bothSides"/><wp:docPr id="${4000 + questionNumber}" name="${name}" descr="${name}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${5000 + questionNumber}" name="${name}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="1000000" cy="760000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:anchor></w:drawing></w:r>`
}

async function imageBytes(image: WorksheetImage): Promise<Uint8Array> {
  const response = await fetch(image.url)
  if (!response.ok) throw new Error(`無法讀取「${image.character}」的學習單圖片。`)
  return new Uint8Array(await response.arrayBuffer())
}

function imageExtension(image: WorksheetImage): string {
  return image.mimeType === 'image/jpeg' ? 'jpg' : image.mimeType.split('/')[1] || 'png'
}

export async function createReferenceTemplateDocxBuffer(
  templateBytes: ArrayBuffer | Uint8Array,
  doc: WorksheetDoc,
  options: DocxExportOptions = {},
): Promise<Uint8Array> {
  const zip = await JSZip.loadAsync(templateBytes)
  const documentXml = await zip.file('word/document.xml')?.async('string')
  const relsXml = await zip.file('word/_rels/document.xml.rels')?.async('string')
  const contentTypesXml = await zip.file('[Content_Types].xml')?.async('string')
  if (!documentXml || !relsXml || !contentTypesXml) {
    throw new Error('教師提供的 Word 範例缺少必要的 OOXML 結構。')
  }

  const bodyMatch = documentXml.match(/(<w:body[^>]*>)([\s\S]*?)(<\/w:body>)/)
  if (!bodyMatch) throw new Error('教師提供的 Word 範例缺少文件本文。')
  const body = bodyMatch[2]
  const paragraphs = directParagraphs(body)
  if (paragraphs.length < 63) throw new Error(`教師提供的 Word 範例結構與預期不符（段落數：${paragraphs.length}）。`)

  const characters = doc.sourceAnalysis.characters
  const firstQuestion = paragraphs[2]
  const spacerParagraphs = paragraphs.slice(3, 7)
  const wordParagraph = paragraphs[7]
  const pageBreakParagraph = paragraphs[32]
  const sectionProperties = body.match(/<w:sectPr[\s\S]*?<\/w:sectPr>/)?.[0] ?? ''
  const imagesByCharacter = new Map((doc.images ?? []).map((image) => [image.character, image]))
  const blocks: string[] = [paragraphs[0], paragraphs[1]]
  let nextRelationshipId = 9000
  let nextRelsXml = relsXml
  let nextContentTypesXml = contentTypesXml

  for (let index = 0; index < characters.length; index += 1) {
    if (index > 0 && index % REFERENCE_QUESTIONS_PER_PAGE === 0) blocks.push(pageBreakParagraph)
    const item = characters[index]
    let question = replaceQuestionText(firstQuestion, item, index + 1, options)
    const image = imagesByCharacter.get(item.character)
    if (image) {
      const extension = imageExtension(image)
      const rId = `rIdReferenceImage${nextRelationshipId++}`
      const mediaName = `reference-${index + 1}.${extension}`
      zip.file(`word/media/${mediaName}`, await imageBytes(image))
      nextRelsXml = nextRelsXml.replace(
        '</Relationships>',
        `<Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${mediaName}"/></Relationships>`,
      )
      const mime = image.mimeType === 'image/jpeg' ? 'image/jpeg' : image.mimeType
      if (!nextContentTypesXml.includes(`Extension="${extension}"`)) {
        nextContentTypesXml = nextContentTypesXml.replace(
          '</Types>',
          `<Default Extension="${extension}" ContentType="${mime}"/></Types>`,
        )
      }
      question = question.replace('</w:p>', `${imageAnchor(rId, index + 1, image)}</w:p>`)
    }
    blocks.push(question, ...spacerParagraphs, fillWords(wordParagraph, item))
  }

  const nextBody = `${blocks.join('')}${sectionProperties}`
  zip.file('word/document.xml', documentXml.replace(bodyMatch[0], `${bodyMatch[1]}${nextBody}${bodyMatch[3]}`))
  zip.file('word/_rels/document.xml.rels', nextRelsXml)
  zip.file('[Content_Types].xml', nextContentTypesXml)
  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' })
}

export async function generateReferenceTemplateDocxBlob(
  doc: WorksheetDoc,
  options: DocxExportOptions = {},
): Promise<Blob> {
  const baseUrl = import.meta.env.BASE_URL || '/'
  const response = await fetch(`${baseUrl}${REFERENCE_TEMPLATE_URL}`)
  if (!response.ok) throw new Error('無法載入教師提供的 Word 範例模板。')
  const buffer = await createReferenceTemplateDocxBuffer(await response.arrayBuffer(), doc, options)
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer
  return new Blob([arrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
}
