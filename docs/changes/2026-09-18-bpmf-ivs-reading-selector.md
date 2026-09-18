## Handoff
- Owner: Codex
- Goal: 加入破音字讀音候選、bpmfvs IVS resolver，並讓審查卡片與 Word 匯出使用教師選定讀音。
- Changed files: `scripts/build-bpmf-ivs-map.mjs`, `scripts/vendor/bpmfvs/phonic_table_Z.txt`, `src/assets/fonts/bpmf-ivs-map.json`, `src/assets/fonts/README.md`, `src/domain/analysis-context.ts`, `src/domain/analysis-result.ts`, `src/infrastructure/bpmf-ivs.ts`, `src/infrastructure/moe-dictionary.ts`, `src/infrastructure/index.ts`, `src/services/contracts.ts`, `src/services/docx-builder.ts`, `src/services/use-cases.ts`, `src/app/AppContext.tsx`, `src/app/app-context.ts`, `src/features/upload/UploadPage.tsx`, `src/features/review/ReviewPage.tsx`, `src/features/preview/PrintPreviewPage.tsx`, `src/features/templates/TemplateSelectionPage.tsx`, `src/styles/app.css`, `tests/bpmf-ivs.test.ts`, `tests/moe-dictionary.test.ts`, `tests/docx-builder.test.ts` 及既有測試 fixture；移除 `src/assets/fonts/BpmfZihiBox-R.ttf`。
- Dictionary version: unchanged (`dict_concised_2014_20260626`)
- Contract change: `CharacterAnalysis` 新增必填 `zhuyinCandidates: string[]`；`zhuyin` 改為單一目前選定讀音且必須存在於候選陣列；`AnalysisContextInput` 移除 `includeZhuyin`；`WorksheetFont` 移除 `zihi-box-zhuyin`。
- Verified: `npm run build:bpmf-ivs -- --check`; `npx tsc -b --pretty false`; `npm run lint`; `npm test -- --run`（6 files / 30 tests）；`npm run build`。
- Risks / open questions: bpmfvs 第一讀音不帶 IVS，resolver 對第一讀音會回傳 `null`，顯示函式因此保留原字；只有完全相符的注音才套用 selector，不做正規化或猜測。舊的 IndexedDB `AnalysisResult` 沒有 `zhuyinCandidates` 時不符合新 schema，需要重新查詢生字資料。
- Next owner action: Antigravity 可直接用 `zhuyinCandidates` 渲染讀音下拉；儲存時只更新同一筆資料的 `zhuyin`，Word 匯出會讀取該目前值。

### 資料形狀

```ts
{
  character: '行',
  zhuyin: 'ㄒㄧㄥˊ',
  zhuyinCandidates: ['ㄒㄧㄥˊ', 'ㄏㄤˊ', 'ㄒㄧㄥˋ'],
  // radical / strokeCount / wordCandidates / sentenceCandidates / source 不變
}
```

`chooseDefaultReading(character, zhuyinCandidates)` 位於
`src/infrastructure/moe-dictionary.ts`。規則是保留教育部辭典精確單字詞條的順序，
選擇去重後第一個讀音；不依字形或例詞猜測。

### IVS resolver

位置：`src/infrastructure/bpmf-ivs.ts`

```ts
resolveBopomofoVariationSelector(
  character: string,
  selectedZhuyin: string,
): string | null

resolveBopomofoDisplayCharacter(
  character: string,
  selectedZhuyin: string,
): string
```

查詢採完全相符。非預設讀音有對應時回傳 U+E01E1～U+E01E5；第一讀音、
未知讀音或未知字元回傳 `null`，display resolver 則回傳原字。Word 匯出只在
`zihi-kai-zhuyin`、`zihi-only-zhuyin` 套用 display resolver；`standard-kai`
永遠寫入原始生字。

### IVS 資產來源

- 上游：<https://github.com/ButTaiwan/bpmfvs/blob/62683aa/phonetic/phonic_table_Z.txt>
- 固定 commit：`62683aa`
- SHA-256：`3310ecd8fcc7fa70bf5cda0731a96441628cc773eb0857977ed4bb73e0e94b60`
- 授權：規格與程式碼 Apache-2.0；專案已保留上游 license 與 NOTICE。
- 重建：`npm run build:bpmf-ivs`；驗證產物：`npm run build:bpmf-ivs -- --check`。
