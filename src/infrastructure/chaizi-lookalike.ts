import lookalikeAsset from '../assets/chaizi/lookalike-index.json'

interface LookalikeIndexAsset {
  metadata: {
    title: string
    sourceName: string
    sourceUrl: string
    sourceRevision: string
    sourceFile: string
    sourceFileSha256: string
    license: string
    characterCount: number
    componentCount: number
    candidateLimit: number
    candidateOrdering: string
    compositeRecognition: string
  }
  candidatesByCharacter: Record<string, string[]>
}

const asset = lookalikeAsset as LookalikeIndexAsset

export const CHAIZI_LOOKALIKE_METADATA = asset.metadata

/** 同步查詢共用拆字部件的候選；只提供候選，不決定教材分組。 */
export function lookupLookalikeCandidates(character: string): string[] {
  const normalized = character.trim()
  if ([...normalized].length !== 1) return []
  return [...(asset.candidatesByCharacter[normalized] ?? [])]
}
