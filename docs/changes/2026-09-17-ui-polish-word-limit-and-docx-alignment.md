## Handoff

- Owner: Antigravity
- Goal: 完成五項 UI 改善與 Docx 格式完全對齊：
  1. 移除教材上傳頁（步驟一）注音設定面板，只保留 A4 預覽／列印頁（步驟六）的注音設定。
  2. 「生字教學配圖」步驟改為純「上傳配圖」，移除所有 AI 圖片生成過時文案，同步全站導航按鈕。
  3. 閱讀短文生成字數上限改為單選選項（30, 50, 60, 100 字以內），傳遞給 `generateReadingPassage` use case。
  4. 修正 docx 匯出內容與排版，100% 對齊 A4 預覽與 PDF 匯出（詞語田字格方框、延伸造詞、句型仿寫引導語、看圖識字圖文區塊、選擇題與頁尾）。
  5. 學習單標題列移除「國小 X 年級」文字與分隔符號，排版整齊不留空位。
- Modified files:
  - `src/features/upload/UploadPage.tsx`: 移除注音設定面板與預估範圍內之注音項目。
  - `src/app/routes.ts`: 路由步驟標題更新為「上傳配圖」，描述更新為「依教學需求為生字上傳本機自備教學插圖」。
  - `src/features/review/ReviewPage.tsx`: 下一步按鈕改為「下一步：上傳配圖 →」。
  - `src/features/templates/TemplateSelectionPage.tsx`: 上一步按鈕改為「← 上一步：上傳配圖」，新增 4 種短文字數上限單選 radio 按鈕，傳遞 `targetCharacters`。
  - `src/features/preview/PrintPreviewPage.tsx`: 標題 meta 移除 `國小 {selectedGrade} 年級` 與分隔符號。
  - `src/services/docx-builder.ts`: 標題副標移除年級並對齊預覽；詞語為每個字提供習寫方格與延伸造詞線；句型補齊引導提示；看圖識字改為圖文卡片表格；頁尾格式完全對齊。
- Verified:
  - `npm test`（9 個測試檔，61 個測試全部通過）。
  - `npm run lint`（ESLint 零錯誤零警告）。
  - `npm run build`（TypeScript 與 Vite 生產環境編譯通過）。
  - 實機 CDP 擷取 4 步驟驗證截圖，並在 artifact 目錄產出各模板實體 `.docx` 檔案。
