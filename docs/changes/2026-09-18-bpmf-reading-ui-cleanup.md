## Handoff

- Owner: Antigravity
- Goal: 完成審核卡片標楷注音字體渲染與多音字讀音切換按鈕組、移除過時的「顯示注音」勾選框與破音字提醒文案、將字型安裝說明改為預設收折，並確保三款字型切換與端到端流程正常。
- Changed files:
  - `src/features/review/ReviewPage.tsx`
  - `src/features/preview/PrintPreviewPage.tsx`
  - `src/styles/app.css`
  - `.gitattributes`
  - `scripts/build-bpmf-ivs-map.mjs`
  - `docs/changes/2026-09-18-bpmf-reading-ui-cleanup.md`
- Dictionary version: unchanged (`dict_concised_2014_20260626`)
- Contract change: none (UI 配合 Codex 既有 `CharacterAnalysis.zhuyinCandidates`、`resolveBopomofoDisplayCharacter`、以及 `WorksheetFont` 3 種字型選項)
- Verified:
  - `npm run build:bpmf-ivs -- --check`: 通過，IVS map 產物與上游文字檔檢查一致。
  - `npx tsc -b --pretty false`: 通過，零型別錯誤。
  - `npm run lint`: 通過，ESLint 零錯誤。
  - `npm test -- --run`: 6 個測試檔、30 項測試全數通過（含 IVS map、辭典查詢、DOCX 字型與 IVS 寫入）。
  - `npm run build`: 通過，Vite 打包順利完成。
  - 瀏覽器自動化 CDP 端到端測試（挑選破音字「長」「行」與單音字「學」）：
    1. **步驟三審核卡片渲染**：
       - 生字標頭改以 `resolveBopomofoDisplayCharacter(item.character, item.zhuyin)` 渲染，套用 `.review-bopomofo-character`（`ㄅ字嗨注音標楷 Regular`，`font-weight: 400`，字級 `4.5rem`）。
       - 多音字（如「長」、「行」）卡片顯示讀音切換按鈕組，目前選取的讀音高亮為 `.selected` 並設 `aria-pressed="true"`，下方顯示「目前讀音：XX」備援小字。
       - 單音字（如「學」）不顯示切換按鈕，簡潔顯示「讀音：ㄒㄩㄝˊ」。
       - 移除舊版卡片上的「注音：XX」純文字行與步驟三頂部「若生字為破音字...」固定提醒文字。
       - 點擊其他讀音（如「長」切換至「ㄔㄤˊ」、「行」切換至「ㄒㄧㄥˊ」）時，立即更新 `item.zhuyin` 並呼叫 `saveAnalysisData` 持久化儲存，大字與 IVS 注音即時隨之切換變更。
    2. **步驟六控制列與字型選單**：
       - 完全無「顯示注音」勾選框，字型選擇完全由下拉選單決定。
       - 學習單字體下拉選單僅包含三款：「標楷體（標準字體，不顯示注音）」、「標楷有注音」、「純注音」，完全移除「注音有框」與相關資源。
    3. **字型安裝提醒收折**：
       - 「學習單字型安裝與 Word (.docx) 排版提醒」預設為收合狀態，標題列顯示「點擊展開 ▶」，`aria-expanded="false"`，不佔用版面垂直空間。
       - 點擊標題列任一處可展開完整說明（三款開源字型下載連結、安裝指引、安全說明），右側顯示「點擊收合 ▼」，`aria-expanded="true"`。再次點擊可順暢收回。
    4. **學習單預覽與字型切換**：
       - 步驟五模板選擇與步驟六預覽共用正確字型與版面配置。
       - 切換至「標楷體」、「標楷有注音」、「純注音」時，A4 學習單預覽即時套用對應字型 class。
- Screenshots:
  - `step3_polyphone_reading_buttons.png`（多音字顯示讀音切換按鈕、單音字顯示純讀音文字）
  - `step3_reading_switched.png`（點擊切換讀音後狀態更新）
  - `step3_switched_readings_chang_xing.png`（「長」切換至「ㄔㄤˊ」、「行」切換至「ㄒㄧㄥˊ」之即時 IVS 注音渲染）
  - `step6_font_reminder_collapsed.png`（控制列無勾選框、三款字體、安裝提醒預設收合）
  - `step6_font_reminder_expanded.png`（點擊展開字型安裝提醒）
  - `step6_font_zihi_kai.png`（標楷有注音 A4 預覽）
  - `step6_font_zihi_only.png`（純注音 A4 預覽）
- Risks / open questions: None.
- Next owner action: 可進行後續功能擴充或合併至 main 分支。
