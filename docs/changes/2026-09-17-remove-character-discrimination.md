# 移除字音字形辨析單

日期：2026-09-17

## 契約變更

- `WorksheetTemplate` 不再接受 `character-discrimination`。
- `WorksheetDoc.templateLabel` 不再接受 `字音字形辨析`。
- 移除 `CharacterDiscriminationWorksheetSection`，`WorksheetSection` union 不再包含此 section。
- `CharacterAnalysis`／`AnalysisResult` 的字元項目移除 `lookalikeCandidates` 與 `multiPronunciations`，對應 Zod schema 與具名型別同步移除。
- 移除只供此模板使用的 `no-eligible-characters` AppError variant。

目前可用模板為：`character-practice`、`word-practice`、`sentence-practice`、`picture-practice`。

## 實作移除範圍

- 移除 `buildWorksheet` 的辨析模板資料組裝、門檻檢查與錯誤分支。
- 移除模板選擇頁、列印預覽、DOCX 匯出與 CSS 中的辨析單顯示邏輯。
- 移除辨析 schema、worksheet builder 與 DOCX 的專屬測試案例／樣本欄位。
- Gemini 分析 prompt 維持只要求 OCR 字元、詞語與例句；已確認沒有形近字或多音字候選指令殘留。

## 保留的共用功能

`src/infrastructure/data/cns11643-character-info.json` 與 `lookupCharacterInfo` 不是辨析單專用資料。圖片分析與直接輸入生字流程仍使用它們查詢部首、筆畫與台灣注音，因此完整保留。

## 串接注意事項

UI 不應再傳入 `character-discrimination`，也不應讀取 `lookalikeCandidates` 或 `multiPronunciations`。其餘分析資料（部首、筆畫、注音、詞語、例句）與四種現有模板契約維持不變。
