## Handoff

- Owner: Codex
- Goal: 移除 Gemini 圖片生成與圖片快取，保留教師本機上傳配圖；強化閱讀短文生成診斷並改為自選字數。
- Contract change: 移除 `ImageResult` 與圖片生成 exports，新增只代表教師上傳圖片的 `WorksheetImage`；`GenerateReadingPassageInput` 新增必要的 `targetCharacters: 30 | 50 | 60 | 100`。
- Removed: `generateSelectedImage`、Gemini image client、圖片 IndexedDB API 與相關測試；IndexedDB version 3 會刪除舊 `images` store。
- Preserved: 教師可在配圖頁上傳、替換、移除本機圖片，並由 `BuildWorksheetOptions.images` 傳入 `buildWorksheet`。
- Reading API audit: 使用官方有效的 `v1beta/models/{model}:generateContent`、`contents[].parts[].text`、`systemInstruction`、`generationConfig.responseMimeType` 與 `responseJsonSchema`。短文模型由 legacy `gemini-3.5-flash` 更新為 GA stable `gemini-3.8-flash`。
- Error diagnostics: HTTP 400/404 回傳 `validation`，HTTP 429 回傳 `quota`；`AppError.details` 包含 `httpStatus`、`requestSent`、`geminiStatus` 與截斷／去 Key 的 `geminiMessage`。
- Verified: `npm test`, `npm run lint`, `npm run build`。
- Next owner action: UI 若需額外錯誤詳情，可在開發模式顯示 `error.details`，正式介面維持使用 `error.message`。
