import React, { useEffect, useState, useTransition, useMemo } from 'react'
import type { AnalysisResult, AppError } from '../domain'
import {
  analyzeMaterial,
  clearApiKey as removeStoredApiKey,
  getApiKey,
  getCachedAnalysis,
  isApiKeyConfigured,
  saveApiKey as persistApiKey,
  type ImageResult,
  type WorksheetDoc,
  type WorksheetTemplate,
} from '../services'
import { type AppRoute, ROUTE_METAS } from './routes'
import { AppContext, type UploadedFileInfo, type AnalysisScope } from './app-context'

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
      return getApiKey()
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
    if (trimmed) {
      persistApiKey(trimmed)
      setApiKey(trimmed)
    } else {
      removeStoredApiKey()
      setApiKey('')
    }
  }

  const clearApiKey = () => {
    removeStoredApiKey()
    setApiKey('')
  }

  // 設定已選頁碼
  const setSelectedPages = (pages: number[]) => {
    setUploadedFile((prev) => (prev ? { ...prev, selectedPages: pages } : null))
  }

  // 計算預估處理範圍（依 PROJECT.md 第 6 節規範：顯示頁數、選取項目數，不猜測費用）
  const analysisScope: AnalysisScope = useMemo(() => {
    const pages = uploadedFile?.selectedPages && uploadedFile.selectedPages.length > 0
      ? uploadedFile.selectedPages
      : [1]
    const pageCount = pages.length
    return {
      pageCount,
      selectedPages: pages,
      estimatedItemsMin: Math.max(1, pageCount * 2),
      estimatedItemsMax: pageCount * 4,
      grade: selectedGrade,
    }
  }, [uploadedFile, selectedGrade])

  /**
   * 執行教材分析 use case 流程：
   * 1. 昂貴操作：嚴格由使用者點擊按鈕觸發
   * 2. 計算特徵雜湊值（包含檔案與所選頁碼）並比對本機快取
   * 3. 呼叫 analyzeMaterial 取得驗證後結構化結果
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

      const activePages = targetFile.selectedPages && targetFile.selectedPages.length > 0
        ? targetFile.selectedPages
        : [1]

      // 計算特徵雜湊值（包含所選頁碼以確保多頁 PDF 快取命中正確性）
      const pagesKey = activePages.sort((a, b) => a - b).join(',')
      const contentHash = `hash-${encodeURIComponent(targetFile.name)}-${targetFile.size}-p${pagesKey}`

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
        selectedPages: activePages,
        context: {
          grade: selectedGrade,
          language: 'zh-TW',
        },
      })

      if (res.ok) {
        // 短暫保留非同步過渡，使 loading 狀態與進度檢核清晰可見
        await new Promise((resolve) => setTimeout(resolve, 700))
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
        hasApiKey: isApiKeyConfigured(),
        saveApiKey,
        clearApiKey,
        uploadedFile,
        setUploadedFile,
        setSelectedPages,
        analysisScope,
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
