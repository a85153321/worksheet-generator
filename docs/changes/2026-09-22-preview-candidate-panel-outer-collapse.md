# 步驟六「匯出前候選內容確認」外層總折疊列

## 變更摘要
- 於步驟六「預覽與列印」（`PrintPreviewPage.tsx`）的「匯出前候選內容確認」最外層新增可點擊折疊/展開的標題列按鈕。
- 標題列清楚呈現生字總數：`匯出前候選內容確認 ({N} 個生字)`，並附有說明標籤 `語詞最多 3 個・例句最多 2 則` 與狀態指示器（`點擊展開 ▶` / `點擊收合 ▼`）。
- 經教師使用動線評估，預設為**收合狀態（Collapsed）**：當生字量多（例如 7~10 個）時，若整區展開，即便每個生字列為單行也會推擠下方 A4 核心學習單預覽達數百像素；預設收合將縱向高度壓縮至約 44px，讓教師進入步驟六即可第一時間檢視 A4 學習單版面與列印設定，需要微調詞句時再一鍵展開。
- 支援無障礙操作：標題列為語意化 `<button type="button">`，具備 `aria-expanded`、`aria-controls` 與動態 `aria-label`，完整支援鍵盤 Enter/Space 操作與螢幕報讀。
- 在 `vite.config.ts` 與 `.gitignore` 中加入 `.tmp/**` 排除規則，確保本機測試暫存資料夾不會被 Vite 檔案監控鎖定或觸發 EBUSY。

## 相關檔案
- `src/features/preview/PrintPreviewPage.tsx`
- `src/styles/app.css`
- `tests/preview-candidate-panel.test.tsx`
- `vite.config.ts`
- `.gitignore`

## Handoff
- Owner: Antigravity
- Goal: 在「匯出前候選內容確認」外層增加可摺疊標題列，顯示生字總數，支援整區收合/展開，大幅縮短畫面高度。
- Changed files: `src/features/preview/PrintPreviewPage.tsx`, `src/styles/app.css`, `tests/preview-candidate-panel.test.tsx`, `vite.config.ts`, `.gitignore`, `docs/changes/2026-09-22-preview-candidate-panel-outer-collapse.md`
- Dictionary version: unchanged
- Contract change: none
- Verified: `npm run lint` (0 errors), `npm test` (10 passed, 59 tests passed), `npm run build` (success, chunk size verified)
- Risks / open questions: none
- Next owner action: 繼續其他 UI/Domain 開發或合併分支。
