# 變更記錄：學習單標楷體、芫荽注音字型與臺灣傳統直式注音排版規則

**日期**：2026-09-16  
**負責 Agent**：antigravity  
**分支**：`antigravity/print-export`  
**關聯需求**：
1. 全站學習單內文字統一使用標楷體（`"標楷體", "DFKai-SB", "BiauKai", serif`），並提供合理 fallback。
2. 當教材年級為一年級或二年級時，額外改用「芫荽注音」字體（SIL OFL 1.1 授權，可免費商用於教育教材）。字體檔放置於 `src/assets/fonts/`，並附帶 `OFL.txt` 授權聲明以保留授權合規紀錄。
3. 提供 fallback：若字體載入失敗，平滑改用標楷體，避免畫面顯示不出注音或破版。
4. 注音呈現方式須採臺灣傳統直式標示法：注音符號直式排列於國字右側，聲調符號位置正確（一聲不標、二三四聲標於注音符號旁、輕聲點標於整組注音上方置中）。
5. 字體與注音切換邏輯讀取目前教材對應的年級資訊，確認資料流完整貫穿至列印步驟。

---

## 1. 實作項目與架構設計

### 1.1 字型檔案與授權聲明（`src/assets/fonts/`）
- **字型檔**：`src/assets/fonts/BpmfIansui-Regular.ttf`（約 7.4 MB TrueType 字型檔，由 But Ko 發布之開源注音字型專案，採注音 IVS 規格，會在漢字右側直式標示臺灣教育部標準注音符號）。
- **授權合規聲明檔**：`src/assets/fonts/OFL.txt`（包含完整的 SIL Open Font License 1.1 授權全文、Klee One 衍生條款與 Copyright 2022 But Ko / The Klee Project Authors 聲明，確保在教育教材與商業應用中完全合規）。

### 1.2 CSS 字型堆疊與直式注音排版系統（`src/styles/app.css`）
- **`@font-face` 定義**：
  ```css
  @font-face {
    font-family: 'BpmfIansui';
    src: url('../assets/fonts/BpmfIansui-Regular.ttf') format('truetype');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }
  ```
- **CSS 變數與字型模式**：
  - `--font-worksheet-standard`: `'標楷體', 'DFKai-SB', 'BiauKai', serif;`
  - `--font-worksheet-bopomofo`: `'BpmfIansui', '標楷體', 'DFKai-SB', 'BiauKai', serif;`
  - 低年級類別：`.a4-sheet.worksheet-font-bopomofo, .a4-sheet.worksheet-grade-1, .a4-sheet.worksheet-grade-2` 自動切換為 `--font-worksheet-bopomofo`。
  - 中高年級類別：`.a4-sheet.worksheet-font-standard, .a4-sheet.worksheet-grade-3-6` 套用標準楷體。
  - **Fallback 保證**：若字型檔案下載中或失敗，自動平滑降級至標楷體，絕不破版。
- **臺灣教育部標準直式注音 CSS**：
  - `.zhuyin-wrapper`: `inline-flex`，基準線對齊國字。
  - `.zhuyin-col-wrap`: 垂直排列欄位。
  - `.zhuyin-symbols`: 注音符號垂直流（`flex-direction: column`）。
  - `.zhuyin-light-dot`: 輕聲點置於符號正上方（`top: -0.15em; left: 50%; transform: translateX(-50%)`）。
  - `.zhuyin-side-tone`: 二聲（ˊ）、三聲（ˇ）、四聲（ˋ）精確標註於右側下緣。
  - 一聲不標調。
- **示範田字格含直式注音欄**：
  - `.tianzige-box-with-zhuyin`: 田字格右側無縫銜接紅框米黃底直式注音欄（`.sheet-tian-zhuyin-column`），還原臺灣生字習寫簿標準版面。

### 1.3 直式注音元件與剖析器（`src/components/`）
- `src/components/zhuyin-parser.ts`：
  - `parseZhuyin(zhuyinStr)`：解析注音字串，區分音標主體（ㄅ~ㄦ）與聲調（1~5 聲），準確識別輕聲符號（˙）與二三四聲符號。
- `src/components/VerticalZhuyin.tsx`：
  - `<VerticalZhuyin />`：高保真直式注音元件，支援語音朗讀無障礙標籤 `aria-label`。
  - `<TianzigeWithZhuyin />`：提供示範字（含右側注音欄）、描紅字與編號習寫格。

### 1.4 年級資料流與 A4 預覽列印整合（`src/features/preview/PrintPreviewPage.tsx`）
- **資料流貫穿確認**：
  - `selectedGrade` 由 `AppContext` 全域維護（從步驟一教材上傳設定開始貫穿）。
  - 在步驟六 A4 預覽列印頁直接自 `useApp()` 取得 `selectedGrade`，並於卡片上新增快速年級切換器（`#preview-grade-select`），讓教師可一鍵即時切換一二年級（芫荽注音）與三至六年級（標楷體）預覽效果。
  - `<article className="a4-sheet">` 動態綁定 `worksheet-font-bopomofo` 或 `worksheet-font-standard`。
  - 頁面標題與副標題清晰標示目前年級與字型模式（例如「國小 1 年級 ｜ （芫荽注音）」）。

---

## 2. 測試與驗證（Verification）

撰寫自動化端對端測試腳本（`scratch/test_grade_fonts_and_zhuyin.mjs`）進行 Edge CDP 驗證：

1. **一年級情境（Grade 1）**：
   - 驗證 `.a4-sheet` 包含 class `worksheet-font-bopomofo` 與 `worksheet-grade-1-2`。
   - 驗證 computed `fontFamily` 為 `BpmfIansui, 標楷體, DFKai-SB, BiauKai, serif`。
   - 驗證全站文字（含說明欄、生字、詞語、造句）自動帶有芫荽注音直式標記。
   - 驗證示範田字格右側注音欄（`.sheet-tian-zhuyin-column`）成功渲染，二聲標號（`ˊ`）位於右側。
   - 截圖存證：`preview_grade_1_bpmf.png`。
2. **三年級情境（Grade 3）**：
   - 切換年級為 3 年級。
   - 驗證 `.a4-sheet` 包含 class `worksheet-font-standard` 與 `worksheet-grade-3-6`。
   - 驗證 computed `fontFamily` 為 `標楷體, DFKai-SB, BiauKai, serif`。
   - 驗證生字示範格維持右側直式注音欄，內容本文切換為標楷體純漢字。
   - 截圖存證：`preview_grade_3_kaishu.png`。
3. **列印預覽（Ctrl+P / Print Media）情境**：
   - 啟用 `@media print` 媒體模擬。
   - 驗證非列印 UI（導航列、按鈕列、切換選單）全部為 `display: none`。
   - 驗證列印模式下字型維持 `BpmfIansui`，直式注音排版完全保留且不跑版。
   - 透過 `Page.printToPDF` 產出真實 PDF（838 KB），驗證列印輸出完整無缺字。
   - 截圖存證：`preview_print_grade_1.png`。

---

## 3. 建置與代碼檢查
- `npm run build`：0 errors，Vite 成功打包 `dist/assets/BpmfIansui-Regular-*.ttf`。
- `npm run lint`：0 errors，0 warnings。

---

## Handoff
- Owner: Antigravity
- Goal: 完成學習單字體設定（標楷體基準、一二年級套用芫荽注音、SIL OFL 1.1 授權合規、臺灣標準直式注音排版與年級資料流對接）。
- Changed files:
  - `src/assets/fonts/BpmfIansui-Regular.ttf`（注音芫荽開源字型）
  - `src/assets/fonts/OFL.txt`（SIL OFL 1.1 授權聲明檔案）
  - `src/components/zhuyin-parser.ts`（標準注音聲調剖析器）
  - `src/components/VerticalZhuyin.tsx`（直式注音與示範田字格注音欄元件）
  - `src/styles/app.css`（@font-face、字型變數、直式注音與田字格樣式、列印相容）
  - `src/features/preview/PrintPreviewPage.tsx`（對接 selectedGrade、動態套用字型、田字格注音欄與年級切換控制）
  - `docs/changes/2026-09-16-worksheet-fonts-and-vertical-zhuyin.md`（變更與測試記錄）
- Contract change: none
- Verified: 一年級（芫荽注音）、三年級（標楷體）、直式注音聲調定位、Ctrl+P 列印預覽與實體 PDF 驗證皆通過
- Risks / open questions: none（未來若 Codex 擴充 `WorksheetDoc` 型別時，建議可加入 `grade?: number` 作為儲存記錄）
- Next owner action: 可由教師體驗一年級至六年級的學習單版面切換與列印輸出效果
