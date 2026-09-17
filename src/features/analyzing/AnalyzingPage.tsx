import React from 'react'
import { useApp } from '../../app/index'

export const AnalyzingPage: React.FC = () => {
  const { analysisError, analysisResult, navigate, runTypedAnalysis, typedCharacters } = useApp()

  if (analysisError) {
    return (
      <div className="card">
        <div className="callout callout-warning" role="alert">
          <div className="callout-title">{analysisError.message}</div>
          {analysisError.type === 'dictionary-not-found' && (
            <p>查無此字：{analysisError.missingCharacters.join('、')}</p>
          )}
        </div>
        <div className="btn-group">
          <button className="btn btn-secondary" onClick={() => navigate('upload')}>返回修改輸入</button>
          <button className="btn btn-primary" onClick={() => runTypedAnalysis(typedCharacters)}>重新查詢</button>
        </div>
      </div>
    )
  }

  if (!analysisResult) {
    return (
      <div className="card empty-state">
        <h2 className="empty-state-title">尚未查詢生字</h2>
        <button className="btn btn-primary" onClick={() => navigate('upload')}>前往輸入生字</button>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header" style={{ textAlign: 'center' }}>
        <h1 className="card-title" style={{ justifyContent: 'center' }}>本機辭典查詢完成</h1>
        <p className="card-subtitle">
          已從教育部《國語辭典簡編本》查得 {analysisResult.characters.length} 個生字的注音、部首、筆畫、詞語與例句候選。
        </p>
      </div>
      <div className="btn-group" style={{ justifyContent: 'center' }}>
        <button className="btn btn-secondary" onClick={() => navigate('upload')}>返回修改輸入</button>
        <button className="btn btn-primary" onClick={() => navigate('review')}>前往審核與編輯 →</button>
      </div>
    </div>
  )
}
