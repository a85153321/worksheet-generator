# Word 圖片嵌入與預覽版型對齊

## Handoff
- Owner: Codex
- Goal: 修復 `picture-practice` 匯出 Word 後圖片消失，並實際比較四種 HTML 預覽與 DOCX，讓 `reference-character-practice` 網頁模擬更接近教師原始 Word 範本。
- Changed files: `PROJECT.md`, `src/services/contracts.ts`, `src/features/images/ImageSelectionPage.tsx`, `src/services/worksheet-builder.ts`, `src/services/docx-builder.ts`, `src/components/worksheet/constants.ts`, `src/components/worksheet/WorksheetContentRenderer.tsx`, `src/components/worksheet/WorksheetSheet.tsx`, `src/components/worksheet/index.ts`, `src/features/templates/TemplateSelectionPage.tsx`, `src/styles/app.css`, `tests/docx-builder.test.ts`, `docs/changes/2026-09-21-word-image-embedding-and-preview-fidelity.md`
- Dictionary version: unchanged
- Contract change: `WorksheetImage` 新增可選 `file: Blob`；`PictureWorksheetSection.item.image` 同步保留 `file`。上傳流程會保存原始 `File`，`WorksheetDoc.images` 保留同一 Blob／File 物件供 Word 匯出讀取。
- Verified: `npm test`、`npm run lint`、`npm run build`；以實際 Blob 產生 `picture-practice.docx`，確認 ZIP 內 `word/media/*.png` 的 bytes 與輸入一致；用 Microsoft Word 將五種 QA DOCX 渲染為 PDF／PNG 並逐頁檢查；瀏覽器實際觸發 `character-practice`、`word-practice`、`sentence-practice`、`reference-character-practice` 四種 Word 下載並取得成功訊息。
- Risks / open questions: DOCX 與 HTML 使用不同排版引擎，無法像素級一致。PNG／JPEG 直接嵌入；SVG 使用原始 SVG 加 PNG fallback；WebP 在瀏覽器端先經 Canvas 轉成 PNG。參考模板仍以教師 DOCX XML 為版型權威。
- Next owner action: Antigravity 可在 desktop／tablet 再做互動視覺檢查；若調整教師原始 DOCX，須同步更新 `reference-character-practice` 的 HTML 模擬尺寸。

## 圖片嵌入修正

### 修正前

- `WorksheetImage` 只有 `url`，沒有保留原始 File／Blob。
- `picture-practice` Word 左欄只寫出「教學插圖區」和生字文字。
- `docx-builder.ts` 沒有使用 `ImageRun`，DOCX ZIP 內沒有對應圖片媒體。

### 修正後

- `ImageSelectionPage` 在既有 `worksheetImages` state 中同時保存 `url` 與原始 `file`。
- `buildWorksheet` 不再對圖片做會失去原始物件語意的深層複製，Blob／File 一路保留到 `WorksheetDoc.images`。
- `generateDocxBlob` 匯出前呼叫 `file.arrayBuffer()`，將資料轉為 `Uint8Array`。
- `renderPictureSections` 使用 `ImageRun`，固定 `transformation.width = 120`、`height = 90`。
- PNG 與 JPEG 直接嵌入；SVG 帶透明 PNG fallback；WebP 先轉為 PNG。

## 四種模板比對與調整

### character-practice

- 修正前差異：HTML 有 1px 圓角題目卡；Word 以段落和連續表格呈現，沒有外層圓角。HTML 格子約 64px；Word 格子視覺高度約 60–64px。HTML 題間距約 14px，Word 由段前／段後距控制，較緊湊。
- 結論：題序、8 格比例、紅色示範字、淡色描字、六格虛線練習與語詞列皆一致，差異不影響內容辨識，因此保留兩邊既有原生結構。

### word-practice

- 修正前差異：HTML 每個生字是圓角卡片、每個語詞列有 4px 圓角；Word 是連續表格。Word 欄寬固定為 22%／28%／50%，HTML 由 flex 配置；HTML 行距與卡片 padding 較大。
- 結論：藍色主題、語詞／習寫格／延伸造詞三區的比例與順序相符，維持現有 Word 表格以確保列印穩定。

### sentence-practice

- 修正前差異：HTML 例句使用 `#f0fdf4` 淡綠底、4px `#16a34a` 左框與 4px 圓角；Word 使用白底段落。HTML 卡片 padding 為 12px 14px；Word 使用較緊湊的段前／段後距。
- 結論：標題色、評閱欄、例句、兩條仿寫線與內容順序一致；保留 Word 的純段落結構，避免新增巢狀表格造成跨頁不穩定。

### reference-character-practice

- 修正前差異：HTML 多出說明 banner、藍色 tag、圓角卡片外框、一般模板 meta 與頁尾；田字格只有約 48–64px，遠小於真實 Word 原稿的大格。
- 修正後數值：A4 padding 改為上下 10mm、左右 12mm；標題 25px、字距 `0.08em`；資料列 15px、欄間距 24px；每題間距 10px；題號 16px；五欄採 `repeat(5, minmax(0, 1fr))`、欄間距 5px；每個田字格高 96px、主字 54px、注音欄 28px。
- 修正後結構：移除說明 banner、tag、卡片邊框、一般模板 meta、得分欄與頁尾；標題與班級資料置中；題號、部首、筆畫、讀音改為同列純文字；保留紅色示範格、淡色描字格、兩個空白格與紫色部首格。
