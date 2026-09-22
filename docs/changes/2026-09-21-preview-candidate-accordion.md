# 步驟六「匯出前候選內容確認」展開式收合（Accordion）

## 變更摘要
- 步驟六（`PrintPreviewPage.tsx`）的「匯出前候選內容確認」面板改為展開式收合（Accordion）元件。
- 預設每個生字項目為收合狀態，僅顯示生字字元方塊、生字標籤以及收合/展開箭頭（`▶`），節省縱向排版空間。
- 點擊生字摘要列展開詳細內容，顯示語詞候選、例句候選以及「換一批」按鈕，箭頭切換為 `▼`；再次點擊即可折疊收合。
- 收合／展開狀態使用頁面局部 State（`expandedCharacterIndices`），進到該頁面時預設全部收合，無額外快取或跨頁干擾。
- 防禦性相容：加入 `getCandidateText` 解析函式，支援 `wordCandidates` 為純字串陣列（`string[]`）或物件陣列（`{ text: string }[]`），避免未來 contract 調整時字串轉型異常。

## 相關檔案
- `src/features/preview/PrintPreviewPage.tsx`
- `src/styles/app.css`
- `tests/preview-candidate-selection.test.ts`
