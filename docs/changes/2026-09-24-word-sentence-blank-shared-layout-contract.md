# 語詞例句填空共用版面契約

## Handoff
- Owner: Codex
- Goal: 將語詞例句填空的摘要裁切、雙欄配對與每頁 8 題規則移入共用 service 契約，讓即時預覽與 DOCX 匯出讀取同一份已計算 section 資料。
- Changed files: `src/services/word-sentence-blank-layout.ts`、`src/services/contracts.ts`、`src/services/worksheet-builder.ts`、`src/services/reference-template-docx.ts`、`src/services/index.ts`、`tests/word-sentence-blank-layout.test.ts`、`tests/worksheet-builder.test.ts`、`tests/reference-template-docx.test.ts`、`docs/word-template-design-guide.md`、本文件。未修改 `src/features/**` 或 `src/components/**`。
- Dictionary version: unchanged (`2014_20260626`)
- Contract change: `WorksheetTemplate` 新增 `'word-sentence-blank'`；`WorksheetSection` 新增 `WordSentenceBlankWorksheetSection`。`buildWorksheet` 每 8 題建立一頁 section，只在 `buildSections` 呼叫 `selectWordSentenceBlankTopItems` 與 `pairWordSentenceBlankItems`；DOCX 匯出只把 section 內已算好的 `topItems`／`itemRows` 映射成 Word 顯示項目，不重新裁切或配對。實際型別如下：

```ts
export interface WordSentenceBlankWorksheetItem {
  questionNumber: number
  character: string
  targetWord: string
  originalSentence: string
  sentenceBeforeBlank: string
  sentenceAfterBlank: string
}

export interface WordSentenceBlankWorksheetItemRow {
  left: WordSentenceBlankWorksheetItem
  right?: WordSentenceBlankWorksheetItem
}

export interface WordSentenceBlankWorksheetSection {
  kind: 'word-sentence-blank'
  id: string
  instructions: string
  topItems: WordSentenceBlankWorksheetItem[]
  itemRows: WordSentenceBlankWorksheetItemRow[]
}
```

- Verified: 純函式測試涵蓋 0 筆、剛好 5 筆、超過 5 筆、偶數配對與奇數尾列缺少 `right`；builder 測試覆蓋 9 題分成 8＋1 兩頁、第一頁 5 筆摘要與 4 列題目；DOCX 整合測試比對 section 與 Word template data 的題號、字元、語詞及例句欄位完全一致，並實際輸出確認奇數右格留白。`npm run lint` 通過；完整 `npm test` 為 13 檔 65 案例全數通過，既有 `reference-character-practice` 測試無 regression。`npm run build` 的 service 端型別通過，但整體 TypeScript 建置目前停在未修改的 UI exhaustive map：`src/components/worksheet/constants.ts` 的 `TEMPLATE_NAMES` 尚缺 `'word-sentence-blank'`，依本輪不修改 UI 的明確限制留給 Antigravity。
- Risks / open questions: 模板選擇頁目前仍把 registry 中所有 DOCX 映射到 `'reference-character-practice'`，在 Antigravity 完成 UI 對應前，新 service 路徑只能由直接呼叫 `buildWorksheet(..., 'word-sentence-blank')` 使用。Word 模板目前以第一頁 section 的 `topItems` 作文件頂端摘要，題目列則依所有 page sections 的既有配對順序輸出。
- Next owner action: Antigravity 接續完成三件事：一、在模板選擇 UI 將 `語詞例句填空學習單雙欄版.docx` 對應到 `WorksheetTemplate = 'word-sentence-blank'`，並補齊 `TEMPLATE_NAMES` 的新值；二、新增 `word-sentence-blank` section 的 React renderer，直接讀取 section 內的 `topItems` 與 `itemRows`，不得在 component 再做 `slice` 或配對；三、完成 targetWord 選擇操作，使用既有 `resolveOwnSentencesForWord`／`createSentenceBlank`，把結果寫回 `AnalysisResult.characters[n].wordSentenceBlank` 後再呼叫 `buildWorksheet`。
