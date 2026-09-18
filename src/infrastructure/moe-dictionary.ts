import dictionaryAsset from '../assets/dictionary/dict-concised.json'

type DictionaryTuple = [
  wordNumber: string,
  wordName: string,
  zhuyin: string,
  radical: string,
  strokeCount: number,
  definition: string,
]

export interface DictionaryEntry {
  wordNumber: string
  wordName: string
  zhuyin: string
  radical: string
  strokeCount: number
  definition: string
}

export interface CharacterDictionaryLookup {
  character: string
  zhuyin: string
  zhuyinCandidates: string[]
  radical: string
  strokeCount: number
  wordCandidates: string[]
  sentenceCandidates: string[]
  entryWordNumbers: string[]
}

const tuples = dictionaryAsset.entries as DictionaryTuple[]
const entryByWordNumber = new Map<string, DictionaryEntry>(
  tuples.map(([wordNumber, wordName, zhuyin, radical, strokeCount, definition]) => [
    wordNumber,
    { wordNumber, wordName, zhuyin, radical, strokeCount, definition },
  ]),
)
const entryIdsByTerm = dictionaryAsset.entryIdsByTerm as Record<string, string[]>
const entryIdsByCharacter = dictionaryAsset.entryIdsByCharacter as Record<string, string[]>

function entriesFromIds(ids: readonly string[] | undefined): DictionaryEntry[] {
  if (!ids) return []
  return ids.flatMap((id) => {
    const entry = entryByWordNumber.get(id)
    return entry ? [entry] : []
  })
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)]
}

export function chooseDefaultReading(
  _character: string,
  zhuyinCandidates: readonly string[],
): string {
  return zhuyinCandidates[0] ?? ''
}

function extractExamples(definition: string): string[] {
  return [...definition.matchAll(/\[例\]\s*([^\n]+)/g)]
    .map((match) => match[1]?.trim() ?? '')
    .filter(Boolean)
}

export function lookupDictionaryEntriesByTerm(term: string): DictionaryEntry[] {
  return entriesFromIds(entryIdsByTerm[term.trim()])
}

export function lookupCharacterFromDictionary(
  character: string,
): CharacterDictionaryLookup | null {
  const normalized = character.trim()
  if ([...normalized].length !== 1) return null

  const exactEntries = lookupDictionaryEntriesByTerm(normalized)
  const primaryEntry = exactEntries[0]
  if (!primaryEntry) return null

  const relatedEntries = entriesFromIds(entryIdsByCharacter[normalized])
  const zhuyinCandidates = unique(exactEntries.map((entry) => entry.zhuyin).filter(Boolean))
  const wordCandidates = unique(
    relatedEntries
      .map((entry) => entry.wordName)
      .filter((wordName) => wordName !== normalized && [...wordName].length <= 6),
  )
  const sentenceCandidates = unique(
    relatedEntries.flatMap((entry) => extractExamples(entry.definition)),
  )

  return {
    character: normalized,
    zhuyin: chooseDefaultReading(normalized, zhuyinCandidates),
    zhuyinCandidates,
    radical: primaryEntry.radical,
    strokeCount: primaryEntry.strokeCount,
    wordCandidates,
    sentenceCandidates,
    entryWordNumbers: relatedEntries.map((entry) => entry.wordNumber),
  }
}

export const MOE_CONCISED_DICTIONARY_METADATA = dictionaryAsset.metadata
