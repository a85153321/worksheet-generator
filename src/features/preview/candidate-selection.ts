export function selectReplacementCandidates(
  fullCandidates: string[],
  currentCandidates: string[],
  limit: number,
  random: () => number = Math.random,
): string[] | null {
  const uniqueCandidates = [...new Set(fullCandidates.map((candidate) => candidate.trim()).filter(Boolean))]
  const currentSet = new Set(currentCandidates.map((candidate) => candidate.trim()).filter(Boolean))
  const alternatives = uniqueCandidates.filter((candidate) => !currentSet.has(candidate))

  if (alternatives.length === 0) return null

  const shuffledAlternatives = [...alternatives].sort(() => random() - 0.5)
  const targetCount = Math.min(limit, uniqueCandidates.length)
  const replacement = shuffledAlternatives.slice(0, targetCount)

  if (replacement.length < targetCount) {
    const remaining = uniqueCandidates
      .filter((candidate) => !replacement.includes(candidate))
      .sort(() => random() - 0.5)
    replacement.push(...remaining.slice(0, targetCount - replacement.length))
  }

  return replacement
}
