## Handoff
- Owner: Codex
- Goal: 修正綜合學習單跨頁重複與每頁容量不足
- Changed files: `src/services/worksheet-builder.ts`, `tests/worksheet-builder.test.ts`, `docs/changes/2026-09-16-mixed-template-pagination.md`
- Contract change: none；`WorksheetDoc`、`WorksheetPage` 與 `buildWorksheet` 簽名不變
- Verified: 12 個生字以 8 + 4 分頁、順序不變、無重複或遺漏；完整 tests、build、lint。瀏覽器上傳重測時 Gemini 回覆暫時性 network error，未完成該次 UI 端到端預覽
- Risks / open questions: 每頁上限依目前 A4 綜合模板列高設為 8；若 Antigravity 日後大幅調整列高，需同步重新評估
- Next owner action: Antigravity 無需修改 UI
