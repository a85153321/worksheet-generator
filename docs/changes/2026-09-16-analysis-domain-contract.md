## Handoff
- Owner: Codex
- Goal: 建立分析結果 Zod schema、TypeScript 型別與共用錯誤契約
- Changed files: `src/domain/analysis-result.ts`, `src/domain/app-error.ts`, `src/domain/index.ts`, `PROJECT.md`, `docs/changes/2026-09-16-analysis-domain-contract.md`
- Contract change: 新增 `AnalysisResult` / `CharacterAnalysis` schema 與 type，以及 `Result<T, AppError>`；錯誤可區分 validation、network、authentication、quota
- Verified: TypeScript build、ESLint
- Risks / open questions: `words` 與 `exampleSentences` 目前為字串陣列；若 UI 之後需要逐項來源或信心值，應先協調最小契約變更
- Next owner action: Antigravity 可從 `src/domain` 匯入型別與 schema，依 `editableState.needsReview` 呈現審核狀態
