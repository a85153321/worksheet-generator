## Handoff
- Owner: Codex
- Goal: 修正 easy-template-x 多題輸出時，單題資訊列與練習格表格被 Word 分頁拆開的問題。
- Changed files: `src/assets/docx-templates/生字學習單注音版.docx`、`src/assets/docx-templates/生字學習單注音版 - 複製.docx`、`tests/reference-template-docx.test.ts`、`docs/word-template-design-guide.md`、`outputs/生字學習單-8題分頁驗證.docx`、`docs/changes/2026-09-22-keep-question-blocks-together.md`
- Dictionary version: unchanged
- Contract change: none；Word 標籤與 TypeScript 資料形狀均未改變。範本版面契約新增：資訊列及練習格列必須含 `w:cantSplit`，資訊表格段落與兩表間橋接段落必須含 `w:keepNext`。
- Verified: easy-template-x 八題輸出結構測試確認 8 個資訊列與 8 個練習格列均保留 `w:cantSplit`，資訊表格保留 `w:keepNext`；Microsoft Word 實際開啟 8 題成品並匯出為 3 頁 PDF，逐題頁碼為 1–3 題第 1 頁、4–6 題第 2 頁、7–8 題第 3 頁，所有資訊表格與對應練習格表格起訖頁碼完全相同；三頁 PNG 已逐頁目視確認無攔腰截斷。
- Risks / open questions: Word 為保持完整題目，頁尾剩餘空間不足時會把整題移到下一頁，因此頁尾可能有合理留白；這是避免拆題的預期行為。內建 LibreOffice renderer 在目前 Windows runtime 找不到 bundled `soffice.exe`，視覺 QA 改由 Microsoft Word COM 唯讀匯出 PDF，再以 Poppler 產生 PNG。
- Next owner action: Antigravity 新增或替換 DOCX 範本時，依設計規範保留相同分頁屬性，並以至少 8 題資料驗證。
