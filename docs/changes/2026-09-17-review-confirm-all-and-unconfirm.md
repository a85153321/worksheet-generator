# 步驟 3 審核與編輯頁新增「全部確認」與單筆「取消確認」操作

## 變更背景
在「步驟 3：分析結果審核與編輯」（`ReviewPage.tsx`）中，教師需要更高效的批次與單筆審核操作，能一次性將所有待審核生字標記為已確認，也能隨時對個別生字取消確認改回待審核狀態，並維持頂部統計數字與卡片視覺狀態即時聯動。

## 具體變更

### 1. 頂部統計區「全部確認」按鈕
- 文案定為「✓ 全部確認」，持續呈現於頂部統計列右側。
- 點擊後僅將所有狀態為待審核（`status !== 'confirmed'`）的生字標記為已確認（`status: 'confirmed'`, `needsReview: false`）；已為 `confirmed` 狀態的項目維持不變，不重複處理。
- 當所有生字均為已確認（`needsReviewCount === 0`）或儲存處理中時，按鈕自動切換為 disabled。
- 統計數字定義精確對齊：
  - `needsReviewCount = characters.filter((c) => c.editableState.status !== 'confirmed').length`
  - `confirmedCount = characters.filter((c) => c.editableState.status === 'confirmed').length`
  - 確保 `needsReviewCount + confirmedCount === totalCount`。

### 2. 單筆生字卡片「取消確認」與「確認無誤」按鈕切換
- 在卡片底部操作按鈕區（`✏️ 編輯` 與 `🗑️ 刪除` 之間）：
  - 若該生字為「已確認」（`isConfirmed: true`）：顯示「↩️ 取消確認」按鈕，點擊後透過 `handleUnconfirmItem` 將狀態改回 `status: 'draft', needsReview: true`。
  - 若該生字為待審核（`isConfirmed: false`）：顯示「✓ 確認無誤」按鈕，點擊後透過 `handleConfirmItem` 將狀態設為 `status: 'confirmed', needsReview: false`。
- 卡片視覺樣式維持色彩語意：
  - 已確認卡片：綠色外框（`#10b981`）、白色背景、`✓ 已確認` 標籤。
  - 待審核卡片：琥珀色外框（`#f59e0b`）、淺黃背景（`#fffbeb`）、`⚠️ 待審核` 標籤。
  - 已編輯未確認卡片：紫色外框（`#6366f1`）、淺黃背景、`✏️ 已編輯` 標籤。

### 3. 本機資料與狀態安全性
- 純本機狀態切換，僅呼叫既有 `updateAnalysisResult` use case 進行 Zod 格式驗證與快取儲存，絕不觸發任何 Gemini 請求。
- 切換狀態時僅更新 `editableState`，完全保留已填寫或編輯的生字、注音、部首、筆畫、詞語、例句等所有欄位資料。

## 驗證結果
1. 執行 `npm test`：8 個測試套件共 48 項測試全部通過。
2. 執行 `npm run lint && npm run build`：0 errors，編譯與型別檢查完全通過。
3. 透過 Edge CDP 實機自動化操作驗證：
   - 初始狀態：待審核 3，已確認 0，卡片皆為待審核。
   - 點擊「全部確認」後：待審核 0，已確認 3，卡片皆變更為綠框已確認，並顯示「取消確認」按鈕。
   - 點擊卡片 2「取消確認」後：待審核 1，已確認 2，卡片 2 轉為待審核並顯示「確認無誤」按鈕，其餘卡片保持已確認。
   - 再次點擊卡片 2「確認無誤」：待審核 0，已確認 3，全流程來回切換驗證無誤。
