## Handoff

- Owner: Codex
- Goal: 新增字音字形辨析單與閱讀理解評量單，維持學習單引擎完全本機運作。
- Changed files: `PROJECT.md`, `src/domain/analysis-result.ts`, `src/domain/app-error.ts`, `src/domain/index.ts`, `src/infrastructure/gemini-client.ts`, `src/services/contracts.ts`, `src/services/index.ts`, `src/services/worksheet-builder.ts`, `tests/worksheet-builder.test.ts`
- Contract change: `CharacterAnalysis` 新增兩個可選欄位；`AppError`、`WorksheetTemplate`、`WorksheetSection` 與 `WorksheetDoc.templateLabel` 新增 union 成員。
- Verified: `npm test`, `npm run build`
- Risks / open questions: 預覽 UI 需為兩個新的 section kind 製作正式視覺版型；目前資料契約已可直接串接。
- Next owner action: Antigravity 依下列 section 結構呈現新模板，並提供選擇入口。

### Schema 變動

`CharacterAnalysis` 新增可選欄位：

```ts
lookalikeCandidates?: Array<{
  character: string
  radical: string
  strokeCount: number
}>

multiPronunciations?: Array<{
  pronunciation: string
  word: string
}>
```

兩個欄位可以不存在或為空陣列。Gemini 結構化輸出的 JSON schema 亦已同步接受這些欄位，但 `buildWorksheet` 本身不會呼叫 Gemini。

### 新錯誤型別

```ts
{
  type: 'no-eligible-characters'
  template: 'character-discrimination' | 'reading-comprehension'
  message: string
  retryable: false
  details?: Record<string, unknown>
}
```

辨析單只有在整份教材每個字都同時沒有形近字與多音字資料時回傳此錯誤。閱讀評量只有在短文、選擇題、問答題三者都無法產出時回傳此錯誤。

### `character-discrimination` section

每個至少有一種辨析資料的生字會建立一個 section；兩個陣列獨立 fallback，缺少的一側回傳空陣列。

```ts
{
  kind: 'character-discrimination'
  id: string
  instructions: string
  item: {
    character: string
    zhuyin: string
    lookalikeCandidates: Array<{ character: string; radical: string; strokeCount: number }>
    multiPronunciations: Array<{ pronunciation: string; word: string }>
    handwritingLineCount: 3
  }
}
```

### `reading-comprehension` section 與資料門檻

- 短文：至少 3 個 schema 驗證通過的非空完整例句；最多取前 5 句組裝。
- 選擇題：至少 2 個不同生字各自有非空詞語；達門檻後每個符合的生字各產出 1 題。
- 問答題：至少 1 個完整例句；最多取前 3 句各產出 1 題。
- 各題型獨立判斷，不足時使用 `null` 或空陣列，絕不以 AI 或虛構內容補題。

```ts
{
  kind: 'reading-comprehension'
  id: string
  instructions: string
  item: {
    passage: null | { title: string; text: string; sentences: string[] }
    multipleChoiceQuestions: Array<{
      id: string
      character: string
      prompt: string
      options: string[]
      correctAnswer: string
    }>
    openResponseQuestions: Array<{
      id: string
      prompt: string
      sourceSentence: string
      answerLineCount: number
    }>
  }
}
```
