# Handoff：全面改用教育部《國語辭典簡編本》本機資料

## Handoff

- Owner: Codex
- Goal: 移除所有模型與 API Key 功能，以《國語辭典簡編本》作為分析資料的唯一來源。
- Contract change: `analyzeMaterial` 移除；`analyzeTypedCharacters` 改為同步；`words`／`exampleSentences` 改名為 `wordCandidates`／`sentenceCandidates`；新增 `dictionary-not-found`。
- Verified: 官方資料 45,130 筆且字詞號唯一；本機查詢測試、無網路請求測試、lint、unit tests、production build。
- Risks / open questions: 完整索引使主要前端 bundle 約 11.5 MB（gzip 約 4.45 MB）；若要改善首屏載入，需改成非同步分片或 SQLite/WASM。
- Next owner action: Word 範本直接使用下方欄位標籤；同步更新產品文件中仍描述舊模型流程的段落。

## 資料來源與授權

- 名稱：中華民國教育部《國語辭典簡編本》
- 版本：`dict_concised_2014_20260626`
- 官方下載頁：`https://language.moe.gov.tw/001/Upload/Files/site_content/M0001/respub/dict_concised_download.html`
- 原始文字資料：`dict_concised_2014_20260626.zip`，內含 XLSX，不含圖片與語音。
- 授權：創用CC-姓名標示-禁止改作 3.0 臺灣（CC BY-ND 3.0 TW）。官方說明允許重製、散布、傳輸及商業利用，但不得修改著作，並須遵守使用說明。
- 處理原則：字詞名、注音、部首、筆畫、釋義文字原樣保留；JSON 僅改變儲存結構並建立索引，不改寫辭典內容。

## 本機資料庫結構

檔案：`src/assets/dictionary/dict-concised.json`

```ts
interface DictionaryAsset {
  metadata: {
    title: string
    version: string
    sourceUrl: string
    license: string
    recordCount: number
    tupleFields: readonly string[]
  }
  entries: Array<[
    wordNumber: string,
    wordName: string,
    zhuyin: string,
    radical: string,
    strokeCount: number,
    definition: string,
  ]>
  entryIdsByTerm: Record<string, string[]>
  entryIdsByCharacter: Record<string, string[]>
}
```

- `wordNumber`（字詞號）是唯一主鍵，45,130 筆均不重複。
- `entryIdsByTerm` 是字詞名精確查詢索引。
- `entryIdsByCharacter` 可由單一漢字取得所有包含該字的詞條與例句。
- 原始 JSON 約 10.8 MB；目前為滿足同步查詢而直接打包。正式 bundle 約 11.5 MB，gzip 約 4.45 MB。

## 查詢函式

```ts
import {
  analyzeTypedCharacters,
  lookupCharacterFromDictionary,
} from './src/services'

const lookup = lookupCharacterFromDictionary('學')
// {
//   character: '學',
//   zhuyin: 'ㄒㄩㄝˊ',
//   radical: '子',
//   strokeCount: 16,
//   wordCandidates: ['學習', '學生', ...],
//   sentenceCandidates: ['我們要努力學習。', ...],
//   entryWordNumbers: ['...', ...]
// }

const result = analyzeTypedCharacters({
  characters: ['學', '習'],
  context: { includeZhuyin: true },
})
// 同步回傳 Result<AnalysisResult, AppError>；不回傳 Promise，也不發出網路請求。
```

查無資料時：

```ts
{
  ok: false,
  error: {
    type: 'dictionary-not-found',
    message: '《國語辭典簡編本》查無此字：𠀀。',
    retryable: false,
    missingCharacters: ['𠀀'],
  },
}
```

## Word 範本標籤命名對照表

| 標籤 | TypeScript 欄位 | 型別 | 說明 |
| --- | --- | --- | --- |
| `{{character}}` | `character` | `string` | 單一生字 |
| `{{zhuyin}}` | `zhuyin` | `string` | 教育部注音；關閉注音時為空字串 |
| `{{radical}}` | `radical` | `string` | 部首字 |
| `{{strokeCount}}` | `strokeCount` | `number` | 總筆畫數 |
| `{{wordCandidates}}` | `wordCandidates` | `string[]` | 含該生字的辭典字詞名候選 |
| `{{sentenceCandidates}}` | `sentenceCandidates` | `string[]` | 從辭典 `[例]` 欄位擷取的原文例句候選 |
| `{{source.page}}` | `source.page` | `number \| null` | 本機辭典流程固定為 `null` |
| `{{source.block}}` | `source.block` | `string \| null` | 固定為 `教育部《國語辭典簡編本》` |
| `{{editableState.status}}` | `editableState.status` | `draft \| edited \| confirmed` | 教師審核狀態 |

陣列欄位建議由 Word 範本引擎提供 repeat 區塊；不要先串成單一字串，以免失去逐項排版能力。

## 移除的檔案

- `src/infrastructure/gemini-client.ts`
- `src/infrastructure/api-key-store.ts`
- `src/services/key-settings.ts`
- `src/features/settings/SettingsPage.tsx`
- `tests/gemini-client.test.ts`
- `tests/api-key-integration.test.ts`
- `tests/cache.test.ts`（舊模型分析快取測試）
- `src/infrastructure/character-info.ts`
- `src/infrastructure/data/cns11643-character-info.json`
- `src/infrastructure/data/README.md`
- `scripts/build-cns11643-character-data.mjs`
- `tests/character-info.test.ts`

## 新增的檔案

- `src/assets/dictionary/dict-concised.json`
- `src/assets/dictionary/README.md`
- `src/infrastructure/moe-dictionary.ts`
- `scripts/build-moe-concised-dictionary.py`
- `tests/moe-dictionary.test.ts`

## PROJECT.md 建議修改（本次未改動）

依使用者要求，本次不修改 `PROJECT.md`。建議確認後一次調整：

1. 標題與第 1 節：移除「AI」、BYOK 與 Gemini 定位，改為教育部辭典本機工具。
2. 第 2 節：移除 quota、昂貴請求與模型草稿原則，補上辭典署名及禁止改作規範。
3. 第 3 節：移除 API Key、Gemini client 與遠端 API 架構，加入 bundled dictionary index。
4. 第 4 節：資料流改為 `UI → services → domain → MOE dictionary index`；更新 `wordCandidates`、`sentenceCandidates` 與 `dictionary-not-found`。
5. 第 5 節：整段 Quota-aware 流程改為同步本機查詢流程。
6. 第 6 節：整段模型呼叫規範移除，改為辭典版本、授權、索引與查無資料規範。
7. 第 7 節：Phase 1、3、4 的模型、Key、retry、信心描述改成本機辭典匯入與教師審核。
8. 第 8 節：完成定義移除 Key、圖片分析與遠端模型，改為直接輸入生字到本機查詢的端到端流程。

`AGENT_COLLABORATION.md` 也仍包含 Gemini、API Key、quota 舊分工，建議與 `PROJECT.md` 同批確認後更新。
