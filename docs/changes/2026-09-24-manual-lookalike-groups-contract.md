# 教師手動形近字分組契約

## Handoff
- Owner: Codex
- Goal: 將形近字候選降級為教師參考建議，新增由教師手動核定的跨字分組契約與 `character-lookalike-practice` worksheet 資料結構；不建立 DOCX 或 UI。
- Changed files: `src/domain/analysis-result.ts`、`src/domain/index.ts`、`src/services/use-cases.ts`、`src/services/index.ts`、`src/services/contracts.ts`、`src/services/worksheet-builder.ts`、`tests/lookalike-groups.test.ts`、`PROJECT.md`、本文件。上一輪尚未提交的 chaizi 資產／查詢檔案維持不變。
- Dictionary version: 教育部《國語辭典簡編本》與 kfcd/chaizi revision 均 unchanged。
- Contract change: `AnalysisResult` 頂層新增 optional `lookalikeGroups`；每組 2–6 個單一字元，所有字都必須存在於同一份 `characters`，且同一字最多只能出現在一組。`WorksheetTemplate` 新增 `'character-lookalike-practice'`；每個教師分組建立一個 `character-lookalike` section，每頁最多 2 組、橫式 A4。建議查詢由 service `lookupLookalikeCandidateSuggestions()` 提供，註解明定不得自動寫入 `lookalikeGroups`。實際型別如下：

```ts
export type LookalikeGroup = {
  id: string
  characters: string[] // 2–6；皆須存在於 AnalysisResult.characters
}

export interface CharacterLookalikeWorksheetItem {
  character: string
  zhuyin: string
  radical: string
  strokeCount: number
  wordCandidates: string[]
}

export interface CharacterLookalikeWorksheetSection {
  kind: 'character-lookalike'
  id: string
  instructions: string
  groupCharacters: CharacterLookalikeWorksheetItem[]
}
```

- Verified: schema／builder 測試覆蓋每組少於 2 字、超過 6 字、引用不存在字元、同一字跨組重複，全部回傳既有 `validation` AppError；5 組分頁結果為 2／2／1，section 不會被拆到不同頁；未提供或空 `lookalikeGroups` 時不建立形近字 section/page，既有模板仍正常。測試以 spy 確認 `buildWorksheet` 不呼叫 `lookupLookalikeCandidates`，service 建議查詢也不會改動教師分組。`npm run lint` 通過；完整 `npm test` 為 15 檔 80 案例全數通過。
- Risks / open questions: 每頁 2 組是資料契約的保守上限，依單組最多 6 欄及欄內需容納注音、部首、筆畫、語詞而定；本輪沒有 renderer 或 DOCX，因此只驗證資料分頁與分組原子性，視覺高度仍須由後續 UI／模板實測。依「不動 UI」要求，完整 `npm run build` 目前會在既有 `src/components/worksheet/constants.ts` 的 exhaustive `TEMPLATE_NAMES` 缺少新 template 值時停止；domain/services 指定測試與 lint 通過，該 UI 消費端更新留給 Antigravity。
- Next owner action: Antigravity 接續完成三件事：一、製作教師輸入或勾選形近字分組的 UI，透過 `lookupLookalikeCandidateSuggestions` 顯示即時建議，但只有教師確認後才能寫入頂層 `lookalikeGroups`；二、製作 `character-lookalike` section 的即時預覽 renderer，直接使用 `groupCharacters`，不得重新查候選或自動分組；三、在模板選擇頁新增 `'character-lookalike-practice'` 入口並補齊 `TEMPLATE_NAMES`。資料品質與版面確認後，再另案建立 DOCX 範本。
