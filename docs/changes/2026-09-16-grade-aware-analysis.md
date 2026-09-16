## Handoff
- Owner: Codex
- Goal: 讓適用年級真正影響 Gemini 分析 prompt，並隔離不同年級的分析快取
- Changed files: `src/infrastructure/gemini-client.ts`, `src/services/use-cases.ts`, `src/services/index.ts`, `src/app/AppContext.tsx`, `src/features/review/ReviewPage.tsx`, `tests/gemini-client.test.ts`, `tests/cache.test.ts`, `PROJECT.md`
- Contract change: 新增 `buildAnalysisCacheKey` export；既有 `analyzeMaterial`、`getCachedAnalysis` 與資料契約簽名不變
- Verified: 年級 prompt 與快取隔離測試、完整 tests、build、lint、同教材一年級／六年級 UI 分析比較
- Risks / open questions: 真實比較仍受 Gemini 服務狀態與配額影響
- Next owner action: Antigravity 無需修改年級選單；繼續傳入既有 `context.grade`
