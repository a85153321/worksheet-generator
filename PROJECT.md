# 國小本機學習單生成器：專案藍圖

## 1. 產品定位

一個給教師使用的 Local-First 學習單工具。教師直接輸入生字後，系統從隨專案提供的教育部《國語辭典簡編本》文字資料查詢注音、部首、筆畫、相關詞語與例句候選；教師確認與編輯後，可輸出 A4 學習單預覽與 Word (.docx) 文件。

產品不使用生成式模型、外部分析服務或 API Key。《國語辭典簡編本》是生字分析資料的唯一來源，查詢與學習單組裝皆在瀏覽器本機完成。

## 2. 不變的產品原則

- 教師擁有最終選擇與編輯權；辭典資料只提供可驗證、可修改的候選內容。
- 生字查詢不得發出網路請求，也不得依輸入內容自行猜測辭典未提供的資料。
- 《國語辭典簡編本》資料須清楚標示來源與版本，遵守「創用CC－姓名標示－禁止改作 3.0 臺灣」授權；可重製、散布、傳輸及商業利用，但不得改寫辭典著作內容。
- 辭典原文欄位與衍生索引必須可追溯到字詞號；查詢層只能整理儲存結構與建立索引，不得改寫注音、釋義或例句。
- 教師輸入、分析結果與自行上傳的配圖留在使用者裝置，不自動上傳到第三方。
- 排版、預覽、Word 匯出與手動編輯必須在離線情況下可用。

## 3. 目標架構

```text
Browser (React + TypeScript)
├─ UI / review editor / worksheet preview
├─ bundled MOE Concised Dictionary index
│  ├─ entries keyed by wordNumber
│  ├─ entryIdsByTerm
│  └─ entryIdsByCharacter
├─ domain schemas and local lookup services
├─ optional IndexedDB for teacher-edited results
├─ local image upload / preprocessing
└─ local worksheet / Word export engine

Optional static host
└─ only serves application files and dictionary assets
```

### 儲存界線

| 資料 | 位置 | 備註 |
| --- | --- | --- |
| 《國語辭典簡編本》索引 | 隨前端打包的唯讀資產 | 保留版本、來源、授權與字詞號索引 |
| 教師輸入與查詢結果 | React state；需要持久化時使用 IndexedDB | 不自動上傳 |
| 教師自行提供的配圖 | 瀏覽器工作階段／本機儲存 | 同時保留預覽 URL 與原始 File／Blob，供 DOCX 嵌入；不送往外部服務 |
| Log / analytics | 預設關閉或匿名化 | 不得含教師輸入、完整辭典內容或本機圖片 |

完整索引目前約 10.8 MB；正式前端 bundle 約 11.5 MB、gzip 約 4.45 MB。這是維持同步查詢的已知取捨。若改用分片或 SQLite/WASM，首次載入與查詢契約必須明確改為非同步。

## 4. 技術邊界與介面契約

資料與領域邏輯是 UI 的唯一資料來源；UI 不自行解析辭典資產、不複製 domain type，也不直接猜測生字資料。

```text
UI → use cases / services → domain schemas → MOE dictionary index
```

核心 TypeScript 模組：

```text
src/
  assets/dictionary/ # 教育部辭典唯讀資料與授權說明
  domain/            # Zod schemas、types、純規則
  services/          # 本機查詢、教師更新、worksheet use cases
  infrastructure/    # 辭典索引、IndexedDB、檔案處理
  features/          # UI 功能模組與 components
  app/               # routing、providers、application composition
```

共用契約由 `src/domain/analysis-result.ts` 定義。頂層 `AnalysisResult` 包含 `characters: CharacterAnalysis[]`；每個項目至少包含：

- `character`
- `zhuyin`
- `zhuyinCandidates`（辭典中該字所有相異讀音；`zhuyin` 為目前選定讀音）
- `radical`
- `strokeCount`
- `wordCandidates`
- `sentenceCandidates`
- `wordSentenceBlank`（optional／nullable；只保存教師最終指定語詞的一組原始例句挖空資料）

`AnalysisResult` 中的教師確認候選有固定上限：`wordCandidates` 最多 3 個、`sentenceCandidates` 最多 2 則。辭典 lookup 的完整候選只供教師手動換選，不直接進入預覽或匯出資料。
- `source`

跨層操作使用 `Result<T, AppError>`。目前錯誤類型為：

- `validation`：輸入或跨層資料不符合 schema。
- `dictionary-not-found`：辭典查無一個或多個指定字元，並以 `missingCharacters` 提供明細。

主要查詢契約：

```ts
lookupCharacterFromDictionary(character): {
  character: string
  zhuyin: string
  zhuyinCandidates: string[]
  radical: string
  strokeCount: number
  wordCandidates: string[]
  wordCandidateDetails: Array<{
    text: string
    zhuyin: string
    entryWordNumber: string
    sentenceCandidates: string[]
    source: '教育部《國語辭典簡編本》'
  }>
  sentenceCandidates: string[]
  entryWordNumbers: string[]
} | null

analyzeTypedCharacters(input): Result<AnalysisResult, AppError>
```

`wordCandidateDetails` 保留每個相關詞條自己的字詞號、注音與 `[例]`；同名但不同詞條可各自保留。`wordCandidates` 仍是去重後的字串陣列，供既有 UI 與 `AnalysisResult` 使用。初次分析與教師換例句時，先合併目前已選語詞對應 detail 的例句；若這些詞條都沒有例句，才回退到整體 `sentenceCandidates` 池。

語詞挖空候選使用不帶 fallback 的 `resolveOwnSentencesForWord(lookup, word)` 保留詞條 ownership，再由 `createSentenceBlank(sentence, targetWord)` 只挖除第一次出現位置。完整候選仍是 lookup-only；canonical `AnalysisResult` 只保存教師最終選定的一組 `wordSentenceBlank`，未選定時可省略或為 `null`。

`analyzeTypedCharacters` 是同步、本機函式。查無資料不得用猜測值補齊；應回傳 `dictionary-not-found`。注音與其他辭典欄位一律隨查詢回傳，不提供省略注音的查詢開關。

圖片與 PDF 預處理契約可保留供教師整理或自行提供素材，但不負責 OCR 或自動分析生字。

### Word 動態範本契約

`reference-character-practice` 的 Word 匯出使用瀏覽器端 `easy-template-x`。範本放在
`src/assets/docx-templates/*.docx`，由建置流程自動掃描並內嵌為 base64 資產；執行時不
使用 `fetch`，也不維護檔名白名單。每份範本以 `{character}`、`{zhuyin}`、
`{radical}`、`{strokeCount}`、候選內容標籤、`{#items}...{/items}` 迴圈與 `{image}`
圖片標籤定義自己的版面。完整契約見 `docs/word-template-design-guide.md`。

生字標籤必須套用 `WorksheetCharacter` Word 字元樣式。匯出前會修改範本
`word/styles.xml` 中該樣式的 `w:rFonts`：一、二年級預設使用
`ㄅ字嗨注音標楷 Regular` 並先解析 IVS，三至六年級預設使用 `標楷體` 與原始字元。
教師配圖只從 state 保留的原始 File／Blob 讀取，以 `arrayBuffer()` 交給 Image plugin，
不從預覽 URL 重新下載。

## 5. 本機辭典查詢流程

1. 教師直接輸入一個或多個生字，按下「查詢生字資料」。
2. UI 去除重複字與標點，將字元陣列交給 `analyzeTypedCharacters`。
3. Service 逐字呼叫 `lookupCharacterFromDictionary`。
4. Infrastructure 以字詞名精確索引取得單字詞條，再以單一漢字索引取得所有相關詞條。
5. 由原始詞條組裝注音、部首、總筆畫、`wordCandidates`、保留詞條關聯的 `wordCandidateDetails`，以及從 `[例]` 擷取的整體 fallback `sentenceCandidates`。
6. 使用 Zod 驗證 `AnalysisResult`；任一字查無資料時回傳 `dictionary-not-found` 與 `missingCharacters`。
7. 教師挑選或修改候選內容，修改後再次通過 schema 驗證。
8. 教師可從本機上傳自備配圖；現有 React state 會保留原始 File／Blob，讓預覽使用 URL、Word 匯出使用實際二進位資料，再以本機模板建立預覽、Word、列印與 PDF。

整個生字查詢流程不使用 fetch、不連線到外部 API、不需要重試或配額管理。

## 6. 辭典資料與授權規範

- 唯一資料來源為教育部《國語辭典簡編本》文字資料，版本 `dict_concised_2014_20260626`。
- 官方來源與授權說明必須保留於 `src/assets/dictionary/README.md` 及產出資料的 metadata。
- 資料庫保留：字詞號、字詞名、注音、部首、總筆畫數、釋義／例句。
- `wordNumber` 是唯一主鍵；`entryIdsByTerm` 是字詞名索引；`entryIdsByCharacter` 是單一漢字到相關詞條的索引。
- 辭典字詞名、注音、釋義與例句必須原樣保存，不得為了文案、難度或年級自行改寫。
- `wordCandidates` 只能來自相關詞條的字詞名；`sentenceCandidates` 只能來自辭典釋義中的 `[例]` 原文。
- 資料轉換工具必須驗證必要欄位與字詞號唯一性，並可從官方 XLSX 重現 JSON 索引。
- 查不到的字元回傳 `null` 或 `dictionary-not-found`，不得以其他資料源靜默補值。
- 教師手動修改後的內容屬教師工作資料，必須與原始辭典資料區分，不得反寫或覆蓋唯讀辭典資產。
- 完整資料直接打包過大時，可提出按字元分片或 SQLite/WASM 方案；任何改動須同步說明載入方式、同步／非同步契約及離線可用性。

## 7. 開發里程碑

| Phase | 可驗收成果 |
| --- | --- |
| 0：規格與契約 | schema、資料流、錯誤策略、授權與協作規約完成 |
| 1：本機辭典核心 | 官方文字資料匯入、字詞號主鍵、字詞名／單字索引與查詢測試 |
| 2：教材輸入 | 直接輸入生字、去重、格式驗證與明確查無資料狀態 |
| 3：資料完整性 | 匯入腳本可重現、必要欄位驗證、版本與授權 metadata |
| 4：教師工作流 | 候選詞語／例句選擇、編輯與 schema 再驗證 |
| 5：自備配圖 | 教師本機上傳、替換／刪除，不提供自動生成 |
| 6：學習單引擎 | 動態 Word 範本 registry 與生字學習單資料組裝 |
| 7：輸出 | A4 預覽、Word (.docx) 匯出與測試 |

`buildWorksheet` 完全在本機將已驗證的 `AnalysisResult` 組裝成 `WorksheetDoc`。`WorksheetTemplate` 目前只保留 `reference-character-practice`；多份不同 DOCX 版型由 `word-template-registry.ts` 提供的 `docxTemplateId` 動態識別，不把檔名或 registry ID 混入學習單種類型別。每頁的 `sections` 提供生字預覽資料，`blocks` 保留為相容索引。資料不足時回傳明確驗證錯誤，不得呼叫其他資料源補齊。Word 匯出只走 easy-template-x，不保留 `docx` 套件的程式化組版備援路徑。

## 7a. Phase 0 起手式（具體步驟）

在開始功能開發前，先建立 React + TypeScript 專案、安裝 Zod，並建立 `src/assets/dictionary`、`src/domain`、`src/services`、`src/infrastructure`、`src/features` 與 `src/app`。根目錄應包含 `PROJECT.md`、`AGENT_COLLABORATION.md` 與指向兩者的 `AGENTS.md`。

辭典資料匯入後，至少驗證：

1. 官方版本與授權 metadata 存在。
2. 必要欄位完整。
3. 字詞號沒有重複。
4. 代表性字元可查出注音、部首、筆畫、詞語與例句。
5. 查無資料能回傳明確錯誤。
6. 查詢過程沒有網路請求。

## 8. 完成定義

第一個端到端版本必須讓使用者能：直接輸入生字、從本機《國語辭典簡編本》取得通過 schema 驗證的注音／部首／筆畫／詞語與例句候選、手動選擇或修正結果、自行上傳配圖、選擇學習單模板，並在不依賴遠端分析服務的情況下完成 A4 預覽與 Word (.docx) 匯出。

驗收時必須確認：離線查詢可用、查無資料狀態清楚、辭典署名與版本可追溯、教師修改不會改寫原始辭典資料，且執行中的程式碼不包含模型 client 或金鑰管理功能。
