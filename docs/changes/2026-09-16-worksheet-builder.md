## Handoff
- Owner: Codex
- Goal: 實作完全本機的五種學習單模板組裝引擎
- Changed files: `src/services/contracts.ts`, `src/services/worksheet-builder.ts`, `src/services/use-cases.ts`, `src/services/index.ts`, `tests/worksheet-builder.test.ts`, `PROJECT.md`, `docs/changes/2026-09-16-worksheet-builder.md`
- Contract change: `WorksheetTemplate` 新增 `picture-practice`；`WorksheetDoc` 新增 `templateLabel`；`WorksheetPage` 新增主要資料 `sections`；新增四種 section 型別與選填 `BuildWorksheetOptions`
- Verified: `npm test`, TypeScript/Vite build, ESLint, Git diff check；測試確認五種模板皆不呼叫 fetch/AI
- Risks / open questions: `pages[].blocks` 為既有 UI 相容索引，新預覽引擎應改用 `sections`；每頁目前固定最多六個 section，後續可依視覺模板調整
- Next owner action: Antigravity 依 `section.kind` 分派五種版型；看圖 section 的 `needsImage` 為 true 時顯示待生成／待選圖狀態
