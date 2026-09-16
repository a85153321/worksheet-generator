import React from 'react'
import { parseZhuyin } from './zhuyin-parser'

export interface VerticalZhuyinProps {
  character?: string
  zhuyin: string
  size?: 'sm' | 'md' | 'lg' | 'tian'
  className?: string
  style?: React.CSSProperties
}

/**
 * 臺灣傳統直式注音元件
 * 國字在左，注音符號直式排列於國字右側：
 * - 一聲不標
 * - 二三四聲標在注音符號右側／右上方
 * - 輕聲點標在整組注音上方置中
 */
export const VerticalZhuyin: React.FC<VerticalZhuyinProps> = ({
  character,
  zhuyin,
  size = 'md',
  className = '',
  style,
}) => {
  const { symbols, tone, toneMark } = parseZhuyin(zhuyin)

  return (
    <span
      className={`zhuyin-wrapper zhuyin-size-${size} ${className}`}
      style={style}
      role="text"
      aria-label={character ? `${character}（${zhuyin}）` : zhuyin}
    >
      {character && <span className="zhuyin-base-char">{character}</span>}
      <span className="zhuyin-col-wrap">
        {tone === 5 && (
          <span className="zhuyin-light-dot" aria-hidden="true">
            ˙
          </span>
        )}
        <span className="zhuyin-symbols" aria-hidden="true">
          {symbols.map((sym, idx) => (
            <span key={idx} className="zhuyin-sym">
              {sym}
            </span>
          ))}
        </span>
        {tone >= 2 && tone <= 4 && (
          <span className={`zhuyin-side-tone tone-${tone}`} aria-hidden="true">
            {toneMark}
          </span>
        )}
      </span>
    </span>
  )
}

export interface TianzigeWithZhuyinProps {
  character: string
  zhuyin: string
  isDemonstration?: boolean
  isTracing?: boolean
  practiceNumber?: number
  className?: string
  showZhuyin?: boolean
}

/**
 * 生字示範田字格含右側直式注音欄
 */
export const TianzigeWithZhuyin: React.FC<TianzigeWithZhuyinProps> = ({
  character,
  zhuyin,
  isDemonstration = false,
  isTracing = false,
  practiceNumber,
  className = '',
  showZhuyin = true,
}) => {
  const hasZhuyinCol = isDemonstration && showZhuyin && Boolean(zhuyin && zhuyin.trim())
  const { symbols, tone, toneMark } = parseZhuyin(zhuyin)

  return (
    <div className={`tianzige-block-item ${className}`}>
      <div className={`tianzige-box-with-zhuyin ${!hasZhuyinCol ? 'no-zhuyin' : ''}`}>
        {/* 田字格主體 */}
        <div
          className={`sheet-tian-grid sm ${isDemonstration ? 'demo-box' : ''} ${isTracing ? 'tracing-box' : ''} ${!hasZhuyinCol ? 'no-zhuyin-col' : ''}`}
          aria-label={
            isDemonstration
              ? `示範字：${character}`
              : isTracing
                ? `描紅格：${character}`
                : `習寫格 ${practiceNumber ?? ''}`
          }
        >
          {isDemonstration || isTracing ? character : ''}
        </div>

        {/* 示範格右側附帶直式注音欄 */}
        {hasZhuyinCol && (
          <div className="sheet-tian-zhuyin-column" aria-label={`讀音：${zhuyin}`}>
            {tone === 5 && <span className="tian-zhuyin-light-dot">˙</span>}
            <div className="tian-zhuyin-symbols">
              {symbols.map((sym, idx) => (
                <span key={idx} className="tian-zhuyin-sym">
                  {sym}
                </span>
              ))}
            </div>
            {tone >= 2 && tone <= 4 && (
              <span className={`tian-zhuyin-side-tone tone-${tone}`}>
                {toneMark}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 底部標籤 */}
      <span className="tianzige-bottom-label">
        {isDemonstration ? '示範' : isTracing ? '描紅' : practiceNumber}
      </span>
    </div>
  )
}
