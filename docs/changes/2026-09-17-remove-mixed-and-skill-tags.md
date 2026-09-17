## Handoff

- Owner: Codex
- Goal: 移除綜合學習單與分析功能標籤，保留注音設定並限制形近字候選範圍。
- Contract change: `WorksheetTemplate` 移除 `mixed`、`WorksheetDoc.templateLabel` 移除 `綜合`；`AnalysisContextInput` 移除 `skillTags`，相關常數與型別不再匯出。
- Cache migration: 分析快取鍵升為 `analysis-v4`，只包含教材 hash、年級、語言與 `includeZhuyin`，不會沿用舊的標籤快取。
- Prompt change: `lookalikeCandidates` 明確限制為教育部常用字表內、國小常見字，不得使用生僻或罕見字。
- UI change: 上傳頁移除功能標籤，模板頁移除標籤推薦與綜合模板；教師只在分析後的模板頁選擇模板。
- Preserved: `includeZhuyin`、低信心／OCR／部首／筆畫的 `needsReview` 規則。
- Verified: `npm test`, `npm run lint`, `npm run build`, source scan for removed identifiers.
- Next owner action: Antigravity 不需再維護功能標籤狀態或綜合模板入口。
