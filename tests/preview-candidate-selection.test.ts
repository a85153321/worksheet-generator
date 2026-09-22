import { describe, expect, it } from 'vitest'
import { selectReplacementCandidates } from '../src/features/preview/candidate-selection'
import {
  lookupCharacterFromDictionary,
  resolveSentenceCandidatesForWords,
} from '../src/services'

describe('preview candidate replacement', () => {
  it('replaces words with at most three dictionary candidates', () => {
    const replacement = selectReplacementCandidates(
      ['學校', '學習', '學生', '學問', '學期'],
      ['學校', '學習', '學生'],
      3,
      () => 0,
    )

    expect(replacement).toHaveLength(3)
    expect(replacement).toEqual(expect.arrayContaining(['學問', '學期']))
    expect(replacement?.every((candidate) => ['學校', '學習', '學生', '學問', '學期'].includes(candidate))).toBe(true)
  })

  it('replaces sentences with at most two candidates and removes duplicates', () => {
    const replacement = selectReplacementCandidates(
      ['第一句。', '第二句。', '第二句。', '第三句。'],
      ['第一句。'],
      2,
      () => 0,
    )

    expect(replacement).toHaveLength(2)
    expect(new Set(replacement).size).toBe(2)
    expect(replacement).not.toContain('第一句。')
  })

  it('reports no replacement when all dictionary candidates are already selected', () => {
    expect(selectReplacementCandidates(['學校', '學習'], ['學校', '學習'], 3)).toBeNull()
  })

  it('uses sentences linked to the currently selected words before replacing a sentence', () => {
    const lookup = lookupCharacterFromDictionary('學')
    expect(lookup).not.toBeNull()
    if (!lookup) return

    const detail = lookup.wordCandidateDetails.find((candidate) => candidate.sentenceCandidates.length > 1)
      ?? lookup.wordCandidateDetails.find((candidate) => candidate.sentenceCandidates.length > 0)
    expect(detail).toBeDefined()
    if (!detail) return

    const linkedPool = resolveSentenceCandidatesForWords(lookup, [detail.text])
    expect(linkedPool).toEqual(detail.sentenceCandidates)

    const replacement = selectReplacementCandidates(linkedPool, [], 2, () => 0)
    expect(replacement?.every((sentence) => detail.sentenceCandidates.includes(sentence))).toBe(true)
  })

  it('falls back to the global sentence pool when selected words have no linked examples', () => {
    const lookup = lookupCharacterFromDictionary('學')
    expect(lookup).not.toBeNull()
    if (!lookup) return

    expect(resolveSentenceCandidatesForWords(lookup, ['教師手動輸入的語詞'])).toEqual(
      lookup.sentenceCandidates,
    )
  })

  it('safely extracts text from both string and object candidates', () => {
    const extractText = (candidate: unknown): string => {
      if (typeof candidate === 'string') return candidate
      if (
        candidate &&
        typeof candidate === 'object' &&
        'text' in candidate &&
        typeof (candidate as { text: unknown }).text === 'string'
      ) {
        return (candidate as { text: string }).text
      }
      return String(candidate ?? '')
    }

    expect(extractText('學校')).toBe('學校')
    expect(extractText({ text: '學習', zhuyin: 'ㄒㄩㄝˊ ㄒㄧˊ' })).toBe('學習')
    expect(extractText(null)).toBe('')
    expect(extractText(undefined)).toBe('')
  })
})
