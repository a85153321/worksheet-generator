# 移除「教材分級語境」功能紀錄

## 變更背景
使用者指示移除步驟一教材上傳頁面的「教材分級語境」功能。教材分析主要依賴「學習單功能標籤」（6 項純文字 Chip）與獨立「顯示注音」開關進行教學引導與排版控制，不再需要手動選擇 1~6 年級的分級語境。

## 具體變更

1. **教材上傳頁 UI (src/features/upload/UploadPage.tsx)**：
   - 移除「🎓 教材分級語境」下拉選單（#grade-select）與其包覆區塊。
   - 移除「本次動作預估處理範圍」卡片中的「語境目標：國小 X 年級」項目。
   - 注音模式說明更新為簡潔的「顯示注音（直式排版）」/「不顯示注音（無佔位空格）」。
   - 清理 UploadPage 中未使用的 selectedGrade 與 setSelectedGrade。

2. **核心型別與狀態 (src/app/app-context.ts / src/app/AppContext.tsx)**：
   - AnalysisScope 中的 grade 改為可選 (grade?: number)。
   - unAnalysis 中送交分析的 nalysisContext 不再附帶 grade，分析快取鍵由 skillTags 與 includeZhuyin 驅動。

3. **審核儲存頁快取鍵同步 (src/features/review/ReviewPage.tsx)**：
   - 儲存更新時移除未使用的 grade: selectedGrade，使快取特徵計算與 AppContext 維持一致。

4. **測試驗證 (	ests/skill-tags-ui-integration.test.ts)**：
   - 新增未提供 grade 時的 nalysisContextSchema 解析測試與快取鍵產生驗證。
   - 執行 
pm test：52 項測試全數通過。
   - 執行 
pm run lint：0 errors, 0 warnings。
   - 執行 
pm run build：成功編譯打包。
