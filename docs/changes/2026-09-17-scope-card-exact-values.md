## Handoff

- Owner: Antigravity
- Goal: 調整「步驟 2：AI 結構化分析處理中」畫面的預估處理範圍顯示，移除無實質價值的「年級目標」欄位，並將猜測性的生字範圍改為已確定的精確數字（直接輸入生字）或明確非猜測說明（教材上傳）。
- Changed files:
  - `src/features/analyzing/AnalyzingPage.tsx`
  - `src/features/upload/UploadPage.tsx`
- Key Changes:
  1. 移除 `AnalyzingPage.tsx` 預估處理範圍卡片中的「年級目標」欄位。
  2. 「預估提取項目」：
     - 直接輸入生字模式：顯示確切字數 `${typedCharacters.length} 個國語生字`（例如「4 個國語生字」），杜絕模糊的「約」字眼。
     - 教材上傳（圖片/PDF）模式：顯示「將依教材內容辨識生字數量」，不進行無根據的數字範圍猜測。
  3. 「處理頁數」：
     - 標籤由「預估處理頁數」正名為「處理頁數」，直接輸入時呈現「不需影像處理（純文字輸入）」，圖片呈現「1 頁（單頁圖片）」，PDF 呈現具體選定頁數。
  4. 進度文字與檢核步驟微調：
     - 區分直接輸入（比對 CNS11643 字庫、analyzeTypedCharacters、4 字內容）與教材上傳（影像預處理、IndexedDB 快取、analyzeMaterial）的實際流程呈現。
  5. `UploadPage.tsx` 底部之範圍提示卡片同步更新為不帶猜測範圍的「將依教材內容辨識生字數量」與「處理頁數」。
- Verification:
  - `npm test`: 8 files, 48 tests passed (100%).
  - `npm run lint`: 0 errors, 0 warnings.
  - `npm run build`: pass.
  - 瀏覽器端針對「直接輸入生字」與「上傳圖片」兩種路徑分別執行並截圖驗證，確認畫面符合精確與非猜測原則。
