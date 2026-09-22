import React, { useEffect, useState, useTransition } from 'react'
import type { AnalysisResult, AppError } from '../domain'
import {
  analyzeTypedCharacters,
  getDefaultWordTemplateId,
  type WorksheetDoc,
  type WorksheetImage,
  type WorksheetTemplate,
} from '../services'
import { AppContext } from './app-context'
import { type AppRoute, ROUTE_METAS } from './routes'

function parseHash(hash: string): AppRoute {
  const clean = hash.replace(/^#\/?/, '').trim() as AppRoute
  return clean in ROUTE_METAS ? clean : 'upload'
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [, startTransition] = useTransition()
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() =>
    typeof window !== 'undefined' && window.location.hash
      ? parseHash(window.location.hash)
      : 'upload',
  )
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [analysisError, setAnalysisError] = useState<AppError | null>(null)
  const [typedCharacters, setTypedCharacters] = useState<string[]>([])
  const [selectedGrade, setSelectedGrade] = useState(3)
  const [worksheetImages, setWorksheetImages] = useState<Record<string, WorksheetImage>>({})
  const [selectedTemplate, setSelectedTemplate] = useState<WorksheetTemplate>('reference-character-practice')
  const [selectedDocxTemplateId, setSelectedDocxTemplateId] = useState<string | null>(
    getDefaultWordTemplateId(),
  )
  const [worksheetDoc, setWorksheetDoc] = useState<WorksheetDoc | null>(null)

  useEffect(() => {
    const handleHashChange = () => startTransition(() => setCurrentRoute(parseHash(window.location.hash)))
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    document.title = `${ROUTE_METAS[currentRoute].title} - 國小學習單生成器`
  }, [currentRoute])

  const navigate = (route: AppRoute) => {
    window.location.hash = `#/${route}`
    startTransition(() => setCurrentRoute(route))
  }

  const runTypedAnalysis = (characters: string[]): boolean => {
    setTypedCharacters(characters)
    setAnalysisError(null)
    const result = analyzeTypedCharacters({
      characters,
      context: { language: 'zh-TW', grade: selectedGrade },
    })
    if (!result.ok) {
      setAnalysisError(result.error)
      return false
    }
    setAnalysisResult(result.value)
    return true
  }

  return (
    <AppContext.Provider value={{
      currentRoute,
      navigate,
      analysisResult,
      setAnalysisResult,
      analysisError,
      setAnalysisError,
      selectedGrade,
      setSelectedGrade,
      worksheetImages,
      setWorksheetImages,
      selectedTemplate,
      setSelectedTemplate,
      selectedDocxTemplateId,
      setSelectedDocxTemplateId,
      worksheetDoc,
      setWorksheetDoc,
      typedCharacters,
      runTypedAnalysis,
    }}>
      {children}
    </AppContext.Provider>
  )
}
