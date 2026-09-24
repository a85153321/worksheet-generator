# 語詞例句填空雙欄 Word 範本

## Handoff
- Owner: Codex
- Goal: 新增只存在於 Word template data 組裝層的 `itemRows` 契約，並提供每列兩題、可處理奇數題的語詞例句填空範本。
- Changed files: `src/services/reference-template-docx.ts`、`src/services/index.ts`、`src/assets/docx-templates/語詞例句填空學習單雙欄版.docx`、`tests/reference-template-docx.test.ts`、`docs/word-template-design-guide.md`、本文件；視覺驗證產物位於 `outputs/語詞例句填空學習單-8題驗證.*` 與 `outputs/語詞例句填空學習單-9題驗證.*`。
- Dictionary version: unchanged
- Contract change: 僅 Word template data 新增 `itemRows: Array<{ left: WorksheetTemplateItem; right?: WorksheetTemplateItem }>` 與最多 5 筆的 `topItems`；`WorksheetDoc`、`AnalysisResult`、`characterAnalysisSchema` 均未變更。`itemRows` 由純函式 `pairWorksheetTemplateItems` 將既有 `items` 兩兩配對。模板使用 `{#itemRows}...{/itemRows}`，欄位為 `left.*`／`right.*`，選配右欄以 `{#right}...{/right}` 包覆。
- Verified: `npm test -- --run tests/reference-template-docx.test.ts`（14/14）；`npm run build`；8 題與 9 題假資料實際經 easy-template-x 輸出；Microsoft Word 匯出 PDF；Poppler 轉 PNG 並人工檢查。8 題為橫式 A4 單頁、4 列 × 2 題；上方 5 組生字／語詞均不同；所有填空前後文正確；無 `{}` 標籤與 `undefined`；9 題第 2 頁最後一列右格為空；題目列均有 `w:cantSplit`。
- Risks / open questions: easy-template-x 預設 scope resolver 不解析 `left.character` 這類點號路徑，因此匯出層使用其公開的 `scopeDataResolver` 擴充點；這是本次唯一額外機制，無新增依賴。每頁上限採 8 題，依據為橫式 A4 在保留 5 組表頭、題目三行內容及可讀字級後，可穩定容納 4 列，9 題會自然進入第 2 頁。舊草稿 `src/assets/docx-templates/語詞例句填空學習單.docx` 保留未動，請由使用者確認後自行刪除。
- Next owner action: 以 `語詞例句填空學習單雙欄版` 在介面選單做一次實際教師資料驗收；確認不再需要舊草稿後，由使用者自行刪除 `語詞例句填空學習單.docx`。
