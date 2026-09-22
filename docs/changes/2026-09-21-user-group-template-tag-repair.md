## Handoff
- Owner: Codex
- Goal: 檢查使用者提供的 `生字學習單test.docx` 標籤，產出不改動群組繪圖結構的標籤補全副本，並實測 easy-template-x 對群組繪圖迴圈的相容性。
- Changed files: `outputs/生字學習單test-標籤補全.docx`、`docs/changes/2026-09-21-user-group-template-tag-repair.md`
- Dictionary version: unchanged
- Contract change: none；沿用 `{#items}`、`{questionNumber}`、`{character}`、`{zhuyin}`、`{radical}`、`{strokeCount}`、`{image}`、`{wordCandidatesText}`、`{/items}`。
- Verified: 原始檔 SHA-256 維持 `dcfa98ab77f4ae6b045ba6b95b698017fa42efb80247c73c3fbbc2c677151399`；輸出封裝只有 `word/document.xml` 與 `word/styles.xml` 改變；`wpg:wgp`、`mc:AlternateContent`、VML `w:pict` 各保留 1 組；新增 `WorksheetCharacter` 字元樣式並套用至 13 個 `{character}` run；easy-template-x 可辨識全部標籤；Microsoft Word 可開啟補全範本及單題實際渲染檔。
- Risks / open questions: easy-template-x 將含群組繪圖的 `{#items}` 區塊複製為兩題後，Microsoft Word 實測回報檔案損毀；因此此副本只證明標籤與單題填值正確，尚不能作為任意多題的安全範本。若要保留群組繪圖，需另做 OOXML DrawingML／VML 成對複製器與識別碼、關聯、錨點重寫。
- Next owner action: 使用者決定採用「表格重建」或投入群組繪圖預展開器；若採表格，保留紅色示範格、灰色描字格、虛線習寫格、紫色部首格及田字格導線即可達成主要視覺語意。
