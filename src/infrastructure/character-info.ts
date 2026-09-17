import characterData from './data/cns11643-character-info.json'

export interface CharacterInfo {
  radical: string
  strokeCount: number
  /** CNS11643 收錄的全部臺灣注音讀音，依原始資料順序。 */
  zhuyin: string[]
}

type CompactCharacterInfo = readonly [radical: string, strokeCount: number, zhuyin: string[]]

const records = characterData as unknown as Record<string, CompactCharacterInfo>

export function lookupCharacterInfo(character: string): CharacterInfo | null {
  if ([...character].length !== 1) return null
  const record = records[character]
  if (!record) return null
  return {
    radical: record[0],
    strokeCount: record[1],
    zhuyin: [...record[2]],
  }
}

export function formatCharacterZhuyin(info: CharacterInfo): string {
  return info.zhuyin.join('、')
}
