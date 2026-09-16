## Handoff
- Owner: Codex
- Goal: 完善 Gemini retry、needsReview 規則與教師修改驗證 use case
- Changed files: `src/domain/analysis-result.ts`, `src/domain/analysis-review.ts`, `src/domain/index.ts`, `src/infrastructure/gemini-client.ts`, `src/services/use-cases.ts`, `src/services/index.ts`, `tests/gemini-client.test.ts`, `tests/analysis-review.test.ts`, `PROJECT.md`, `docs/changes/2026-09-16-retry-review-and-teacher-edits.md`
- Contract change: `CharacterAnalysis` 新增選填 `reviewReasons`；services 新增 `updateAnalysisResult(unknown): Promise<Result<AnalysisResult, AppError>>`
- Verified: `npm test`, TypeScript/Vite build, ESLint, Git diff check
- Risks / open questions: 低信心門檻目前固定為 0.8；若需依年級或教材類型調整，應另建設定契約
- Next owner action: Antigravity 顯示 `reviewReasons` 對應提示，儲存教師修改前呼叫 `updateAnalysisResult`，確認完成時將項目 status 設為 `confirmed`
