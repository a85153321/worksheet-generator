export interface ParsedZhuyin {
  symbols: string[]
  tone: 1 | 2 | 3 | 4 | 5
  toneMark: string
}

/**
 * 臺灣教育部標準注音剖析函式
 * 支援一聲（不標調）、二聲（ˊ）、三聲（ˇ）、四聲（ˋ）、輕聲（˙）
 */
export function parseZhuyin(zhuyinStr: string): ParsedZhuyin {
  if (!zhuyinStr) {
    return { symbols: [], tone: 1, toneMark: '' }
  }

  const clean = zhuyinStr.trim()
  let tone: 1 | 2 | 3 | 4 | 5 = 1
  let toneMark = ''

  // 判斷輕聲：前置或後置的 ˙、·
  if (clean.includes('˙') || clean.includes('·') || clean.startsWith('•')) {
    tone = 5
    toneMark = '˙'
  } else if (clean.includes('ˊ')) {
    tone = 2
    toneMark = 'ˊ'
  } else if (clean.includes('ˇ')) {
    tone = 3
    toneMark = 'ˇ'
  } else if (clean.includes('ˋ')) {
    tone = 4
    toneMark = 'ˋ'
  }

  // 提取注音符號本體（ㄅㄆㄇㄈ...）
  const symbols: string[] = []
  for (const ch of clean) {
    // 排除調號字元
    if (!['ˊ', 'ˇ', 'ˋ', '˙', '·', '•', ' '].includes(ch)) {
      symbols.push(ch)
    }
  }

  return { symbols, tone, toneMark }
}
