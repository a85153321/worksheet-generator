## Handoff

- Owner: Codex
- Goal: 移除生字分析結果的待審核／已確認／已編輯狀態機制，以及辭典流程已不需要的低信心語意。
- Changed files: `src/domain/analysis-result.ts`, `src/domain/analysis-review.ts`（刪除）, `src/domain/index.ts`, `src/services/use-cases.ts`, `tests/analysis-review.test.ts`（刪除）, `tests/worksheet-builder.test.ts`, `tests/docx-builder.test.ts`, `tests/review-status-removal.test.ts`, `PROJECT.md`, `AGENT_COLLABORATION.md`。
- Dictionary version: unchanged (`dict_concised_2014_20260626`)
- Contract change: `CharacterAnalysis` 移除 `editableState`、`confidence` 與 `reviewReasons`；移除 `EditableState`、`ReviewReason`、`editableStateSchema`、`reviewReasonSchema`、`LOW_CONFIDENCE_THRESHOLD`、`applyCharacterReviewRules`、`applyAnalysisReviewRules`。`updateAnalysisResult()` 驗證成功後直接回傳 `parsed.data`。
- Verified: ESLint 通過；Vitest 5 個測試檔、22 項測試通過；新增無狀態資料的 schema、教師編輯儲存、worksheet、Word 產生整合測試；新增舊 IndexedDB 額外欄位會被 Zod 剝除的相容性測試。
- Risks / open questions: 完整 `npm run build` 尚未通過，僅因 Antigravity 主責 UI 仍引用已刪除欄位；核心 domain／services／tests 已無狀態機制引用。本次依明確要求未修改 `src/features/**`。
- Next owner action: Antigravity 請移除下列 UI 殘留後執行 `npm run build`：
  - `src/features/review/ReviewPage.tsx`：示範資料的 `confidence`／`editableState`、狀態統計、確認／取消確認操作、待審核提示與狀態樣式。
  - `src/features/templates/TemplateSelectionPage.tsx`：示範資料的 `confidence`／`editableState`。
  - `src/features/preview/PrintPreviewPage.tsx`：示範資料的 `confidence`／`editableState`。

### IndexedDB 相容性

Zod object 預設會剝除未定義的額外欄位。舊快取若仍含 `confidence`、`reviewReasons` 或 `editableState`，通過 `analysisResultSchema` 後會自動移除，不需另寫資料遷移。
