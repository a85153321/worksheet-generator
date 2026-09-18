import { describe, expect, it, vi } from 'vitest'
import { appErrorSchema } from '../src/domain'
import {
  analyzeTypedCharacters,
  lookupCharacterFromDictionary,
} from '../src/services'

describe('MOE Concised Mandarin Dictionary', () => {
  it('looks up official character data and related candidates locally', () => {
    const result = lookupCharacterFromDictionary('學')

    expect(result).toMatchObject({
      character: '學',
      radical: '子',
      strokeCount: 16,
    })
    expect(result?.zhuyin).toContain('ㄒㄩㄝˊ')
    expect(result?.zhuyinCandidates).toContain('ㄒㄩㄝˊ')
    expect(result?.zhuyinCandidates).toContain(result?.zhuyin)
    expect(result?.wordCandidates).toContain('學習')
    expect(result?.sentenceCandidates.length).toBeGreaterThan(0)
    expect(result?.entryWordNumbers.length).toBeGreaterThan(1)
  })

  it('returns null for a missing or non-single character', () => {
    expect(lookupCharacterFromDictionary('學習')).toBeNull()
    expect(lookupCharacterFromDictionary('𠀀')).toBeNull()
  })

  it('analyzes typed characters synchronously without network requests', () => {
    const networkRequest = vi.fn()
    vi.stubGlobal('fetch', networkRequest)

    const result = analyzeTypedCharacters({ characters: ['學', '習'] })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.characters.map(({ character }) => character)).toEqual(['學', '習'])
      expect(result.value.characters[0]?.wordCandidates).toContain('學習')
    }
    expect(networkRequest).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('returns an explicit dictionary-not-found state', () => {
    const result = analyzeTypedCharacters({ characters: ['𠀀'] })

    expect(result).toMatchObject({
      ok: false,
      error: {
        type: 'dictionary-not-found',
        missingCharacters: ['𠀀'],
      },
    })
    if (!result.ok) expect(appErrorSchema.safeParse(result.error).success).toBe(true)
  })

  it('returns distinct readings and selects one candidate as the default', () => {
    const result = lookupCharacterFromDictionary('行')

    expect(result?.zhuyinCandidates.length).toBeGreaterThan(1)
    expect(result?.zhuyinCandidates).toContain(result?.zhuyin)
    expect(result?.zhuyin).not.toContain('、')
  })
})
