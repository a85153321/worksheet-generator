## Handoff
- Owner: Antigravity
- Goal: 修復現行生字範本 `生字注音學習單.docx` 跨頁切斷與分頁過疏問題，確保每一題（資訊表格、田字格、常用語詞段落）完整同頁呈現。
- Root cause:
  1. 先前 Codex 修改的舊範本檔案已被重構刪除，現行生效的 `src/assets/docx-templates/生字注音學習單.docx` 遺漏了 `cantSplit` 與 `keepNext` 設定。
  2. 先前未對練習格表格到語詞段落建立完整 keep 鏈，造成題內元件有落單風險。
  3. 題號 4 曾因空間不足導致資訊表留在前頁、練習格被切至次頁。
- Changed files:
  - `src/assets/docx-templates/生字注音學習單.docx`：注入表格 `w:cantSplit`、資訊表與練習格 `w:keepNext`，移除直接設定的硬編碼 `w:rFonts` 以利動態字型生效。
  - `scripts/patch-worksheet-template.py`：建立自動化範本修復與檢查腳本。
  - `tests/reference-template-docx.test.ts`：更新範本路徑與樣式斷言，測試覆蓋動態字型、不跨頁分割、欄格結構。
  - `outputs/生字學習單-8題分頁驗證.docx`：更新 8 題實測驗證成品。
- Verified:
  - `npm test`：10 個測試檔、43 個案例全部通過。
  - `npm run lint`：通過。
  - `npm run build`：通過。
  - Microsoft Word COM 實測：8 題自然整齊排版為 2 頁（每頁滿滿 4 題）：
    - 第 1–4 題：第 1 頁（含頂部標題、姓名欄位，底部保留安全邊界約 56pt）
    - 第 5–8 題：第 2 頁（完整容納 4 題）
    每題資訊表格、田字格練習格起訖點與語詞段落完全一致，無任何跨頁切斷現象，消滅題間多餘空行。
