import { createContext } from 'react'
import type { AnalysisResult, AppError } from '../domain'
import type { WorksheetDoc, WorksheetImage, WorksheetTemplate } from '../services'
import type { AppRoute } from './routes'

export interface AppContextType {
  currentRoute: AppRoute
  navigate: (route: AppRoute) => void
  analysisResult: AnalysisResult | null
  setAnalysisResult: React.Dispatch<React.SetStateAction<AnalysisResult | null>>
  analysisError: AppError | null
  setAnalysisError: (error: AppError | null) => void
  selectedGrade: number
  setSelectedGrade: (grade: number) => void
  worksheetImages: Record<string, WorksheetImage>
  setWorksheetImages: React.Dispatch<React.SetStateAction<Record<string, WorksheetImage>>>
  selectedTemplate: WorksheetTemplate
  setSelectedTemplate: (template: WorksheetTemplate) => void
  selectedDocxTemplateId: string | null
  setSelectedDocxTemplateId: (templateId: string | null) => void
  worksheetDoc: WorksheetDoc | null
  setWorksheetDoc: React.Dispatch<React.SetStateAction<WorksheetDoc | null>>
  typedCharacters: string[]
  runTypedAnalysis: (characters: string[]) => boolean
  readingFontMode: 'kai' | 'vertical'
  setReadingFontMode: (mode: 'kai' | 'vertical') => void
}

export const AppContext = createContext<AppContextType | null>(null)
