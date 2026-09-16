## Handoff
- Owner: Codex
- Goal: 將 `generateSelectedImage` mock 替換為 Gemini 圖片生成與 IndexedDB cache 流程
- Changed files: `src/infrastructure/gemini-image-client.ts`, `src/infrastructure/index.ts`, `src/services/image-generation.ts`, `src/services/use-cases.ts`, `src/services/index.ts`, `tests/image-generation.test.ts`, `tests/cache.test.ts`, `PROJECT.md`, `docs/changes/2026-09-16-selected-image-generation.md`
- Contract change: `generateSelectedImage(item)` 簽名不變；新增 prompt builder、測試用 use case factory 與 Gemini image client exports
- Verified: `npm test`, TypeScript/Vite build, ESLint, Git diff check
- Risks / open questions: 預設模型為 `gemini-2.5-flash-image`、輸出比例固定 1:1；`ImageResult.source` 為相容既有 UI 仍保留未再使用的 `mock` union member
- Next owner action: Antigravity 可維持既有呼叫方式，依 `source` 顯示 cache/generated 狀態，並在刪除圖片操作中呼叫 infrastructure 封裝後續提供的 service facade
