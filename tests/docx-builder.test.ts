import { describe, expect, it } from 'vitest'
import type { AnalysisResult } from '../src/domain'
import {
  buildWorksheet,
  createDocxDocument,
  generateDocxBlob,
} from '../src/services'
import { Packer } from 'docx'
import JSZip from 'jszip'
import {
  DOCX_FONT_FULL_NAMES,
  type WorksheetFont,
} from '../src/services'

const sampleAnalysis: AnalysisResult = {
  characters: [
    {
      character: '學',
      zhuyin: 'ㄒㄩㄝˊ',
      radical: '子',
      strokeCount: 16,
      wordCandidates: ['學校', '學習', '學生'],
      sentenceCandidates: ['我每天到學校學習新知識。'],
      source: { page: 1, block: '第一段' },
    },
    {
      character: '習',
      zhuyin: 'ㄒㄧˊ',
      radical: '羽',
      strokeCount: 11,
      wordCandidates: ['學習', '練習'],
      sentenceCandidates: ['多練習可以讓生字寫得更漂亮。'],
      source: { page: 1, block: '第一段' },
    },
  ],
}

describe('docx-builder', () => {
  it.each(Object.entries(DOCX_FONT_FULL_NAMES) as Array<[WorksheetFont, string]>) (
    'writes the exact Word font name for %s',
    async (font, fullName) => {
      const result = await buildWorksheet(sampleAnalysis, 'character-practice', { grade: 3 })
      expect(result.ok).toBe(true)
      if (!result.ok) return

      const buffer = await Packer.toBuffer(createDocxDocument(result.value, { font }))
      const archive = await JSZip.loadAsync(buffer)
      const documentXml = await archive.file('word/document.xml')?.async('string')
      const stylesXml = await archive.file('word/styles.xml')?.async('string')

      expect(documentXml).toContain(`w:eastAsia="${fullName}"`)
      expect(stylesXml).toContain(`w:eastAsia="${fullName}"`)
    },
  )

  it('creates valid Document and generates non-empty buffer for character-practice', async () => {
    const res = await buildWorksheet(sampleAnalysis, 'character-practice', { grade: 3 })
    expect(res.ok).toBe(true)
    if (!res.ok) return

    const docx = createDocxDocument(res.value)
    expect(docx).toBeDefined()

    const buffer = await Packer.toBuffer(docx)
    expect(buffer.length).toBeGreaterThan(1000)
  })

  it('creates valid Document for word-practice and sentence-practice', async () => {
    const wordRes = await buildWorksheet(sampleAnalysis, 'word-practice', { grade: 3 })
    expect(wordRes.ok).toBe(true)
    if (!wordRes.ok) return

    const wordDocx = createDocxDocument(wordRes.value)
    const wordBuf = await Packer.toBuffer(wordDocx)
    expect(wordBuf.length).toBeGreaterThan(1000)

    const sentenceRes = await buildWorksheet(sampleAnalysis, 'sentence-practice', { grade: 3 })
    expect(sentenceRes.ok).toBe(true)
    if (!sentenceRes.ok) return

    const sentenceDocx = createDocxDocument(sentenceRes.value)
    const sentenceBuf = await Packer.toBuffer(sentenceDocx)
    expect(sentenceBuf.length).toBeGreaterThan(1000)
  })

  it('generateDocxBlob produces a Blob in supported environments', async () => {
    const res = await buildWorksheet(sampleAnalysis, 'character-practice', { grade: 3 })
    expect(res.ok).toBe(true)
    if (!res.ok) return

    const blob = await generateDocxBlob(res.value)
    expect(blob).toBeDefined()
    expect(blob.size).toBeGreaterThan(1000)
  })
})
