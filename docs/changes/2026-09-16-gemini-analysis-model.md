## Handoff
- Owner: Codex
- Goal: 將教材分析模型更新為官方目前穩定主力 Flash，並鎖定正確 generateContent URL
- Changed files: `src/infrastructure/gemini-client.ts`, `src/infrastructure/index.ts`, `tests/gemini-client.test.ts`, `PROJECT.md`, `docs/changes/2026-09-16-gemini-analysis-model.md`
- Contract change: 新增 `DEFAULT_GEMINI_ANALYSIS_MODEL`、`GEMINI_GENERATE_CONTENT_ENDPOINT`、`buildGeminiGenerateContentUrl` exports；既有 client/use case 簽名不變
- Verified: endpoint 單元測試、完整 tests、TypeScript/Vite build、ESLint、Git diff check
- Risks / open questions: 真實 API 成功仍取決於使用者 Key 對 `gemini-3.5-flash` 的存取權、配額與 Gemini 服務狀態
- Next owner action: Antigravity 無需修改 UI；404 時可提示使用者確認帳戶可用模型
