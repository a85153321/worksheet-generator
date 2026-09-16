## Handoff
- Owner: Codex
- Goal: 實作 Gemini 結構化分析、受控 retry、SHA-256 hash、IndexedDB 快取，並將分析服務接上真實 infrastructure
- Changed files: `src/infrastructure/*`, `src/services/*`, `tests/gemini-client.test.ts`, `tests/cache.test.ts`, `package.json`, `package-lock.json`, `docs/changes/2026-09-16-infrastructure-core.md`
- Contract change: `analyzeMaterial` 與 `getCachedAnalysis` 簽名不變；新增 additive 的 `saveApiKey`、`clearApiKey`、`isApiKeyConfigured` service exports，以及 cache 刪除 infrastructure API
- Verified: `npm test`, TypeScript/Vite build, ESLint, Git diff check
- Risks / open questions: `generateSelectedImage` 仍待圖片生成 client；IndexedDB schema 目前為 version 1；Gemini 預設模型為 `gemini-2.5-flash`
- Next owner action: Antigravity 維持原有 analyze/cache 呼叫方式，並透過 services 的 Key 設定函式建立設定 UI
