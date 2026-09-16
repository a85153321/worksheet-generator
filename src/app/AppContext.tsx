import React, { useEffect, useState, useTransition } from 'react'
import type { AnalysisResult } from '../domain'
import type { ImageResult, WorksheetDoc, WorksheetTemplate } from '../services'
import { type AppRoute, ROUTE_METAS } from './routes'
import { AppContext, type UploadedFileInfo } from './app-context'

const API_KEY_STORAGE_KEY = 'ws_gemini_api_key'

function parseHash(hash: string): AppRoute {
  const clean = hash.replace(/^#\/?/, '').trim() as AppRoute
  if (clean in ROUTE_METAS) {
    return clean
  }
  return 'upload'
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [, startTransition] = useTransition()
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      return parseHash(window.location.hash)
    }
    return 'upload'
  })

  // 本機 API Key 儲存（BYOK 模式，僅存瀏覽器本機 localStorage）
  const [apiKey, setApiKey] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(API_KEY_STORAGE_KEY) || ''
    }
    return ''
  })

  const [uploadedFile, setUploadedFile] = useState<UploadedFileInfo | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [generatedImages, setGeneratedImages] = useState<Record<string, ImageResult>>({})
  const [selectedTemplate, setSelectedTemplate] = useState<WorksheetTemplate>('character-practice')
  const [worksheetDoc, setWorksheetDoc] = useState<WorksheetDoc | null>(null)

  // 監聽 hashchange 支援上一頁／下一頁及書籤
  useEffect(() => {
    const handleHashChange = () => {
      startTransition(() => {
        setCurrentRoute(parseHash(window.location.hash))
      })
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // 路由切換時更新 document.title
  useEffect(() => {
    const meta = ROUTE_METAS[currentRoute]
    document.title = `${meta.title} - 國小 AI 學習單生成器`
  }, [currentRoute])

  const navigate = (route: AppRoute) => {
    window.location.hash = `#/${route}`
    startTransition(() => {
      setCurrentRoute(route)
    })
  }

  const saveApiKey = (key: string) => {
    const trimmed = key.trim()
    setApiKey(trimmed)
    if (trimmed) {
      localStorage.setItem(API_KEY_STORAGE_KEY, trimmed)
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY)
    }
  }

  const clearApiKey = () => {
    setApiKey('')
    localStorage.removeItem(API_KEY_STORAGE_KEY)
  }

  return (
    <AppContext.Provider
      value={{
        currentRoute,
        navigate,
        apiKey,
        hasApiKey: Boolean(apiKey && apiKey.length > 5),
        saveApiKey,
        clearApiKey,
        uploadedFile,
        setUploadedFile,
        analysisResult,
        setAnalysisResult,
        generatedImages,
        setGeneratedImages,
        selectedTemplate,
        setSelectedTemplate,
        worksheetDoc,
        setWorksheetDoc,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
