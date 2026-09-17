# 國小 AI 學習單生成器：專案藍圖

## 1. 產品定位

一個給教師使用的 Local-First 學習單工具：上傳教材後，協助整理生字、注音、部首、筆畫、詞語、例句與配圖建議；教師確認與編輯後，輸出可列印的 A4 學習單與 PDF。

第一版採 **BYOK（Bring Your Own Key）**：每位使用者自行提供 Gemini API Key，瀏覽器直接呼叫 Gemini。網站與任何自有後端都不得接收、轉送、紀錄或儲存該 Key。

## 2. 不變的產品原則

- 教師擁有最終編輯權；AI 僅提供可驗證、可修改的草稿。
- 品質優先，但以減少不必要請求、快取與明確確認來節省 quota。
- 所有教材、分析結果與生成圖片優先留在使用者裝置。
- 無 AI 也必須能完成排版、預覽、列印、PDF 與手動編輯。
- 每項昂貴操作必須有明確的使用者觸發與費用／quota 提示。

## 3. 目標架構

```text
Browser (React + TypeScript)
├─ UI / worksheet preview / editor
├─ local settings (API Key only)
├─ bundled CNS11643 lookup (zhuyin / radical / stroke count)
├─ IndexedDB (document, analysis and reading-passage cache)
├─ Gemini client ────────────────────> Gemini API
└─ local worksheet / print / PDF engine

Optional static host
└─ only serves application files; never proxies Gemini requests or API Keys
```

### 儲存界線

| 資料 | 位置 | 備註 |
| --- | --- | --- |
| Gemini API Key | 本機設定儲存 | 預設不顯示完整值；可測試與清除 |
| 教材檔案、分析結果、閱讀短文快取 | IndexedDB | 使用者可刪除；不可自動上傳 |
| 畫面狀態 | React state | 不含 Key |
| Log / analytics | 不得含 Key、教材原檔或完整模型回覆 | 預設關閉或匿名化 |

## 4. 技術邊界與介面契約

資料與領域邏輯是 UI 的唯一資料來源；UI 不自行推測生字資料、直接讀取 API Key，或直接呼叫 Gemini。

```text
UI → use cases / services → domain schemas → storage or Gemini client
```

核心 TypeScript 模組建議：

```text
src/
  domain/        # Zod schemas、types、純規則
  services/      # 分析、快取、短文生成、worksheet use cases
  infrastructure/ # Gemini client、IndexedDB、hash、檔案預處理
  features/      # UI 功能模組與 components
  app/           # routing、providers、application composition
```

任何跨層資料都以 Zod schema 驗證。分析結果至少包含：`characters`、注音、部首、筆畫、詞語、例句、信心值、來源頁面／區塊、圖片建議與可編輯狀態。

教材輸入契約由 `src/domain/processed-material.ts` 定義。UI 透過 services 的
`processUploadedImage` 處理單張圖片；PDF 則先呼叫 `inspectUploadedPdf` 取得頁面清單，
待使用者選頁後再呼叫 `processSelectedPdfPages`。兩條流程共用旋轉、裁切、縮放與壓縮設定。


目前共用契約由 `src/domain/analysis-result.ts` 定義：頂層 `AnalysisResult` 包含
`characters: CharacterAnalysis[]`；每個項目使用 `zhuyin`、`radical`、
`strokeCount`、`words`、`exampleSentences`、`confidence`、`source`、
`imageSuggestion` 與 `editableState`。跨層操作以 `Result<T, AppError>` 回傳，
錯誤類別包含 `validation`、`network`、`authentication` 與 `quota`。

教師可選擇上傳圖片／PDF，或直接輸入生字。兩條路徑都回傳同一個
`AnalysisResult`；注音、部首與總筆畫一律由隨專案打包的 CNS11643 精簡資料查詢，
Gemini 不負責產生這三個事實欄位。查不到的字元不得以猜測值補齊，應回傳可操作的
`validation` 錯誤與 `missingCharacters` 明細。


## 5. Quota-aware 流程

1. 使用者選擇圖片或 PDF 頁面。
2. 瀏覽器旋轉、裁切、縮放與壓縮；PDF 必須先選頁。
3. 對已處理輸入計算 hash，先查詢 IndexedDB 分析快取。
4. 未命中時，圖片流程發出 **一次** 多模態結構化請求，只辨識生字並產生詞語／例句；
   直接輸入流程發出 **一次** 純文字結構化請求，只產生詞語／例句。
5. 以本機 CNS11643 查表補齊注音、部首與筆畫，再做 Zod 驗證；格式錯誤最多一次
   受控修復。網路暫時錯誤最多一次重試；認證、配額與 4xx 不重試。
6. 教師審核／修改結果。
7. 教師可選擇從本機上傳自備配圖；系統不提供 AI 圖片生成。
8. 閱讀理解短文只在教師於模板預覽階段明確觸發後生成；先依標準化 prompt 查本機快取，
   未命中才呼叫 Gemini。選擇題仍由本機依短文與生字資料組裝。
9. 用本機模板產生 A4 預覽、列印與 PDF；除前述明確觸發的短文生成外，排版本身不呼叫 AI。

## 6. AI 呼叫規範

- 分析請求必須要求 JSON schema 相容的輸出，並設定清楚的年級、語言與教材情境。
- Gemini 分析 schema 不包含注音、部首與筆畫；這三欄只能來自本機 CNS11643 查表。
- `analyzeTypedCharacters` 只可在教師完成輸入並明確按下分析按鈕後執行；輸入變更、
  mount 或重新 render 不得自動呼叫 Gemini。
- 年級必須實際影響造詞範圍、詞語難度、例句長度與句型／修辭複雜度；分析快取 key
  必須包含年級與語言，避免切換年級時誤用其他年級的結果。
- 分析 context 可帶入 `includeZhuyin`；注音關閉時保留 `zhuyin` 欄位但允許空字串。
  快取 key 必須包含此設定，避免切換注音模式時誤用結果。
- 教材分析預設使用 GA 穩定模型 `gemini-3.5-flash`，透過
  `v1beta/models/gemini-3.5-flash:generateContent` 呼叫；模型與 endpoint 集中由
  infrastructure 常數管理，不在 UI 或 service 重複寫死。
- 閱讀短文生成使用 GA 穩定模型 `gemini-3.8-flash`，透過
  `v1beta/models/gemini-3.8-flash:generateContent` 呼叫並要求 JSON schema 相容輸出。
- 將相關資料合併成單一高品質請求，避免「生字、注音、詞語」分開呼叫。
- `lookalikeCandidates` 僅能使用教育部常用字表內、國小學生會接觸的常用字，
  不得因部首或筆畫相近而選入生僻字或罕見字。
- 低信心、歧義 OCR、筆畫或部首不確定時標示 `needsReview`，不可偽裝成確定答案。
- `confidence < 0.8` 時由 domain 規則自動加入 `low-confidence`；OCR、部首或筆畫
  不確定性分別以 `reviewReasons` 的 `ambiguous-ocr`、`uncertain-radical`、
  `uncertain-stroke-count` 表示。只有教師設為 `confirmed` 後才清除審核提示。
- 閱讀理解短文只使用教師確認保留的生字；教師可選擇 30、50、60 或 100 字的正文
  上限，年級只用於調整語言難度。短文必須連貫且包含所有指定生字，不得直接拼接例句。
- 顯示本次動作的預估處理範圍（頁數、選取項目數）；不承諾或猜測實際費用。

## 7. 開發里程碑

| Phase | 可驗收成果 |
| --- | --- |
| 0：規格與契約 | schema、資料流、錯誤策略、協作規約完成 |
| 1：Local AI Core | 本機 Key 設定／清除／測試、圖片分析、驗證結果顯示 |
| 2：教材輸入 | 圖片預處理、PDF 選頁與結構化教材資料 |
| 3：快取與韌性 | hash、IndexedDB、受控 retry、可刪除快取 |
| 4：教師工作流 | 結果審核、低信心標示、編輯與版本狀態 |
| 5：自備配圖 | 教師本機上傳、替換／刪除 |
| 6：學習單引擎 | 生字、詞語、句子、看圖、字音字形辨析與閱讀理解模板 |
| 7：輸出 | A4 預覽、列印 CSS、PDF 匯出與測試 |

`buildWorksheet` 完全在本機將已驗證的分析結果組裝成 `WorksheetDoc`。模板識別值為
`character-practice`、`word-practice`、`sentence-practice`、`picture-practice`、
`character-discrimination`、`reading-comprehension`；
每頁的 `sections` 是預覽／列印的主要資料來源，舊有 `blocks` 保留為相容索引。
所有模板只使用已驗證的 `AnalysisResult` 在本機組裝；若資料未達題型門檻，
只省略不足的部分，不呼叫 AI 補齊。

## 7a. Phase 0 起手式（具體步驟）

在請 Codex／Antigravity 開始寫功能程式碼之前，先手動（或請其中一個 agent）完成以下骨架，讓兩邊都有一致的起點：

```bash
# 建立 Vite + React + TypeScript 專案
npm create vite@latest worksheet-generator -- --template react-ts
cd worksheet-generator

# 安裝 domain 驗證與常用工具
npm install zod
npm install -D typescript

# 建立目錄骨架
mkdir -p src/domain src/services src/infrastructure src/features src/app

# 建立 .gitignore（若 Vite 模板未附上完整版本，補上這些）
cat >> .gitignore << 'EOF'
node_modules
dist
.env
.env.local
EOF
```

完成後把 `PROJECT.md`、`AGENT_COLLABORATION.md`（以及之後會建立的 `AGENTS.md`）放在 repo 根目錄，再進行第一次 commit。這一步結束後才算真正進入 Phase 0 的「契約完成」狀態。

## 8. 完成定義

第一個端到端版本必須讓使用者能：輸入自己的 Key、上傳一張教材圖片、取得可驗證的結構化草稿、手動修正、選擇一種學習單模板，並在不經自有 AI 後端的前提下完成 A4 預覽與列印／PDF。
