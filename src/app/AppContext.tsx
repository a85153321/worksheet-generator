import React, { useEffect, useState, useTransition } from 'react'
import type { AnalysisResult, AppError } from '../domain'
import {
  analyzeMaterial,
  getCachedAnalysis,
  type ImageResult,
  type WorksheetDoc,
  type WorksheetTemplate,
} from '../services'
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
  const [analysisError, setAnalysisError] = useState<AppError | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false)
  const [selectedGrade, setSelectedGrade] = useState<number>(3)
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

  /**
   * 執行教材分析 use case 流程：
   * 1. 檢查檔案存在性
   * 2. 計算特徵雜湊值並比對快取
   * 3. 呼叫 analyzeMaterial 取得驗證後結果
   * 4. 成功更新 state，失敗記錄 AppError
   */
  const runAnalysis = async (overrideFile?: UploadedFileInfo): Promise<boolean> => {
    const targetFile = overrideFile !== undefined ? overrideFile : uploadedFile

    setIsAnalyzing(true)
    setAnalysisError(null)

    try {
      if (!targetFile) {
        const err: AppError = {
          type: 'validation',
          message: '請先選擇或上傳教材檔案。',
          retryable: false,
        }
        setAnalysisError(err)
        setIsAnalyzing(false)
        return false
      }

      // 計算簡易特徵雜湊
      const contentHash = `hash-${encodeURIComponent(targetFile.name)}-${targetFile.size}`

      // 檢查快取
      const cached = await getCachedAnalysis(contentHash)
      if (cached) {
        setAnalysisResult(cached)
        setIsAnalyzing(false)
        return true
      }

      // 呼叫 Codex 交付之 analyzeMaterial use case
      const res = await analyzeMaterial({
        data: targetFile.blob,
        fileName: targetFile.name,
        mimeType: targetFile.mimeType,
        contentHash,
        context: {
          grade: selectedGrade,
          language: 'zh-TW',
        },
      })

      if (res.ok) {
        setAnalysisResult(res.value)
        setAnalysisError(null)
        setIsAnalyzing(false)
        return true
      } else {
        setAnalysisError(res.error)
        setIsAnalyzing(false)
        return false
      }
    } catch (e) {
      const err: AppError = {
        type: 'network',
        message: e instanceof Error ? e.message : '分析教材時發生非預期錯誤。',
        retryable: true,
      }
      setAnalysisError(err)
      setIsAnalyzing(false)
      return false
    }
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
        analysisError,
        setAnalysisError,
        isAnalyzing,
        setIsAnalyzing,
        selectedGrade,
        setSelectedGrade,
        generatedImages,
        setGeneratedImages,
        selectedTemplate,
        setSelectedTemplate,
        worksheetDoc,
        setWorksheetDoc,
        runAnalysis,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
