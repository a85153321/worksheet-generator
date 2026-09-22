# easy-template-x Word 動態範本遷移

## Handoff
- Owner: Codex
- Goal: 以 `easy-template-x` 取代 `reference-character-practice` 的固定段落／示範字／圖片座標機制，導入建置期自動範本 registry、標籤迴圈、IVS 字元樣式與 File／Blob 圖片嵌入。
- Changed files: `package.json`, `package-lock.json`, `vite.config.ts`, `PROJECT.md`, `src/assets/docx-templates/生字學習單注音版.docx`, `src/services/reference-template-docx.ts`, `src/services/word-template-registry.ts`, `src/services/worksheet-font.ts`, `src/services/contracts.ts`, `src/services/worksheet-builder.ts`, `src/services/docx-builder.ts`, `src/services/index.ts`, `src/app/AppContext.tsx`, `src/app/app-context.ts`, `src/features/templates/TemplateSelectionPage.tsx`, `src/features/preview/PrintPreviewPage.tsx`, `src/styles/app.css`, `tests/reference-template-docx.test.ts`, `docs/word-template-design-guide.md`, `docs/changes/2026-09-21-easy-template-x-word-templates.md`; removed `public/templates/生字學習單注音版.docx`.
- Dictionary version: unchanged
- Contract change: `BuildWorksheetOptions` 與 `WorksheetDoc` 新增 `docxTemplateId`。動態範本資料提供頂層單題欄位及 `items[]`；每個 item 包含 `questionNumber`, `character`, `zhuyin`, `radical`, `strokeCount`, `wordCandidatesText`, `wordCandidates[]`, `sentenceCandidatesText`, `sentenceCandidates[]`, optional `image`。候選陣列元素格式為 `{ text }`。
- Verified: `easy-template-x@7.2.8` 最小文字／迴圈／圖片範例；實際遷移範本 `parseTags`；多題、IVS、有圖片、部分無圖片、`word/media` bytes、零 `fetch` 測試；`npm test`、`npm run lint`、`npm run build`；`npm audit` 在 `@xmldom/xmldom@0.8.15` override 後為 0 vulnerabilities。Microsoft Word COM／命令列在本機回報 Office server 啟動失敗，未能完成 PNG 視覺渲染。
- Risks / open questions: 任意 DOCX 的 HTML 預覽仍是共用模擬，不會自動解析成像素一致預覽；圖片尺寸目前共用 105 × 80 px，若需每範本尺寸應增加 metadata；新增檔案後需重新建置；本機 Office automation 狀態修復後仍應補做 Word 逐頁視覺 QA。
- Next owner action: Antigravity 可依新版設計規範製作更多 `.docx` 放入 `src/assets/docx-templates/`，並確認動態卡片與共用 HTML 預覽文案；在可用的 Word 環境開啟多題 QA 輸出做最後視覺檢查。

## 最終標籤語法

| 用途 | 標籤 |
| --- | --- |
| 標題 | `{title}` |
| 題號 | `{questionNumber}` |
| 生字 | `{character}` |
| 注音 | `{zhuyin}` |
| 部首 | `{radical}` |
| 筆畫 | `{strokeCount}` |
| 串接語詞 | `{wordCandidatesText}` |
| 語詞迴圈 | `{#wordCandidates}{text}{/wordCandidates}` |
| 串接例句 | `{sentenceCandidatesText}` |
| 例句迴圈 | `{#sentenceCandidates}{text}{/sentenceCandidates}` |
| 多題區塊 | `{#items}...{/items}` |
| 圖片 | `{image}`，也可放在圖片替代文字說明中 |

## 字型與 IVS

- 字元樣式固定命名為 `WorksheetCharacter`。
- 一、二年級預設字型為 `ㄅ字嗨注音標楷 Regular`；`character` 先經 `resolveBopomofoDisplayCharacter`。
- 三至六年級預設字型為 `標楷體`；`character` 使用原始字元。
- 渲染前只修改 `word/styles.xml` 中 `WorksheetCharacter` 的 `w:rFonts`，不依範本段落位置判斷。

## 圖片資料

```ts
{
  _type: 'image',
  source: await file.arrayBuffer(),
  format: MimeType.Png,
  width: 105,
  height: 80,
  altText: '教師為「學」上傳的教學圖片',
}
```

PNG、JPEG、SVG 直接交給 Image plugin；WebP 在瀏覽器 Canvas 轉成 PNG。沒有原始 File／Blob 時不提供 `image`，文字型圖片標籤會留空。

## 舊機制移除狀態

已完全移除 runtime 的 `directParagraphs`、固定 `paragraphs[2/7/32]`、`看／目／9／第 1 題` 判斷、固定每五題分頁、`imageAnchor`、寫死 EMU 座標與固定 URL fetch。`reference-template-docx.ts` 現在只負責通用資料映射、字元樣式切換與 `easy-template-x` 渲染。

新版設計規範：`docs/word-template-design-guide.md`。
