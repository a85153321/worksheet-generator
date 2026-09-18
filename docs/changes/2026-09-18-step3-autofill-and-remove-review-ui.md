## Handoff

- Owner: Antigravity
- Goal: 完成步驟三「教師自訂新增生字」卡片「🪄 自動整理」按鈕實作、徹底移除 ReviewPage 及相關示範資料之舊確認狀態機制 UI，並新增破音字固定提醒文案。
- Changed files:
  - `src/features/review/ReviewPage.tsx`
  - `src/features/templates/TemplateSelectionPage.tsx`
  - `src/features/preview/PrintPreviewPage.tsx`
  - `docs/changes/2026-09-18-step3-autofill-and-remove-review-ui.md`
- Dictionary version: unchanged (`dict_concised_2014_20260626`)
- Contract change: none (UI 配合 Codex 既有 domain contract 更新，移除了 `editableState` 與 `confidence` 的寫入與讀取)
- Verified:
  - `npm test`: Vitest 5 個測試檔、22 項測試全部通過。
  - `npm run lint`: ESLint 零錯誤通過。
  - `npm run build`: `tsc -b && vite build` 順利通過，零型別錯誤。
  - 瀏覽器自動化 CDP 端到端手動驗證（含截圖）：
    1. 破音字固定提醒文案「💬 提醒：若生字為破音字，請確認注音是否為您想教授的讀音，避免學習單排版跑版。」於說明下方正常固定顯示。
    2. 頂部狀態列僅顯示「生字總數：X 個」，完全移除待審核／已確認／已修改計數與「全部確認」按鈕。
    3. 移除待審核黃色警告橫幅，卡片恢復中性一般邊框，移除狀態 tags 與確認無誤／取消確認按鈕，僅保留「✏️ 編輯」與「🗑️ 刪除」。
    4. 「➕ 教師自訂新增生字」標題列新增「🪄 自動整理」按鈕；生字空白點擊提示「請先輸入生字」；查無生字顯示「ℹ️ 資料庫查無此字，請手動輸入注音、部首等資料。」；輸入存在生字時，能自動填補空白欄位，且嚴格不覆蓋教師已填寫的內容（如注音、語詞）；筆畫預設為空白，自動補齊正確筆畫。
    5. 新增完成之生字能順暢加入學習單清單，並可繼續前往步驟四配圖、步驟五模板與步驟六預覽列印。
- Screenshots:
  - `step3_review_cleaned.png`
  - `step3_autofill_missing_char.png`
  - `step3_autofill_custom_preserved.png`
  - `step3_review_after_add.png`
- Risks / open questions: None.
- Next owner action: 可進行後續功能開發或合併至 main 分支。
