import { readFile, writeFile } from 'node:fs/promises'
import { TemplateHandler } from 'easy-template-x'

const path = 'outputs/生字學習單test-標籤補全.docx'
const template = await readFile(path)
const handler = new TemplateHandler({ maxXmlDepth: 100 })
const tags = await handler.parseTags(template)
console.log(JSON.stringify(tags.map((tag) => tag.name)))

const item = (questionNumber, character, zhuyin, radical, strokeCount, words) => ({
  questionNumber,
  character,
  zhuyin,
  radical,
  strokeCount,
  wordCandidatesText: words,
  wordCandidates: [],
  sentenceCandidatesText: '',
  sentenceCandidates: [],
})
const first = item(1, '學', 'ㄒㄩㄝˊ', '子', 16, '學習、學生、學校')
const second = item(2, '習', 'ㄒㄧˊ', '羽', 11, '練習、習慣、複習')
await writeFile(
  '.tmp/user-template-review/rendered-one.docx',
  Buffer.from(await handler.process(template, { title: '生字注音學習單', ...first, items: [first] })),
)
await writeFile(
  '.tmp/user-template-review/rendered-two.docx',
  Buffer.from(await handler.process(template, { title: '生字注音學習單', ...first, items: [first, second] })),
)
