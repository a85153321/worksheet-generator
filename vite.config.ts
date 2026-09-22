import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    {
      name: 'docx-template-base64',
      enforce: 'pre',
      load(id) {
        const [filePath, query = ''] = id.split('?', 2)
        const fileName = filePath.split(/[/\\]/).at(-1) ?? ''
        if (!filePath.endsWith('.docx') || fileName.startsWith('~$') || !query.includes('docx-template-base64')) return null
        try {
          const base64 = readFileSync(filePath).toString('base64')
          return `export default ${JSON.stringify(`data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${base64}`)}`
        } catch (error) {
          console.warn(`[docx-template-base64] 警告：無法讀取範本檔案 ${filePath} (${error})`)
          return `export default ""`
        }
      },
    },
    react(),
  ],
  server: {
    host: true,
    port: 5173,
    watch: {
      ignored: [
        '**/~$*',
        '**/.tmp/**',
      ],
    },
  },
})
