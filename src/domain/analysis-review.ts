import type { AnalysisResult, CharacterAnalysis, ReviewReason } from './analysis-result'

export const LOW_CONFIDENCE_THRESHOLD = 0.8

function uniqueReasons(reasons: readonly ReviewReason[]): ReviewReason[] {
  return [...new Set(reasons)]
}

export function applyCharacterReviewRules(item: CharacterAnalysis): CharacterAnalysis {
  if (item.editableState.status === 'confirmed') {
    return {
      ...item,
      reviewReasons: [],
      editableState: { ...item.editableState, needsReview: false },
    }
  }

  const reviewReasons = [...(item.reviewReasons ?? [])]
  if (item.confidence < LOW_CONFIDENCE_THRESHOLD) reviewReasons.push('low-confidence')
  const normalizedReasons = uniqueReasons(reviewReasons)

  return {
    ...item,
    ...(normalizedReasons.length > 0 ? { reviewReasons: normalizedReasons } : {}),
    editableState: {
      ...item.editableState,
      needsReview: item.editableState.needsReview || normalizedReasons.length > 0,
    },
  }
}

export function applyAnalysisReviewRules(analysis: AnalysisResult): AnalysisResult {
  return {
    ...analysis,
    characters: analysis.characters.map(applyCharacterReviewRules),
  }
}
