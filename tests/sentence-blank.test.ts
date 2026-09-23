import { describe, expect, it } from 'vitest'
import { characterAnalysisSchema, createSentenceBlank } from '../src/domain'
import type { CharacterDictionaryLookup } from '../src/services'
import { lookupCharacterFromDictionary, resolveOwnSentencesForWord } from '../src/services'

describe('createSentenceBlank', () => {
  it.each([
    ['句中', '他終於恢復清醒了。', '清醒', '他終於恢復', '了。'],
    ['句首', '清醒之後再出發。', '清醒', '', '之後再出發。'],
    ['句尾', '他現在很清醒', '清醒', '他現在很', ''],
  ])('creates a blank when the target word is at the %s', (
    _position,
    sentence,
    targetWord,
    sentenceBeforeBlank,
    sentenceAfterBlank,
  ) => {
    expect(createSentenceBlank(sentence, targetWord)).toEqual({
      targetWord,
      originalSentence: sentence,
      sentenceBeforeBlank,
      sentenceAfterBlank,
    })
  })

  it('returns null when the original sentence does not contain the target word', () => {
    expect(createSentenceBlank('他已經起床了。', '清醒')).toBeNull()
  })

  it('only removes the first occurrence and preserves the original sentence exactly', () => {
    const sentence = '清醒的人知道自己清醒。'
    expect(createSentenceBlank(sentence, '清醒')).toEqual({
      targetWord: '清醒',
      originalSentence: sentence,
      sentenceBeforeBlank: '',
      sentenceAfterBlank: '的人知道自己清醒。',
    })
  })
})

describe('word sentence blank contracts', () => {
  it('preserves a dictionary sentence while checking owned candidates in source order', () => {
    const lookup = lookupCharacterFromDictionary('學')
    expect(lookup).not.toBeNull()
    if (!lookup) return
    const detail = lookup.wordCandidateDetails.find((candidate) => (
      candidate.sentenceCandidates.some((sentence) => sentence.includes(candidate.text))
    ))
    expect(detail).toBeDefined()
    if (!detail) return

    const ownSentences = resolveOwnSentencesForWord(lookup, detail.text)
    const blank = ownSentences
      .map((sentence) => createSentenceBlank(sentence, detail.text))
      .find((candidate) => candidate !== null) ?? null

    expect(blank).not.toBeNull()
    expect(blank?.originalSentence).toBe(ownSentences.find(
      (sentence) => sentence.includes(detail.text),
    ))
  })

  it('does not fall back when the target word has no own sentences', () => {
    const lookup: CharacterDictionaryLookup = {
      character: '醒',
      zhuyin: 'ㄒㄧㄥˇ',
      zhuyinCandidates: ['ㄒㄧㄥˇ'],
      radical: '酉',
      strokeCount: 16,
      wordCandidates: ['清醒'],
      wordCandidateDetails: [{
        text: '清醒',
        zhuyin: 'ㄑㄧㄥ ㄒㄧㄥˇ',
        entryWordNumber: '0001',
        sentenceCandidates: [],
        source: '教育部《國語辭典簡編本》',
      }],
      sentenceCandidates: ['這是整體 fallback 例句。'],
      entryWordNumbers: ['0001'],
    }

    expect(resolveOwnSentencesForWord(lookup, '清醒')).toEqual([])
  })

  it('keeps legacy character analysis without the optional field valid', () => {
    expect(characterAnalysisSchema.safeParse({
      character: '醒',
      zhuyin: 'ㄒㄧㄥˇ',
      zhuyinCandidates: ['ㄒㄧㄥˇ'],
      radical: '酉',
      strokeCount: 16,
      wordCandidates: ['清醒'],
      sentenceCandidates: ['他終於恢復清醒了。'],
      source: { page: null, block: '教育部《國語辭典簡編本》' },
    }).success).toBe(true)
  })
})
