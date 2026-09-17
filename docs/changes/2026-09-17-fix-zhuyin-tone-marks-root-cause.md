# 變更說明：排查並根治田字格學習單聲調符號（ˊˇˋ˙）錯位問題

## 1. 根本原因排查報告 (CDP / Elements / Platform Font Inspection)

針對田字格聲調符號（二聲 `ˊ` U+02CA、三聲 `ˇ` U+02C7、四聲 `ˋ` U+02CB、輕聲 `˙` U+02D9）持續跑位的問題，本次深入底層字型檔案度量（Font Metrics / Bounding Box）與瀏覽器渲染管線（CDP `CSS.getPlatformFontsForNode`）進行排查，確認根本原因如下：

1. **各字體度量差距懸殊（Fullwidth CJK vs Ruby Annotation vs Western Modifier）**：
   - **標楷體 (DFKai-SB)**：聲調字符屬於標準全形 CJK 字符（`advance: 1024`），字符高度與寬度巨大（如三聲 `ˇ` 寬達 588 units，輕聲為粗圓點），垂直基準線偏向中下半部（`yMin: 32~60, yMax: 556~588`）。
   - **芫荽注音 (BpmfIansui)**：聲調字符是專門給旁注設計的專屬字符，字型內部 advance 寬達 1536（比標準字身寬 1.5 倍），字符本體被推到左上角（`yMin: 490~830`，比標楷體高出 42% 的字身高度），右側留有逾 1000 units 的空白。
   - **西文系統 Fallback (Arial / Segoe UI / Times New Roman / Roboto)**：在非 Windows 環境（如 macOS、Linux、Android、Chromebook），或當字體堆疊缺字 fallback 時，U+02CA..U+02D9 屬於西文變音修飾符號（Spacing Modifier Letters），字身極窄（寬度僅約 300 units），大小與中文注音嚴重脫節。

2. **定位邏輯與字型耦合脆弱**：
   - 原 CSS 採用寫死的邊界位移（`position: absolute; right: -7px; bottom: 1px;`），此數值僅在某單一字體度量下勉強運作。一旦使用者切換「標楷體」或「芫荽注音」，或是跨平台觸發 fallback，因字體間 baseline 差距高達 40% 以上，聲調符號立即發生「碰撞注音本體」、「跌落示範格外框底部」或「漂浮過高」等症狀。
   - 輕聲點 `˙` 原本設置 `top: -8px; font-size: 10px;`，未針對輕聲圓點做正中央水平對齊校正，導致偏斜。

---

## 2. 解決方案與實作細節

1. **建立專屬聲調字型攔截規則 (`WorksheetTone`)**：
   - 在 `src/styles/app.css` 定義 `@font-face WorksheetTone`，精準指定 `unicode-range: U+02CA, U+02C7, U+02CB, U+02D9, U+00B7;`。
   - 依序鎖定系統原生高品質 CJK 楷體/黑體（`DFKai-SB`、`標楷體`、`BiauKai`、`Kaiti TC`、`Microsoft JhengHei`、`PingFang TC`、`Noto Sans TC`），杜絕在任何作業系統上 fallback 到西文細瘦變音符號（Arial / Segoe UI）。
   - 確保不論主要文字使用何種字型模式，聲調符號一律由穩定一致的 CJK 字符渲染。

2. **重構聲調符號比例與精準定位**：
   - **大小比例**：依據教育部《國語注音符號編排規範》，將聲調符號大小規範在注音符號之 70%~75%（田字格示範欄由 10px 微調至 8.5px），解決標楷體三聲 `ˇ` 原本過大吃進符號的壓迫感。
   - **二三四聲細分微調**：
     - `.tian-zhuyin-side-tone.tone-2`（二聲 `ˊ`）：定位於末字右上方（`bottom: 3px; right: -6px;`），筆勢昂揚且不溢出外框。
     - `.tian-zhuyin-side-tone.tone-3`（三聲 `ˇ`）：定位於末字右側適中高度（`bottom: 2.5px; right: -6.5px;`），兩翼與注音符號本體保持安全間隔。
     - `.tian-zhuyin-side-tone.tone-4`（四聲 `ˋ`）：定位於末字右上方（`bottom: 2.5px; right: -5.5px;`），自然收筆。
   - **輕聲點 (`˙`) 置中**：
     - `.tian-zhuyin-light-dot` 改為 `top: -9px; left: 50%; transform: translateX(-50%); font-size: 11px;`，精準居中於注音頂部正上方。
   - **示範格注音欄排版**：
     - `.sheet-tian-zhuyin-column` 設為 `padding: 0; overflow: visible;`，搭配 `.tian-zhuyin-symbols-group` 留出 2.5px 右側安全距離，確保聲調即便在列印與高解析度縮放下亦 100% 落在紅框內部，不溢出邊界。
   - **一般直式注音同步優化**：
     - `.zhuyin-light-dot` 與 `.zhuyin-side-tone` 亦同步改用 `var(--font-zhuyin-tone)` 與分聲調微調（`tone-2`, `tone-3`, `tone-4`）。

3. **豐富預設示範教材**：
   - `PrintPreviewPage.tsx` 中的備用教材擴充涵蓋一聲（`一`）、二聲（`學`）、三聲（`馬`）、四聲（`亮`）與輕聲（`的`），確保預覽與列印測試即時覆蓋所有聲調情境。

---

## 3. 驗證結果

1. **自動化測試**：`npm test` 全數通過（10 個測試檔案、66 個測試項目全數 PASS）。
2. **語法與型別檢查**：`npm run lint` 0 警告 0 錯誤；`npm run build` TypeScript 與 Vite 打包順利完成。
3. **高解析度特寫截圖確認**：
   - `step6_character_practice_standard_zoom.png`：標楷體模式下，學（二聲）、馬（三聲）、亮（四聲）、的（輕聲）定位精確，與符號保持優雅距離，未遮擋或跑位。
   - `step6_character_practice_bopomofo_zoom.png`：芫荽注音模式下，所有聲調符號尺寸均勻、無變形或錯位。
   - `step6_character_practice_light_tone_zoom.png`：輕聲點「˙」端正懸於頂端正中央。
