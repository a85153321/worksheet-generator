import type { WorksheetFont, WorksheetTemplate } from '../../services'

export const WORKSHEET_FONT_LABELS: Record<WorksheetFont, string> = {
  'standard-kai': '標楷體',
  'zihi-kai-zhuyin': '標楷有注音',
  'zihi-only-zhuyin': '純注音',
}

export const TEMPLATE_NAMES: Record<WorksheetTemplate, string> = {
  'reference-character-practice': '範例注音生字學習單',
  'word-sentence-blank': '語詞例句填空',
}
