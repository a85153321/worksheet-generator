# 語詞例句填空範本資料與欄寬診斷

## Handoff
- Owner: Codex
- Goal: 區分例句空白的上游資料依賴與模板責任，並實測上方生字／語詞橫向表格的安全欄數。
- Changed files: `src/services/reference-template-docx.ts`、`src/services/index.ts`、`tests/reference-template-docx.test.ts`、`docs/word-template-design-guide.md`、本文件；診斷產物為 `outputs/語詞例句填空學習單-8欄寬度診斷.pdf` 與同名 PNG。
- Dictionary version: unchanged (`2014_20260626`)
- Contract change: domain 契約不變。Word template data 原有的前 5 筆限制改以 `WORD_SENTENCE_BLANK_TOP_ITEM_LIMIT = 5` 具名表示；`itemRows` 仍完整包含所有題目。
- Verified: `tests/reference-template-docx.test.ts` 與視覺驗證程式的 `characters[].wordSentenceBlank` 都是手動填入的非 null 物件，實際 DOCX／PDF 可正確顯示 `targetWord` 與填空例句，故例句欄位空白不是模板 bug。搜尋 `src/` 後確認目前 UI 沒有寫入 `wordSentenceBlank` 的程式，實際流程仍依賴 Antigravity 尚未完成的 targetWord 選擇 UI。另以 8 筆資料取消 `topItems` 限制實測：第 1 與第 8 欄被頁面裁切，5 欄為完整可讀的安全上限；正式資料維持方案 (a)，摘要只顯示前 5 筆，下方 8 題全部保留。`npm run lint` 通過；完整 `npm test` 為 12 檔 58 案例通過；`npm run build` 通過（僅既有 chunk 警告）。
- Risks / open questions: 例句顯示依賴 Antigravity 尚未完成的 targetWord 選擇 UI，模板本身已驗證可正確渲染。8 欄診斷圖是刻意取消正式限制的失敗案例，用來證明橫向欄重複不會自動換列；不是要交付的版面。
- Next owner action: Antigravity 完成 targetWord 選擇 UI，將教師選擇寫回對應的 `AnalysisResult.characters[n].wordSentenceBlank`，資料形狀如下；不得由模板猜測或自動選第一個候選：

```ts
character.wordSentenceBlank = {
  targetWord: selectedWord,
  originalSentence: selectedSentence,
  sentenceBeforeBlank: selectedSentence.slice(0, matchIndex),
  sentenceAfterBlank: selectedSentence.slice(matchIndex + selectedWord.length),
}
```

實作時應優先使用既有 `resolveOwnSentencesForWord(lookup, selectedWord)` 與 `createSentenceBlank(selectedSentence, selectedWord)`，並把 `createSentenceBlank` 的非 null 回傳值直接寫入，不要在 UI 重複實作切字邏輯。
