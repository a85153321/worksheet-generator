import { describe, expect, it, vi } from 'vitest'
import {
  CHAIZI_LOOKALIKE_METADATA,
  lookupLookalikeCandidates,
} from '../src/infrastructure'

describe('local chaizi lookalike candidates', () => {
  it('finds the 臤-related group from 賢', () => {
    const candidates = lookupLookalikeCandidates('賢')
    expect(candidates).toEqual(expect.arrayContaining(['堅', '竪', '緊', '腎']))
    expect(candidates).toHaveLength(CHAIZI_LOOKALIKE_METADATA.candidateLimit)
  })

  it('finds related 臤 characters from 堅 within the candidate cap', () => {
    const candidates = lookupLookalikeCandidates('堅')
    expect(candidates).toEqual(expect.arrayContaining(['竪', '緊', '腎']))
    expect(candidates.length).toBeLessThanOrEqual(8)
    expect(candidates).not.toContain('堅')
  })

  it('returns an empty array for missing or non-single characters', () => {
    expect(lookupLookalikeCandidates('𠀀')).toEqual([])
    expect(lookupLookalikeCandidates('堅緊')).toEqual([])
    expect(lookupLookalikeCandidates('')).toEqual([])
  })

  it('performs lookups synchronously without network requests', () => {
    const networkRequest = vi.fn()
    vi.stubGlobal('fetch', networkRequest)

    expect(lookupLookalikeCandidates('賢')).toContain('堅')
    expect(networkRequest).not.toHaveBeenCalled()

    vi.unstubAllGlobals()
  })
})
