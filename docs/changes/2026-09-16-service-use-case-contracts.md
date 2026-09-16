## Handoff
- Owner: Codex
- Goal: 提供四個可供 UI 立即串接的非同步 use case mock
- Changed files: `src/domain/analysis-result.ts`, `src/domain/app-error.ts`, `src/domain/index.ts`, `src/services/contracts.ts`, `src/services/use-cases.ts`, `src/services/index.ts`, `PROJECT.md`, `docs/changes/2026-09-16-service-use-case-contracts.md`
- Contract change: 新增 `AnalyzeMaterialInput`、`ImageResult`、`WorksheetTemplate`、`WorksheetDoc`，以及四個公開服務函式；補回共用 `AnalysisResult` 與 `Result<T, AppError>` domain contract
- Verified: TypeScript/Vite build、ESLint、Git diff check
- Risks / open questions: cache 目前只存在記憶體；圖片為 SVG data URL；學習單目前固定產生單頁，待 infrastructure 與排版引擎實作後替換
- Next owner action: Antigravity 從 `src/services` 匯入函式與型別，使用 mock 成功／驗證失敗路徑串接 UI
