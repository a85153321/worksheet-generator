import type { WordSentenceBlank } from './analysis-result'

/** 只挖除 targetWord 第一次出現的位置；找不到時不猜測或改寫原文。 */
export function createSentenceBlank(
  sentence: string,
  targetWord: string,
): WordSentenceBlank | null {
  if (targetWord.length === 0) return null
  const index = sentence.indexOf(targetWord)
  if (index === -1) return null
  return {
    targetWord,
    originalSentence: sentence,
    sentenceBeforeBlank: sentence.slice(0, index),
    sentenceAfterBlank: sentence.slice(index + targetWord.length),
  }
}
