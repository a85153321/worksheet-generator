# 讀音按鈕套用純注音字型與移除四款舊版型

## 變更摘要
1. **讀音切換按鈕字型優化**：
   - 審查頁面（`ReviewPage.tsx`）的「讀音切換」按鈕（`.reading-button`）改用「ㄅ字嗨注音而已 R」（BpmfZihiOnly）字型堆疊：
     `font-family: 'ㄅ字嗨注音而已 R', 'BpmfZihiOnly-R', '標楷體', 'DFKai-SB', serif;`
   - 維持按鈕大小與排版，呈現優美且標準的純注音符號筆畫。

2. **移除四款舊程式化模板**：
   - 移除 `TemplateSelectionPage.tsx` 的 `STATIC_TEMPLATE_OPTIONS` 中的四款舊版型（`character-practice` 生字田字格、`word-practice` 語詞積木、`sentence-practice` 句型仿寫、`picture-practice` 看圖識字）。
   - `renderWireframe` 移除 `character`、`word`、`sentence`、`picture` 分支，僅保留 `reference` 線框示意。
   - `WorksheetContentRenderer.tsx` 移除 `renderCharacterPractice`、`renderWordPractice`、`renderSentencePractice`、`renderPicturePractice`，精簡至僅保留原稿母版渲染（`renderReferenceCharacterPractice`）。
   - `PrintPreviewPage.tsx` 移除舊版型分支，`activeTitle` 預設對齊生字注音學習單。
   - 全域 `AppContext.tsx` 與相關測試預設模板改為 `reference-character-practice`。

3. **步驟五「選擇學習單版型」升級為 Word 動態範本選擇**：
   - 保留步驟五作為「選擇 Word 學習單範本」介面，動態列出 `src/assets/docx-templates/` 資料夾內所有可用之 `.docx` 檔案（透過 `WORD_TEMPLATE_REGISTRY`）。
   - 教師可直接點選不同範本（如預設母版、自訂範本），即時以該範本進行 A4 縮小版面模擬預覽與展開放大檢視，體驗更一致且具備高度自訂擴充性。

## 相關檔案
- `src/styles/app.css`
- `src/app/AppContext.tsx`
- `src/components/worksheet/WorksheetContentRenderer.tsx`
- `src/features/templates/TemplateSelectionPage.tsx`
- `src/features/preview/PrintPreviewPage.tsx`
- `tests/preview-candidate-panel.test.tsx`
- `tests/worksheet-components.test.tsx`

## Handoff
- Owner: Antigravity
- Goal: 將讀音切換按鈕文字字型改為 BpmfZihiOnly，並移除生字田字格、語詞積木、句型仿寫、看圖識字四個舊版型，使學習單生成全數收斂至 Word 母版（reference-character-practice）。
- Changed files: `src/styles/app.css`, `src/app/AppContext.tsx`, `src/components/worksheet/WorksheetContentRenderer.tsx`, `src/features/templates/TemplateSelectionPage.tsx`, `src/features/preview/PrintPreviewPage.tsx`, `tests/preview-candidate-panel.test.tsx`, `tests/worksheet-components.test.tsx`, `docs/changes/2026-09-22-remove-legacy-templates-and-reading-font.md`
- Dictionary version: unchanged
- Contract change: none
- Verified: `npm test` (10 files passed, 55 tests passed), `npm run lint` (0 errors), `npm run build` (build passed)
- Risks / open questions: none
- Next owner action: 繼續進行後續 Word 範本客製化或進入 PR 合併。
