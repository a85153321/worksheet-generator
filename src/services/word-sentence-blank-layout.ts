export const WORD_SENTENCE_BLANK_TOP_ITEM_LIMIT = 5

export interface WordSentenceBlankItemRow<T> {
  left: T
  right?: T
}

export function selectWordSentenceBlankTopItems<T>(items: readonly T[]): T[] {
  return items.slice(0, WORD_SENTENCE_BLANK_TOP_ITEM_LIMIT)
}

export function pairWordSentenceBlankItems<T>(
  items: readonly T[],
): WordSentenceBlankItemRow<T>[] {
  const rows: WordSentenceBlankItemRow<T>[] = []
  for (let index = 0; index < items.length; index += 2) {
    const left = items[index]
    if (left === undefined) continue
    const right = items[index + 1]
    rows.push(right === undefined ? { left } : { left, right })
  }
  return rows
}
