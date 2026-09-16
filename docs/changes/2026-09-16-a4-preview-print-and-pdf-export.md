# 變更記錄：A4 學習單預覽、列印專屬 CSS 與純前端瀏覽器端 PDF 匯出功能

**日期**：2026-09-16  
**負責 Agent**：antigravity  
**分支**：`antigravity/print-export`  
**關聯需求**：
1. 完成 A4 預覽頁：依 `buildWorksheet` 產出的 `WorksheetDoc`（包含多頁 `pages` 與 `sections`）渲染畫面。
2. 撰寫列印用 CSS（A4 尺寸 210mm x 297mm、邊界、分頁控制），確保瀏覽器列印功能正常。
3. 實作 PDF 匯出功能，要求：
   - 完全在瀏覽器端執行，不可呼叫任何外部 API 或雲端 PDF 服務，符合 `PROJECT.md` 的 BYOK、不經自有後端原則。
   - 使用標準 npm 套件（`jspdf`、`html2canvas`），安裝進 `package.json`，不引入需要伺服器端處理的工具。
4. 針對 desktop、tablet 與實際列印情境各測試一次。
5. 說明使用了哪個 PDF 套件、運作方式為何在瀏覽器端完成。

---

## 1. 實作項目與架構設計

### 1.1 套件安裝與管理（`package.json`）
- 安裝標準前端 PDF 生成與 DOM 繪製套件：
  - `jspdf`: `^4.2.1`（純 JavaScript 瀏覽器端 PDF 生成引擎）
  - `html2canvas`: `^1.4.1`（純 JavaScript 瀏覽器端 HTML/DOM 繪製成 Canvas 引擎）
- 完全安裝於本機依賴，未引入任何需要 node/後端 server 執行的 CLI 工具。

### 1.2 A4 紙張與列印專屬 CSS（`src/styles/app.css` & `index.html`）
- **A4 尺寸與版面規格**：
  - `@page { size: A4 portrait; margin: 0; }` 定義於 `index.html` 的 `<style>` 中，確保與各類 CSS minifier 相容。
  - `.a4-sheet` 設置為標準 A4 寬高：`width: 210mm; min-height: 297mm; max-height: 297mm; height: 297mm; padding: 16mm 18mm;`。
  - 邊距符合台灣國小學習單裝訂與列印邊距規範。
- **列印媒體查詢（`@media print`）**：
  - 色彩還原：強制啟用 `-webkit-print-color-adjust: exact; print-color-adjust: exact;`，確保田字格紅色示範格、淺灰格與底線如實列印。
  - 隱藏非列印 UI：將 `.app-header`、`.steps-nav`、`.no-print`、`.btn-group`、`.modal-overlay`、`.callout`、`.tag` 等介面元素在列印時隱藏（`display: none !important`）。
  - 分頁控制：
    - 多頁 `a4-sheet` 之間採用 `page-break-after: always; break-after: page;`。
    - 最後一張 `.a4-sheet:last-of-type` 設置 `page-break-after: avoid; break-after: avoid;`，防止多印一張空白頁。
    - 題目卡片（`.sheet-char-card, .sheet-word-card, .sheet-sentence-card, .sheet-char-row`）設定 `page-break-inside: avoid; break-inside: avoid;`，防止單一題目跨頁斷開。
- **平板自適應與響應式**：
  - `.a4-preview-container` 具備 `overflow-x: auto` 與 `-webkit-overflow-scrolling: touch`，在平板或手機螢幕上可水平捲動預覽，不破壞排版。
  - 控制按鈕群支援 flex-wrap 自動折行。
- **CSS 語法健全性修復**：
  - 補齊了 `.form-error` 遺漏的閉合大括號 `}`，確保後續的所有樣式與 `@media print` 均能被瀏覽器完整解析。

### 1.3 WorksheetDoc 多頁渲染（`src/features/preview/PrintPreviewPage.tsx`）
- 完整對接 `buildWorksheet` use case 產出的 `WorksheetDoc` 資料結構。
- 支援多頁模式（`pages.map(page => ...)`），每一頁均獨立渲染一個 `<article className="a4-sheet">`。
- 根據五大模板類型動態渲染專屬版面：
  1. `character-practice`：生字筆順、部首、筆畫、示範田字格、描紅格、習寫田字格、造詞參考。
  2. `word-practice`：詞語積木、詞語重組、擴展造詞造句。
  3. `sentence-practice`：句型仿寫、核心生字詞標記、引導例句。
  4. `picture-practice`：看圖識字、插圖展示、看圖造詞與造句。
  5. `mixed`：生字田字格 + 詞語 + 插圖 + 造句綜合評量。
- 頁尾標註：各頁底部獨立標註「國小 AI 學習單生成器（Local-First 免費教師版）· {模板名稱} ｜ 第 N 頁 / 共 M 頁」。

### 1.4 純前端瀏覽器端 PDF 匯出機制
- 點擊「📥 下載 PDF 學習單」時，在教師的本機瀏覽器內透過 JavaScript 執行：
  1. 動態 import `jspdf` 與 `html2canvas`。
  2. 依序將畫面上所有的 `.a4-sheet` 透過 `html2canvas`（`scale: 2` 高解析度）轉換為記憶體中的 HTML5 `<canvas>`。
  3. 透過 `canvas.toDataURL('image/jpeg', 0.95)` 取得影像資料。
  4. 由 `jsPDF` 於前端記憶體中組合 A4 直向 PDF 檔案結構。
  5. 呼叫 `pdf.save(...)` 產生本機 Blob 下載。
- **資料安全與隱私保證**：
  - 整個過程 100% 在瀏覽器端記憶體完成，完全不發送任何網路請求到外部雲端或伺服器。
  - 符合 `PROJECT.md` 之 Local-First、BYOK 與零後端傳輸原則。

---

## 2. 測試與驗證（Verification）

針對 3 種情境執行端對端自動化測試（測試腳本：`scratch/test_print_and_export.mjs`）：

1. **Desktop（1280 x 900）情境**：
   - A4 Sheet 寬高為標準 794px x 1123px（符合 96 DPI 下之 210mm x 297mm）。
   - 預覽標題、學生資訊列、田字格習寫區與頁尾頁碼皆完整渲染。
   - 點擊「📥 下載 PDF 學習單」成功觸發本機 canvas 繪製與 jsPDF 封裝，顯示「✅ 已成功於瀏覽器端生成「生字學習單.pdf」並開始下載！」成功通知。
   - 截圖存證：`preview_desktop.png`。
2. **Tablet（768 x 1024）情境**：
   - 測試平板解析度下的自適應佈局。
   - 控制列按鈕平順折行（4 個按鈕完整可視且易於點擊）。
   - `.a4-preview-container` 具備 `overflow-x: auto`，容器寬度 728px，支援平滑水平滑動查看完整 A4 邊緣，未出現橫向溢出跑版。
   - 截圖存證：`preview_tablet.png`。
3. **實際列印情境（Print Media Emulation & Page.printToPDF）**：
   - 模擬列印樣式時，網站標題列（`.app-header`）、步驟導航（`.steps-nav`）、操作卡片（`.no-print`）之 computed display 均為 `none`。
   - 紙張寬度為 `793.688px`（精確對應 210mm），陰影取消（`boxShadow: none`）。
   - 呼叫 `Page.printToPDF` 產出真實 PDF 二進位檔案（`scratch/actual_browser_printed.pdf`）。
   - 透過 `pdfjs-dist` 解析該真實 PDF 文本：完全不含任何按鈕文字或網站導覽列，內容 100% 純淨為學習單題目與學生填寫欄位，且單頁精準切齊無多餘空白頁。
   - 截圖存證：`preview_print_media.png`。

---

## 3. 代碼品質與建置檢查
- `npm run build`：0 errors，順利產出 Vite 生產環境 chunk。
- `npm run lint`：0 errors，0 warnings。

---

## Handoff
- Owner: Antigravity
- Goal: 完成 A4 學習單預覽、多頁 WorksheetDoc 渲染、列印專屬 CSS（A4 邊界與分頁控制）、純前端瀏覽器端 PDF 匯出功能。
- Changed files:
  - `package.json` / `package-lock.json`（引入 jspdf 與 html2canvas）
  - `index.html`（加入 @page 尺寸與邊距規則）
  - `src/styles/app.css`（修復 .form-error 大括號、新增 A4 與 @media print 樣式、平板 RWD）
  - `src/features/preview/PrintPreviewPage.tsx`（支援多頁渲染、五大模板、純前端 PDF 匯出、下載與列印）
  - `docs/changes/2026-09-16-a4-preview-print-and-pdf-export.md`（變更與測試記錄）
- Contract change: none（嚴格遵循 Codex 既有之 `WorksheetDoc`、`WorksheetPage`、`WorksheetSection` 與 `buildWorksheet` 契約）
- Verified: Desktop (1280x900)、Tablet (768x1024)、Print Media Emulation 與 CDP Page.printToPDF 實體 PDF 驗證皆通過
- Risks / open questions: none
- Next owner action: 可進行全流程整合測試或由教師體驗學習單輸出效果
