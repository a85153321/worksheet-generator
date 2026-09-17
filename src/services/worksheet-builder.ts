import type { AnalysisResult, AppError, CharacterAnalysis, Result } from '../domain'
import type {
  BuildWorksheetOptions,
  WorksheetImage,
  WorksheetBlock,
  WorksheetDoc,
  WorksheetPage,
  WorksheetSection,
  WorksheetTemplate,
} from './contracts'

const SECTIONS_PER_PAGE = 6

const TEMPLATE_LABELS: Record<WorksheetTemplate, WorksheetDoc['templateLabel']> = {
  'character-practice': '生字',
  'word-practice': '詞語',
  'sentence-practice': '句子',
  'picture-practice': '看圖',
}

function sectionId(kind: WorksheetSection['kind'], character: string, index: number): string {
  return `${kind}-${encodeURIComponent(character)}-${index + 1}`
}

function characterSection(item: CharacterAnalysis, index: number): WorksheetSection {
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
    },
  }
}

function wordSection(item: CharacterAnalysis, index: number): WorksheetSection | null {
  if (item.words.length === 0) return null
  return {
    kind: 'word',
    id: sectionId('word', item.character, index),
    instructions: '讀一讀詞語，並在空白處各寫一次。',
    item: {
      character: item.character,
      words: item.words.map((text) => ({ text, practiceLineCount: 1 })),
    },
  }
}

function sentenceSection(item: CharacterAnalysis, index: number): WorksheetSection | null {
  if (item.exampleSentences.length === 0) return null
  return {
    kind: 'sentence',
    id: sectionId('sentence', item.character, index),
    instructions: '讀一讀例句，再仿寫一句完整的句子。',
    item: {
      character: item.character,
      sentences: item.exampleSentences.map((text) => ({ text, answerLineCount: 2 })),
    },
  }
}

function pictureSection(
  item: CharacterAnalysis,
  index: number,
  images: ReadonlyMap<string, WorksheetImage>,
): WorksheetSection | null {
  const suggestion = item.imageSuggestion
  const image = images.get(item.character)
  if (!suggestion?.selected && !image) return null

  return {
    kind: 'picture',
    id: sectionId('picture', item.character, index),
    instructions: '看圖後，寫出對應的生字或詞語。',
    item: {
      character: item.character,
      prompt: suggestion?.prompt ?? `與「${item.character}」相關的教學圖片`,
      rationale: suggestion?.rationale ?? '教師選擇的看圖練習。',
      image: image ? { id: image.id, url: image.url, mimeType: image.mimeType } : null,
      needsImage: !image,
    },
  }
}

function buildSections(
  analysis: AnalysisResult,
  template: WorksheetTemplate,
  images: ReadonlyMap<string, WorksheetImage>,
): WorksheetSection[] {
  const sections: WorksheetSection[] = []
  analysis.characters.forEach((item, index) => {
    const candidates =
      template === 'character-practice'
          ? [characterSection(item, index)]
          : template === 'word-practice'
            ? [wordSection(item, index)]
            : template === 'sentence-practice'
              ? [sentenceSection(item, index)]
              : [pictureSection(item, index, images)]
    sections.push(...candidates.filter((section): section is WorksheetSection => section !== null))
  })
  return sections
}

function sectionCharacter(section: WorksheetSection): string | null {
  return section.item.character
}

function worksheetBlock(item: CharacterAnalysis): WorksheetBlock {
  return {
    character: item.character,
    zhuyin: item.zhuyin,
    words: [...item.words],
    exampleSentences: [...item.exampleSentences],
  }
}

function buildPages(
  sections: WorksheetSection[],
  analysis: AnalysisResult,
): WorksheetPage[] {
  const characterMap = new Map(analysis.characters.map((item) => [item.character, item]))
  const pages: WorksheetPage[] = []
  for (let start = 0; start < sections.length; start += SECTIONS_PER_PAGE) {
    const pageSections = sections.slice(start, start + SECTIONS_PER_PAGE)
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
  expectedCharacters: readonly CharacterAnalysis[],
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
  if (analysis.characters.length === 0) {
    return {
      ok: false,
      error: {
        type: 'validation',
        message: '至少需要一個生字才能建立學習單。',
        retryable: false,
      },
    }
  }

  const images = new Map((options.images ?? []).map((image) => [image.character, image]))
  const sections = buildSections(analysis, template, images)
  if (sections.length === 0) {
    return {
      ok: false,
      error: {
        type: 'validation',
        message: `分析結果沒有可用於「${TEMPLATE_LABELS[template]}」模板的內容。`,
        retryable: false,
      },
    }
  }

  const pages = buildPages(sections, analysis)

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
      sourceAnalysis: structuredClone(analysis),
      createdAt: new Date().toISOString(),
    },
  }
}
