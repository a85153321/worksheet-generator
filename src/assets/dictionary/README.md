# 教育部《國語辭典簡編本》本機資料

- 版本：`dict_concised_2014_20260626`
- 來源：教育部國語辭典公眾授權網
- 原始下載：`https://language.moe.gov.tw/001/Upload/Files/site_content/M0001/respub/download/dict_concised_2014_20260626.zip`
- 授權：創用CC-姓名標示-禁止改作 3.0 臺灣（CC BY-ND 3.0 TW）
- 官方說明：允許重製、散布、傳輸及商業利用，但不得修改著作，使用時須遵守使用說明。

`dict-concised.json` 是原始 XLSX 文字欄位的結構化索引；字詞名、注音、部首、筆畫與釋義文字均原樣保留。資料以字詞號為唯一主鍵，另提供字詞名與單一漢字索引。此目錄不包含語音、圖片等多媒體檔案。

重新產生：

```text
python scripts/build-moe-concised-dictionary.py <原始 xlsx> src/assets/dictionary/dict-concised.json
```
