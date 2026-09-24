import { describe, expect, it, vi } from 'vitest'
import {
  lookalikeGroupSchema,
  type AnalysisResult,
  type CharacterAnalysis,
} from '../src/domain'
import * as infrastructure from '../src/infrastructure'
import {
  buildWorksheet,
  CHARACTER_LOOKALIKE_GROUPS_PER_PAGE,
} from '../src/services/worksheet-builder'
import { lookupLookalikeCandidateSuggestions } from '../src/services'

const characters = [...'堅賢腎緊竪豎監覽藍籃'].map((character, index): CharacterAnalysis => ({
  character,
  zhuyin: `ㄐㄧㄢ${index}`,
  zhuyinCandidates: [`ㄐㄧㄢ${index}`],
  radical: '臣',
  strokeCount: 10 + index,
  wordCandidates: [`${character}字`],
  sentenceCandidates: [],
  source: { page: 1, block: '形近字測試' },
}))

function analysis(lookalikeGroups?: AnalysisResult['lookalikeGroups']): AnalysisResult {
  return {
    characters,
    ...(lookalikeGroups === undefined ? {} : { lookalikeGroups }),
  }
}

describe('lookalike group contract', () => {
  it('requires between two and six characters and returns validation errors', async () => {
    expect(lookalikeGroupSchema.safeParse({ id: 'one', characters: ['堅'] }).success).toBe(false)
    expect(lookalikeGroupSchema.safeParse({
      id: 'seven',
      characters: ['堅', '賢', '腎', '緊', '竪', '豎', '監'],
    }).success).toBe(false)
    expect(lookalikeGroupSchema.safeParse({
      id: 'six',
      characters: ['堅', '賢', '腎', '緊', '竪', '豎'],
    }).success).toBe(true)

    const tooFew = await buildWorksheet({
      characters,
      lookalikeGroups: [{ id: 'one', characters: ['堅'] }],
    }, 'character-lookalike-practice')
    const tooMany = await buildWorksheet({
      characters,
      lookalikeGroups: [{
        id: 'seven',
        characters: ['堅', '賢', '腎', '緊', '竪', '豎', '監'],
      }],
    }, 'character-lookalike-practice')
    expect(tooFew).toMatchObject({ ok: false, error: { type: 'validation' } })
    expect(tooMany).toMatchObject({ ok: false, error: { type: 'validation' } })
  })

  it('returns validation when a grouped character is absent from characters', async () => {
    const result = await buildWorksheet({
      characters,
      lookalikeGroups: [{ id: 'missing', characters: ['堅', '假'] }],
    }, 'character-lookalike-practice')
    expect(result).toMatchObject({ ok: false, error: { type: 'validation' } })
  })

  it('returns validation when one character belongs to more than one group', async () => {
    const result = await buildWorksheet(analysis([
      { id: 'first', characters: ['堅', '賢'] },
      { id: 'second', characters: ['堅', '腎'] },
    ]), 'character-lookalike-practice')
    expect(result).toMatchObject({ ok: false, error: { type: 'validation' } })
  })

  it('builds teacher-defined groups atomically with two groups per page', async () => {
    const groups = Array.from({ length: 5 }, (_, index) => ({
      id: `group-${index + 1}`,
      characters: [characters[index * 2]!.character, characters[index * 2 + 1]!.character],
    }))
    const result = await buildWorksheet(analysis(groups), 'character-lookalike-practice')
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.error.message)

    expect(CHARACTER_LOOKALIKE_GROUPS_PER_PAGE).toBe(2)
    expect(result.value.templateLabel).toBe('形近字辨析')
    expect(result.value.pageSetup.orientation).toBe('landscape')
    expect(result.value.pages.map((page) => page.sections.length)).toEqual([2, 2, 1])
    expect(result.value.pages.flatMap((page) => page.sections).map((section) => section.kind)).toEqual([
      'character-lookalike',
      'character-lookalike',
      'character-lookalike',
      'character-lookalike',
      'character-lookalike',
    ])
    const first = result.value.pages[0]?.sections[0]
    expect(first?.kind).toBe('character-lookalike')
    if (!first || first.kind !== 'character-lookalike') throw new Error('missing section')
    expect(first.groupCharacters).toEqual([
      expect.objectContaining({ character: '堅', wordCandidates: ['堅字'] }),
      expect.objectContaining({ character: '賢', wordCandidates: ['賢字'] }),
    ])
  })

  it('creates no lookalike sections when groups are absent or empty', async () => {
    const absent = await buildWorksheet(analysis(), 'character-lookalike-practice')
    const empty = await buildWorksheet(analysis([]), 'character-lookalike-practice')
    expect(absent.ok && absent.value.pages).toEqual([])
    expect(empty.ok && empty.value.pages).toEqual([])

    const reference = await buildWorksheet(analysis([]), 'reference-character-practice')
    expect(reference.ok).toBe(true)
    if (reference.ok) {
      expect(reference.value.pages.flatMap((page) => page.sections)).toHaveLength(characters.length)
    }
  })

  it('never asks the suggestion lookup to create worksheet groups', async () => {
    const lookupSpy = vi.spyOn(infrastructure, 'lookupLookalikeCandidates')
    const result = await buildWorksheet(analysis([
      { id: 'manual', characters: ['堅', '賢'] },
    ]), 'character-lookalike-practice')
    expect(result.ok).toBe(true)
    expect(lookupSpy).not.toHaveBeenCalled()
    lookupSpy.mockRestore()
  })

  it('exposes suggestions without mutating teacher-defined groups', () => {
    const groups = [{ id: 'manual', characters: ['堅', '賢'] }]
    const suggestions = lookupLookalikeCandidateSuggestions('堅')
    expect(suggestions.length).toBeGreaterThan(0)
    expect(groups).toEqual([{ id: 'manual', characters: ['堅', '賢'] }])
  })
})
