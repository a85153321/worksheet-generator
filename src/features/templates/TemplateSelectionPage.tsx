import React, { useState } from 'react'
import { useApp } from '../../app/index'
import { buildWorksheet, type WorksheetTemplate } from '../../services'

interface TemplateOption {
  id: WorksheetTemplate
  title: string
  badge: string
  description: string
  features: string[]
  icon: string
}

const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    id: 'character-practice',
    title: '生字田字格練習單',
    badge: '低年級首選',
    description: '標準田字格習寫、注音標註、筆畫部首與描紅空位',
    features: ['九宮／田字格標準格', '國字筆畫部首標示', '字音字形對照'],
    icon: '🈴',
  },
  {
    id: 'word-practice',
    title: '詞語積木擴展單',
    badge: '中高年級',
    description: '引導學生從單字擴展為詞語、多詞辨析與語意聯想',
    features: ['詞語擴詞連線', '生字詞義填空', '多音字辨析'],
    icon: '📚',
  },
  {
    id: 'sentence-practice',
    title: '句型仿寫應用單',
    badge: '語文表達',
    description: '依據課文教學例句進行句子擴寫、短語仿寫與造句',
    features: ['情境例句解析', '引導式仿寫空白格', '教師評分標籤'],
    icon: '✏️',
  },
  {
    id: 'mixed',
    title: '生字語文綜合單',
    badge: '全方位評量',
    description: '整合生字習寫、生詞造詞、情境造句與插畫圖文題',
    features: ['含插圖看圖寫字', '田字格與造詞造句', '課堂隨堂評量適用'],
    icon: '📑',
  },
]

export const TemplateSelectionPage: React.FC = () => {
  const { analysisResult, selectedTemplate, setSelectedTemplate, setWorksheetDoc, navigate } =
    useApp()
  const [isBuilding, setIsBuilding] = useState(false)
  const [buildError, setBuildError] = useState<string | null>(null)

  const handleCreateWorksheet = async () => {
    if (!analysisResult || analysisResult.characters.length === 0) {
      setBuildError('目前沒有可用的生字分析結果，請先返回上傳或審核。')
      return
    }

    setIsBuilding(true)
    setBuildError(null)

    try {
      const res = await buildWorksheet(analysisResult, selectedTemplate)
      if (res.ok) {
        setWorksheetDoc(res.value)
        navigate('preview')
      } else {
        setBuildError(res.error.message)
      }
    } catch {
      setBuildError('建立學習單文件時發生錯誤。')
    } finally {
      setIsBuilding(false)
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h1 className="card-title">📋 步驟 5：選擇學習單版型</h1>
        <p className="card-subtitle">
          根據年級與教學目的挑選適合的版面結構，系統將自動套用本機排版引擎
        </p>
      </div>

      <div className="template-grid" role="radiogroup" aria-label="學習單模板選項">
        {TEMPLATE_OPTIONS.map((tpl) => {
          const isSelected = selectedTemplate === tpl.id
          return (
            <div
              key={tpl.id}
              className={`template-card ${isSelected ? 'selected' : ''}`}
              onClick={() => setSelectedTemplate(tpl.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelectedTemplate(tpl.id)
                }
              }}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  width: '100%',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '2rem' }} aria-hidden="true">
                  {tpl.icon}
                </span>
                <span className="tag tag-info">{tpl.badge}</span>
              </div>

              <h3 style={{ fontSize: '1.15rem', marginTop: '0.65rem', marginBottom: '0.25rem' }}>
                {tpl.title}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                {tpl.description}
              </p>

              <ul
                style={{
                  paddingLeft: '1.15rem',
                  fontSize: '0.82rem',
                  color: 'var(--color-text-main)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                }}
              >
                {tpl.features.map((feat) => (
                  <li key={feat}>{feat}</li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      {buildError && (
        <div className="callout callout-warning" style={{ marginTop: '1.25rem' }} role="alert">
          {buildError}
        </div>
      )}

      <div className="btn-group" style={{ marginTop: '2.5rem', justifyContent: 'space-between' }}>
        <button type="button" className="btn btn-secondary" onClick={() => navigate('images')}>
          ← 上一步：配圖選擇
        </button>
        <button
          type="button"
          className="btn btn-primary"
          style={{ padding: '0.65rem 1.6rem', fontSize: '1rem' }}
          onClick={handleCreateWorksheet}
          disabled={isBuilding}
        >
          {isBuilding ? '排版中...' : '生成學習單並前往 A4 預覽 →'}
        </button>
      </div>
    </div>
  )
}
