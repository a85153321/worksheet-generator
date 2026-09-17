export type AppRoute =
  | 'upload'
  | 'analyzing'
  | 'review'
  | 'images'
  | 'templates'
  | 'preview'

export interface RouteMeta {
  path: AppRoute
  title: string
  stepNumber: number | null
  description: string
}

export const ROUTE_METAS: Record<AppRoute, RouteMeta> = {
  upload: {
    path: 'upload',
    title: '輸入生字',
    stepNumber: 1,
    description: '直接輸入要查詢的生字',
  },
  analyzing: {
    path: 'analyzing',
    title: '辭典查詢結果',
    stepNumber: 2,
    description: '查詢注音、部首、筆畫、語詞與例句',
  },
  review: {
    path: 'review',
    title: '審核與編輯',
    stepNumber: 3,
    description: '檢視辭典查詢成果，修正或確認生字資訊',
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
    description: '挑選生字、語詞、句型或看圖版型',
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
