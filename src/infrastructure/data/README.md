# CNS11643 本機漢字屬性資料

`cns11643-character-info.json` 由數位發展部「CNS11643 中文標準交換碼全字庫」
的 Unicode 對照表與字型屬性檔整理而成，只保留本專案需要的部首、總筆畫與
注音欄位。

- 原始資料：https://data.gov.tw/dataset/5961
- 提供機關：數位發展部
- 來源名稱：CNS11643 中文標準交換碼全字庫
- 授權：政府資料開放授權條款－第 1 版
- 授權全文：https://data.gov.tw/license
- 產生方式：`scripts/build-cns11643-character-data.mjs`

本衍生資料採 `[radical, strokeCount, zhuyin[]]` 的精簡格式，以 Unicode 字元為
key。目前打包範圍為 Unicode CJK Unified Ideographs、Extension A 與 CJK
Compatibility Ideographs；範圍外字元由查詢函式回傳 `null`。依授權要求，使用
或再散布時應保留上述來源標示。
