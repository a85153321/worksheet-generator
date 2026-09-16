# 開發路線圖：Round 2 → 完成

本文件延續 `PROJECT.md` 第 7 節里程碑，把每一輪 Codex／Antigravity 的分工任務、
具體提示詞、commit 訊息與合併步驟都寫清楚。每輪的操作模式固定，照抄即可。

## 固定循環（每一輪都一樣）

```
1. 切 codex/<主題> 分支 → 下任務 → review → commit → push
2. 切 antigravity/<主題> 分支 → 下任務 → review → commit → push
3. 切回 main → merge codex 分支 → push
4. merge antigravity 分支 → 若有衝突，處理後 Continue merge → push
5. npm run dev 確認畫面與 console 正常，再進下一輪
```

### 已知的衝突地雷（前幾輪學到的經驗，提前避開）

- **Codex 修改 barrel 檔案（如 `src/domain/index.ts`）時，明確要求「在既有內容基礎上新增 export，不要整個覆寫檔案」**，否則兩次任務之間容易自己打架。
- **Antigravity 不要自己在 `src/domain/` 底下建檔案**。schema 還沒合併進來時，請它在自己的 feature 資料夾內用暫時型別或本地 mock，不要碰 domain 目錄。
- 每輪任務開頭固定加一句「請先讀 PROJECT.md 和 AGENT_COLLABORATION.md」。

---

## Round 2：Gemini Client、快取 ×  Key 設定頁

### Codex 任務（分支：`codex/gemini-client`）

```
請先讀 PROJECT.md 和 AGENT_COLLABORATION.md。

任務：
1. 在 src/infrastructure/ 實作 Gemini client，遵守 PROJECT.md 第 6 節
   「AI 呼叫規範」：單一結構化請求、JSON schema 相容輸出、格式錯誤
   最多一次受控修復、網路錯誤最多重試一次、認證/配額/4xx 不重試。
2. 在 src/infrastructure/ 實作 hash 工具（對已處理輸入計算 hash）與
   IndexedDB 封裝（分析結果快取、圖片快取，皆可刪除）。
3. 在 src/services/ 把 analyzeMaterial、getCachedAnalysis 從 mock
   換成真正呼叫 infrastructure 層的邏輯，維持原本的函式簽名不變。
4. 如果 src/domain/index.ts 已存在，請新增 export，不要整個覆寫檔案。
5. 補上針對 retry 上限、快取命中、API Key 不外洩的測試。
6. 完成後列出修改/新增的檔案，以及是否有任何 contract 變動。
```

### Antigravity 任務（分支：`antigravity/api-key-page`）

```
請先讀 PROJECT.md 和 AGENT_COLLABORATION.md。

任務：
1. 建立 API Key 設定頁：輸入、測試連線、清除功能。
   注意 PROJECT.md 儲存界線表格：Key 只能存在本機設定儲存，
   不可寫入 log、不可自動送出。
2. Key 欄位預設用遮罩顯示（不顯示完整值），旁邊放測試按鈕與清除按鈕。
3. 目前若 src/domain 的相關型別還沒合併到這個分支，請用暫時型別，
   不要自己在 src/domain/ 建檔案。
4. 確認鍵盤可操作、繁體中文文案、loading/error 狀態清楚。
```

### 收尾

- Commit：`[codex] 新增 Gemini client、hash 與 IndexedDB 快取`
- Commit：`[antigravity] 新增 API Key 設定頁`
- 合併順序：先 merge codex 分支到 main，再 merge antigravity 分支。

---

## Round 3：檔案預處理／PDF 選頁 × 上傳與選頁 UI

### Codex 任務（分支：`codex/file-processing`）

```
請先讀 PROJECT.md 和 AGENT_COLLABORATION.md。

任務：
1. 在 src/infrastructure/ 實作圖片預處理（旋轉、裁切、縮放、壓縮）。
2. 實作 PDF 選頁邏輯：讀取 PDF、列出頁面、回傳選定頁面的處理結果。
3. 在 src/services/ 提供對應 use case，讓 UI 可以呼叫
   「上傳圖片 → 取得處理後結果」「上傳 PDF → 選頁 → 取得處理後結果」。
4. 錯誤情況（檔案格式不支援、PDF 損毀等）要回傳明確的 AppError。
5. 完成後列出檔案清單與 use case 使用方式範例。
```

### Antigravity 任務（分支：`antigravity/upload-ui`）

```
請先讀 PROJECT.md 和 AGENT_COLLABORATION.md。

任務：
1. 完成教材上傳頁：支援圖片與 PDF 上傳、PDF 需顯示頁面縮圖供選頁。
2. 完成分析進度顯示：呼叫分析 use case 時顯示明確的 loading 狀態，
   並顯示「本次動作的預估處理範圍」（頁數、選取項目數，依 PROJECT.md
   第 6 節規範，不可承諾或猜測實際費用）。
3. 確保「分析」這個昂貴操作只能由使用者明確按鈕觸發，不能在
   mount 或輸入變更時自動觸發。
```

### 收尾

- Commit：`[codex] 新增圖片預處理與 PDF 選頁邏輯`
- Commit：`[antigravity] 完成教材上傳頁與分析進度顯示`
- 合併：codex → main → antigravity。

---

## Round 4：Retry／needsReview 邏輯 × 審核編輯頁

### Codex 任務（分支：`codex/review-logic`）

```
請先讀 PROJECT.md 和 AGENT_COLLABORATION.md。

任務：
1. 完善 retry 策略：確認網路暫時錯誤最多重試一次、認證/配額錯誤
   絕不重試，並補齊對應測試案例。
2. 在分析結果的 use case 中加入 needsReview 判斷邏輯：低信心、
   歧義 OCR、筆畫或部首不確定時標示 needsReview，不可偽裝成確定答案。
3. 提供讓 UI 更新教師修改結果的 use case（例如 updateAnalysisResult），
   確保修改後的資料仍符合 Zod schema 驗證。
```

### Antigravity 任務（分支：`antigravity/review-editor`）

```
請先讀 PROJECT.md 和 AGENT_COLLABORATION.md。

任務：
1. 完成分析結果審核／編輯頁：逐字呈現生字、注音、部首、筆畫、
   詞語、例句，並清楚標示 needsReview 項目（例如顏色或圖示提示）。
2. 讓教師可以直接編輯每個欄位，編輯後呼叫 updateAnalysisResult
   use case 儲存變更。
3. 確保空狀態、錯誤狀態、儲存中狀態都有清楚呈現。
```

### 收尾

- Commit：`[codex] 完善 retry 策略與 needsReview 判斷`
- Commit：`[antigravity] 完成審核編輯頁與低信心標示`
- 合併：codex → main → antigravity。

---

## Round 5：圖片生成與快取 × 圖片選擇 UI

### Codex 任務（分支：`codex/image-generation`）

```
請先讀 PROJECT.md 和 AGENT_COLLABORATION.md。
「generateSelectedImage 目前仍是佔位 mock，Round 5 請整個換成真正實作」
任務：
1. 完成 generateSelectedImage use case 的真正邏輯：只處理教師勾選
   的項目，依標準化 prompt 與風格先查圖片快取，未命中才呼叫 Gemini。
2. 圖片快取比照分析快取模式，存在 IndexedDB，可刪除。
3. 補上測試：確認未勾選項目不會觸發圖片生成請求。
```

### Antigravity 任務（分支：`antigravity/image-selection-ui`）

```
請先讀 PROJECT.md 和 AGENT_COLLABORATION.md。

任務：
1. 完成圖片選擇頁：教師可勾選需要配圖的項目、預覽建議圖片、
   替換或刪除已生成的圖片。
2. 「生成圖片」動作必須是使用者明確按鈕觸發，且只送出已勾選項目。
3. loading/error/quota 提示狀態清楚呈現。
```

### 收尾

- Commit：`[codex] 完成圖片生成 use case 與快取`
- Commit：`[antigravity] 完成圖片選擇/替換/刪除 UI`
- 合併：codex → main → antigravity。

---

## Round 6：學習單引擎 × 模板選擇 UI

### Codex 任務（分支：`codex/worksheet-engine`）

```
請先讀 PROJECT.md 和 AGENT_COLLABORATION.md。

任務：
1. 實作 buildWorksheet use case 的真正邏輯，支援 PROJECT.md 第 7 節
   提到的模板類型：生字、詞語、句子、看圖、綜合。
2. 這一步完全在本機組裝資料，不呼叫任何 AI。
3. 定義每種模板需要的資料結構（WorksheetDoc），供 Antigravity 的
   預覽／列印引擎使用。
```

### Antigravity 任務（分支：`antigravity/template-selection`）

```
請先讀 PROJECT.md 和 AGENT_COLLABORATION.md。

任務：
1. 完成模板選擇頁：教師可預覽並選擇一種學習單模板。
2. 串接 buildWorksheet use case，確認選擇模板後能正確組出資料。
```

### 收尾

- Commit：`[codex] 完成學習單引擎（各模板資料組裝）`
- Commit：`[antigravity] 完成模板選擇頁`
- 合併：codex → main → antigravity。

---

## Round 7：A4 預覽、列印與 PDF 匯出（Antigravity 主責）

這一輪 Codex 沒有新任務（對照表也是「—」），只需要在 Antigravity 開工前，
先讓它確認 main 上已經有前六輪的完整成果。

### Antigravity 任務（分支：`antigravity/print-export`）

```
請先讀 PROJECT.md 和 AGENT_COLLABORATION.md。

任務：
1. 完成 A4 預覽頁：依 buildWorksheet 產出的 WorksheetDoc 渲染畫面。
2. 撰寫列印用 CSS（A4 尺寸、邊界、分頁），確保瀏覽器列印功能正常。
3. 實作 PDF 匯出功能（本機產生，不經任何自有後端）。
4. 針對 desktop、tablet 與實際列印情境各測試一次。
```

### 收尾

- Commit：`[antigravity] 完成 A4 預覽、列印 CSS 與 PDF 匯出`
- 合併：antigravity → main。

---

## 最終驗收：對照 PROJECT.md 第 8 節「完成定義」

全部七輪跑完、合併回 main 之後，實際跑一次完整流程確認符合「完成定義」：

1. `npm run dev` 啟動專案。
2. 輸入自己的 Gemini API Key，測試連線成功。
3. 上傳一張教材圖片，觸發分析，取得結構化草稿。
4. 確認低信心／`needsReview` 項目有清楚標示。
5. 手動修正至少一個欄位，確認儲存成功。
6. 勾選一項配圖，觸發圖片生成，確認只呼叫了勾選項目。
7. 選擇一種學習單模板，進入 A4 預覽。
8. 測試列印功能與 PDF 匯出，確認**全程沒有任何請求經過自有後端**
   （可用瀏覽器開發者工具的 Network 分頁檢查，除了 Gemini API 網域
   之外不該有其他網路請求送出教材或 Key）。

全部通過，這個專案的第一個端到端版本就正式完成。

## 之後（非必要）

- 把 `docs/changes/` 裡累積的 handoff 記錄整理成 CHANGELOG。
- 考慮補上 GitHub Actions（跑 `npm run typecheck` / `npm test`）在 PR 時自動檢查，取代手動 review。
- 若要正式讓其他教師使用，準備靜態部署（Vercel / Netlify / GitHub Pages 皆可），
  但務必再次確認部署方式**沒有引入任何自有後端代理 Gemini 請求**，符合
  PROJECT.md 開頭的 BYOK 承諾。
