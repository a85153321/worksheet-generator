import { createContext } from 'react'
import type { AnalysisResult } from '../domain'
import type { ImageResult, WorksheetDoc, WorksheetTemplate } from '../services'
import type { AppRoute } from './routes'

export interface UploadedFileInfo {
  name: string
  size: number
  mimeType: string
  blob: Blob
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
  analysisResult: AnalysisResult | null
  setAnalysisResult: React.Dispatch<React.SetStateAction<AnalysisResult | null>>
  generatedImages: Record<string, ImageResult>
  setGeneratedImages: React.Dispatch<React.SetStateAction<Record<string, ImageResult>>>
  selectedTemplate: WorksheetTemplate
  setSelectedTemplate: (tpl: WorksheetTemplate) => void
  worksheetDoc: WorksheetDoc | null
  setWorksheetDoc: React.Dispatch<React.SetStateAction<WorksheetDoc | null>>
}

export const AppContext = createContext<AppContextType | null>(null)
