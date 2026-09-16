## Handoff
- Owner: Codex
- Goal: 統一 UI readiness 與分析 use case 的 API Key 儲存來源
- Changed files: `src/infrastructure/api-key-store.ts`, `src/services/key-settings.ts`, `src/services/index.ts`, `src/app/AppContext.tsx`, `tests/api-key-integration.test.ts`, `docs/changes/2026-09-16-api-key-storage-unification.md`
- Contract change: services 新增 `getApiKey()`；正式 storage key 為 `worksheet-generator.gemini-api-key`，舊 `ws_gemini_api_key` 會自動遷移
- Verified: 儲存 Key → readiness true → `analyzeMaterial` 發出請求並成功；legacy key migration；`npm test`、build、lint、diff check
- Risks / open questions: none
- Next owner action: Antigravity 不再於 UI 直接讀寫 API Key localStorage，統一透過 services
