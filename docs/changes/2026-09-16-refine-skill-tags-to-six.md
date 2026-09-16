## Handoff
- Owner: Antigravity
- Goal: 將學習單功能標籤精簡為 6 項（生字練習、語詞練習、句型練習、字音字形、造句練習、閱讀理解），純字呈現無括號說明；維持三大既有模板（生字田字格練習單、詞語積木擴展單、句型仿寫應用單）與選用邏輯不變
- Changed files: `src/domain/analysis-context.ts`, `src/infrastructure/gemini-client.ts`, `src/app/app-context.ts`, `src/features/upload/UploadPage.tsx`, `tests/skill-tags-ui-integration.test.ts`
- Contract change: `ANALYSIS_SKILL_TAGS` 精簡為 6 項：`生字練習`、`語詞練習`、`句型練習`、`字音字形`、`造句練習`、`閱讀理解`；schema 透過 `SUPPORTED_SKILL_TAGS` 兼容既有項目，保持向後相容
- Verified:
  1. 標籤清單精簡為 6 項，純文字呈現，無任何括號或附加說明文字。
  2. 常用預設按鈕調整為對應三大核心模板之 `['生字練習', '語詞練習', '句型練習']`。
  3. 全選（6 項）、清空（0 項）、鍵盤 Space 切換功能正常。
  4. 三大模板（生字田字格練習單、詞語積木擴展單、句型仿寫應用單）結構與選用邏輯完全維持不變。
  5. 完整測試套件全數通過（9 檔案、51 項測試通過），eslint 0 錯誤 0 警告，TypeScript 編譯與 Vite build 通過。
- Risks / open questions: none
- Next owner action: Codex 可繼續擴展相關功能或推進後續 Phase 需求
