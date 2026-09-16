import React, { useState, useEffect } from 'react'
import { useApp } from '../../app/index'
import { buildWorksheet, type WorksheetTemplate } from '../../services'
import type { CharacterAnalysis } from '../../domain'

interface TemplateOption {
  id: WorksheetTemplate
  title: string
  badge: string
  description: string
  targetGrade: string
  features: string[]
  icon: string
  wireframeType: 'character' | 'word' | 'sentence' | 'mixed'
}

const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    id: 'character-practice',
    title: '生字田字格練習單',
    badge: '低年級首選',
    targetGrade: '適合國小一至三年級',
    description: '標準田字格習寫、注音標註、筆畫部首與描紅空位',
    features: ['九宮／田字格標準格', '國字筆畫部首標示', '字音字形對照描紅'],
    icon: '🈴',
    wireframeType: 'character',
  },
  {
    id: 'word-practice',
    title: '詞語積木擴展單',
    badge: '中高年級',
    targetGrade: '適合國小三至五年級',
    description: '引導學生從單字擴展為詞語、多詞辨析與語意聯想',
    features: ['詞語擴詞積木格', '生字詞義填空連線', '多音字詞性辨析'],
    icon: '📚',
    wireframeType: 'word',
  },
  {
    id: 'sentence-practice',
    title: '句型仿寫應用單',
    badge: '語文表達',
    targetGrade: '適合國小三至六年級',
    description: '依據課文教學例句進行句子擴寫、短語仿寫與造句',
    features: ['情境教學例句解析', '引導式仿寫空白格', '教師批閱評分欄'],
    icon: '✏️',
    wireframeType: 'sentence',
  },
  {
    id: 'mixed',
    title: '生字語文綜合單',
    badge: '全方位評量',
    targetGrade: '全學段通用評量',
    description: '整合生字習寫、生詞造詞、情境造句與插畫圖文題',
    features: ['含教學插圖看圖寫字', '田字格與造詞造句', '課堂隨堂評量適用'],
    icon: '📑',
    wireframeType: 'mixed',
  },
]

export const TemplateSelectionPage: React.FC = () => {
  const {
    analysisResult,
    setAnalysisResult,
    selectedTemplate,
    setSelectedTemplate,
    worksheetDoc,
    setWorksheetDoc,
    generatedImages,
    navigate,
  } = useApp()

  const [isBuilding, setIsBuilding] = useState(false)
  const [buildError, setBuildError] = useState<string | null>(null)
  const [successNotice, setSuccessNotice] = useState<string | null>(null)
  const [showEnlargedPreview, setShowEnlargedPreview] = useState(false)

  const characters: CharacterAnalysis[] = analysisResult?.characters || []
  const isEmpty = characters.length === 0
  const currentOption = TEMPLATE_OPTIONS.find((t) => t.id === selectedTemplate) || TEMPLATE_OPTIONS[0]
  const generatedCount = Object.keys(generatedImages).length

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

  // 串接 buildWorksheet use case (Requirement 2)
  const handleCreateWorksheet = async () => {
    if (!analysisResult || analysisResult.characters.length === 0) {
      setBuildError('目前沒有可用的生字分析結果，請先載入示範生字或返回教材上傳。')
      return
    }

    setIsBuilding(true)
    setBuildError(null)
    setSuccessNotice(null)

    try {
      const imageList = Object.values(generatedImages)
      const res = await buildWorksheet(analysisResult, selectedTemplate, { images: imageList })
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

  // 快速載入三上示範生字（供測試與無生字時快速恢復體驗）
  const handleLoadSampleData = () => {
    setAnalysisResult({
      characters: [
        {
          character: '學',
          zhuyin: 'ㄒㄩㄝˊ',
          radical: '子',
          strokeCount: 16,
          words: ['學校', '學習', '學生'],
          exampleSentences: ['我每天到學校學習新知識。'],
          confidence: 0.96,
          source: { page: 1, block: '第一段' },
          imageSuggestion: {
            prompt: '小學生在明亮的教室裡專心學習，兒童教材插畫風格',
            rationale: '用熟悉的校園情境幫助理解「學」。',
            selected: true,
          },
          editableState: {
            status: 'confirmed',
            isEditable: true,
            needsReview: false,
          },
        },
        {
          character: '習',
          zhuyin: 'ㄒㄧˊ',
          radical: '羽',
          strokeCount: 11,
          words: ['學習', '練習', '習慣'],
          exampleSentences: ['多練習可以讓生字寫得更漂亮。'],
          confidence: 0.88,
          source: { page: 1, block: '第一段' },
          imageSuggestion: {
            prompt: '小朋友手握鉛筆在作業本上認真習字練習，特寫溫馨插畫',
            rationale: '對應習字、練習的生活經驗。',
            selected: true,
          },
          editableState: {
            status: 'confirmed',
            isEditable: true,
            needsReview: false,
          },
        },
      ],
    })
    setBuildError(null)
  }

  // 渲染卡片內線框縮圖 (Wireframe Mini Illustration)
  const renderWireframe = (type: TemplateOption['wireframeType']) => {
    switch (type) {
      case 'character':
        return (
          <div className="template-wireframe" aria-hidden="true">
            <div className="wireframe-header-line"></div>
            <div className="wireframe-row">
              <div className="wireframe-box" style={{ fontWeight: 700 }}>字</div>
              <div className="wireframe-box" style={{ opacity: 0.35 }}>字</div>
              <div className="wireframe-box"></div>
              <div className="wireframe-box"></div>
              <div className="wireframe-lines">
                <div className="wireframe-line-sm" style={{ width: '80%' }}></div>
                <div className="wireframe-line-sm" style={{ width: '50%' }}></div>
              </div>
            </div>
            <div className="wireframe-row">
              <div className="wireframe-box" style={{ fontWeight: 700 }}>生</div>
              <div className="wireframe-box" style={{ opacity: 0.35 }}>生</div>
              <div className="wireframe-box"></div>
              <div className="wireframe-box"></div>
              <div className="wireframe-lines">
                <div className="wireframe-line-sm" style={{ width: '70%' }}></div>
                <div className="wireframe-line-sm" style={{ width: '40%' }}></div>
              </div>
            </div>
          </div>
        )
      case 'word':
        return (
          <div className="template-wireframe" aria-hidden="true">
            <div className="wireframe-header-line"></div>
            <div className="wireframe-row">
              <div className="wireframe-box" style={{ fontWeight: 700 }}>字</div>
              <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                <div style={{ height: '20px', border: '1px solid #94a3b8', borderRadius: '2px', padding: '0 4px', fontSize: '9px', display: 'flex', alignItems: 'center' }}>[詞語一]</div>
                <div style={{ height: '20px', border: '1px dashed #cbd5e1', borderRadius: '2px', padding: '0 4px', fontSize: '9px', display: 'flex', alignItems: 'center' }}>[填空]</div>
              </div>
            </div>
            <div className="wireframe-row">
              <div className="wireframe-box" style={{ fontWeight: 700 }}>詞</div>
              <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                <div style={{ height: '20px', border: '1px solid #94a3b8', borderRadius: '2px', padding: '0 4px', fontSize: '9px', display: 'flex', alignItems: 'center' }}>[詞語二]</div>
                <div style={{ height: '20px', border: '1px dashed #cbd5e1', borderRadius: '2px', padding: '0 4px', fontSize: '9px', display: 'flex', alignItems: 'center' }}>[填空]</div>
              </div>
            </div>
          </div>
        )
      case 'sentence':
        return (
          <div className="template-wireframe" aria-hidden="true">
            <div className="wireframe-header-line"></div>
            <div className="wireframe-row">
              <div className="wireframe-box" style={{ fontWeight: 700 }}>句</div>
              <div className="wireframe-lines">
                <div className="wireframe-line-sm" style={{ backgroundColor: '#94a3b8' }}></div>
                <div className="wireframe-line-sm" style={{ borderBottom: '1px dashed #94a3b8', height: '1px', backgroundColor: 'transparent' }}></div>
              </div>
            </div>
            <div className="wireframe-row">
              <div className="wireframe-box" style={{ fontWeight: 700 }}>仿</div>
              <div className="wireframe-lines">
                <div className="wireframe-line-sm" style={{ backgroundColor: '#94a3b8' }}></div>
                <div className="wireframe-line-sm" style={{ borderBottom: '1px dashed #94a3b8', height: '1px', backgroundColor: 'transparent' }}></div>
              </div>
            </div>
          </div>
        )
      case 'mixed':
        return (
          <div className="template-wireframe" aria-hidden="true">
            <div className="wireframe-header-line"></div>
            <div className="wireframe-row">
              <div style={{ width: '28px', height: '22px', border: '1px solid #cbd5e1', backgroundColor: '#e2e8f0', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px' }}>🖼️</div>
              <div className="wireframe-box" style={{ fontWeight: 700 }}>學</div>
              <div className="wireframe-lines">
                <div className="wireframe-line-sm" style={{ width: '90%' }}></div>
                <div className="wireframe-line-sm" style={{ width: '60%' }}></div>
              </div>
            </div>
            <div className="wireframe-row">
              <div style={{ width: '28px', height: '22px', border: '1px solid #cbd5e1', backgroundColor: '#e2e8f0', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px' }}>🖼️</div>
              <div className="wireframe-box" style={{ fontWeight: 700 }}>習</div>
              <div className="wireframe-lines">
                <div className="wireframe-line-sm" style={{ width: '85%' }}></div>
                <div className="wireframe-line-sm" style={{ width: '50%' }}></div>
              </div>
            </div>
          </div>
        )
    }
  }

  // 渲染選中模板的即時排版結構預覽 (Requirement 1: 教師可預覽學習單模板)
  const renderLivePreviewContent = (isEnlarged = false) => {
    const previewChars = characters.length > 0
      ? characters
      : [
          {
            character: '學',
            zhuyin: 'ㄒㄩㄝˊ',
            words: ['學校', '學習', '學生'],
            exampleSentences: ['我每天到學校學習新知識。'],
          },
          {
            character: '習',
            zhuyin: 'ㄒㄧˊ',
            words: ['學習', '練習', '習慣'],
            exampleSentences: ['多練習可以讓生字寫得更漂亮。'],
          },
        ]

    return (
      <div
        className={isEnlarged ? 'enlarged-sheet-container' : undefined}
        style={
          isEnlarged
            ? {
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                padding: '2rem 2.2rem',
                width: '100%',
                boxSizing: 'border-box',
                fontSize: '15px',
                color: '#1e293b',
              }
            : {
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                padding: '1.25rem 1.5rem',
                maxWidth: '560px',
                margin: '0 auto',
                fontSize: '13px',
                color: '#1e293b',
              }
        }
      >
        {/* 紙頭區域 */}
        <div
          style={{
            borderBottom: isEnlarged ? '3px solid #000000' : '2px solid #000000',
            paddingBottom: isEnlarged ? '10px' : '6px',
            marginBottom: isEnlarged ? '16px' : '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h4
              style={{
                margin: 0,
                fontSize: isEnlarged ? '22px' : '15px',
                fontWeight: 700,
                color: '#000000',
              }}
            >
              國小國語單元評量學習單
            </h4>
            <span style={{ fontSize: isEnlarged ? '13px' : '11px', color: '#64748b' }}>
              版型：{currentOption.title}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: isEnlarged ? '10px' : '6px',
              fontSize: isEnlarged ? '14px' : '11px',
              color: '#475569',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <span>____年____班</span>
            <span>座號：____</span>
            <span>姓名：____________</span>
            <span>得分：______</span>
          </div>
        </div>

        {/* 依模板樣式呈現排版模擬 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: isEnlarged ? '16px' : '10px' }}>
          {previewChars.slice(0, 2).map((item, idx) => {
            const img = generatedImages[item.character]

            return (
              <div
                key={`${item.character}-${idx}`}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: isEnlarged ? '8px' : '4px',
                  padding: isEnlarged ? '14px 18px' : '8px 10px',
                  display: 'flex',
                  gap: isEnlarged ? '20px' : '12px',
                  alignItems: 'center',
                  backgroundColor: '#fafafa',
                  flexWrap: 'wrap',
                }}
              >
                {/* 綜合模板特有：插圖預覽 */}
                {selectedTemplate === 'mixed' && (
                  <div
                    style={{
                      width: isEnlarged ? '110px' : '64px',
                      height: isEnlarged ? '80px' : '46px',
                      border: '1px dashed #94a3b8',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#ffffff',
                      flexShrink: 0,
                    }}
                  >
                    {img ? (
                      <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: isEnlarged ? '28px' : '18px' }} aria-hidden="true">🖼️</span>
                    )}
                  </div>
                )}

                {/* 生字田字格 */}
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: isEnlarged ? '14px' : '11px', color: '#64748b' }}>{item.zhuyin}</div>
                  <div
                    style={{
                      width: isEnlarged ? '58px' : '38px',
                      height: isEnlarged ? '58px' : '38px',
                      border: isEnlarged ? '2px solid #ef4444' : '1px solid #ef4444',
                      color: '#b91c1c',
                      fontSize: isEnlarged ? '36px' : '22px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: "'DFKai-SB', 'BiauKai', 'KaiTi', serif",
                      backgroundColor: '#fff',
                      borderRadius: '3px',
                    }}
                  >
                    {item.character}
                  </div>
                </div>

                {/* 模板特有內容區 */}
                <div style={{ flex: 1, minWidth: '220px' }}>
                  {selectedTemplate === 'character-practice' && (
                    <div>
                      <div style={{ display: 'flex', gap: isEnlarged ? '8px' : '4px', marginBottom: isEnlarged ? '8px' : '4px', flexWrap: 'wrap' }}>
                        <div
                          style={{
                            width: isEnlarged ? '44px' : '28px',
                            height: isEnlarged ? '44px' : '28px',
                            border: '1px dashed #ef4444',
                            opacity: 0.35,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: isEnlarged ? '26px' : '16px',
                            color: '#b91c1c',
                            fontFamily: "'DFKai-SB', 'BiauKai', 'KaiTi', serif",
                          }}
                        >
                          {item.character}
                        </div>
                        <div style={{ width: isEnlarged ? '44px' : '28px', height: isEnlarged ? '44px' : '28px', border: '1px dashed #ef4444', backgroundColor: '#fff' }}></div>
                        <div style={{ width: isEnlarged ? '44px' : '28px', height: isEnlarged ? '44px' : '28px', border: '1px dashed #ef4444', backgroundColor: '#fff' }}></div>
                        {isEnlarged && (
                          <>
                            <div style={{ width: '44px', height: '44px', border: '1px dashed #ef4444', backgroundColor: '#fff' }}></div>
                            <div style={{ width: '44px', height: '44px', border: '1px dashed #ef4444', backgroundColor: '#fff' }}></div>
                          </>
                        )}
                      </div>
                      <div style={{ fontSize: isEnlarged ? '14px' : '11px', color: '#475569' }}>
                        生詞造詞：{item.words?.slice(0, 3).join('、') || '______、______'}
                      </div>
                    </div>
                  )}

                  {selectedTemplate === 'word-practice' && (
                    <div>
                      <div style={{ fontSize: isEnlarged ? '14px' : '11px', fontWeight: 600, color: '#334155' }}>【詞語積木延伸】</div>
                      <div style={{ display: 'flex', gap: isEnlarged ? '10px' : '6px', marginTop: isEnlarged ? '6px' : '3px', flexWrap: 'wrap' }}>
                        <span style={{ border: '1px solid #cbd5e1', padding: isEnlarged ? '4px 12px' : '1px 6px', borderRadius: '3px', backgroundColor: '#fff', fontSize: isEnlarged ? '14px' : '11px', fontWeight: 600 }}>
                          {item.words?.[0] || '詞語一'}
                        </span>
                        <span style={{ border: '1px dashed #94a3b8', padding: isEnlarged ? '4px 12px' : '1px 6px', borderRadius: '3px', backgroundColor: '#fff', fontSize: isEnlarged ? '14px' : '11px', color: '#94a3b8' }}>
                          [ 造詞填空：__________________ ]
                        </span>
                      </div>
                    </div>
                  )}

                  {selectedTemplate === 'sentence-practice' && (
                    <div>
                      <div
                        style={{
                          fontSize: isEnlarged ? '14px' : '11px',
                          color: '#0369a1',
                          backgroundColor: isEnlarged ? '#f0f9ff' : 'transparent',
                          padding: isEnlarged ? '6px 10px' : '0',
                          borderRadius: '4px',
                        }}
                      >
                        <strong>例：</strong>{item.exampleSentences?.[0] || '我在學校快樂地學習國語。'}
                      </div>
                      <div
                        style={{
                          borderBottom: '1px dashed #94a3b8',
                          height: isEnlarged ? '22px' : '14px',
                          marginTop: isEnlarged ? '6px' : '2px',
                        }}
                      ></div>
                    </div>
                  )}

                  {selectedTemplate === 'mixed' && (
                    <div>
                      <div style={{ fontSize: isEnlarged ? '14px' : '11px', color: '#334155' }}>
                        <strong>造詞：</strong>{item.words?.slice(0, 3).join('、')}
                      </div>
                      <div style={{ fontSize: isEnlarged ? '14px' : '11px', color: '#64748b', marginTop: isEnlarged ? '6px' : '2px' }}>
                        <strong>造句：</strong>{item.exampleSentences?.[0] || '請用生詞練習造句。'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* 頁面註腳 */}
        <div
          style={{
            textAlign: 'center',
            marginTop: isEnlarged ? '18px' : '12px',
            fontSize: isEnlarged ? '13px' : '10px',
            color: '#94a3b8',
            borderTop: '1px solid #f1f5f9',
            paddingTop: isEnlarged ? '8px' : '6px',
          }}
        >
          第 1 頁 ／ 共 1 頁（A4 格式）
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="card-title">📋 步驟 5：選擇學習單版型與排版預覽</h1>
            <p className="card-subtitle">
              根據教學目的挑選適合的學習單模板；點選即可切換版面結構並即時預覽，本步驟不消耗任何 AI Quota
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="tag tag-info" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
              目前生字庫：{characters.length} 個字 ｜ 已生成插圖：{generatedCount} 張
            </div>
            {worksheetDoc && (
              <span className="tag tag-success" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
                ✓ 已組裝文件 ({worksheetDoc.template})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 空狀態警示與快速載入 (Requirement 2 & 韌性) */}
      {isEmpty && (
        <div className="callout callout-warning" role="region" aria-label="無生字提示">
          <div className="callout-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>⚠️ 目前尚未有分析後的生字資料</span>
          </div>
          <p style={{ marginTop: '0.3rem' }}>
            依據系統規則，建立學習單至少需要 1 個生字。您可以返回教材上傳選頁分析，或直接點擊下方按鈕載入三上國語示範生字資料以進行模板排版測試。
          </p>
          <div className="btn-group" style={{ marginTop: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: '0.35rem 0.85rem', fontSize: '0.85rem' }}
              onClick={handleLoadSampleData}
            >
              ✨ 立即載入三上示範生字（學、習）
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.85rem', fontSize: '0.85rem' }}
              onClick={() => navigate('upload')}
            >
              ← 返回教材上傳選頁
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

      {/* 模板選擇卡片網格 (Requirement 1: 預覽並選擇一種學習單模板) */}
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>
          1. 選擇學習單版型：
        </h2>
      </div>

      <div className="template-grid" role="radiogroup" aria-label="學習單模板選項">
        {TEMPLATE_OPTIONS.map((tpl) => {
          const isSelected = selectedTemplate === tpl.id

          return (
            <div
              key={tpl.id}
              className={`template-card ${isSelected ? 'selected' : ''}`}
              onClick={() => {
                setSelectedTemplate(tpl.id)
                setBuildError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelectedTemplate(tpl.id)
                  setBuildError(null)
                }
              }}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              aria-label={`學習單模板：${tpl.title}，${isSelected ? '已選取' : '點選套用'}`}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <span style={{ fontSize: '2rem' }} aria-hidden="true">{tpl.icon}</span>
                  <span className="tag tag-info">{tpl.badge}</span>
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

                {/* 模板線框圖示意 (Requirement 1: 預覽模板) */}
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
                  {isSelected ? '✓ 已選取此模板' : '⚪ 點擊選用'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* 2. 即時版面模擬預覽區塊 (Requirement 1: 預覽建議版面與結構) */}
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
              以下為帶入當前教材資料後的 A4 縮小排版模擬；正式排版列印請進入下一步驟
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
        {renderLivePreviewContent()}
      </section>

      {/* 底部導引與建立學習單按鈕 (Requirement 2: 串接 buildWorksheet use case) */}
      <div className="btn-group" style={{ marginTop: '2.5rem', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate('images')}
          disabled={isBuilding}
        >
          ← 上一步：配圖選擇
        </button>

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

      {/* 放大預覽 Modal Lightbox (Requirement 1: 預覽模板) */}
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

            <div className="modal-body">
              {renderLivePreviewContent(true)}
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
                  A4 等比例放大模擬檢視（按 Esc 鍵亦可關閉）
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
                  🚀 套用此模板並建立學習單
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

