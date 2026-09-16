## Handoff
- Owner: Antigravity
- Goal: 將「適用年級語境」下拉選單改為 19 項可複選功能標籤（Chip 群組），新增獨立「顯示注音」勾選開關，並於注音關閉時在 A4 預覽與列印版面完全移除注音欄位（不留空白佔位）
- Changed files: `src/app/app-context.ts`, `src/app/AppContext.tsx`, `src/features/upload/UploadPage.tsx`, `src/components/VerticalZhuyin.tsx`, `src/features/preview/PrintPreviewPage.tsx`, `src/features/review/ReviewPage.tsx`, `src/styles/app.css`, `tests/skill-tags-ui-integration.test.ts`
- Contract change: none（UI 完整遵循並串接 Codex 交付之 `AnalysisSkillTag`、`ANALYSIS_SKILL_TAGS`、`AnalysisContextInput.skillTags` 與 `includeZhuyin` 契約）
- Verified:
  1. 19 項功能標籤（生字、部件、造詞、注音符號拼讀、筆順識字、詞語搭配、看圖造句、句型仿寫、段落寫作、關聯詞運用、形音義辨析、成語運用、語病修改、修辭技巧、長文閱讀理解、摘要、多元文本閱讀、觀點思辨、短文論述）以 accessible Chip 群組呈現，支援快速按鈕（常用預設、全選、清空）。
  2. 鍵盤無障礙支援：Tab 鍵聚焦各標籤，Space／Enter 鍵即可切換勾選狀態。
  3. 獨立「顯示注音」勾選開關：支援低年級情境預設勾選，教師可自主隨時切換。
  4. 當 `includeZhuyin: false` 時，A4 預覽與列印畫面（生字示範田字格、讀音列、詞語核心、看圖寫字提示）均完全移除注音欄位與多餘空白，維持三大模板排版整潔。
  5. 測試套件全數通過（9 檔案、51 項測試通過），eslint 0 錯誤 0 警告，TypeScript 編譯與 Vite build 通過。
- Risks / open questions: none
- Next owner action: Codex 可繼續推展後續 Phase 功能或擴展詞庫／語句分析 prompt 指令集
