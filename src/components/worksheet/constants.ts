import type { WorksheetFont, WorksheetTemplate } from '../../services'

export const WORKSHEET_FONT_LABELS: Record<WorksheetFont, string> = {
  'standard-kai': '標楷體',
  'zihi-kai-zhuyin': '標楷有注音',
  'zihi-only-zhuyin': '純注音',
}

export const TEMPLATE_NAMES: Record<WorksheetTemplate, string> = {
  'character-practice': '生字田字格練習單',
  'reference-character-practice': '範例注音生字學習單',
  'word-practice': '語詞積木擴展單',
  'sentence-practice': '句型仿寫應用單',
  'picture-practice': '看圖識字練習單',
}
