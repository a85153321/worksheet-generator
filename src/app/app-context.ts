import { createContext } from 'react'
import type { AnalysisResult, AppError } from '../domain'
import type { WorksheetDoc, WorksheetImage, WorksheetTemplate } from '../services'
import type { AppRoute } from './routes'

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
  includeZhuyin: boolean
  setIncludeZhuyin: React.Dispatch<React.SetStateAction<boolean>>
  worksheetImages: Record<string, WorksheetImage>
  setWorksheetImages: React.Dispatch<React.SetStateAction<Record<string, WorksheetImage>>>
  selectedTemplate: WorksheetTemplate
  setSelectedTemplate: (tpl: WorksheetTemplate) => void
  worksheetDoc: WorksheetDoc | null
  setWorksheetDoc: React.Dispatch<React.SetStateAction<WorksheetDoc | null>>
  runAnalysis: (overrideFile?: UploadedFileInfo) => Promise<boolean>
}

export const AppContext = createContext<AppContextType | null>(null)
