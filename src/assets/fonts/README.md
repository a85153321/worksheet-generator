# 學習單字型

來源：ButTaiwan/bpmfvs release `v1.500`

官方下載頁：<https://github.com/ButTaiwan/bpmfvs/releases>

| UI 選項 | 檔案 | OpenType Full font name（name ID 4） | Word `w:rFonts` |
| --- | --- | --- | --- |
| 標楷體 | 系統字型，不隨專案提供 | `標楷體` | `標楷體` |
| 標楷有注音 | `BpmfZihiKaiStd-Regular.ttf` | `ㄅ字嗨注音標楷 Regular` | `ㄅ字嗨注音標楷 Regular` |
| 注音有框 | `BpmfZihiBox-R.ttf` | `ㄅ字嗨注音加框 R` | `ㄅ字嗨注音加框 R` |
| 純注音 | `BpmfZihiOnly-R.ttf` | `ㄅ字嗨注音而已 R` | `ㄅ字嗨注音而已 R` |

完整字型名稱由字型檔 OpenType `name` table 的 name ID 4 讀取，並非由檔名推測。Word 匯出只寫入字型名稱，不把 TTF 嵌入 DOCX；開啟文件的電腦需要安裝相同字型，否則 Word 會進行字型替代。

授權與 NOTICE：

- `BPMFVS-LICENSE-2.0.txt`
- `BPMFVS-LICENSE-ZihiKaiStd.txt`
- `BPMFVS-LICENSE-Gen.txt`
- `BPMFVS-NOTICE.txt`
