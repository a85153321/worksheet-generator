import { describe, expect, it } from 'vitest'
import {
  pairWordSentenceBlankItems,
  selectWordSentenceBlankTopItems,
  WORD_SENTENCE_BLANK_TOP_ITEM_LIMIT,
} from '../src/services/word-sentence-blank-layout'

describe('word sentence blank layout rules', () => {
  it('selects no summary items from an empty list', () => {
    expect(selectWordSentenceBlankTopItems([])).toEqual([])
  })

  it('keeps exactly the safe summary limit without mutation', () => {
    const items = [1, 2, 3, 4, 5]
    expect(WORD_SENTENCE_BLANK_TOP_ITEM_LIMIT).toBe(5)
    expect(selectWordSentenceBlankTopItems(items)).toEqual(items)
    expect(items).toEqual([1, 2, 3, 4, 5])
  })

  it('truncates summary items above the safe limit', () => {
    expect(selectWordSentenceBlankTopItems([1, 2, 3, 4, 5, 6, 7, 8])).toEqual([
      1, 2, 3, 4, 5,
    ])
  })

  it('pairs no rows from an empty list', () => {
    expect(pairWordSentenceBlankItems([])).toEqual([])
  })

  it('pairs even items two at a time', () => {
    expect(pairWordSentenceBlankItems([1, 2, 3, 4])).toEqual([
      { left: 1, right: 2 },
      { left: 3, right: 4 },
    ])
  })

  it('leaves the final right item absent for an odd count', () => {
    expect(pairWordSentenceBlankItems([1, 2, 3])).toEqual([
      { left: 1, right: 2 },
      { left: 3 },
    ])
  })
})
