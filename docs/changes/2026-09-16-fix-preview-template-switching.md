# 變更記錄：修復步驟五切換模板後步驟六預覽未同步更新問題

**日期**：2026-09-16  
**負責 Agent**：antigravity  
**分支**：`antigravity/fix-template-sync`  
**關聯需求**：解決在模板選擇頁（步驟五）切換不同學習單模板並「套用」後，步驟六學習單預覽畫面沒有跟著更新的問題。

---

## 1. 問題根因分析（Root Cause Analysis）

1. **預覽頁面寫死單一排版結構，未消費 `worksheetDoc` 的模板與章節資訊**：
   - `PrintPreviewPage.tsx` 原先僅讀取 `worksheetDoc?.pages[0]?.blocks`，而 `blocks` 在所有模板中均為相同的生字清單資料結構。
   - 預覽主要內容區寫死為「單一生字田字格練習」（大田字格 + 3練習格 + 生詞造詞 + 造句練習），**完全未依據 `worksheetDoc.template` 或 `worksheetDoc.pages[0].sections` 做任何條件分支渲染**。
   - 即使 `buildWorksheet` 依據所選模板組裝出不同種類的章節（如 `SentenceWorksheetSection`、`WordWorksheetSection`、`CharacterWorksheetSection`），預覽畫面呈現的排版與文字依然一模一樣。
2. **標題未綁定文件標題**：
   - 學習單紙頭大標題寫死為「國小國語生字語文學習單」，未反映 `worksheetDoc.title`（如「生字學習單」、「句子學習單」、「詞語學習單」、「綜合學習單」）。
3. **套用時漏傳配圖參數與人為非同步延遲**：
   - `TemplateSelectionPage.tsx` 中的 `handleCreateWorksheet` 呼叫 `buildWorksheet` 時未傳入 `options.images: Object.values(generatedImages)`，且有 500ms 的 `setTimeout` 延遲。

---

## 2. 修正方案與實作（Implemented Solution）

### 2.1 模板分流動態渲染（`src/features/preview/PrintPreviewPage.tsx`）
- 讀取 `activeTemplate = worksheetDoc?.template || selectedTemplate` 與 `activeTitle = worksheetDoc?.title || ...`。
- 新增 `renderContentByTemplate()`，針對 4 款模板提供專屬真實排版：
  1. **`character-practice`（生字田字格練習單）**：
     - 指引橫幅：【壹、生字筆順與田字格習寫】。
     - 題目：生字第 N 題、部首、筆畫、讀音。
     - 8 格田字格排版：示範大格（紅色高對比）、描紅格（透明度 0.35）、6 格編號空白練習格。
     - 常用詞語造詞參考。
  2. **`sentence-practice`（句型仿寫應用單）**：
     - 指引橫幅：【參、句型仿寫與情境造句】。
     - 題目：生字造句應用、教師評閱欄（優／良／可）。
     - 課文情境例句卡片（綠色高亮邊框標示）。
     - 雙橫線引導式仿寫練習格（①、② 標準作業橫線附輔助虛線）。
  3. **`word-practice`（詞語積木擴展單）**：
     - 指引橫幅：【貳、詞語積木擴展與習寫】。
     - 核心生字藍色徽章。
     - 詞語積木清單：詞語標籤、為該詞各字提供之習寫田字格、延伸造詞練習橫線。
  4. **`mixed`（生字語文綜合單）**：
     - 指引橫幅：【肆、生字語文綜合評量】。
     - 整合生字書寫、生詞造詞、看圖寫字（支援配圖）與情境造句。
- **自動補償同步機制**：
  - 在 `PrintPreviewPage` 中加入防禦性 `useEffect`，若當前 `worksheetDoc.template !== selectedTemplate`，自動呼叫 `buildWorksheet` 同步最新狀態。

### 2.2 串接與導航強化（`src/features/templates/TemplateSelectionPage.tsx`）
- 在 `handleCreateWorksheet` 中正確傳入 `{ images: Object.values(generatedImages) }`。
- 移除人為 500ms 延遲，完成 `setWorksheetDoc(res.value)` 後立即執行 `navigate('preview')`。

### 2.3 樣式系統增強（`src/styles/app.css`）
- 修復先前遺漏之閉合大括號。
- 擴充 `.sheet-instruction-banner`、`.sheet-char-card`、`.sheet-word-card`、`.sheet-sentence-card`、`.sheet-writing-rule` 等 A4 專屬印刷樣式。

---

## 3. 測試與驗證（Verification）

1. **靜態型別與語法檢查**：
   - `npm run build`：編譯通過，0 錯誤。
   - `npm run lint`：ESLint 通過，0 錯誤。
2. **端到端瀏覽器測試（Edge CDP Headless）**：
   - 載入示範生字「學」、「習」。
   - **測試 A（生字模板）**：套用後確認標題為「生字學習單」，呈現 16 個標準練習田字格與筆順部首，截圖確認。
   - **切換模板 B（句子模板）**：返回模板頁點選「句型仿寫應用單」並套用，確認標題切換為「句子學習單」，畫面即時更新為課文情境例句與雙橫線仿寫格，截圖確認。
   - **切換模板 C（詞語模板）**：切換為「詞語積木擴展單」，確認標題變為「詞語學習單」，呈現詞語積木與延伸造詞線，截圖確認。
   - **切換模板 D（綜合模板）**：切換為「生字語文綜合單」，確認標題變為「綜合學習單」，呈現綜合評量架構，截圖確認。
