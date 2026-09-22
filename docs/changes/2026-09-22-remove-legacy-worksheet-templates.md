## Handoff
- Owner: Codex
- Goal: 配合 Antigravity 移除生字田字格、語詞積木、句型仿寫、看圖識字四個舊模板，將底層組裝與 Word 匯出收斂到動態 easy-template-x 範本流程。
- Changed files: `src/services/contracts.ts`、`src/services/worksheet-builder.ts`、`src/services/docx-builder.ts`、`src/services/index.ts`、`src/components/worksheet/constants.ts`、`src/components/worksheet/WorksheetSheet.tsx`、`src/styles/app.css`、`tests/worksheet-builder.test.ts`、`tests/review-status-removal.test.ts`、`tests/worksheet-components.test.tsx`、`tests/docx-builder.test.ts`（刪除）、`package.json`、`package-lock.json`、`PROJECT.md`
- Dictionary version: unchanged
- Contract change: `WorksheetTemplate` 由五種 union 縮減為唯一字面值 `'reference-character-practice'`；移除 `WordWorksheetSection`、`SentenceWorksheetSection`、`PictureWorksheetSection`，保留 reference 預覽仍使用的 `CharacterWorksheetSection`。多份 DOCX 版型繼續以 `WorksheetDoc.docxTemplateId` 對應 `word-template-registry.ts` 的動態 ID。
- Verified: `npm test`（9 files / 41 tests）、`npm run lint`、`npm run build` 全部通過；全域搜尋確認正式程式與現行測試不再包含四個舊模板 ID、三種已移除 section 型別、`createDocxDocument` 或 `Packer.toBlob`。
- Risks / open questions: `docx` 不再是正式執行依賴，只保留為 devDependency，供 `reference-template-docx.test.ts` 在測試中建立最小 DOCX fixture；正式匯出沒有 `createDocxDocument` 或 `Packer.toBlob` 備援。既有 docs/changes 歷史紀錄仍會提到舊模板，屬不可改寫的交接歷史。
- Next owner action: Antigravity 合併 UI 移除工作時，沿用單一 `WorksheetTemplate` 與動態 `docxTemplateId`，不要把 registry ID 改塞進 `WorksheetTemplate`。
