import React, { useState, useEffect, useMemo } from 'react'
import { useApp } from '../../app/index'
import {
  buildWorksheet,
  WORD_TEMPLATE_REGISTRY,
  type WorksheetTemplate,
  type WorksheetDoc,
} from '../../services'
import type {
  AnalysisResult,
  CharacterAnalysis,
  ElementaryGrade,
} from '../../domain'
import {
  WorksheetSheet,
  TEMPLATE_NAMES,
} from '../../components/worksheet'

interface TemplateOption {
  id: WorksheetTemplate
  docxTemplateId?: string
  title: string
  badge: string
  description: string
  targetGrade: string
  features: string[]
  icon: string
  wireframeType: 'reference' | 'word-sentence-blank' | 'character-lookalike'
}

const defaultSampleAnalysis: AnalysisResult = {
  characters: [
    {
      character: '學',
      zhuyin: 'ㄒㄩㄝˊ',
      zhuyinCandidates: ['ㄒㄩㄝˊ'],
      radical: '子',
      strokeCount: 16,
      wordCandidates: ['學校', '學習', '學生'],
      sentenceCandidates: ['我每天到學校學習新知識。', '在明亮的教室裡認真讀書。'],
      source: { page: 1, block: '第一段' },
    },
    {
      character: '習',
      zhuyin: 'ㄒㄧˊ',
      zhuyinCandidates: ['ㄒㄧˊ'],
      radical: '羽',
      strokeCount: 11,
      wordCandidates: ['學習', '練習', '習慣'],
      sentenceCandidates: ['多練習可以讓生字寫得更漂亮。', '養成良好的讀書與習字習慣。'],
      source: { page: 1, block: '第一段' },
    },
    {
      character: '一',
      zhuyin: 'ㄧ',
      zhuyinCandidates: ['ㄧ', 'ㄧˊ', 'ㄧˋ'],
      radical: '一',
      strokeCount: 1,
      wordCandidates: ['一起', '一定', '一樣', '第一'],
      sentenceCandidates: ['我們一起到公園玩耍。', '只要努力練習，一定能把字寫好。', '大家都有著一樣的愛心。'],
      source: { page: 1, block: '第一段' },
    },
  ],
}

export const TemplateSelectionPage: React.FC = () => {
  const {
    analysisResult,
    setAnalysisResult,
    selectedTemplate,
    setSelectedTemplate,
    selectedDocxTemplateId,
    setSelectedDocxTemplateId,
    worksheetDoc,
    setWorksheetDoc,
    worksheetImages,
    navigate,
    selectedGrade,
  } = useApp()

  const [isBuilding, setIsBuilding] = useState(false)
  const [buildError, setBuildError] = useState<string | null>(null)
  const [successNotice, setSuccessNotice] = useState<string | null>(null)
  const [showEnlargedPreview, setShowEnlargedPreview] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<WorksheetDoc | null>(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)

  const characters: CharacterAnalysis[] = analysisResult?.characters || []
  const isEmpty = characters.length === 0

  const templateOptions: TemplateOption[] = useMemo(() => {
    const wordTemplateOptions: TemplateOption[] = WORD_TEMPLATE_REGISTRY.length > 0
      ? WORD_TEMPLATE_REGISTRY.map((template) => {
          const isWordSentenceBlank =
            template.fileName.includes('語詞例句填空') ||
            template.displayName.includes('語詞例句填空')
          const isSingleColumn =
            template.fileName.includes('單欄') ||
            template.displayName.includes('單欄')
          const id: WorksheetTemplate = isWordSentenceBlank
            ? 'word-sentence-blank'
            : 'reference-character-practice'
          return {
            id,
            docxTemplateId: template.id,
            title: template.displayName,
            badge: isWordSentenceBlank
              ? (isSingleColumn ? '直式單欄範本（草稿）' : '橫式雙欄範本')
              : 'Word 動態範本',
            targetGrade: isWordSentenceBlank ? '適合國小中高年級' : '適合國小一至六年級',
            description: isWordSentenceBlank
              ? (isSingleColumn
                  ? '直式單欄排版草稿（建議改用橫式雙欄版以獲得最佳排版）'
                  : '橫式 A4 雙欄排版、上方 5 欄語詞摘要與下方挖空題目，適合語詞與例句練習')
              : '由 easy-template-x 在瀏覽器本機套用標籤、迴圈、IVS 字型與教師配圖',
            features: isWordSentenceBlank
              ? [
                  `範本檔名：${template.fileName}`,
                  isSingleColumn ? '直式 A4 單欄排版・每頁 5 題' : '橫式 A4 雙欄排版・每頁 8 題',
                  '上方 5 欄摘要・下方挖空練習',
                ]
              : [
                  `範本檔名：${template.fileName}`,
                  '每頁 5 題・多題迴圈與自動換頁',
                  '支援注音 IVS 字型與插圖',
                ],
            icon: isWordSentenceBlank ? '📖' : '📝',
            wireframeType: isWordSentenceBlank ? 'word-sentence-blank' : 'reference',
          }
        })
      : [
          {
            id: 'reference-character-practice' as const,
            title: '範例注音生字學習單',
            badge: 'Word 動態範本',
            targetGrade: '適合國小一至六年級',
            description: '由 easy-template-x 在瀏覽器本機套用標籤、迴圈、IVS 字型與教師配圖',
            features: ['標準 5 格排版母版', '注音與紫色部首格', '多題迴圈與自備配圖'],
            icon: '📝',
            wireframeType: 'reference' as const,
          },
        ]
    return [
      ...wordTemplateOptions,
      {
        id: 'character-lookalike-practice',
        title: '形近字辨析',
        badge: '即時預覽',
        targetGrade: '適合國小一至六年級',
        description: '由教師手動核定形近字分組，呈現字音、部首、筆畫與語詞候選',
        features: ['每組 2–6 字', '步驟 6 可新增、解散分組', '目前尚未提供 Word 範本'],
        icon: '🔎',
        wireframeType: 'character-lookalike',
      },
    ]
  }, [])

  const currentOption = templateOptions.find((option) =>
    option.docxTemplateId ? option.docxTemplateId === selectedDocxTemplateId : option.id === selectedTemplate,
  ) ?? templateOptions[0]

  const uploadedImageCount = Object.keys(worksheetImages).length

  // 確保 selectedTemplate 與 selectedDocxTemplateId 同步且具備合法初始值
  useEffect(() => {
    if (!selectedDocxTemplateId && selectedTemplate !== 'character-lookalike-practice' && WORD_TEMPLATE_REGISTRY.length > 0) {
      const defaultTpl = templateOptions[0]
      setSelectedDocxTemplateId(defaultTpl.docxTemplateId ?? null)
      setSelectedTemplate(defaultTpl.id)
    } else if (selectedDocxTemplateId) {
      const matched = templateOptions.find((opt) => opt.docxTemplateId === selectedDocxTemplateId)
      if (matched && matched.id !== selectedTemplate) {
        setSelectedTemplate(matched.id)
      }
    }
  }, [selectedTemplate, selectedDocxTemplateId, setSelectedTemplate, setSelectedDocxTemplateId, templateOptions])

  // ESC 鍵關閉放大預覽彈窗與背景滾動控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowEnlargedPreview(false)
      }
    }
    if (showEnlargedPreview) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [showEnlargedPreview])

  // 自動呼叫 buildWorksheet() 產生預覽資料，確保與步驟六 100% 共用相同的生成邏輯
  useEffect(() => {
    let isCancelled = false
    const activeAnalysis = (!analysisResult || analysisResult.characters.length === 0)
      ? defaultSampleAnalysis
      : analysisResult

    // Loading 狀態是本 effect 所啟動非同步工作的起點，不是衍生 render state。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsPreviewLoading(true)
    const imageList = Object.values(worksheetImages)

    buildWorksheet(activeAnalysis, currentOption.id, {
      images: imageList,
      grade: selectedGrade as ElementaryGrade,
      docxTemplateId: selectedDocxTemplateId ?? undefined,
    })
      .then((res) => {
        if (!isCancelled && res.ok) {
          setPreviewDoc(res.value)
        }
      })
      .catch((err) => {
        console.error('Failed to build preview worksheet:', err)
      })
      .finally(() => {
        if (!isCancelled) {
          setIsPreviewLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [selectedDocxTemplateId, analysisResult, worksheetImages, selectedGrade, currentOption.id])

  // 串接 buildWorksheet use case
  const handleCreateWorksheet = async () => {
    if (!analysisResult || analysisResult.characters.length === 0) {
      setBuildError('目前沒有可用的生字查詢結果，請先載入示範生字或返回輸入生字。')
      return
    }

    const imageList = Object.values(worksheetImages)

    setIsBuilding(true)
    setBuildError(null)
    setSuccessNotice(null)

    try {
      const res = await buildWorksheet(analysisResult, currentOption.id, {
        images: imageList,
        grade: selectedGrade as ElementaryGrade,
        docxTemplateId: selectedDocxTemplateId ?? undefined,
      })
      if (res.ok) {
        setWorksheetDoc(res.value)
        setSuccessNotice(
          `已成功由 buildWorksheet 組裝「${currentOption.title}」學習單（包含 ${res.value.pages[0]?.sections?.length || res.value.pages[0]?.blocks.length || 0} 個項目）！`
        )
        // 立即導航至 A4 預覽
        navigate('preview')
      } else {
        setBuildError(res.error.message)
      }
    } catch {
      setBuildError('建立學習單文件時發生非預期錯誤。')
    } finally {
      setIsBuilding(false)
    }
  }

  // 快速載入三上完整示範生字
  const handleLoadSampleData = () => {
    setAnalysisResult(structuredClone(defaultSampleAnalysis))
    setBuildError(null)
  }

  // 渲染卡片內線框縮圖
  const renderWireframe = (type: TemplateOption['wireframeType']) => {
    if (type === 'character-lookalike') {
      return (
        <div className="template-wireframe" aria-hidden="true" style={{ display: 'grid', gap: '4px' }}>
          {[['堅', '賢', '腎'], ['緊', '竪']].map((group) => (
            <div key={group.join('')} style={{ display: 'grid', gridTemplateColumns: `repeat(${group.length}, 1fr)`, gap: '3px' }}>
              {group.map((character) => (
                <div key={character} style={{ border: '1px solid #94a3b8', borderRadius: '3px', textAlign: 'center', padding: '3px', color: '#3730a3', fontWeight: 700 }}>
                  {character}
                </div>
              ))}
            </div>
          ))}
        </div>
      )
    }
    if (type === 'word-sentence-blank') {
      return (
        <div className="template-wireframe" aria-hidden="true">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '2px', marginBottom: '3px' }}>
            <div style={{ background: '#2563eb', height: '8px', borderRadius: '1px' }}></div>
            <div style={{ background: '#2563eb', height: '8px', borderRadius: '1px' }}></div>
            <div style={{ background: '#2563eb', height: '8px', borderRadius: '1px' }}></div>
            <div style={{ background: '#2563eb', height: '8px', borderRadius: '1px' }}></div>
            <div style={{ background: '#2563eb', height: '8px', borderRadius: '1px' }}></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px', marginBottom: '3px' }}>
            <div style={{ border: '1px dashed #94a3b8', height: '14px', borderRadius: '2px', padding: '1px' }}>
              <div style={{ background: '#cbd5e1', height: '3px', width: '70%', marginBottom: '2px' }}></div>
              <div style={{ background: '#e2e8f0', height: '3px', width: '40%' }}></div>
            </div>
            <div style={{ border: '1px dashed #94a3b8', height: '14px', borderRadius: '2px', padding: '1px' }}>
              <div style={{ background: '#cbd5e1', height: '3px', width: '70%', marginBottom: '2px' }}></div>
              <div style={{ background: '#e2e8f0', height: '3px', width: '40%' }}></div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="template-wireframe" aria-hidden="true">
        <div className="wireframe-header-line" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
          <span style={{ fontSize: '8px', color: '#64748b', fontWeight: 600 }}>第 1 題：【看】 部首：目 9畫</span>
        </div>
        <div className="wireframe-row" style={{ gap: '3px', marginBottom: '3px' }}>
          <div className="wireframe-box" style={{ borderColor: '#ef4444', color: '#b91c1c', fontWeight: 700, fontSize: '9px' }} title="示範格">看</div>
          <div className="wireframe-box" style={{ borderColor: '#cbd5e1', color: '#94a3b8', opacity: 0.5, fontSize: '9px' }} title="描字格">看</div>
          <div className="wireframe-box" style={{ borderColor: '#cbd5e1' }} title="習寫格 1"></div>
          <div className="wireframe-box" style={{ borderColor: '#cbd5e1' }} title="習寫格 2"></div>
          <div className="wireframe-box" style={{ borderColor: '#7030a0', borderWidth: '1.5px', color: '#7030a0', fontSize: '8px', fontWeight: 700 }} title="原稿紫色部首格">目</div>
        </div>
        <div className="wireframe-lines">
          <div className="wireframe-line-sm" style={{ width: '85%' }}></div>
        </div>
      </div>
    )
  }

  // 預覽使用的生字清單
  const activeCharacters = characters.length > 0 ? characters : defaultSampleAnalysis.characters
  const previewPage = previewDoc?.pages[0] || { pageNumber: 1, blocks: [], sections: [] }
  const previewFont = (selectedGrade ?? 3) <= 2 ? 'zihi-kai-zhuyin' : 'standard-kai'

  return (
    <div className="card">
      <div className="card-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="card-title">📋 步驟 5：選擇學習單範本與排版預覽</h1>
            <p className="card-subtitle">
              選擇 docx-templates 資料夾中可用的 Word 動態母版；點選即可即時預覽排版效果，完全在本機執行
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.8rem', padding: '0.25rem 0.65rem' }}
              onClick={handleLoadSampleData}
              title="載入包含完整造詞造句的示範生字（學、習、一）"
            >
              ✨ 立即載入完整示範生字
            </button>
            <div className="tag tag-info" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
              目前生字庫：{characters.length} 個字 ｜ 已上傳插圖：{uploadedImageCount} 張
            </div>
            {worksheetDoc && (
              <span className="tag tag-success" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
                ✓ 已組裝文件 ({worksheetDoc.template})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 空狀態警示與快速載入 */}
      {isEmpty && (
        <div className="callout callout-warning" role="region" aria-label="無生字提示">
          <div className="callout-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>⚠️ 目前尚未有查詢後的生字資料</span>
          </div>
          <p style={{ marginTop: '0.3rem' }}>
            依據系統規則，建立學習單至少需要 1 個生字。您可以返回輸入生字頁查詢，或直接點擊下方按鈕載入示範生字資料以進行範本排版測試。
          </p>
          <div className="btn-group" style={{ marginTop: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: '0.35rem 0.85rem', fontSize: '0.85rem' }}
              onClick={handleLoadSampleData}
            >
              ✨ 立即載入完整示範生字（學、習、一）
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.85rem', fontSize: '0.85rem' }}
              onClick={() => navigate('upload')}
            >
              ← 返回輸入生字
            </button>
          </div>
        </div>
      )}

      {/* 建立學習單錯誤警示 */}
      {buildError && (
        <div className="callout callout-warning" style={{ borderColor: 'var(--color-danger)', backgroundColor: 'var(--color-danger-light)', marginBottom: '1.25rem' }} role="alert">
          <div className="callout-title" style={{ color: 'var(--color-danger)' }}>
            ❌ 學習單建立失敗
          </div>
          <p style={{ color: '#7f1d1d', marginTop: '0.25rem' }}>{buildError}</p>
        </div>
      )}

      {/* 建立學習單成功提示 */}
      {successNotice && (
        <div
          className="callout"
          style={{
            borderColor: 'var(--color-success)',
            backgroundColor: 'var(--color-success-light)',
            color: '#065f46',
            marginBottom: '1.25rem',
          }}
          role="status"
          aria-live="polite"
        >
          ✅ {successNotice}
        </div>
      )}

      {/* 範本選擇卡片網格 */}
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>
          1. 選擇學習單範本：
        </h2>
      </div>

      <div className="template-grid" role="radiogroup" aria-label="學習單範本選項">
        {templateOptions.map((tpl) => {
          const isSelected = tpl.docxTemplateId
            ? tpl.docxTemplateId === selectedDocxTemplateId
            : selectedDocxTemplateId === null && tpl.id === selectedTemplate
          return (
            <div
              key={tpl.docxTemplateId ?? tpl.id}
              className={`template-card ${isSelected ? 'selected' : ''}`}
              onClick={() => {
                setSelectedTemplate(tpl.id)
                setSelectedDocxTemplateId(tpl.docxTemplateId ?? null)
                setBuildError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelectedTemplate(tpl.id)
                  setSelectedDocxTemplateId(tpl.docxTemplateId ?? null)
                  setBuildError(null)
                }
              }}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              aria-label={`學習單範本：${tpl.title}，${isSelected ? '已選取' : '點選套用'}`}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '2rem' }} aria-hidden="true">{tpl.icon}</span>
                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <span className="tag tag-info">{tpl.badge}</span>
                  </div>
                </div>

                <h3 style={{ fontSize: '1.15rem', marginTop: '0.65rem', marginBottom: '0.2rem', color: isSelected ? 'var(--color-primary-dark)' : 'inherit' }}>
                  {tpl.title}
                </h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: '0.35rem' }}>
                  {tpl.targetGrade}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>
                  {tpl.description}
                </p>

                {/* 模板線框圖示意 */}
                {renderWireframe(tpl.wireframeType)}

                <ul
                  style={{
                    paddingLeft: '1.15rem',
                    fontSize: '0.82rem',
                    color: 'var(--color-text-main)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem',
                    marginTop: '0.5rem',
                  }}
                >
                  {tpl.features.map((feat) => (
                    <li key={feat}>{feat}</li>
                  ))}
                </ul>
              </div>

              {/* 選取狀態指示按鈕 */}
              <div style={{ marginTop: '1rem', width: '100%', paddingTop: '0.6rem', borderTop: '1px solid var(--color-border)' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: isSelected ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
                  }}
                >
                  {isSelected ? '✓ 已選取此範本' : '⚪ 點擊選用'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {WORD_TEMPLATE_REGISTRY.length === 0 && (
        <div className="callout" role="status" style={{ marginTop: '1rem' }}>
          目前沒有可用的 Word 動態範本。請將至少一份 `.docx` 放入
          `src/assets/docx-templates/` 後重新建置。
        </div>
      )}

      {/* 2. 即時版面模擬預覽區塊：呼叫 buildWorksheet() 取得真實資料並以共用 WorksheetSheet 縮小渲染 */}
      <section
        style={{
          marginTop: '2rem',
          padding: '1.5rem',
          backgroundColor: '#f8fafc',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
        }}
        aria-label="選定模板即時版面預覽"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-main)', margin: 0 }}>
              📄 即時版面模擬預覽：【{currentOption.title}】
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.2rem', margin: 0 }}>
              以下為透過與步驟六完全相同之排版引擎渲染的 A4 縮小預覽；點擊「展開放大預覽」可檢視 100% 真實尺寸
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.8rem', fontSize: '0.85rem' }}
              onClick={() => setShowEnlargedPreview(true)}
              aria-label="展開放大預覽模擬版面"
            >
              🔍 展開放大預覽
            </button>
          </div>
        </div>

        {/* 縮小版即時模擬 A4 紙張 */}
        {(() => {
          const isLandscape = currentOption.id === 'word-sentence-blank'
          return (
            <div className="worksheet-scaled-viewport" style={{ maxHeight: '720px' }}>
              {isPreviewLoading && !previewDoc ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  <span className="spinner-sm" style={{ marginRight: '6px' }}></span>
                  正在組裝即時排版預覽...
                </div>
              ) : (
                <div
                  className="worksheet-scaled-stage"
                  style={{
                    width: isLandscape ? '617px' : '476px', // 297mm * 0.55 or 794px * 0.6
                    height: isLandscape ? '437px' : '674px', // 210mm * 0.55 or 1123px * 0.6
                    overflow: 'hidden',
                    borderRadius: '4px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  }}
                >
                  <div
                    style={{
                      transform: isLandscape ? 'scale(0.55)' : 'scale(0.6)',
                      transformOrigin: 'top left',
                      width: isLandscape ? '297mm' : '210mm',
                    }}
                  >
                    <WorksheetSheet
                      page={previewPage}
                      totalPages={previewDoc?.pages.length || 1}
                      template={currentOption.id}
                      title={previewDoc?.title || TEMPLATE_NAMES[currentOption.id]}
                      previewFont={previewFont}
                      characters={activeCharacters}
                      images={worksheetImages}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })()}
      </section>

      {/* 底部導引與建立學習單按鈕 */}
      <div className="btn-group" style={{ marginTop: '2.5rem', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate('images')}
          disabled={isBuilding}
        >
          ← 上一步：上傳配圖
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            style={{ padding: '0.75rem 1.8rem', fontSize: '1.05rem', fontWeight: 700 }}
            onClick={handleCreateWorksheet}
            disabled={isBuilding || isEmpty}
            aria-label={`套用「${currentOption.title}」並建立學習單`}
          >
            {isBuilding ? (
              <>
                <span className="spinner-sm" aria-hidden="true"></span>
                <span>正在組裝學習單資料 (buildWorksheet)...</span>
              </>
            ) : (
              `🚀 套用「${currentOption.title}」並建立學習單 →`
            )}
          </button>
        </div>
      </div>

      {/* 放大預覽 Modal Lightbox：使用共用 WorksheetSheet 渲染真實尺寸 A4 */}
      {showEnlargedPreview && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-tpl-title"
          onClick={() => setShowEnlargedPreview(false)}
        >
          <div
            className="modal-content"
            style={{ width: currentOption.id === 'word-sentence-blank' ? 'min(96vw, 1150px)' : 'min(94vw, 860px)' }}
            onClick={(e) => e.stopPropagation()}
            role="document"
          >
            <div className="modal-header">
              <h2 id="modal-tpl-title" className="modal-title">
                🔍 學習單版面放大預覽：{currentOption.title}
              </h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowEnlargedPreview(false)}
                aria-label="關閉放大預覽"
                title="關閉放大預覽 (Esc)"
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1rem', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '100%', maxWidth: currentOption.id === 'word-sentence-blank' ? '1122px' : '794px' }}>
                <WorksheetSheet
                  page={previewPage}
                  totalPages={previewDoc?.pages.length || 1}
                  template={currentOption.id}
                  title={previewDoc?.title || TEMPLATE_NAMES[currentOption.id]}
                  previewFont={previewFont}
                  characters={activeCharacters}
                  images={worksheetImages}
                />
              </div>
            </div>

            <div className="modal-footer">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <span className="tag tag-info">
                  {currentOption.targetGrade}
                </span>
                <span className="tag tag-success">
                  {currentOption.badge}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  A4 真實尺寸預覽檢視（按 Esc 鍵亦可關閉）
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEnlargedPreview(false)}
                >
                  關閉預覽
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setShowEnlargedPreview(false)
                    handleCreateWorksheet()
                  }}
                  disabled={isBuilding || isEmpty}
                >
                  🚀 套用此範本並建立學習單
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
