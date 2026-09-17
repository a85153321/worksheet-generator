# 全站文案改為「語詞」、限制候選數量（3 語詞 / 2 例句）與審核頁隨機抽選功能

## 變更摘要

1. **全站文案統一改為「語詞」**：
   - 搜尋全專案程式碼與樣式，徹底將所有「詞語」替換為「語詞」（如「詞語候選」改為「語詞候選」、「詞語積木擴展單」改為「語詞積木擴展單」、「【常用詞語造詞參考】」改為「【常用語詞造詞參考】」等）。
   - 包含模板識別標籤 `templateLabel`（`contracts.ts`）、模板組裝器 `worksheet-builder.ts`、Word 產生器 `docx-builder.ts`、導覽路徑說明 `routes.ts`、教材上傳頁 `UploadPage.tsx`、辭典查詢完成頁 `AnalyzingPage.tsx`、審核編輯頁 `ReviewPage.tsx`、模板選擇頁 `TemplateSelectionPage.tsx` 與預覽列印頁 `PrintPreviewPage.tsx`。

2. **限制候選數量顯示（最多 3 組語詞、2 組例句）**：
   - 審核編輯頁（步驟三）：生字卡片預設僅取前 3 個語詞候選、前 2 則例句候選呈現。
   - 學習單模板組裝器 (`worksheet-builder.ts`)：
     - `word-practice`（語詞積木擴展單）：每字取前 3 組語詞進行積木格排版。
     - `sentence-practice`（句型仿寫應用單）：每字取前 2 組例句進行仿寫橫線排版。
   - Word 檔匯出器 (`docx-builder.ts`)：
     - 生字田字格練習單：造詞參考取前 3 組語詞。
     - 語詞積木擴展單：取前 3 組語詞。
     - 句型仿寫應用單：取前 2 組例句。
   - A4 預覽與列印 (`PrintPreviewPage.tsx`)：同步取前 3 組語詞與前 2 組例句。

3. **審核編輯頁新增「隨機抽選」按鈕**：
   - 在生字卡片編輯表單與手動新增生字表單之「語詞候選」與「例句候選」欄位旁各配置「🎲 隨機抽選」按鈕。
   - 點擊語詞抽選：從本機辭典 `lookupCharacterFromDictionary(character)` 的完整候選詞庫中，隨機挑選未包含在目前欄位中的詞語，自動以頓號「、」銜接追加在末尾。
   - 點擊例句抽選：從完整候選句庫中隨機挑選未包含在目前欄位中的句子，以換行銜接追加在末尾。
   - 本機純前端即時運算，不發出任何網路請求；若所有候選皆已加入，即時提示「⚠️ 已無更多候選」，不重複加入已有項目。

## Handoff

- Owner: Antigravity
- Goal: 全站文案替換為「語詞」、限制候選數量（3 語詞 / 2 例句）、新增離線隨機抽選功能
- Changed files:
  - `src/services/contracts.ts`
  - `src/services/worksheet-builder.ts`
  - `src/services/docx-builder.ts`
  - `src/styles/app.css`
  - `src/app/routes.ts`
  - `src/features/upload/UploadPage.tsx`
  - `src/features/analyzing/AnalyzingPage.tsx`
  - `src/features/templates/TemplateSelectionPage.tsx`
  - `src/features/review/ReviewPage.tsx`
  - `src/features/preview/PrintPreviewPage.tsx`
- Dictionary version: unchanged (`dict_concised_2014_20260626`)
- Contract change: `WorksheetDoc['templateLabel']` 由 `'生字' | '詞語' | '句子' | '看圖'` 更新為 `'生字' | '語詞' | '句子' | '看圖'`
- Verified:
  - Vitest 測試套件 27/27 項通過（包含 `docx-builder`、`worksheet-builder`、`moe-dictionary`、`analysis-review`）
  - ESLint 與 TypeScript 編譯、Vite 生產構建皆 0 error
  - 透過 CDP 於 Microsoft Edge 完整驗證「輸入生字 → 辭典查詢 → 審核編輯頁（3語詞/2例句） → 隨機抽選追加與無候選提示 → 模板選擇（語詞積木擴展單） → A4 預覽（田字格、語詞積木、句型仿寫）」
- Risks / open questions: None
- Next owner action: 可進行後續功能交付與驗收
