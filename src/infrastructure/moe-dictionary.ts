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

export function matchReadingForWord(
  character: string,
  targetZhuyin: string,
  wordName: string,
  wordZhuyin: string,
): boolean {
  if (!targetZhuyin) return true
  const syllables = wordZhuyin.split(/\s+/)
  const chars = [...wordName]
  if (syllables.length === chars.length) {
    for (let i = 0; i < chars.length; i++) {
      if (chars[i] === character && syllables[i] === targetZhuyin) return true
    }
    return false
  }
  return wordZhuyin.includes(targetZhuyin)
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
  const defaultZhuyin = chooseDefaultReading(normalized, zhuyinCandidates)

  const rawDetails = relatedEntries
    .filter((entry) => entry.wordName !== normalized && [...entry.wordName].length <= 6)
    .map((entry): WordCandidateDetail => ({
      text: entry.wordName,
      zhuyin: entry.zhuyin,
      entryWordNumber: entry.wordNumber,
      sentenceCandidates: unique(extractExamples(entry.definition)),
      source: '教育部《國語辭典簡編本》',
    }))

  const wordCandidateDetails = [
    ...rawDetails.filter((d) => matchReadingForWord(normalized, defaultZhuyin, d.text, d.zhuyin)),
    ...rawDetails.filter((d) => !matchReadingForWord(normalized, defaultZhuyin, d.text, d.zhuyin)),
  ]

  const wordCandidates = unique(wordCandidateDetails.map((entry) => entry.text))
  const sentenceCandidates = unique(
    relatedEntries.flatMap((entry) => extractExamples(entry.definition)),
  )

  return {
    character: normalized,
    zhuyin: defaultZhuyin,
    zhuyinCandidates,
    radical: primaryEntry.radical,
    strokeCount: primaryEntry.strokeCount,
    wordCandidates,
    wordCandidateDetails,
    sentenceCandidates,
    entryWordNumbers: relatedEntries.map((entry) => entry.wordNumber),
  }
}

export function getCandidatesForCharacterReading(
  character: string,
  targetZhuyin: string,
): {
  wordCandidates: string[]
  allWordCandidates: string[]
  sentenceCandidates: string[]
} {
  const lookup = lookupCharacterFromDictionary(character)
  if (!lookup) {
    return { wordCandidates: [], allWordCandidates: [], sentenceCandidates: [] }
  }

  const matchedDetails = lookup.wordCandidateDetails.filter((detail) =>
    matchReadingForWord(character, targetZhuyin, detail.text, detail.zhuyin),
  )

  const allWordCandidates = unique(
    (matchedDetails.length > 0 ? matchedDetails : lookup.wordCandidateDetails).map((d) => d.text),
  )
  const wordCandidates = allWordCandidates.slice(0, 3)

  const matchedSentences = unique(
    (matchedDetails.length > 0 ? matchedDetails : lookup.wordCandidateDetails).flatMap(
      (d) => d.sentenceCandidates,
    ),
  )

  const linkedSentences = resolveSentenceCandidatesForWords(lookup, wordCandidates)
  const sentenceCandidates = unique([...linkedSentences, ...matchedSentences]).slice(0, 2)

  return {
    wordCandidates,
    allWordCandidates,
    sentenceCandidates: sentenceCandidates.length > 0 ? sentenceCandidates : lookup.sentenceCandidates.slice(0, 2),
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

/** 回傳指定語詞自己的例句；沒有時維持空陣列，不使用整體例句池 fallback。 */
export function resolveOwnSentencesForWord(
  lookup: CharacterDictionaryLookup,
  word: string,
): string[] {
  const targetWord = word.trim()
  if (!targetWord) return []
  return unique(
    lookup.wordCandidateDetails
      .filter((candidate) => candidate.text === targetWord)
      .flatMap((candidate) => candidate.sentenceCandidates),
  )
}

export const MOE_CONCISED_DICTIONARY_METADATA = dictionaryAsset.metadata
