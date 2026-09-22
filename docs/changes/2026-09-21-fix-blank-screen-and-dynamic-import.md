# 修復網站空白問題、easy-template-x 動態載入與 Watcher EBUSY 鎖定防護

## Handoff
- Owner: Antigravity
- Goal: 
  1. 診斷並修復瀏覽器畫面空白/無法開啟問題，落實 `easy-template-x` 與 `jszip` 之動態 `import()` 延遲載入，解決初始 entry chunk 過大與主機綁定限制。
  2. 在 `vite.config.ts` 的 `server.watch.ignored` 完整忽略 `src/assets/docx-templates/` 及 `**/~$*`，並為 loader 加上例外防禦，徹底杜絕 Word 開啟範本檔時因 Windows 作業系統檔案鎖定導致 Vite watcher 拋出 `EBUSY` 崩潰的問題。
  3. 在 `.gitignore` 加入 `~$*`，避免 Office 鎖定暫存檔被 git 追蹤。
- Changed files: `vite.config.ts`, `.gitignore`, `src/services/word-template-registry.ts`, `src/services/reference-template-docx.ts`, `src/services/docx-builder.ts`, `src/services/index.ts`, `tests/reference-template-docx.test.ts`.
- Dictionary version: unchanged
- Contract change: none
- Verified:
  1. `npm test`：全部 9 個測試檔、57 項單元與整合測試全數通過（含排除 `~$*.docx` 暫存檔測試）。
  2. `npm run lint`：ESLint 通過，0 errors / 0 warnings。
  3. `npm run build`：TypeScript 型別檢查與 Vite build 成功，`easy-template-x` (272.96 kB)、`jszip` (95.95 kB) 與 `reference-template-docx` (3.70 kB) 成功拆為獨立動態 chunk。
  4. 實機瀏覽器驗證：以 Microsoft Edge 實際造訪 `http://localhost:5173/` 與 `http://localhost:5173/#/templates`，確認 Header、步驟指示列、生字輸入區與學習單版型預覽均 100% 正常渲染。
  5. 檔案鎖定壓力測試：模擬 Windows OS 檔案鎖定情境（`FileShare::ReadWrite` 與 `FileMode::Open`）並放置 `~$` 暫存檔，啟動 Vite 開發伺服器，伺服器完全未受鎖定影響，順利啟動並持續提供 200 OK 正常服務。
- Risks / open questions: none
- Next owner action: 可繼續依規劃新增或調整 `.docx` 範本至 `src/assets/docx-templates/`。新增或修改範本檔案儲存後，透過儲存任一關聯程式碼檔案或重啟 dev 伺服器即可重新整理 registry。
