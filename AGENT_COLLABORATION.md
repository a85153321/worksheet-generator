# Codex × Antigravity 協作規約

本專案由兩個 agent 在同一個 repository 協作。共同目標是交付安全、可維護、可離線使用，且符合教育部辭典授權要求的 Local-First 學習單生成器。

## 0. 與工具整合

- Codex CLI 應透過 repo 根目錄的 `AGENTS.md` 讀取本文件與 `PROJECT.md`。
- `AGENTS.md` 建議說明：

  ```md
  # AGENTS.md

  本專案的協作規則請先閱讀：
  - ./PROJECT.md（產品藍圖、本機辭典架構、資料與授權規範）
  - ./AGENT_COLLABORATION.md（分工邊界、交接格式、Git 規範）

  Codex 主責 src/domain、src/services、src/infrastructure、辭典匯入工具與邏輯測試。
  修改前請確認未提交變更，不覆寫 Antigravity 的檔案。
  ```

- Antigravity 的 rules／context 也應指向相同文件，不另建第二套欄位或辭典規格。

## 1. 分工總表

| 面向 | Codex | Antigravity |
| --- | --- | --- |
| 資料模型、Zod schema、型別 | 主責 | 依契約使用，不自行改欄位語意 |
| 教育部辭典匯入、索引、版本與授權 metadata | 主責 | 顯示必要來源與授權資訊 |
| 本機查詢、錯誤契約與資料完整性 | 主責 | 呈現查詢結果及可操作錯誤 |
| IndexedDB 與教師修改資料 | 主責 | 透過 service／hook 使用 |
| 圖片／PDF 本機預處理 | 主責 | 提供操作介面與狀態呈現 |
| Use cases、測試、資料遷移 | 主責 | 可提出需求，不直接覆寫核心邏輯 |
| 設計系統、版面、元件、互動 | 提供資料與限制 | 主責 |
| 生字輸入、候選內容編輯器、預覽、空／錯誤狀態 | 提供穩定契約 | 主責 |
| A4／Word 視覺模板與列印呈現 | 定義資料輸入與測試案例 | 主責 |
| 無障礙、RWD、繁中介面文案 | 審查資料與授權影響 | 主責 |
| 整合與 PR／變更說明 | 守護契約、來源與測試 | 守護 UI 與互動品質 |

## 2. Codex 工作內容

Codex 負責「結構、資料來源與可靠性」，交付可被 UI 消費的穩定契約。

必做項目：

- 在 `src/domain/` 維護 Zod schemas、資料型別與純資料規則。
- 在 `src/services/` 提供 `lookupCharacterFromDictionary`、`analyzeTypedCharacters`、`updateAnalysisResult`、`buildWorksheet` 等本機 use cases。
- 在 `src/infrastructure/` 封裝辭典索引、IndexedDB 與檔案處理，不把資料格式細節洩漏給 UI。
- 維護官方 XLSX 到 JSON 索引的可重現匯入工具，驗證必要欄位、字詞號唯一性、版本與授權 metadata。
- 維護 `Result<T, AppError>`；查無字元必須使用 `dictionary-not-found` 並提供 `missingCharacters`。
- 撰寫單元／整合測試，覆蓋 schema、代表性辭典查詢、查無資料、同步執行與零網路請求。
- 每次改動資料契約、資料版本或索引格式時，更新 `PROJECT.md` 與 change note，並通知 Antigravity。

Codex 不負責：重做既有視覺設計、任意調整元件 DOM／CSS，或在 component 內塞入底層資料解析邏輯。

## 3. Antigravity 工作內容

Antigravity 負責「前端介面與教師工作流」，將 Codex 提供的本機查詢契約做成清楚、易用、可列印的體驗。

必做項目：

- 建立直接輸入生字、辭典查詢結果、審核編輯、本機配圖、模板選擇、A4 預覽與輸出介面。
- 維持繁體中文、鍵盤可操作，以及清楚的 loading、empty、validation、`dictionary-not-found` 狀態。
- 僅經由 services 或專用 hooks 查詢資料，不直接 import 或遍歷完整 JSON 資產。
- 將查詢設為教師按鈕觸發；輸入期間可做字元格式預覽，但不得建立第二套辭典查詢或猜測資料。
- 依 schema 呈現 `wordCandidates`、`sentenceCandidates`，並保留教師修改能力；不得另建確認狀態機制。
- 顯示必要的教育部資料來源、版本與授權署名，不改寫辭典原文。
- 針對 desktop、tablet 與列印／Word 情境驗證版面。

Antigravity 不得：直接解析完整辭典資產、複製 domain type、靜默採用其他字典或網路資料、改寫辭典注音／釋義／例句，或將教師資料輸出到第三方 analytics／console。

## 4. 共同不可違反規則

1. 《國語辭典簡編本》是生字分析的唯一資料來源；不得加入遠端模型或其他字典作為靜默 fallback。
2. 辭典資料必須保留版本、來源、授權與字詞號追溯關係；原文內容不得改寫。
3. UI 不直接讀取辭典 JSON；查詢只能經由受控的 service use case。
4. 查無資料不得猜測補值，必須回傳並呈現 `dictionary-not-found`。
5. 任何 schema 或 Word 標籤變動須先同步，並以 TypeScript 編譯與相關測試驗證。
6. 不得為了外觀方便複製 domain type 或建立第二套資料真相。
7. 教師修改資料必須與唯讀辭典分離，不得反寫原始資料資產。
8. 不得因資料實作方便而任意破壞既有 UI；契約不足時先提出最小變更。
9. 每個 agent 只修改自己主責區域；跨區修改時寫明原因、受影響檔案與回滾方式。

## 5. 每次工作前後流程

### 開始前

1. 閱讀 `PROJECT.md`、本文件與最近的 change note。
2. 查看未提交變更，不覆寫另一個 agent 的工作。
3. 宣告本次目標、預計修改檔案、是否影響契約或辭典索引。
4. 涉及資料更新時，先確認官方版本、下載來源與授權沒有改變。

### 進行中

- 先做小而可驗證的變更。
- 跨責任邊界時，以 issue、change note 或註解提出需求，不建立臨時耦合解法。
- 所有查詢均維持本機執行；新增依賴或載入策略時，明確評估離線能力、bundle 大小與同步／非同步契約。
- 不直接手改生成的辭典 JSON；資料更新必須透過匯入工具重建並驗證。

### 結束時

1. 執行 typecheck、lint、測試與必要 UI 檢查。
2. 辭典或查詢有變更時，驗證代表性字元、查無資料與零網路請求。
3. 寫下修改內容、契約變更、資料版本、已驗證項目、已知限制與下一位 agent 的行動。
4. shared contract 有變更時，附最小使用範例、Word 標籤對照或 migration note。

## 6. 交接格式

將下列格式放在 PR 描述、commit body 或 `docs/changes/` 的新檔案：

```md
## Handoff
- Owner: Codex | Antigravity
- Goal: <goal>
- Changed files: <files>
- Dictionary version: unchanged | <version>
- Contract change: none | <description>
- Verified: <typecheck / tests / representative lookups / offline check>
- Risks / open questions: <bundle size / loading contract / items or none>
- Next owner action: <action>
```

## 7. 建議目錄所有權

```text
src/assets/dictionary/** Codex（唯讀生成資料、來源與授權）
scripts/dictionary*      Codex（資料匯入與驗證工具）
src/domain/**            Codex
src/services/**          Codex
src/infrastructure/**    Codex
src/features/**          Antigravity（使用 Codex 契約）
src/components/**        Antigravity
src/styles/**            Antigravity
src/app/**               共同：小幅、協調後修改
tests/**                 共同：Codex 主責邏輯，Antigravity 主責互動
docs/**                  共同：契約、來源與授權文件以 Codex 為主
```

若現有專案目錄不同，保留相同責任邊界後再調整路徑；不要只為符合文件而大規模搬檔。

## 8. Git 分支與提交規範

- 分支命名使用 `codex/<主題>` 或 `antigravity/<主題>`；`main` 保持可執行、可展示。
- Commit message 使用 `[codex]` 或 `[antigravity]` 前綴。
- 一個 commit 只做一件事；辭典資料版本更新應與無關 UI 改動分開。
- 合併前對照第 4 節規則，並在 PR 描述或 commit body 提供第 6 節 Handoff。
- 衝突時優先保留檔案主責 agent 的版本，再手動補入另一方需要的最小修改。
- 對生成的辭典 JSON 發生衝突時，不手工拼接；以確認過的官方 XLSX 重新執行匯入工具。
