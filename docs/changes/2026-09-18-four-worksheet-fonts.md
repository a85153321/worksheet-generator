## Handoff

- Owner: Codex
- Goal: 將步驟六的單一芫荽字型改為四種可切換字型，並讓同一選擇正確寫入 DOCX `w:rFonts`。
- Changed files: `src/assets/fonts/**`, `src/styles/app.css`, `src/features/preview/PrintPreviewPage.tsx`, `src/services/contracts.ts`, `src/services/docx-builder.ts`, `src/services/index.ts`, `tests/docx-builder.test.ts`, `package.json`, `package-lock.json`。
- Dictionary version: unchanged (`dict_concised_2014_20260626`)
- Contract change: 新增 `WorksheetFont` union 與 `DocxExportOptions`；`createDocxDocument`、`generateDocxBlob`、`exportWorksheetToDocx` 接受可選 `{ font }`，未指定時預設 `standard-kai`。
- Verified: OpenType name table full name 已核對；四種選項的 DOCX `word/document.xml` 與 `word/styles.xml` 均測得正確 `w:eastAsia`；ESLint、26 項單元測試、production build 全數通過。
- Risks / open questions: DOCX 只寫字型名稱，不嵌入 TTF；收件端未安裝字型時由 Word 替代。三款 webfont 合計約 21.2 MB，其中標楷有注音約 17.1 MB，會增加靜態資產下載量。
- Next owner action: Antigravity 可補上「Word 不內嵌字型，開啟端需安裝相同字型」提示；如要降低初次載入量，可評估按選項延遲載入字型資產。

### 選項與精確字型名稱

| UI 選項 | `WorksheetFont` | 字型檔 | Word `w:rFonts` 完整名稱 |
| --- | --- | --- | --- |
| 標楷體 | `standard-kai` | 系統內建 | `標楷體` |
| 標楷有注音 | `zihi-kai-zhuyin` | `src/assets/fonts/BpmfZihiKaiStd-Regular.ttf` | `ㄅ字嗨注音標楷 Regular` |
| 注音有框 | `zihi-box-zhuyin` | `src/assets/fonts/BpmfZihiBox-R.ttf` | `ㄅ字嗨注音加框 R` |
| 純注音 | `zihi-only-zhuyin` | `src/assets/fonts/BpmfZihiOnly-R.ttf` | `ㄅ字嗨注音而已 R` |

三個完整名稱直接讀自各 TTF 的 OpenType name ID 4。授權與 NOTICE 一併放在 `src/assets/fonts/`。

### DOCX 實作選擇

本專案沒有載入既有 Word 範本，而是使用 `docx` library 以 `Document`、`Paragraph`、`TextRun` 程式化建立文件。因此採用「程式在建立 run 時直接設定字型屬性」：每個 `TextRun` 與 default document style 都取得相同的 font attributes，讓 library 產出 `w:rFonts` 的 `ascii`、`hAnsi`、`eastAsia`、`cs`。

沒有採用預先建立四組 Word style，因為目前沒有範本 style 可切換；也沒有在打包後以字串方式修改 XML，避免繞過 `docx` library 的型別與 escaping。這仍屬程式直接控制 XML 字型屬性，只是透過現有 builder API 安全產生。

### 移除項目

- `src/assets/fonts/BpmfIansui-Regular.ttf`
- `src/assets/fonts/OFL.txt`
- CSS 的 `BpmfIansui` font-face、芫荽變數與預覽 class。
- 預覽頁所有「芫荽注音字體」文案與二選一狀態。
