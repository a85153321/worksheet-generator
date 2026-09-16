# 修復學習單標點符號字體對齊與標題列彈性排版

## 變更背景
套用標楷體與芫荽注音字體規則後，使用者回報兩個版面問題：
1. **標點符號對齊問題**：全形符號（如冒號、頓號等）在多個學習單模板中位置跑掉、跟文字對不齊。
2. **標題列排版錯亂問題**：「詞語學習單」標題列（年級、單元評量、模板名稱、年/班/座號/姓名/得分）排版錯亂、欄位互相擠壓覆蓋。
要求：針對所有學習單模板（生字田字格、詞語積木、句型仿寫、生字語文綜合單）逐一檢查修正，確認標點符號與標題列排版正常對齊。

## 問題根因分析
1. **標點符號偏移**：
   - index.html 之前宣告為 <html lang=en>，導致 Chromium/Edge 等瀏覽器的 OpenType locl 特徵未啟用台灣繁體中文標點規則（全形冒號與頓號會偏向底線左側，而不是正中）。
   - 字體 fallback 堆疊末端帶有 generic serif，在部分平台（如 Windows）fallback 到英文字型（Times New Roman），造成全形標點之字寬與行高基線突變。
2. **標題列欄位擠壓覆蓋**：
   - A4 內容可用寬度約 174mm (~657px)，原本標題列在單一 flex 列同時容納標題（例如「國小 3 年級 ｜ 國語單元評量 ｜ 詞語積木擴展單」）與四個學生資訊欄位（年班、座號、姓名、得分），總寬度超過 750px，造成 flex-wrap 換行錯位並相互擠壓。

## 具體變更

1. **HTML 繁體中文語系設定 (index.html)**：
   - 將 <html lang=en> 調整為 <html lang=zh-TW>，確保 OpenType locl 繁體中文標準字形與標點特徵啟用。

2. **標點專屬字體堆疊與安全 Fallback (src/styles/app.css)**：
   - 定義 @font-face { font-family: 'WorksheetPunct'; ... unicode-range: U+FF1A, U+3001, U+FF0C, U+3002, U+FF1B, U+FF01, U+FF1F, U+3010, U+3011, U+300C, U+300D, U+FF08, U+FF09, U+2014, U+FF5C; }，優先由微軟正黑體/蘋方/思源黑體等繁體中文標點專門渲染標點符號。
   - 移除不穩定的 generic serif，改為以 sans-serif 為系統級最後保底。
   - 為 .a4-sheet 補上 ont-feature-settings: pwid 0, palt 0; 與 ont-variant-east-asian: normal;，確保全形標點具備標準全角寬度與正中基線。

3. **標題列排版重構 (src/styles/app.css, src/features/preview/PrintPreviewPage.tsx, src/features/templates/TemplateSelectionPage.tsx)**：
   - 將 .sheet-header 重構為雙層結構：
     - 上層 .sheet-header-top：左側標題與右側單元/模板標籤，採用 flexbox 與 baseline 對齊。
     - 下層 .sheet-info-row：獨立排於下方，包含年班、座號、姓名、得分四欄位，配置 white-space: nowrap 與彈性 gap。
   - 確保四種學習單模板在任何年級（1 年級含注音、3 年級標楷體等）長度下，標題與學生資訊欄位永不重疊擠壓。

## 驗證結果
1. **自動化測試與代碼檢查**：
   - 
pm test：52 項測試全數通過（含 9 個測試套件）。
   - 
pm run lint：0 錯誤。
   - 
pm run build：成功編譯打包。
2. **跨模板瀏覽器實機渲染驗證**：
   - 透過 Edge CDP 實機跑遍 4 大模板（生字田字格、詞語積木、句型仿寫、綜合練習），各測試 1 年級（芫荽注音）與 3 年級（標楷體）共 8 種組合。
   - 實機 DOM 碰撞檢測：	itleMetaOverlap: false，標題與中繼標籤無任何碰撞。
   - 實機標點符號檢查：冒號與頓號置中，字寬與基線均勻穩定。
