# 學習單字型

來源：ButTaiwan/bpmfvs release `v1.500`

官方下載頁：<https://github.com/ButTaiwan/bpmfvs/releases>

| UI 選項 | 檔案 | OpenType Full font name（name ID 4） | Word `w:rFonts` |
| --- | --- | --- | --- |
| 標楷體 | 系統字型，不隨專案提供 | `標楷體` | `標楷體` |
| 標楷有注音 | `BpmfZihiKaiStd-Regular.ttf` | `ㄅ字嗨注音標楷 Regular` | `ㄅ字嗨注音標楷 Regular` |
| 純注音 | `BpmfZihiOnly-R.ttf` | `ㄅ字嗨注音而已 R` | `ㄅ字嗨注音而已 R` |

## 注音 IVS 讀音對照

`bpmf-ivs-map.json` 由 `scripts/build-bpmf-ivs-map.mjs` 從
ButTaiwan/bpmfvs 的 `phonetic/phonic_table_Z.txt` 建立。來源固定於 commit
`62683aa`，來源檔 SHA-256 為
`3310ecd8fcc7fa70bf5cda0731a96441628cc773eb0857977ed4bb73e0e94b60`。

固定版本的上游原始快照保留在 `scripts/vendor/bpmfvs/phonic_table_Z.txt`。
重建指令：`npm run build:bpmf-ivs`。腳本會驗證來源雜湊後才覆寫對照表；
也可用 `--source <path>` 指定相同內容的來源檔。第一讀音不加
selector，第二至第六讀音依序使用 U+E01E1 至 U+E01E5，與上游字型生成器一致。

規格與相關程式碼依 Apache License 2.0 發行；完整授權與 NOTICE 已隨字型資產
保留於本目錄的 `BPMFVS-LICENSE-2.0.txt` 與 `BPMFVS-NOTICE.txt`。

完整字型名稱由字型檔 OpenType `name` table 的 name ID 4 讀取，並非由檔名推測。Word 匯出只寫入字型名稱，不把 TTF 嵌入 DOCX；開啟文件的電腦需要安裝相同字型，否則 Word 會進行字型替代。

授權與 NOTICE：

- `BPMFVS-LICENSE-2.0.txt`
- `BPMFVS-LICENSE-ZihiKaiStd.txt`
- `BPMFVS-LICENSE-Gen.txt`
- `BPMFVS-NOTICE.txt`
