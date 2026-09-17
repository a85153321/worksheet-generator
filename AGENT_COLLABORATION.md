# Codex × Antigravity 協作規約

本專案由兩個 agent 同時在同一個 repository 工作。共同目標是交付安全、可維護且教師可用的 Local-First 學習單生成器。

## 0. 與工具整合

- **Codex CLI 會自動讀取 repo 根目錄的 `AGENTS.md`** 作為預設指示，不需要每次手動貼規則。建議在根目錄建立一份精簡的 `AGENTS.md`，內容指向本文件與 `PROJECT.md`，例如：

  ```md
  # AGENTS.md

  本專案的協作規則請先閱讀：
  - ./PROJECT.md（產品藍圖、架構、AI 呼叫規範）
  - ./AGENT_COLLABORATION.md（分工邊界、交接格式、Git 規範）

  Codex 只負責 src/domain、src/services、src/infrastructure、tests 中的邏輯測試。
  修改前請先確認未提交變更，不覆寫 Antigravity 的檔案。
  ```

- Antigravity 若有自己讀取專案設定的機制（例如專屬的 rules／context 檔），可比照辦理，指向同樣兩份文件，確保兩邊看到的規則永遠一致、不需要各自維護一份副本。

## 1. 分工總表

| 面向 | Codex | Antigravity |
| --- | --- | --- |
| 資料模型、Zod schema、型別 | 主責 | 依契約使用，不自行改欄位語意 |
| Gemini client、請求／錯誤／retry 策略 | 主責 | 不直接實作或呼叫 |
| API Key、快取、hash、IndexedDB | 主責 | 透過 service／hook 使用 |
| 檔案預處理、PDF 頁面資料流程 | 主責 | 提供操作介面與狀態呈現 |
| Use cases、測試、資料遷移 | 主責 | 可提出需求，不直接覆寫核心邏輯 |
| 設計系統、版面、元件、互動 | 提供資料與限制 | 主責 |
| 表單、上傳、編輯器、預覽、空／錯誤狀態 | 提供狀態契約 | 主責 |
| A4 視覺模板與列印呈現 | 定義資料輸入與測試案例 | 主責 |
| 無障礙、RWD、繁中介面文案 | 審查資料／安全影響 | 主責 |
| 整合與 PR／變更說明 | 守護契約與測試 | 守護 UI 與互動品質 |

## 2. Codex 工作內容

Codex 負責「結構、資料與可靠性」，交付可被 UI 消費的穩定契約。

必做項目：

- 在 `src/domain/` 維護 Zod schemas、資料型別與資料轉換。
- 在 `src/services/` 提供明確的 use cases，例如 `analyzeMaterial`、`analyzeTypedCharacters`、`getCachedAnalysis`、`generateReadingPassage`、`buildWorksheet`。
- 在 `src/infrastructure/` 封裝 Gemini、IndexedDB、hash、檔案處理；避免把實作洩漏給 UI。
- 設計 `Result<T, AppError>` 或等效錯誤契約，讓 UI 能顯示可理解、可行動的訊息。
- 撰寫單元／整合測試，覆蓋 schema、快取命中、retry 上限與 API Key 不外洩。
- 每次改動資料契約，更新 `PROJECT.md` 與 change note，並先通知 Antigravity。

Codex 不負責：重做既有視覺設計、任意調整元件 DOM／CSS、在 component 內塞入資料存取邏輯。

## 3. Antigravity 工作內容

Antigravity 負責「前端介面與教師工作流」，將 Codex 提供的資料契約做成清楚、易用、可列印的體驗。

必做項目：

- 建立頁面與元件：Key 設定、教材上傳、頁面選擇、分析進度、審核編輯、圖片選擇、模板選擇、A4 預覽與輸出。
- 維持繁體中文、鍵盤可操作、清楚的 loading／empty／error／quota 狀態。
- 僅經由 services 或專用 hooks 取得資料與發起動作。
- 將「圖片分析」、「直接輸入生字分析」、「閱讀短文生成」等昂貴行為設成使用者明確按鈕，不在 mount、輸入變更或自動重繪時觸發。
- 依 Codex schema 呈現低信心與 `needsReview`，並保留教師修改能力。
- 針對 desktop、tablet 與列印情境驗證版面。

Antigravity 不得：讀寫 API Key、直接呼叫 Gemini、修改 Zod schema 語意、繞過快取、將教材或回覆輸出到第三方 analytics／console。

## 4. 共同不可違反規則

1. API Key 不進 Git、不進 `.env` 前端打包、不寫進 log、不經過自有伺服器。
2. UI 不直接呼叫 Gemini；Gemini 請求只能由受控 client 發出。
3. 任何 schema 變動先同步，並以 TypeScript 編譯與相關測試驗證。
4. 不得為了外觀方便而複製 domain type 或建立第二套資料真相。
5. 不得因資料實作方便而任意破壞既有 UI；若 API 契約不足，先提出最小變更。
6. 每個 agent 只修改自己主責區域。需跨區修改時，先寫明原因、受影響檔案與回滾方式。

## 5. 每次工作前後流程

### 開始前

1. 閱讀 `PROJECT.md`、本文件與最近 change note。
2. 查看現有未提交變更；不可覆寫另一個 agent 的工作。
3. 宣告本次目標、預計修改檔案與是否影響契約。

### 進行中

- 先做小而可驗證的變更。
- 跨責任邊界時，以 issue／註解提出需求，不用臨時耦合解法。
- 任何會產生 Gemini 請求的操作，都要確認快取檢查與使用者觸發存在。

### 結束時

1. 執行相關 typecheck、測試與 UI 檢查。
2. 寫下：修改內容、契約變更、已驗證項目、已知限制、下一位 agent 的行動。
3. 若改了 shared contract，附上最小使用範例或 migration note。

## 6. 交接格式

將下列格式放在 PR 描述、commit body 或 `docs/changes/` 的新檔案：

```md
## Handoff
- Owner: Codex | Antigravity
- Goal: <goal>
- Changed files: <files>
- Contract change: none | <description>
- Verified: <checks>
- Risks / open questions: <items or none>
- Next owner action: <action>
```

## 7. 建議目錄所有權

```text
src/domain/**           Codex
src/services/**         Codex
src/infrastructure/**   Codex
src/features/**         Antigravity（使用 Codex 契約）
src/components/**       Antigravity
src/styles/**           Antigravity
src/app/**              共同：小幅、協調後修改
tests/**                共同：Codex 主責邏輯，Antigravity 主責互動
docs/**                 共同：契約類文件以 Codex 為主
```

若現有專案目錄不同，先保留相同責任邊界，再調整路徑；不要為了符合本文件而大規模搬檔。

## 8. Git 分支與提交規範

由於是同一位使用者（你）在不同時間分別驅動 Codex 與 Antigravity 工作，並非兩者同時自動 push，建議用以下方式讓 GitHub Desktop 上的紀錄一目了然：

- **分支命名**：`codex/<主題>`（例如 `codex/analysis-schema`）、`antigravity/<主題>`（例如 `antigravity/upload-page`）。`main` 永遠保持可執行、可展示的狀態。
- **Commit message 前綴**：`[codex] ...` 或 `[antigravity] ...`，方便之後在 History 面板快速分辨是誰改的。
- **小步提交**：一個 commit 只做一件事（例如「新增 analyzeMaterial use case」），避免一次改動橫跨多個責任區域。
- **合併回 main 前**：對照本文件第 4 節「共同不可違反規則」自我檢查一次，並在 PR 描述或 commit body 貼上第 6 節的交接格式。
- **衝突處理**：因為目錄所有權（第 7 節）已經分開，兩個 agent 理論上不太會改到同一個檔案；若真的衝突，優先保留該檔案「主責 agent」的版本，再手動補上另一邊需要的小改動。
