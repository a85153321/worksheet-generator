# 教師 Word 範例模板與 IVS 匯出

## 變更摘要

- 將教師提供的 `生字學習單注音版.docx` 保留於 `public/templates`，作為唯讀 Word 範例模板。
- 新增「範例注音生字學習單」模板選項。
- 匯出時直接複製範例文件第一題的群組圖形、文字格式、框線、田字格與段落間距。
- 每題替換為各自的生字、部首、筆畫、選定讀音與前三個常用語詞。
- 每頁固定五題；第六題起自動換頁。
- 若生字有教師上傳圖片，圖片會寫入 DOCX media、建立 image relationship，並錨定於對應題目。
- 注音字型模式會依選定讀音寫入 IVS；標楷體模式則保留一般 Unicode 生字。

## 驗證

- 測試 1、3、5、6、10 個不同生字的題目複製與分頁。
- 測試「會／ㄎㄨㄞˋ」寫入 `U+E01E1` variation selector。
- 測試 PNG 圖片、relationship 與 media part 均寫入 DOCX。
- 完整測試、ESLint、TypeScript 與 Vite production build 通過。
