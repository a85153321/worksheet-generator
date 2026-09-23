import {
  analysisResultSchema,
  type AnalysisResult,
  type AppError,
  type Result,
} from '../domain'
import type {
  BuildWorksheetOptions,
  WorksheetBlock,
  WorksheetDoc,
  WorksheetPage,
  WorksheetSection,
  WorksheetTemplate,
} from './contracts'

const SECTIONS_PER_PAGE = 6

const TEMPLATE_LABELS: Record<WorksheetTemplate, WorksheetDoc['templateLabel']> = {
  'reference-character-practice': '範例生字',
}

function sectionId(kind: WorksheetSection['kind'], character: string, index: number): string {
  return `${kind}-${encodeURIComponent(character)}-${index + 1}`
}

function characterSection(item: AnalysisResult['characters'][number], index: number): WorksheetSection {
  return {
    kind: 'character',
    id: sectionId('character', item.character, index),
    instructions: '先讀注音與部首，再依筆順練習書寫。',
    item: {
      character: item.character,
      zhuyin: item.zhuyin,
      radical: item.radical,
      strokeCount: item.strokeCount,
      practiceBoxCount: 8,
      wordSentenceBlank: item.wordSentenceBlank
        ? { ...item.wordSentenceBlank }
        : item.wordSentenceBlank,
    },
  }
}

function buildSections(analysis: AnalysisResult): WorksheetSection[] {
  return analysis.characters.map(characterSection)
}

function sectionCharacter(section: WorksheetSection): string | null {
  return section.item.character
}

function worksheetBlock(item: AnalysisResult['characters'][number]): WorksheetBlock {
  return {
    character: item.character,
    zhuyin: item.zhuyin,
    wordCandidates: [...item.wordCandidates],
    sentenceCandidates: [...item.sentenceCandidates],
  }
}

function buildPages(
  sections: WorksheetSection[],
  analysis: AnalysisResult,
  sectionsPerPage = SECTIONS_PER_PAGE,
): WorksheetPage[] {
  const characterMap = new Map(analysis.characters.map((item) => [item.character, item]))
  const pages: WorksheetPage[] = []
  for (let start = 0; start < sections.length; start += sectionsPerPage) {
    const pageSections = sections.slice(start, start + sectionsPerPage)
    const seen = new Set<string>()
    const blocks: WorksheetBlock[] = []
    for (const section of pageSections) {
      const character = sectionCharacter(section)
      if (character === null) continue
      const source = characterMap.get(character)
      if (!source || seen.has(character)) continue
      seen.add(character)
      blocks.push(worksheetBlock(source))
    }
    pages.push({ pageNumber: pages.length + 1, blocks, sections: pageSections })
  }
  return pages
}

export function findCharacterPaginationIssues(
  expectedCharacters: readonly AnalysisResult['characters'][number][],
  pages: readonly WorksheetPage[],
): string[] {
  const expected = new Map<string, number>()
  const actual = new Map<string, number>()
  for (const item of expectedCharacters) {
    expected.set(item.character, (expected.get(item.character) ?? 0) + 1)
  }
  for (const block of pages.flatMap((page) => page.blocks)) {
    actual.set(block.character, (actual.get(block.character) ?? 0) + 1)
  }

  const characters = new Set([...expected.keys(), ...actual.keys()])
  return [...characters].filter(
    (character) => (expected.get(character) ?? 0) !== (actual.get(character) ?? 0),
  )
}

export async function buildWorksheet(
  analysis: AnalysisResult,
  template: WorksheetTemplate,
  options: BuildWorksheetOptions = {},
): Promise<Result<WorksheetDoc, AppError>> {
  const parsedAnalysis = analysisResultSchema.safeParse(analysis)
  if (!parsedAnalysis.success) {
    return {
      ok: false,
      error: {
        type: 'validation',
        message: '分析結果格式不正確，無法建立學習單。',
        retryable: false,
        details: { issues: parsedAnalysis.error.issues },
      },
    }
  }
  const canonicalAnalysis = parsedAnalysis.data
  if (canonicalAnalysis.characters.length === 0) {
    return {
      ok: false,
      error: {
        type: 'validation',
        message: '至少需要一個生字才能建立學習單。',
        retryable: false,
      },
    }
  }

  const sections = buildSections(canonicalAnalysis)

  const pages = buildPages(
    sections,
    canonicalAnalysis,
    SECTIONS_PER_PAGE,
  )

  return {
    ok: true,
    value: {
      id: `worksheet-${Date.now()}`,
      title: options.title?.trim() || `${TEMPLATE_LABELS[template]}學習單`,
      template,
      templateLabel: TEMPLATE_LABELS[template],
      grade: options.grade ?? 3,
      locale: 'zh-TW',
      pageSetup: { size: 'A4', orientation: 'portrait' },
      status: 'draft',
      pages,
      sourceAnalysis: structuredClone(canonicalAnalysis),
      // Blob/File 是不可變的瀏覽器物件；保留原物件，Word 匯出時才能讀取 arrayBuffer()。
      images: options.images ? [...options.images] : undefined,
      docxTemplateId: options.docxTemplateId,
      createdAt: new Date().toISOString(),
    },
  }
}
