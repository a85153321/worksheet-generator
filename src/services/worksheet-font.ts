import type { WorksheetFont } from './contracts'

export const DOCX_FONT_FULL_NAMES: Record<WorksheetFont, string> = {
  'standard-kai': '標楷體',
  'zihi-kai-zhuyin': 'ㄅ字嗨注音標楷 Regular',
  'zihi-only-zhuyin': 'ㄅ字嗨注音而已 R',
}

export function resolveWorksheetFont(
  grade: number,
  override?: WorksheetFont,
): WorksheetFont {
  return override ?? (grade <= 2 ? 'zihi-kai-zhuyin' : 'standard-kai')
}
