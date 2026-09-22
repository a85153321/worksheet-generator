import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import JSZip from 'jszip'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
} from 'docx'
import { TemplateHandler } from 'easy-template-x'
import type { AnalysisResult } from '../src/domain'
import type { WorksheetImage } from '../src/services'
import { buildWorksheet } from '../src/services'
import {
  createReferenceTemplateDocxBuffer,
  createWorksheetTemplateData,
  WORKSHEET_CHARACTER_STYLE,
} from '../src/services/reference-template-docx'
import { resolveWorksheetFont } from '../src/services/worksheet-font'

const templateBuffer = readFileSync('src/assets/docx-templates/生字注音學習單.docx')
const template = templateBuffer.buffer.slice(
  templateBuffer.byteOffset,
  templateBuffer.byteOffset + templateBuffer.byteLength,
) as ArrayBuffer
const values = [
  ['看', 'ㄎㄢˋ', '目', 9],
  ['學', 'ㄒㄩㄝˊ', '子', 16],
  ['習', 'ㄒㄧˊ', '羽', 11],
  ['會', 'ㄎㄨㄞˋ', '曰', 13],
  ['鳥', 'ㄋㄧㄠˇ', '鳥', 11],
  ['山', 'ㄕㄢ', '山', 3],
  ['三', 'ㄙㄢ', '一', 3],
  ['槍', 'ㄑㄧㄤ', '木', 14],
] as const
const pngBytes = Uint8Array.from(Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
))

function analysisFor(count: number): AnalysisResult {
  return {
    characters: values.slice(0, count).map(([character, zhuyin, radical, strokeCount]) => ({
      character,
      zhuyin,
      zhuyinCandidates: [zhuyin],
      radical,
      strokeCount,
      wordCandidates: [`${character}字`, `${character}詞`],
      sentenceCandidates: [`這是「${character}」的例句。`],
      source: { page: 1, block: '範例測試' },
    })),
  }
}

async function worksheet(count: number, images: WorksheetImage[] = []) {
  const result = await buildWorksheet(analysisFor(count), 'reference-character-practice', {
    images,
    grade: 1,
    docxTemplateId: '生字注音學習單',
  })
  expect(result.ok).toBe(true)
  if (!result.ok) throw new Error(result.error.message)
  return result.value
}

async function outputArchive(count: number, images: WorksheetImage[] = []) {
  const doc = await worksheet(count, images)
  const output = await createReferenceTemplateDocxBuffer(template, doc)
  const zip = await JSZip.loadAsync(output)
  return {
    zip,
    documentXml: await zip.file('word/document.xml')!.async('string'),
    stylesXml: await zip.file('word/styles.xml')!.async('string'),
  }
}

describe('easy-template-x smoke template', () => {
  it('renders a single field, nested loop and image without network access', async () => {
    const simpleTemplate = new Document({
      styles: {
        characterStyles: [{
          id: WORKSHEET_CHARACTER_STYLE,
          name: WORKSHEET_CHARACTER_STYLE,
          run: { font: '標楷體' },
        }],
      },
      sections: [{
        children: [
          new Paragraph({ children: [new TextRun('{character}')] }),
          new Paragraph({ children: [new TextRun('{#wordCandidates}{text}{/wordCandidates}')] }),
          new Paragraph({ children: [new TextRun('{image}')] }),
        ],
      }],
    })
    const simpleBuffer = await Packer.toBuffer(simpleTemplate)
    const simpleBytes = simpleBuffer.buffer.slice(
      simpleBuffer.byteOffset,
      simpleBuffer.byteOffset + simpleBuffer.byteLength,
    ) as ArrayBuffer
    const doc = await worksheet(1, [{
      id: 'image-see',
      character: '看',
      url: 'blob:preview-only',
      file: new Blob([pngBytes], { type: 'image/png' }),
      mimeType: 'image/png',
      source: 'upload',
      createdAt: '2026-09-21T00:00:00.000Z',
    }])
    const data = await createWorksheetTemplateData(doc, 'standard-kai')
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const output = await new TemplateHandler().process(
      simpleBytes,
      data as unknown as Parameters<TemplateHandler['process']>[1],
    )
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()

    const zip = await JSZip.loadAsync(output)
    const xml = await zip.file('word/document.xml')!.async('string')
    const media = Object.keys(zip.files).filter((path) => /^word\/media\/[^/]+\.png$/.test(path))
    expect(xml).toContain('看')
    expect(xml).toContain('看字')
    expect(xml).toContain('看詞')
    expect(xml).not.toMatch(/\{(?:character|wordCandidates|text|image)/)
    expect(media).toHaveLength(1)
  })
})

describe('migrated teacher Word template', () => {
  it('contains the supported easy-template-x tags and character style', async () => {
    const tags = await new TemplateHandler({ maxXmlDepth: 100 }).parseTags(template)
    const names = tags.map((tag) => tag.name)
    expect(names).toContain('items')
    expect(names).toContain('character')
    expect(names).toContain('wordCandidatesText')
    expect(names).toContain('image')
    const zip = await JSZip.loadAsync(template)
    expect(await zip.file('word/styles.xml')!.async('string')).toContain(
      `w:styleId="${WORKSHEET_CHARACTER_STYLE}"`,
    )
    const documentXml = await zip.file('word/document.xml')!.async('string')
    const characterRuns = (documentXml.match(/<w:r(?:\s[^>]*)?>[\s\S]*?<\/w:r>/g) ?? [])
      .filter((run) => run.includes(`w:rStyle w:val="${WORKSHEET_CHARACTER_STYLE}"`))
    expect(characterRuns.length).toBeGreaterThanOrEqual(1)
    expect(characterRuns.every((run) => !run.includes('<w:rFonts'))).toBe(true)
  })

  it('keeps the table-only visual roles and fixed square-cell grid in the template', async () => {
    const zip = await JSZip.loadAsync(template)
    const xml = await zip.file('word/document.xml')!.async('string')
    expect(xml).toContain('w:color="EF4444"')
    expect(xml).toContain('w:color="7030A0"')
    expect(xml).toContain('w:fill="F8FAFC"')
    expect(xml).toContain('<w:tblLayout w:type="fixed"/>')
    expect(xml.match(/<w:gridCol w:w="144[23]"\/>/g)).toHaveLength(5)
    expect(xml.match(/<w:gridCol w:w="5[012]\d"\/>/g)).toHaveLength(5)
  })

  it('keeps each information row attached to its practice grid across page breaks', async () => {
    const { documentXml } = await outputArchive(8)
    const rootRows = documentXml.match(/<w:tr(?:\s[^>]*)?>[\s\S]*?<\/w:tr>/g) ?? []
    const informationRows = rootRows.filter((row) => row.includes('第 ') && row.includes('題'))
    const practiceRows = rootRows.filter((row) => row.includes('EF4444') && row.includes('7030A0'))
    expect(informationRows).toHaveLength(8)
    expect(practiceRows).toHaveLength(8)
    expect(informationRows.every((row) => row.includes('<w:cantSplit'))).toBe(true)
    expect(practiceRows.every((row) => row.includes('<w:cantSplit'))).toBe(true)

    const informationTables = documentXml.match(/<w:tbl(?:\s[^>]*)?>[\s\S]*?<\/w:tbl>/g) ?? []
    const protectedInformationTables = informationTables.filter(
      (table) => table.includes('第 ') && table.includes('題'),
    )
    expect(protectedInformationTables).toHaveLength(8)
    expect(protectedInformationTables.every((table) => table.includes('<w:keepNext'))).toBe(true)
  })

  it('selects the annotated font for lower grades and honors a forced override', () => {
    expect(resolveWorksheetFont(1)).toBe('zihi-kai-zhuyin')
    expect(resolveWorksheetFont(2)).toBe('zihi-kai-zhuyin')
    expect(resolveWorksheetFont(3)).toBe('standard-kai')
    expect(resolveWorksheetFont(6, 'zihi-kai-zhuyin')).toBe('zihi-kai-zhuyin')
  })

  it('renders multiple items and selected IVS without fixed question counts', async () => {
    const { documentXml, stylesXml } = await outputArchive(6)
    const visibleText = documentXml.replace(/<[^>]+>/g, '')
    for (let index = 0; index < 6; index += 1) {
      expect(visibleText).toContain(`第 ${index + 1} 題`)
      expect(visibleText).toContain(values[index][0])
      expect(visibleText).toContain(values[index][2])
    }
    expect(visibleText).toContain(`會${String.fromCodePoint(0xe01e1)}`)
    expect(documentXml).not.toMatch(/\{(?:#|\/)?items|\{character}|\{radical}|\{strokeCount}/)
    expect(stylesXml).toContain('w:styleId="WorksheetCharacter"')
    expect(stylesXml).toContain('w:eastAsia="ㄅ字嗨注音標楷 Regular"')
    const styledRuns = (documentXml.match(/<w:r(?:\s[^>]*)?>[\s\S]*?<\/w:r>/g) ?? [])
      .filter((run) => run.includes('w:rStyle w:val="WorksheetCharacter"'))
    expect(styledRuns.length).toBeGreaterThanOrEqual(6)
    expect(styledRuns.every((run) => !run.includes('<w:rFonts'))).toBe(true)
  })

  it('never exposes more than three words or two sentences to the template', async () => {
    const doc = await worksheet(1)
    doc.sourceAnalysis.characters[0].wordCandidates = ['詞一', '詞二', '詞三', '詞四']
    doc.sourceAnalysis.characters[0].sentenceCandidates = ['句一', '句二', '句三']
    const data = await createWorksheetTemplateData(doc, 'standard-kai')
    expect(data.items[0].wordCandidatesText).toBe('詞一、詞二、詞三')
    expect(data.items[0].wordCandidates).toEqual([
      { text: '詞一' }, { text: '詞二' }, { text: '詞三' },
    ])
    expect(data.items[0].sentenceCandidatesText).toBe('句一；句二')
    expect(data.items[0].sentenceCandidates).toEqual([{ text: '句一' }, { text: '句二' }])
  })

  it('embeds File or Blob bytes through the image plugin and leaves missing images blank', async () => {
    const image: WorksheetImage = {
      id: 'image-see',
      character: '看',
      url: 'blob:preview-only',
      file: new Blob([pngBytes], { type: 'image/png' }),
      mimeType: 'image/png',
      source: 'upload',
      createdAt: '2026-09-21T00:00:00.000Z',
    }
    const { zip } = await outputArchive(2, [image])
    const mediaFiles = Object.keys(zip.files).filter((path) => /^word\/media\/[^/]+\.png$/.test(path))
    expect(mediaFiles).toHaveLength(1)
    const embedded = await Promise.all(mediaFiles.map(
      async (path) => zip.file(path)!.async('uint8array'),
    ))
    expect(embedded.some((bytes) => Buffer.from(bytes).equals(Buffer.from(pngBytes)))).toBe(true)

    const noImage = await outputArchive(2)
    const noImageMedia = Object.keys(noImage.zip.files).filter(
      (path) => /^word\/media\/[^/]+\.png$/.test(path),
    )
    expect(noImageMedia).toEqual([])
  })

  it('does not issue network requests while producing the real template', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    await outputArchive(3)
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  it('filters out temporary Office files (~$*.docx) from WORD_TEMPLATE_REGISTRY', async () => {
    const { WORD_TEMPLATE_REGISTRY } = await import('../src/services/word-template-registry')
    expect(WORD_TEMPLATE_REGISTRY.length).toBeGreaterThan(0)
    expect(WORD_TEMPLATE_REGISTRY.every((item) => !item.fileName.startsWith('~$'))).toBe(true)
    expect(WORD_TEMPLATE_REGISTRY.every((item) => !item.id.startsWith('~$'))).toBe(true)
  })
})
