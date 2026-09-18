import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import JSZip from 'jszip'
import type { AnalysisResult } from '../src/domain'
import type { WorksheetImage } from '../src/services'
import { buildWorksheet } from '../src/services'
import { createReferenceTemplateDocxBuffer } from '../src/services/reference-template-docx'

const template = readFileSync('public/templates/生字學習單注音版.docx')
const values = [
  ['看', 'ㄎㄢˋ', '目', 9],
  ['學', 'ㄒㄩㄝˊ', '子', 16],
  ['習', 'ㄒㄧˊ', '羽', 11],
  ['會', 'ㄎㄨㄞˋ', '曰', 13],
  ['鳥', 'ㄋㄧㄠˇ', '鳥', 11],
  ['山', 'ㄕㄢ', '山', 3],
  ['水', 'ㄕㄨㄟˇ', '水', 4],
  ['火', 'ㄏㄨㄛˇ', '火', 4],
  ['人', 'ㄖㄣˊ', '人', 2],
  ['天', 'ㄊㄧㄢ', '大', 4],
] as const

function analysisFor(count: number): AnalysisResult {
  return {
    characters: values.slice(0, count).map(([character, zhuyin, radical, strokeCount]) => ({
      character,
      zhuyin,
      zhuyinCandidates: [zhuyin],
      radical,
      strokeCount,
      wordCandidates: [`${character}字`, `${character}詞`],
      sentenceCandidates: [],
      source: { page: 1, block: '範例測試' },
    })),
  }
}

async function generatedXml(count: number, images: WorksheetImage[] = []) {
  const result = await buildWorksheet(analysisFor(count), 'reference-character-practice', { images })
  expect(result.ok).toBe(true)
  if (!result.ok) throw new Error(result.error.message)
  const output = await createReferenceTemplateDocxBuffer(template, result.value, {
    font: 'zihi-only-zhuyin',
  })
  const zip = await JSZip.loadAsync(output)
  return {
    zip,
    documentXml: await zip.file('word/document.xml')!.async('string'),
    relsXml: await zip.file('word/_rels/document.xml.rels')!.async('string'),
  }
}

describe('teacher reference Word template', () => {
  it.each([1, 3, 5, 6, 10])('clones question one for %i distinct characters', async (count) => {
    const { documentXml } = await generatedXml(count)
    for (let index = 0; index < count; index += 1) {
      expect(documentXml).toContain(`第 ${index + 1} 題`)
      expect(documentXml).toContain(values[index][0])
      expect(documentXml).toContain(values[index][2])
    }
    expect(documentXml).not.toContain('{{character}}')
    expect((documentXml.match(/w:type="page"/g) ?? []).length).toBe(Math.floor((count - 1) / 5))
  })

  it('uses five questions per preview page to match the Word template', async () => {
    const result = await buildWorksheet(analysisFor(6), 'reference-character-practice')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.pages.map((page) => page.sections.length)).toEqual([5, 1])
  })

  it('writes the selected IVS for the non-default reading of 會', async () => {
    const { documentXml } = await generatedXml(4)
    expect(documentXml).toContain(`會${String.fromCodePoint(0xe01e1)}`)
  })

  it('embeds a teacher image and its OOXML relationship', async () => {
    const image: WorksheetImage = {
      id: 'image-see',
      character: '看',
      url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      mimeType: 'image/png',
      source: 'upload',
      createdAt: '2026-09-19T00:00:00.000Z',
    }
    const { zip, documentXml, relsXml } = await generatedXml(1, [image])
    expect(zip.file('word/media/reference-1.png')).not.toBeNull()
    expect(documentXml).toContain('rIdReferenceImage9000')
    expect(relsXml).toContain('media/reference-1.png')
  })
})
