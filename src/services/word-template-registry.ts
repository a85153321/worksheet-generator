const templateModules = import.meta.glob<string>(
  [
    '../assets/docx-templates/*.docx',
    '!../assets/docx-templates/~$*.docx',
    '!**/~$*',
  ],
  {
    eager: true,
    import: 'default',
    query: '?docx-template-base64',
  },
)

export interface WordTemplateDescriptor {
  id: string
  displayName: string
  fileName: string
  sourcePath: string
}

function fileNameFromPath(path: string): string {
  return path.split('/').at(-1) ?? path
}

function templateId(fileName: string): string {
  return fileName
    .replace(/\.docx$/i, '')
    .normalize('NFKC')
    .replace(/\s+/g, '-')
    .toLocaleLowerCase('zh-TW')
}

export const WORD_TEMPLATE_REGISTRY: readonly WordTemplateDescriptor[] = Object.keys(templateModules)
  .filter((sourcePath) => !fileNameFromPath(sourcePath).startsWith('~$'))
  .sort((left, right) => left.localeCompare(right, 'zh-TW'))
  .map((sourcePath) => {
    const fileName = fileNameFromPath(sourcePath)
    return {
      id: templateId(fileName),
      displayName: fileName.replace(/\.docx$/i, ''),
      fileName,
      sourcePath,
    }
  })

export function getDefaultWordTemplateId(): string | null {
  return WORD_TEMPLATE_REGISTRY[0]?.id ?? null
}

export function findWordTemplate(templateId: string | null | undefined): WordTemplateDescriptor | null {
  if (!templateId) return null
  return WORD_TEMPLATE_REGISTRY.find((template) => template.id === templateId) ?? null
}

function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  const comma = dataUrl.indexOf(',')
  if (comma < 0 || !dataUrl.slice(0, comma).includes(';base64')) {
    throw new Error('Word 範本未以離線 base64 資產載入。')
  }
  const binary = atob(dataUrl.slice(comma + 1))
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  return bytes.buffer
}

export function loadWordTemplateBytes(templateId: string): ArrayBuffer {
  const descriptor = findWordTemplate(templateId)
  if (!descriptor) throw new Error(`找不到 Word 範本「${templateId}」。`)
  const encoded = templateModules[descriptor.sourcePath]
  if (!encoded) throw new Error(`Word 範本「${descriptor.displayName}」沒有可用的建置資產。`)
  return dataUrlToArrayBuffer(encoded)
}
