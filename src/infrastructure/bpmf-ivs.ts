import ivsAsset from '../assets/fonts/bpmf-ivs-map.json'

const selectorsByCharacter = ivsAsset.selectorsByCharacter as Record<
  string,
  Record<string, string>
>

export function resolveBopomofoVariationSelector(
  character: string,
  selectedZhuyin: string,
): string | null {
  return selectorsByCharacter[character]?.[selectedZhuyin] ?? null
}

export function resolveBopomofoDisplayCharacter(
  character: string,
  selectedZhuyin: string,
): string {
  const selector = resolveBopomofoVariationSelector(character, selectedZhuyin)
  return selector ? `${character}${selector}` : character
}

export const BPMF_IVS_METADATA = ivsAsset.metadata
