import { describe, expect, it } from 'vitest'
import type { AnalysisResult } from '../src/domain'
import {
  buildWorksheet,
  createDocxDocument,
  generateDocxBlob,
} from '../src/services'
import { Packer } from 'docx'

const sampleAnalysis: AnalysisResult = {
  characters: [
    {
      character: '學',
      zhuyin: 'ㄒㄩㄝˊ',
      radical: '子',
      strokeCount: 16,
      words: ['學校', '學習', '學生'],
      exampleSentences: ['我每天到學校學習新知識。'],
      confidence: 0.98,
      source: { page: 1, block: '第一段' },
      imageSuggestion: null,
      lookalikeCandidates: [
        { character: '字', radical: '子', strokeCount: 6 },
      ],
      multiPronunciations: [
        { pronunciation: 'ㄒㄩㄝˊ', word: '學校' },
      ],
      editableState: { status: 'confirmed', isEditable: true, needsReview: false },
    },
    {
      character: '習',
      zhuyin: 'ㄒㄧˊ',
      radical: '羽',
      strokeCount: 11,
      words: ['學習', '練習'],
      exampleSentences: ['多練習可以讓生字寫得更漂亮。'],
      confidence: 0.95,
      source: { page: 1, block: '第一段' },
      imageSuggestion: null,
      lookalikeCandidates: [],
      multiPronunciations: [],
      editableState: { status: 'confirmed', isEditable: true, needsReview: false },
    },
  ],
}

describe('docx-builder', () => {
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

  it('creates valid Document for character-discrimination with lookalikes and multi-pronunciations', async () => {
    const discrimRes = await buildWorksheet(sampleAnalysis, 'character-discrimination', { grade: 3 })
    expect(discrimRes.ok).toBe(true)
    if (!discrimRes.ok) return

    const docx = createDocxDocument(discrimRes.value)
    const buf = await Packer.toBuffer(docx)
    expect(buf.length).toBeGreaterThan(1000)
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
