import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const [propertiesDirectory, mappingDirectory, outputFile] = process.argv.slice(2)

if (!propertiesDirectory || !mappingDirectory || !outputFile) {
  throw new Error(
    'Usage: node scripts/build-cns11643-character-data.mjs <properties-dir> <mapping-dir> <output-file>',
  )
}

async function readTable(filePath) {
  const text = await readFile(filePath, 'utf8')
  return text
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split('\t'))
}

const unicodeFiles = [
  'CNS2UNICODE_Unicode BMP.txt',
  'CNS2UNICODE_Unicode 2.txt',
  'CNS2UNICODE_Unicode 3.txt',
  'CNS2UNICODE_Unicode 15.txt',
]

const cnsToCharacter = new Map()
for (const fileName of unicodeFiles) {
  for (const [cnsCode, unicodeHex] of await readTable(join(mappingDirectory, 'Unicode', fileName))) {
    const codePoint = Number.parseInt(unicodeHex, 16)
    if (!Number.isFinite(codePoint)) continue
    const character = String.fromCodePoint(codePoint)
    const isBrowserCoreHan =
      (codePoint >= 0x3400 && codePoint <= 0x9fff) ||
      (codePoint >= 0xf900 && codePoint <= 0xfaff)
    if (isBrowserCoreHan && /\p{Script=Han}/u.test(character)) {
      cnsToCharacter.set(cnsCode, character)
    }
  }
}

const radicalLabels = new Map(
  (await readTable(join(propertiesDirectory, 'CNS_radical_word.txt')))
    .map(([number, label]) => [number, label?.trim().split(/[（(]/u)[0]]),
)
const radicals = new Map(
  (await readTable(join(propertiesDirectory, 'CNS_radical.txt')))
    .map(([cnsCode, radicalNumber]) => [cnsCode, radicalLabels.get(radicalNumber)]),
)
const strokes = new Map(
  (await readTable(join(propertiesDirectory, 'CNS_stroke.txt')))
    .map(([cnsCode, strokeCount]) => [cnsCode, Number.parseInt(strokeCount, 10)]),
)
const pronunciations = new Map()
for (const [cnsCode, zhuyin] of await readTable(join(propertiesDirectory, 'CNS_phonetic.txt'))) {
  const values = pronunciations.get(cnsCode) ?? []
  if (zhuyin && !values.includes(zhuyin)) values.push(zhuyin)
  pronunciations.set(cnsCode, values)
}

const data = {}
for (const [cnsCode, character] of cnsToCharacter) {
  const radical = radicals.get(cnsCode)
  const strokeCount = strokes.get(cnsCode)
  const zhuyin = pronunciations.get(cnsCode)
  if (!radical || !Number.isInteger(strokeCount) || !zhuyin?.length) continue

  // Prefer the first CNS entry for duplicate Unicode mappings. The property
  // dataset sometimes maps compatibility entries to the same Unicode scalar.
  data[character] ??= [radical, strokeCount, zhuyin]
}

await mkdir(dirname(outputFile), { recursive: true })
await writeFile(outputFile, `${JSON.stringify(data)}\n`, 'utf8')
console.log(`Wrote ${Object.keys(data).length} character records to ${outputFile}`)
