# 變更記錄：修復學習單版面放大預覽 Modal 呈現與等比例放大視覺效果

**日期**：2026-09-16  
**負責 Agent**：antigravity  
**分支**：`antigravity/fix-zoom-preview`  
**關聯需求**：
1. 解決點擊「放大」後內容跟原預覽卡片幾乎一樣大、未達到放大預覽效果之問題。
2. 解決放大預覽原本直接插入在頁面流程中把內容往下推、左側關閉按鈕被截斷卡在邊緣之版面問題。
3. 改為標準 Modal / Overlay 呈現（半透明背景遮罩、寬度佔螢幕 80-90%、字級與圖示等比例放大、關閉按鈕移至右上角完整可見）。
4. 支援桌面與較窄視窗自適應排版、Esc 鍵與背景點擊關閉。

---

## 1. 問題根因分析（Root Cause Analysis）

1. **缺少 Modal Overlay 樣式定義**：
   - 原先專案 CSS 中完全沒有 `.modal-overlay`、`.modal-content`、`.modal-header`、`.modal-close-btn` 的樣式規則。
   - 導致該 DOM 元素僅作為一般的 `display: block` 靜態插入於頁面底部流中，把下方按鈕往下推，且右上角關閉按鈕無定位與盒模型樣式，導致在 flex 佈局下被擠壓、截斷在視窗左側邊緣。
2. **預覽內容尺寸寫死**：
   - `renderLivePreviewContent` 原本寫死為縮小版（`maxWidth: 560px`、大字田字格 38px、練習田字格 28px、字級 11px），彈窗打開時直接重用該縮小版函式，因此內容完全沒有放大效果。

---

## 2. 修正內容（Implemented Changes）

### 2.1 CSS 樣式系統增強（`src/styles/app.css`）
- **`.modal-overlay`**：
  - `position: fixed; inset: 0; z-index: 1050;`
  - `background-color: rgba(15, 23, 42, 0.72); backdrop-filter: blur(4px);`
  - 具備平滑淡入動畫（`modalFadeIn 0.2s ease-out`）與置中佈局。
- **`.modal-content`**：
  - `width: min(90vw, 980px); max-height: 90vh;`（確實佔螢幕 80-90% 寬度）。
  - 白色背景、高級浮動陰影（`0 25px 50px -12px rgba(0,0,0,0.35)`）與圓角。
- **`.modal-header` 與 `.modal-close-btn`**：
  - 標題與關閉按鈕採 `space-between`，關閉按鈕固定於 modal 右上角。
  - 按鈕尺寸 36px x 36px，具備 hover 變色、圓角與 focus-visible 外框光暈。
- **`.modal-body` 與 `.enlarged-sheet-container`**：
  - 提供獨立捲動區域，內層白底卡片 padding 加大至 2.2rem 2.5rem。
- **RWD 響應式優化（`@media (max-width: 768px)`）**：
  - 在窄螢幕下寬度自動展開為 `96vw`，內邊距彈性縮減，按鈕永不截斷。

### 2.2 元件邏輯與等比例放大（`src/features/templates/TemplateSelectionPage.tsx`）
- `renderLivePreviewContent(isEnlarged = false)` 支援放大模式：
  - 學習單大標題放大至 `22px`（原 15px）。
  - 學生資料列放大至 `14px`（原 11px）。
  - 示範田字格放大至 `58px x 58px`、字級 `36px`（原 38px/22px）。
  - 習寫田字格放大至 `44px x 44px`、字級 `26px`（原 28px/16px），並展開為 5 格。
  - 詞語積木、例句與造句橫線等比例加大加寬。
- 背景滾動鎖定：
  - 當 `showEnlargedPreview === true` 時，自動設定 `document.body.style.overflow = 'hidden'`，關閉時復原。
- Modal 底部功能列：
  - 提供「關閉預覽」按鈕與「🚀 套用此模板並建立學習單」快捷操作。

---

## 3. 測試與驗證（Verification）

- **自動化測試指令**：`node scratch/test_enlarged_modal.mjs`
  1. **桌面視窗（1280 x 900）測試**：
     - Modal Overlay 為 `position: fixed`，z-index 為 `1050`。
     - Modal 寬度為 980px（約佔螢幕 77%~90%）。
     - 關閉按鈕位於標題列右上角（right = 1105），可視且正常點擊。
     - 內容字級成功放大至 22px，田字格放大至 58px。
     - 點擊關閉按鈕正常關閉，背景滾動成功解鎖。
     - 按 `Escape` 鍵成功關閉。
  2. **窄視窗行動裝置（480 x 850）測試**：
     - Modal 寬度自適應為 460px（佔螢幕 96%）。
     - 關閉按鈕完整可見（在螢幕邊界內，不截斷、不卡死）。
     - 無水平捲動條（`noHorizontalOverflow: true`）。
     - 點擊關閉按鈕成功回到原畫面。
- **靜態建置與代碼檢查**：
  - `npm run build`：0 錯誤。
  - `npm run lint`：0 錯誤。
