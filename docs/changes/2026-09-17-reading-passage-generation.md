## Handoff

- Owner: Codex
- Goal: 將閱讀理解評量改為「明確觸發 AI 生成連貫短文 + 本機組裝選擇題」。
- Contract change: 新增 `ReadingPassage`、`ElementaryGrade`、`GenerateReadingPassageInput`、`GeneratedReadingPassageResult`；閱讀 section 移除 `openResponseQuestions`，`passage` 改為必要欄位。
- WorksheetDoc change: 新增 `grade`、`locale`、`pageSetup`，閱讀 section 內含完整短文 metadata 與選擇題正解，可直接供 DOCX 產生器使用。
- Cache: IndexedDB 升級至 version 2，新增 `reading-passages` store，支援查詢、寫入、刪除與清空。
- Quota behavior: UI 只在教師按下「生成閱讀短文」時呼叫 use case；先查快取，命中時不讀 API Key、不呼叫 Gemini。
- Grade limits: 一、二年級 30 字；三年級 50 字；四至六年級 60 字（正文不計空白）。
- Local questions: 至少兩個教師確認且有詞語的生字才組裝選擇題；不再產生簡答／問答題，也不為題目另呼叫 AI。
- Verified: `npm test`, `npm run lint`, `npm run build`。
- Next owner action: DOCX 匯出可直接使用 `WorksheetDoc.pageSetup`、`grade`、`locale` 與 `pages[].sections[]`；答案鍵取 `correctAnswer`。

### UI quota 提示建議

> 生成連貫閱讀短文會使用您設定的 Gemini API Key。系統會先查詢本機快取；只有未命中時才送出 1 次文字生成請求，可能使用 Gemini quota。選擇題與後續排版皆在本機完成，不會再次呼叫 AI。
