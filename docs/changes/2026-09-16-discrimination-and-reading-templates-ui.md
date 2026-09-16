## Handoff

- Owner: Antigravity
- Goal: 新增「字音字形辨析單」與「閱讀理解評量單」模板卡片、標籤推薦邏輯與 A4 預覽渲染排版。
- Changed files:
  - `src/features/templates/TemplateSelectionPage.tsx`
  - `src/features/preview/PrintPreviewPage.tsx`
  - `src/styles/app.css`
  - `docs/changes/2026-09-16-discrimination-and-reading-templates-ui.md`
- Contract adherence:
  - 完全遵循 Codex 於 `docs/changes/2026-09-16-local-discrimination-reading-templates.md` 定義的 `CharacterDiscriminationWorksheetSection` 與 `ReadingComprehensionWorksheetSection` 結構。
  - 形近字/多音字與短文/選擇題/問答題採取獨立條件渲染（無資料時完全不渲染 DOM，嚴禁使用 `display: none`）。
  - 空狀態判定嚴格限制僅在 Codex 回傳 `error.type === 'no-eligible-characters'` 時觸發，不自行根據長度推測。
- Verified:
  - `npm test`: 9 files, 58 tests passed (100%).
  - `npm run lint`: 0 errors, 0 warnings.
  - `npm run build`: Production bundle succeeded.
  - 自動化端對端瀏覽器驗證腳本：全 6 大模板、標楷體與芫荽注音切換、空狀態（no-eligible-characters）全數自動化截圖通過。
- Next owner action: 無，功能已完整交付。

### 實作重點摘要

1. **模板選擇頁擴充 (`TemplateSelectionPage.tsx`)**：
   - 增加 `character-discrimination`（字音字形辨析單）與 `reading-comprehension`（閱讀理解評量單）兩張模板卡片。
   - 繪製專屬微型線框圖（wireframeType: `'discrimination'` / `'reading'`）。
   - 擴充標籤推薦映射：勾選「字音字形」優先推薦 `character-discrimination`；勾選「閱讀理解」優先推薦 `reading-comprehension`。卡片呈現 `🎯 推薦` 標籤與高亮外框。
   - 放大預覽 Modal 支援兩新模板之即時排版模擬。
   - 標題工具列提供「⚡ 載入無辨析生字（測試空狀態）」按鈕，方便隨時測試空狀態防禦。

2. **A4 列印預覽頁排版 (`PrintPreviewPage.tsx`)**：
   - 實作 `renderCharacterDiscrimination`：
     - 生字標頭與注音（依年級切換標楷體／芫荽注音）。
     - 形近字比較區塊（`hasLookalikes &&` 渲染）。
     - 多音字辨析區塊（`hasMultiPron &&` 渲染）。
     - 書寫練習橫線區塊（`handwritingLineCount > 0 &&` 渲染）。
   - 實作 `renderReadingComprehension`：
     - 短文閱讀框（`passage !== null &&` 渲染）。
     - 詞語理解選擇題（`mcQuestions.length > 0 &&` 渲染，依序編號與呈現選項括號 `（　）`）。
     - 文意問答題（`openQuestions.length > 0 &&` 渲染，提供手寫答題橫線）。
   - 空狀態卡片：當 Codex 回傳 `no-eligible-characters` 時，呈現友善說明與引導按鈕，並停用列印與 PDF 按鈕。

3. **視覺樣式與列印優化 (`app.css`)**：
   - 定義 `.sheet-discrimination-card`、`.sheet-reading-card` 等卡片層次。
   - `@media print` 設置 `break-inside: avoid !important; page-break-inside: avoid !important;` 避免卡片跨頁被截斷。
