# 開放詞典網《漢字拆字字典》繁體版本機索引

- 來源：開放詞典網《漢字拆字字典》繁體版
- 上游 repository：`https://github.com/kfcd/chaizi`
- 原始檔案：`chaizi-ft.txt`
- 本次來源 revision：`e177ab54ce4edf255315a60593ffecbd8167e96b`
- 授權：Creative Commons Attribution 3.0 Unported（CC BY 3.0）
- 原作者署名：© 2015 開放詞典

`lookalike-index.json` 是由繁體拆字資料建立的離線衍生索引，包含每個漢字的部件清單、部件到漢字的反向索引，以及最多 8 個「共用至少一個部件」候選。它只提供候選集合，不判定哪些字應放入同一道辨析題。

除了原始檔明列的直接部件，產生器也會辨識「連續部件序列恰好等於另一個已收錄漢字拆法」的複合部件。例如 `竪 = 臣 又 立`、`臤 = 臣 又`，因此 `竪` 也會索引到複合部件 `臤`。此規則完全由同一份拆字資料推導，不使用部首、筆畫或遠端服務。

候選依序採用：共享部件涉及的漢字越少者優先、共享部件數越多者優先、最後依 Unicode 碼位固定排序。常見部件可能連結大量漢字，因此每字最多保留 8 個候選，避免前端一次載入與教師審核的資料量失控。

重新產生：

```text
python scripts/build-chaizi-lookalike-index.py src/assets/chaizi/chaizi-ft.txt src/assets/chaizi/lookalike-index.json e177ab54ce4edf255315a60593ffecbd8167e96b
```
