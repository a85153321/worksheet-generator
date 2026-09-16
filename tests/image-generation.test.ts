import { describe, expect, it, vi } from 'vitest'
import type { CharacterAnalysis } from '../src/domain'
import { createGenerateSelectedImageUseCase } from '../src/services/image-generation'

function selectedItem(selected: boolean): CharacterAnalysis {
  return {
    character: '鳥',
    zhuyin: 'ㄋㄧㄠˇ',
    radical: '鳥',
    strokeCount: 11,
    words: ['小鳥'],
    exampleSentences: ['小鳥在天空飛。'],
    confidence: 0.98,
    source: { page: 1, block: '第二段' },
    imageSuggestion: {
      prompt: '一隻小鳥在藍天下飛翔',
      rationale: '幫助理解詞語情境',
      selected,
    },
    editableState: { status: 'confirmed', isEditable: true, needsReview: false },
  }
}

function dependencies() {
  return {
    calculateHash: vi.fn(async () => 'image-cache-key'),
    getApiKey: vi.fn(() => 'api-key'),
    getCachedImage: vi.fn(async () => null),
    putCachedImage: vi.fn(async () => undefined),
    generateImage: vi.fn(async () => ({
      ok: true as const,
      value: {
        data: new Blob(['generated'], { type: 'image/png' }),
        mimeType: 'image/png' as const,
      },
    })),
  }
}

describe('generateSelectedImage', () => {
  it('does not hash, read cache, read the key, or request generation when not selected', async () => {
    const deps = dependencies()
    const generateSelectedImage = createGenerateSelectedImageUseCase(deps)

    const result = await generateSelectedImage(selectedItem(false))

    expect(result).toMatchObject({ ok: false, error: { type: 'validation' } })
    expect(deps.calculateHash).not.toHaveBeenCalled()
    expect(deps.getCachedImage).not.toHaveBeenCalled()
    expect(deps.getApiKey).not.toHaveBeenCalled()
    expect(deps.generateImage).not.toHaveBeenCalled()
    expect(deps.putCachedImage).not.toHaveBeenCalled()
  })

  it('returns a cache hit without requesting Gemini or reading the API key', async () => {
    const deps = dependencies()
    deps.getCachedImage.mockResolvedValue({
      key: 'image-cache-key',
      data: new Blob(['cached'], { type: 'image/png' }),
      mimeType: 'image/png',
      createdAt: '2026-09-16T00:00:00.000Z',
    })
    const generateSelectedImage = createGenerateSelectedImageUseCase(deps)

    const result = await generateSelectedImage(selectedItem(true))

    expect(result).toMatchObject({ ok: true, value: { source: 'cache' } })
    expect(deps.getApiKey).not.toHaveBeenCalled()
    expect(deps.generateImage).not.toHaveBeenCalled()
  })

  it('generates and caches an image after a cache miss', async () => {
    const deps = dependencies()
    const generateSelectedImage = createGenerateSelectedImageUseCase(deps)

    const result = await generateSelectedImage(selectedItem(true))

    expect(result).toMatchObject({ ok: true, value: { source: 'generated' } })
    expect(deps.generateImage).toHaveBeenCalledTimes(1)
    expect(deps.putCachedImage).toHaveBeenCalledTimes(1)
  })
})
