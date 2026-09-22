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

export interface WordCandidateDetail {
  text: string
  zhuyin: string
  entryWordNumber: string
  sentenceCandidates: string[]
  source: '教育部《國語辭典簡編本》'
}

export interface CharacterDictionaryLookup {
  character: string
  zhuyin: string
  zhuyinCandidates: string[]
  radical: string
  strokeCount: number
  wordCandidates: string[]
  /** 完整候選詞條與各自例句；wordCandidates 仍保留為 UI 方便使用的字串陣列。 */
  wordCandidateDetails: WordCandidateDetail[]
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
  const wordCandidateDetails = relatedEntries
    .filter((entry) => entry.wordName !== normalized && [...entry.wordName].length <= 6)
    .map((entry): WordCandidateDetail => ({
      text: entry.wordName,
      zhuyin: entry.zhuyin,
      entryWordNumber: entry.wordNumber,
      sentenceCandidates: unique(extractExamples(entry.definition)),
      source: '教育部《國語辭典簡編本》',
    }))
  const wordCandidates = unique(wordCandidateDetails.map((entry) => entry.text))
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
    wordCandidateDetails,
    sentenceCandidates,
    entryWordNumbers: relatedEntries.map((entry) => entry.wordNumber),
  }
}

export function resolveSentenceCandidatesForWords(
  lookup: CharacterDictionaryLookup,
  selectedWords: readonly string[],
): string[] {
  const selected = new Set(selectedWords.map((word) => word.trim()).filter(Boolean))
  const linked = unique(
    lookup.wordCandidateDetails
      .filter((candidate) => selected.has(candidate.text))
      .flatMap((candidate) => candidate.sentenceCandidates),
  )
  return linked.length > 0 ? linked : [...lookup.sentenceCandidates]
}

export const MOE_CONCISED_DICTIONARY_METADATA = dictionaryAsset.metadata
