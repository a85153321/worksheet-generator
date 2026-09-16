## Handoff
- Owner: Codex
- Goal: 修正 Gemini 圖片生成模型與 REST 請求格式，排除 HTTP 400
- Changed files: `src/infrastructure/gemini-image-client.ts`, `src/infrastructure/index.ts`, `tests/gemini-image-client.test.ts`, `PROJECT.md`, `docs/changes/2026-09-16-gemini-image-model.md`
- Contract change: 新增圖片模型、endpoint 與 URL builder exports；既有 `generateSelectedImage` 函式簽名及回傳契約不變
- Verified: 單元測試、完整 tests、TypeScript/Vite build、ESLint、實際 UI 圖片生成流程
- Risks / open questions: 真實生成仍取決於使用者 Key 對圖片模型的存取權、配額與 Gemini 服務狀態
- Next owner action: Antigravity 無需修改 UI
