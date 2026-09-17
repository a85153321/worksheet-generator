export type AppRoute =
  | 'settings'
  | 'upload'
  | 'analyzing'
  | 'review'
  | 'images'
  | 'templates'
  | 'preview'

export interface RouteMeta {
  path: AppRoute
  title: string
  stepNumber: number | null // null 表示非主流程步驟（如設定頁）
  description: string
}

export const ROUTE_METAS: Record<AppRoute, RouteMeta> = {
  settings: {
    path: 'settings',
    title: 'API Key 設定',
    stepNumber: null,
    description: '管理個人 Gemini API 金鑰（BYOK 模式）',
  },
  upload: {
    path: 'upload',
    title: '教材上傳',
    stepNumber: 1,
    description: '選擇或拖曳教材圖片／PDF 頁面',
  },
  analyzing: {
    path: 'analyzing',
    title: 'AI 分析進度',
    stepNumber: 2,
    description: '分析生字、注音、部首、筆畫與詞句',
  },
  review: {
    path: 'review',
    title: '審核與編輯',
    stepNumber: 3,
    description: '檢視 AI 提取成果，修正或確認生字資訊',
  },
  images: {
    path: 'images',
    title: '上傳配圖',
    stepNumber: 4,
    description: '依教學需求為生字上傳本機自備教學插圖',
  },
  templates: {
    path: 'templates',
    title: '學習單模板',
    stepNumber: 5,
    description: '挑選生字、詞語、句型、看圖或字音字形版型',
  },
  preview: {
    path: 'preview',
    title: 'A4 預覽與列印',
    stepNumber: 6,
    description: '檢視標準 A4 排版並直接列印或匯出 PDF',
  },
}

export const WORKFLOW_STEPS: AppRoute[] = [
  'upload',
  'analyzing',
  'review',
  'images',
  'templates',
  'preview',
]
