import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import {
  resolveBopomofoDisplayCharacter,
  resolveBopomofoVariationSelector,
} from '../src/infrastructure'

describe('bpmf IVS map', () => {
  it('is reproducible from the pinned upstream source snapshot', () => {
    expect(() => execFileSync(
      process.execPath,
      ['scripts/build-bpmf-ivs-map.mjs', '--check'],
      { stdio: 'pipe' },
    )).not.toThrow()
  })

  it('resolves an exact non-default reading to its variation selector', () => {
    const selector = resolveBopomofoVariationSelector('會', 'ㄎㄨㄞˋ')

    expect(selector).toBe(String.fromCodePoint(0xe01e1))
    expect(resolveBopomofoDisplayCharacter('會', 'ㄎㄨㄞˋ')).toBe(`會${selector}`)
  })

  it('returns null and the original character when the reading does not match', () => {
    expect(resolveBopomofoVariationSelector('會', 'ㄅㄨˋ')).toBeNull()
    expect(resolveBopomofoDisplayCharacter('會', 'ㄅㄨˋ')).toBe('會')
  })

  it('returns null and the original character when the character is absent', () => {
    expect(resolveBopomofoVariationSelector('𠀀', 'ㄅㄨˋ')).toBeNull()
    expect(resolveBopomofoDisplayCharacter('𠀀', 'ㄅㄨˋ')).toBe('𠀀')
  })
})
