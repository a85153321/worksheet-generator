# 變更記錄：語詞例句填空 UI 重構、候選手風琴填空整合、預覽提示與 PDF/列印移除

- **日期**：2026-09-24
- **分支**：`antigracity/語詞填空模板UIFIX`
- **負責 Agent**：Antigravity

---

## 1. 變更背景與目標

本輪工作依據使用者指示，針對回報的 4 個核心問題以及 2 項追加需求進行徹底重構與修復：
1. **辭典釋義彈窗過寬（問題一）**：步驟 6 使用了未定義的 `.modal-dialog` 導致寬度無約束。抽取共用元件 `WordDefinitionModal`，統一套用 `.modal-card`（`max-width: 500px`），消除雙重重複實作。
2. **生字摘要列裁切防護（問題二 & 問題三）**：
   - 在 `WorksheetContentRenderer` 渲染端與 `reference-template-docx.ts` DOCX 資料組裝端，雙重保證 `topItems` 一律由 `WORD_SENTENCE_BLANK_TOP_ITEM_LIMIT = 5` 強制切齊，防止任何情境下（如 15 題）被全量 `items` 擠爆。
   - 在 `TemplateSelectionPage` 清楚區分 `語詞例句填空學習單-單欄版.docx`（直式單欄草稿）與 `語詞例句填空學習單-雙欄版.docx`（橫式雙欄正式母版）。
3. **「設為填空」操作移至步驟 6 候選手風琴（問題四）**：
   - 步驟 3（`ReviewPage`）徹底移除填空設定按鈕、提示文字與相關狀態，回歸純粹的音義審查與辭典查詢。
   - 步驟 6（`PrintPreviewPage`）在展開的候選手風琴中，每個語詞候選均提供「設為填空」與「✓ 已設為填空」切換按鈕，下方即時顯示填空題與挖空例句預覽。
   - 資料流 100% 沿用既有契約 `resolveOwnSentencesForWord(lookup, word)` 與 `createSentenceBlank`，透過 `setAnalysisResult` 回寫並觸發 `worksheetDoc` 即時自動重建。
4. **追加需求一：預覽畫面提示**：
   - 在 `PrintPreviewPage` 的 A4 預覽區塊上方，加入明顯置中的提示文字：
     > 「📌 此為預覽畫面，實際版面請以下載的 Word 文件為準」
5. **追加需求二：徹底移除 PDF 下載與列印功能**：
   - 移除步驟 6 的「下載 PDF 學習單」與「瀏覽器列印」按鈕、`handleExportPdf`、`handlePrint` 與動態 landscape `@page` 樣式。
   - 保留「📝 下載 Word 檔 (.docx)」作為唯一下載管道。
   - 同步更新 `PROJECT.md` 說明與相關測試案例。

---

## 2. 變更檔案清單

- `src/components/dictionary/WordDefinitionModal.tsx`（新增：共用辭典釋義彈窗元件）
- `src/features/review/ReviewPage.tsx`（移除 targetWord UI、state 與死碼，改用 `WordDefinitionModal`）
- `src/features/preview/PrintPreviewPage.tsx`（整合候選手風琴「設為填空」、移除 PDF/列印、加入「僅供參考」提示、改用 `WordDefinitionModal`）
- `src/features/templates/TemplateSelectionPage.tsx`（區分單欄草稿版與雙欄正式版之 badge 與描述）
- `src/components/worksheet/WorksheetContentRenderer.tsx`（更新空狀態引導文案，`topItems` 強制 `slice(0, 5)`）
- `src/services/reference-template-docx.ts`（以 `WORD_SENTENCE_BLANK_TOP_ITEM_LIMIT` 限制 `topItems`）
- `tests/reference-template-docx.test.ts`（更新雙欄版範本路徑與舊草稿中繼資料豁免）
- `tests/word-sentence-blank-ui.test.tsx`（更新測試：驗證 ReviewPage 無殘留填空設定、PrintPreviewPage 提示存在且無 PDF/列印按鈕、9 題雙欄版 Word 匯出）
- `.tmp/template-rebuild/generate-validation.test.ts`（更新雙欄版範本路徑）
- `PROJECT.md`（更新產品描述，確立 Word 匯出為唯一管道）

---

## 3. 驗證記錄

- **TypeScript / Build**：`cmd /c npm run build`（`tsc -b && vite build`）成功無任何型別錯誤。
- **ESLint**：`cmd /c npm run lint` 0 errors, 0 warnings。
- **Unit & Integration Tests**：`cmd /c npm test` 全部 14 個測試套件、71 個測試項目 100% 通過。

---

## 4. 交接格式

```md
## Handoff
- Owner: Antigravity
- Goal: 修正步驟 6 辭典彈窗寬度、生字摘要列與 DOCX 5 題上限、搬移「設為填空」至候選手風琴、加入預覽「僅供參考」提示並移除 PDF/列印功能。
- Changed files:
  - src/components/dictionary/WordDefinitionModal.tsx
  - src/features/review/ReviewPage.tsx
  - src/features/preview/PrintPreviewPage.tsx
  - src/features/templates/TemplateSelectionPage.tsx
  - src/components/worksheet/WorksheetContentRenderer.tsx
  - src/services/reference-template-docx.ts
  - tests/reference-template-docx.test.ts
  - tests/word-sentence-blank-ui.test.tsx
  - .tmp/template-rebuild/generate-validation.test.ts
  - PROJECT.md
- Dictionary version: unchanged
- Contract change: none（沿用既有 resolveOwnSentencesForWord 契約）
- Verified: npm run lint、npm run build、npm test 全數通過
- Risks / open questions: none
- Next owner action: 等待使用者確認後進行 git push
```
