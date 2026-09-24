# 步驟 6 教師手動形近字分組與即時預覽

## Handoff
- Owner: Antigravity
- Goal: 在不改動步驟 3 的前提下，補齊 `character-lookalike-practice` 模板入口、步驟 6 教師手動分組工具、即時預覽 renderer，以及 DOCX 尚未提供時的可理解提示。
- Changed files: `src/components/worksheet/constants.ts`、`src/components/worksheet/WorksheetContentRenderer.tsx`、`src/features/preview/PrintPreviewPage.tsx`、`src/features/templates/TemplateSelectionPage.tsx`、`tests/lookalike-ui.test.tsx`、本文件。
- Dictionary version: unchanged；教育部《國語辭典簡編本》與 kfcd/chaizi 離線資產均未修改。
- Contract change: none；直接使用 Codex 已定案的 `AnalysisResult.lookalikeGroups`、`WorksheetTemplate='character-lookalike-practice'` 與 `CharacterLookalikeWorksheetSection.groupCharacters`。所有候選替換、填空語詞與形近字分組更新都經過既有 `updateAnalysisResult()` 驗證後再寫回 AppContext。
- Verified: `npm run build`、`npm run lint`、完整 `npm test` 均通過（16 個測試檔、83 案例）。瀏覽器以 5 字「堅、賢、腎、緊、直」實測：選取「堅」會顯示同教材內的建議「緊、腎」；建立 3 字組「堅、賢、腎」與 2 字組「緊、直」後，已分組按鈕均 disabled 並標示組別；解散第 2 組後「緊、直」立即恢復可選，重新建立成功；每次建立／解散後預覽同步更新。點擊下載 Word 顯示「此學習單類型尚未提供 Word 範本，請先使用畫面預覽」，沒有產生空檔。`ReviewPage` 的 SSR 測試確認步驟 3 不含「形近字分組」或「你可能還想加」。本次工作結果已附步驟 6 全頁截圖，畫面同時呈現兩組分組及兩組預覽。
- Risks / open questions: 本輪依需求僅提供簡潔資料版面，尚未製作最終美術與 DOCX 範本；候選建議只顯示同一份 `AnalysisResult.characters` 內、尚未分組的字，因此不會把教材外字直接加進目前勾選。分組 id 目前以本機 `Date.now()` 產生，符合現有 string 契約，但若未來需要跨裝置同步可再改為持久 UUID。
- Next owner action: 由產品／Codex 先人工確認形近字資料品質與此版面方向；若確認採用，再另案建立 `character-lookalike-practice` DOCX 範本與匯出映射。步驟 3 不需新增形近字功能。
