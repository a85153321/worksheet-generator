## Handoff
- Owner: Codex
- Goal: 以可勾選功能標籤與獨立注音開關控制教材分析
- Changed files: `src/domain/analysis-context.ts`, `src/domain/index.ts`, `src/domain/analysis-result.ts`, `src/services/contracts.ts`, `src/services/use-cases.ts`, `src/services/index.ts`, `src/infrastructure/gemini-client.ts`, `src/infrastructure/index.ts`, `tests/gemini-client.test.ts`, `tests/cache.test.ts`, `PROJECT.md`
- Contract change: `AnalyzeMaterialInput.context` 新增 `skillTags`、`includeZhuyin`；新增 `AnalysisSkillTag`、`AnalysisContext`、`AnalysisContextInput` 與 `ANALYSIS_SKILL_TAGS`；`zhuyin` 仍為 string 但允許空字串
- Verified: 不同功能標籤的 prompt／結果差異、注音開關的 prompt／回傳差異、快取隔離、完整 tests、build、lint
- Risks / open questions: 現有 UI 尚未傳入新欄位時採 `skillTags=[]`、`includeZhuyin=true`，維持向後相容
- Next owner action: Antigravity 將標籤核取方塊與注音開關值傳入既有 `context`
