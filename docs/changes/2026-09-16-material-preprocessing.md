## Handoff
- Owner: Codex
- Goal: 實作圖片預處理與 PDF 選頁／頁面處理流程
- Changed files: `src/domain/processed-material.ts`, `src/domain/index.ts`, `src/infrastructure/image-processing.ts`, `src/infrastructure/pdf-processing.ts`, `src/infrastructure/index.ts`, `src/services/material-processing.ts`, `src/services/contracts.ts`, `src/services/index.ts`, `tests/material-processing.test.ts`, `PROJECT.md`, `package.json`, `package-lock.json`, `docs/changes/2026-09-16-material-preprocessing.md`
- Contract change: 新增 `processUploadedImage`、`inspectUploadedPdf`、`processSelectedPdfPages` use cases 與對應輸入／輸出型別；既有契約不變
- Verified: `npm test`, TypeScript/Vite build, ESLint, Git diff check
- Risks / open questions: PDF 頁面以 2x viewport 渲染後再套用圖片處理選項；極大頁面未來可加入記憶體上限策略
- Next owner action: Antigravity 可在上傳頁依 MIME type 分流；PDF 先顯示 inspect 結果供選頁，再提交選定頁碼
