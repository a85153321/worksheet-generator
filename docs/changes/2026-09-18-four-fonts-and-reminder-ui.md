## Handoff

- Owner: Antigravity
- Goal: 完成步驟六「學習單字體」下拉選單四選項改版（標楷體（標準字體，不顯示注音）、標楷有注音、注音有框、純注音）、排版狀態文案動態同步更新、增強 `@font-face` 本機安裝優先 fallback 堆疊，並於預覽頁面新增字型安裝與 Word (.docx) 排版提醒區塊。
- Changed files:
  - `src/features/preview/PrintPreviewPage.tsx`
  - `src/styles/app.css`
  - `docs/changes/2026-09-18-four-fonts-and-reminder-ui.md`
- Dictionary version: unchanged (`dict_concised_2014_20260626`)
- Contract change: none（直接使用 Codex 於 `src/services/contracts.ts` 提供之 `WorksheetFont` 契約與 export options）
- Verified:
  - `npm test`: 5 個測試檔、26 項測試全數通過。
  - `npm run lint`: ESLint 0 錯誤、0 警告。
  - `npm run build`: `tsc -b && vite build` 0 型別錯誤，順利產出包含三款 TTF 的完整 production build。
  - 瀏覽器自動化 CDP 端到端驗證（含截圖）：
    1. 「學習單字體」下拉選單選項名稱確認：
       - `標楷體（標準字體，不顯示注音）` (`standard-kai`)
       - `標楷有注音` (`zihi-kai-zhuyin`)
       - `注音有框` (`zihi-box-zhuyin`)
       - `純注音` (`zihi-only-zhuyin`)
    2. 切換字體時，狀態提示即時反映所選字體：
       - `✨ 已套用標準「標楷體」排版`
       - `✨ 已套用標準「標楷有注音」排版`
       - `✨ 已套用標準「注音有框」排版`
       - `✨ 已套用標準「純注音」排版`
    3. A4 預覽區域即時更新為對應之 CSS class（`worksheet-font-standard-kai`、`worksheet-font-zihi-kai-zhuyin`、`worksheet-font-zihi-box-zhuyin`、`worksheet-font-zihi-only-zhuyin`），且頁面頂部副標題與學習單頁首徽章動態同步。
    4. 字型安裝與 Word (.docx) 排版提醒區塊清楚呈現於操作列下方，具備 `no-print` 樣式確保列印與 PDF 匯出時自動隱藏，完整包含：
       - 預覽與 PDF 匯出內建字型顯示正確 vs Word 開啟需安裝字型否則跑版之詳細說明。
       - 四款字型名稱、檔案對照及 ButTaiwan/bpmfvs GitHub Releases 官方安全下載連結。
       - Windows 及 Mac 簡易安裝步驟說明。
       - 純向量字型格式非可執行檔之安全性說明。
- Screenshots:
  - `step6_font_reminder_block.png`
  - `step6_font_standard_kai.png`
  - `step6_font_zihi_kai_zhuyin.png`
  - `step6_font_zihi_box_zhuyin.png`
  - `step6_font_zihi_only_zhuyin.png`
- Risks / open questions: None.
- Next owner action: 可進行後續功能驗收或發布。
