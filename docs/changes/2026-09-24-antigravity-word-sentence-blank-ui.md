# 語詞例句填空前端 UI 與即時預覽實作

## Handoff
- Owner: Antigravity
- Goal: 修復建置、完成語詞例句填空模板選擇映射、在 ReviewPage 提供教師指定 targetWord 填空題操作，並實作橫式雙欄 A4 即時預覽渲染與列印樣式。
- Changed files:
  - `src/components/worksheet/constants.ts`
  - `src/components/worksheet/WorksheetContentRenderer.tsx`
  - `src/components/worksheet/WorksheetSheet.tsx`
  - `src/features/templates/TemplateSelectionPage.tsx`
  - `src/features/review/ReviewPage.tsx`
  - `src/features/preview/PrintPreviewPage.tsx`
  - `src/styles/app.css`
  - `tests/worksheet-components.test.tsx`
  - `tests/word-sentence-blank-ui.test.tsx`
- Dictionary version: unchanged (`2014_20260626`)
- Contract change: none（嚴格遵守 Codex 既有 `WordSentenceBlankWorksheetSection`、`topItems`、`itemRows` 與 `AnalysisResult.characters[n].wordSentenceBlank` 資料契約）
- Verified:
  - `npm run lint` 通過（0 errors, 0 warnings）。
  - `npm run build` 通過（tsc -b 與 vite build 無型別錯誤）。
  - `npm test` 通過（14 個測試檔案、全數 71 案例通過）：
    - 包含既有 65 案例無任何 regression。
    - `tests/worksheet-components.test.tsx`：驗證 `word-sentence-blank` 的空狀態渲染、9 題雙頁分頁（第 1 頁 5 筆摘要 + 4 列 8 題、第 2 頁 1 題左欄 + 右欄空欄平衡），且無任何 `undefined`。
    - `tests/word-sentence-blank-ui.test.tsx`：驗證 ReviewPage 候選詞「設為填空」操作與挖空例句提示、TemplateSelectionPage 讀取「語詞例句填空學習單雙欄版.docx」對應至 `word-sentence-blank`、以及 9 題資料產出 Word .docx Blob 成功。
- Risks / open questions:
  - 當教師尚未在步驟 2 為任何生字點選「設為填空」時，預覽與步驟 5 縮小版均顯示友善黃色提示引導教師設定，不會破版或噴出空白表格。
  - 既有「範例生字」模板完全不受影響，資料結構保持相容。
- Next owner action:
  - 可進行端對端手動驗收（輸入生字 -> 步驟 2 點選「設為填空」 -> 步驟 5 選擇「語詞例句填空學習單雙欄版」 -> 步驟 6 檢視即時預覽與 Word 下載）。
