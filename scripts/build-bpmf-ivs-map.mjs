import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const SOURCE_COMMIT = '62683aa'
const SOURCE_URL = `https://raw.githubusercontent.com/ButTaiwan/bpmfvs/${SOURCE_COMMIT}/phonetic/phonic_table_Z.txt`
const SOURCE_SHA256 = '3310ecd8fcc7fa70bf5cda0731a96441628cc773eb0857977ed4bb73e0e94b60'
const DEFAULT_SOURCE = new URL('./vendor/bpmfvs/phonic_table_Z.txt', import.meta.url)
const DEFAULT_OUTPUT = new URL('../src/assets/fonts/bpmf-ivs-map.json', import.meta.url)
const IVS_BASE = 0xe01e0
const MAX_READINGS_PER_FONT = 6

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

export function buildIvsMapFromText(sourceText) {
  const selectorsByCharacter = {}
  let sourceCharacterCount = 0
  let mappedReadingCount = 0

  for (const [lineIndex, rawLine] of sourceText.split(/\r?\n/u).entries()) {
    if (!rawLine.trim()) continue
    const [character, codePointHex, , ...rawReadings] = rawLine.split('\t')
    const readings = [...new Set(rawReadings.map((reading) => reading.trim()).filter(Boolean))]
    if (!character || !codePointHex || readings.length === 0) {
      throw new Error(`Invalid phonic_table_Z.txt row at line ${lineIndex + 1}`)
    }
    if (character.codePointAt(0) !== Number.parseInt(codePointHex, 16)) {
      throw new Error(`Character/code point mismatch at line ${lineIndex + 1}: ${character}`)
    }

    sourceCharacterCount += 1
    const readingMap = {}
    readings.slice(1, MAX_READINGS_PER_FONT).forEach((reading, index) => {
      readingMap[reading] = String.fromCodePoint(IVS_BASE + index + 1)
      mappedReadingCount += 1
    })
    if (Object.keys(readingMap).length > 0) selectorsByCharacter[character] = readingMap
  }

  return {
    metadata: {
      source: 'ButTaiwan/bpmfvs phonetic/phonic_table_Z.txt',
      sourceUrl: SOURCE_URL,
      sourceCommit: SOURCE_COMMIT,
      sourceSha256: sha256(sourceText),
      license: 'Apache-2.0 (code/specification); see bundled BPMFVS license and notice files',
      selectorRule: 'First reading uses no selector; readings 2-6 use U+E01E1 through U+E01E5.',
      sourceCharacterCount,
      mappedCharacterCount: Object.keys(selectorsByCharacter).length,
      mappedReadingCount,
    },
    selectorsByCharacter,
  }
}

async function loadSource(sourcePath) {
  return readFile(sourcePath ?? DEFAULT_SOURCE, 'utf8')
}

async function main() {
  const args = process.argv.slice(2)
  const sourceFlag = args.indexOf('--source')
  const outputFlag = args.indexOf('--output')
  const sourceText = await loadSource(sourceFlag >= 0 ? args[sourceFlag + 1] : undefined)
  const actualHash = sha256(sourceText)
  if (actualHash !== SOURCE_SHA256) {
    throw new Error(`Unexpected bpmfvs source SHA-256: ${actualHash}`)
  }

  const output = outputFlag >= 0 ? args[outputFlag + 1] : DEFAULT_OUTPUT
  const serialized = `${JSON.stringify(buildIvsMapFromText(sourceText), null, 2)}\n`
  if (args.includes('--check')) {
    const current = (await readFile(output, 'utf8')).replace(/\r\n/g, '\n')
    const expected = serialized.replace(/\r\n/g, '\n')
    if (current !== expected) throw new Error('bpmf-ivs-map.json is out of date')
    return
  }
  await writeFile(output, serialized, 'utf8')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main()
}
