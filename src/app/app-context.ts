import { createContext } from 'react'
import type { AnalysisResult, AnalysisSkillTag, AppError } from '../domain'
import type { ImageResult, WorksheetDoc, WorksheetTemplate } from '../services'
import type { AppRoute } from './routes'

export const DEFAULT_SKILL_TAGS: AnalysisSkillTag[] = ['生字練習', '語詞練習', '句型練習']

export interface UploadedFileInfo {
  name: string
  size: number
  mimeType: string
  blob: Blob
  previewUrl?: string
  isPdf?: boolean
  pageCount?: number
  selectedPages?: number[]
}

export interface AnalysisScope {
  pageCount: number
  selectedPages: number[]
  estimatedItemsMin: number
  estimatedItemsMax: number
  grade?: number
  skillTags?: AnalysisSkillTag[]
  includeZhuyin?: boolean
}

export interface AppContextType {
  currentRoute: AppRoute
  navigate: (route: AppRoute) => void
  apiKey: string
  hasApiKey: boolean
  saveApiKey: (key: string) => void
  clearApiKey: () => void
  uploadedFile: UploadedFileInfo | null
  setUploadedFile: (file: UploadedFileInfo | null) => void
  setSelectedPages: (pages: number[]) => void
  analysisScope: AnalysisScope
  analysisResult: AnalysisResult | null
  setAnalysisResult: React.Dispatch<React.SetStateAction<AnalysisResult | null>>
  analysisError: AppError | null
  setAnalysisError: (err: AppError | null) => void
  isAnalyzing: boolean
  setIsAnalyzing: (loading: boolean) => void
  selectedGrade: number
  setSelectedGrade: (grade: number) => void
  skillTags: AnalysisSkillTag[]
  setSkillTags: React.Dispatch<React.SetStateAction<AnalysisSkillTag[]>>
  includeZhuyin: boolean
  setIncludeZhuyin: React.Dispatch<React.SetStateAction<boolean>>
  generatedImages: Record<string, ImageResult>
  setGeneratedImages: React.Dispatch<React.SetStateAction<Record<string, ImageResult>>>
  selectedTemplate: WorksheetTemplate
  setSelectedTemplate: (tpl: WorksheetTemplate) => void
  worksheetDoc: WorksheetDoc | null
  setWorksheetDoc: React.Dispatch<React.SetStateAction<WorksheetDoc | null>>
  runAnalysis: (overrideFile?: UploadedFileInfo) => Promise<boolean>
}

export const AppContext = createContext<AppContextType | null>(null)
