# 移除所有 AI／API Key 殘留項目與全流程完整驗證

## 變更背景
配合 Codex 實作之教育部《國語辭典簡編本》全本機離線查詢架構（移除了 Gemini Client、API Key Store、SettingsPage），全面盤點與清理前端剩餘的過時文案、死連結、舊教材字眼，並確認審核頁能正確呈現及編輯 `wordCandidates` 與 `sentenceCandidates` 候選陣列。

## 清理的殘留項目清單

1. **路由設定與導覽列**：
   - 確認 `src/app/routes.ts`、`src/app/Layout.tsx`、`src/components/Header.tsx`、`src/components/StepNavigation.tsx` 中已無任何「金鑰設定」、「Settings」或指向不存在頁面的死連結。
   - 頂部導覽列僅保留純淨的「📝 國小本機學習單生成器 Local-First」首頁入口。

2. **舊教材／PDF 選頁殘留文案清理**：
   - `src/features/review/ReviewPage.tsx`：
     - 空狀態說明移除「尚未進行教材分析...返回上傳頁重新選頁分析」舊字眼，改為「尚未進行生字查詢，或生字清單已被全部移除。您可以返回輸入生字頁重新輸入...」。
     - 底部與空狀態按鈕「← 返回教材上傳選頁」統一改為「← 返回輸入生字」。
     - 頁面標題由「🔍 步驟 3：分析結果審核與編輯」正名為「🔍 步驟 3：生字查詢結果審核與編輯」。
     - 來源顯示清理：當 `source.page` 為 `null` 時（本機辭典固定為 null），不再誤顯「第 1 頁」，改為顯示「來源：教育部《國語辭典簡編本》」。
     - 示範生字 `defaultSampleAnalysis` 的 `source` 更新為 `{ page: null, block: '教育部《國語辭典簡編本》' }`。
   - `src/features/templates/TemplateSelectionPage.tsx`：
     - 錯誤與空狀態中的「返回教材上傳選頁」統一改為「返回輸入生字」。
     - 「目前尚未有分析後的生字資料」改為「目前尚未有查詢後的生字資料」。
     - 即時預覽模擬文字「帶入當前教材資料後」改為「帶入當前生字資料後」。
   - `src/features/preview/PrintPreviewPage.tsx`：
     - `fallbackCharacters` 的 `source` 統一更新為 `{ page: null, block: '教育部《國語辭典簡編本》' }`。

3. **候選詞語與例句欄位（wordCandidates／sentenceCandidates）完整呈現與編輯**：
   - 審核編輯卡片將原本「詞語」與「例句」標籤更新為「詞語候選」與「例句候選」。
   - 例句候選支援呈現辭典查出的所有 candidate 句子（單句直接呈現，多句依序編號列出）。
   - 編輯表單將例句欄位改為多行輸入（換行分隔），並在儲存時正確將多行例句轉為 `sentenceCandidates: string[]` 陣列，不再遺漏任何候選句子。

## 完整流程驗證
透過 Edge CDP 實機執行端到端完整流程：
- 步驟 1（輸入生字）：輸入「學、習、春、風」，已識別 4 個生字 chips，離線查詢。
- 步驟 2（辭典查詢結果）：顯示從教育部《國語辭典簡編本》查得 4 個生字的注音、部首、筆畫、詞語與例句候選。
- 步驟 3（審核與編輯）：正確列出「學、習、春、風」完整辭典詞語候選與編號例句候選，點擊「✓ 全部確認」。
- 步驟 4（上傳配圖）：純本機上傳介面，4 張卡片正常呈現。
- 步驟 5（選擇模板）：3 種模板（生字田字格、詞語積木、句型仿寫）排版即時預覽正常。
- 步驟 6（A4 預覽與列印）：A4 田字格學習單、注音開關、標楷體/芫荽字體切換、下載 Word 檔 (.docx) 皆正常運作。
