# Word 範本設計規範

本專案使用 `easy-template-x` 在瀏覽器本機套用 DOCX 範本。每份範本自行決定版面、題目區塊、欄位位置與分頁方式；程式不再依段落索引、固定示範字或固定圖片座標辨識內容。

範本放在 `src/assets/docx-templates/`。建置時會自動收集該資料夾內所有 `.docx`，顯示名稱預設為去掉 `.docx` 的檔名。新增或移除檔案後必須重新啟動開發伺服器或重新建置，不需修改檔名白名單或 TypeScript registry。

## 一 標籤總表

標籤使用半形大括號。名稱區分大小寫，請完全照表輸入。

| 標籤 | 型別 | 內容 |
| --- | --- | --- |
| `{title}` | 文字 | 學習單標題 |
| `{questionNumber}` | 數字 | 題號，從 1 開始 |
| `{character}` | 文字 | 依當次字型規則處理後的生字；注音字型模式下可能含 IVS |
| `{zhuyin}` | 文字 | 選定的注音字串，例如 `ㄒㄩㄝˊ` |
| `{radical}` | 文字 | 部首；無資料時為 `—` |
| `{strokeCount}` | 數字或文字 | 總筆畫；無資料時為 `—` |
| `{wordCandidatesText}` | 文字 | 教師目前確認的語詞候選，以 `、` 串接，最多 3 個 |
| `{sentenceCandidatesText}` | 文字 | 教師目前確認的例句候選，以 `；` 串接，最多 2 則 |
| `{targetWord}` | 文字 | 教師指定作為挖空題答案的語詞；未指定時為空字串 |
| `{originalSentence}` | 文字 | 教育部辭典原始例句，完整保留；未指定時為空字串 |
| `{sentenceBeforeBlank}` | 文字 | `targetWord` 第一次出現位置之前的原文 |
| `{sentenceAfterBlank}` | 文字 | `targetWord` 第一次出現位置之後的原文 |
| `{#wordCandidates}{text}{/wordCandidates}` | 陣列迴圈 | 逐一輸出語詞候選 |
| `{#sentenceCandidates}{text}{/sentenceCandidates}` | 陣列迴圈 | 逐一輸出例句候選 |
| `{#items}...{/items}` | 陣列迴圈 | 逐一產生所有生字題目 |
| `{image}` | 圖片 | 該生字的教師上傳圖片；沒有原始 File／Blob 時不提供資料 |

`AnalysisResult` 是預覽與匯出的唯一候選資料來源：`wordCandidates` 實際只保存最多 3 個，`sentenceCandidates` 實際只保存最多 2 則。教育部辭典 lookup 另以 `wordCandidateDetails` 保留詞條字詞號、讀音及該詞條自己的例句，供教師換選時優先取得與目前語詞相符的例句；只有已選詞條都沒有例句時才使用整體例句池。這個 detail 結構不直接暴露成 Word 標籤，範本仍只讀取教師確認後的字串與陣列。

`wordSentenceBlank` 只保存教師最終指定語詞的一組挖空資料，不保存其他候選語詞的結果。Word 範本不負責判斷 `targetWord` 是否存在於例句；這項檢查完全由 domain 層的 `createSentenceBlank` 負責，找不到時不提供挖空資料，也不猜測或改寫辭典原文。

頂層的單一欄位取第一個生字，適合一份文件只處理一題的範本。多題範本應把題目區塊放在 `{#items}` 與 `{/items}` 之間；迴圈內可使用全部單一欄位、候選陣列與圖片。

本專案的候選陣列元素是 `{ text: string }`，因此逐項輸出使用 `{text}`，不是 `{.}`。這是刻意固定的專案契約，可避免依賴自訂 scope resolver。

## 二 單題範本

最簡單的單題範本可直接輸入：

```text
生字：{character}
注音：{zhuyin}
部首：{radical}
筆畫：{strokeCount}
語詞：{wordCandidatesText}
例句：{sentenceCandidatesText}
```

單題欄位會使用資料中的第一個生字。若資料可能含多個生字，應改用下一節的 `items` 迴圈。

## 三 多題迴圈

把一個完整題目區塊夾在開、關標籤之間：

```text
{#items}
第 {questionNumber} 題
生字：{character}　注音：{zhuyin}
部首：{radical}　筆畫：{strokeCount}
語詞：{wordCandidatesText}
{image}
{/items}
```

開標籤和關標籤應各放在獨立段落。兩者之間可以包含一般段落、表格、圖形與圖片佔位符。`easy-template-x` 會重複這段內容，不限制每頁五題；實際每頁題數由範本的區塊高度、段落設定、表格列設定及 Word 自然分頁共同決定。

### 避免單題被分頁拆開

如果一題由「資訊表格 → 練習格表格」等多個相鄰區塊組成，必須在 Word 範本中建立連續的分頁約束：

- 資訊表格與練習格表格的每一列都設定「不允許跨頁分割列」，OOXML 為 `w:trPr/w:cantSplit`。
- 資訊表格內的段落設定「與下段同頁」，OOXML 為 `w:pPr/w:keepNext`。
- 兩個表格之間若有空白段落，該段落也要設定「與下段同頁」，否則 keep chain 會在空白段落中斷。
- 不要把 `keepNext` 加到題目最後的語詞或例句段落，否則可能把下一題一併拉到同頁，造成不必要的大面積留白。

現行生字範本使用「資訊表格所有段落 keepNext → 橋接段落 keepNext → 練習格表格」的鏈，並在兩個表格列上使用 `cantSplit`。設計新範本時，至少以 8 題資料在 Microsoft Word 實際跨頁驗證；只檢查 XML 不足以證明 Word 排版結果。

若迴圈位於表格內，`easy-template-x` 會依位置判斷要重複儲存格、欄或列。為避免誤判，題目型迴圈建議使用獨立段落；確實需要指定策略時，可使用套件的 tag options，例如：

```text
{#items[loopOver:"paragraph"]}
...
{/items}
```

## 四 候選內容迴圈

不需要為每個候選套不同格式時，使用已串接欄位：

```text
常用語詞：{wordCandidatesText}
例句：{sentenceCandidatesText}
```

需要讓每個候選各佔一列、表格列或項目符號時，使用巢狀迴圈：

```text
{#wordCandidates}
□ {text}
{/wordCandidates}

{#sentenceCandidates}
例句：{text}
{/sentenceCandidates}
```

巢狀迴圈放在 `{#items}` 內時，會使用當前生字的候選資料。

## 五 語詞例句挖空

學生版建議把挖空前後文字與空格放在同一題內：

```text
{sentenceBeforeBlank}＿＿＿＿{sentenceAfterBlank}
```

教師答案版建議直接顯示完整原文：

```text
{originalSentence}
```

需要另列答案時可使用 `{targetWord}`。這四個標籤來自同一個巢狀資料物件；未指定挖空語詞時均為空字串。範本不得自行搜尋、刪除或替換句中文字。

## 六 圖片標籤

### 建議做法 圖片佔位符

在 Word 插入一張任意圖片作為佔位符，調整到最終需要的位置與繞圖方式，然後在圖片的替代文字說明欄填入：

```text
{image}
```

`easy-template-x` 會以教師圖片取代佔位圖。使用圖片佔位符比在一般文字中輸入 `{image}` 更適合固定版面，因為範本可直接表達位置、錨點與繞圖設定。

圖片資料由程式建立，格式如下：

```ts
{
  _type: 'image',
  source: await file.arrayBuffer(),
  format: MimeType.Png, // 或 Jpeg、Svg；WebP 會先在瀏覽器轉為 PNG
  width: 105,
  height: 80,
  altText: '教師為「學」上傳的教學圖片',
}
```

`width`、`height` 單位是 pixel。現行共用契約為 105 × 80 px。設計新範本時應為這個比例預留空間；若未來需要每份範本各自指定圖片尺寸，需再把尺寸加入模板 metadata。

只有 `WorksheetImage.file` 存在時才會提供圖片資料。預覽用的 `url` 不會拿來下載圖片，匯出也不會發出網路請求。沒有圖片時，文字型 `{image}` 會被移除；圖片佔位符若需要支援可選圖片，則應使用透明佔位圖，使未替換時保持空白。專案內已遷移的「生字學習單注音版」是在表格儲存格內使用文字型 `{image}`，無圖片時該儲存格保持空白。

### 行內圖片

也可以直接在一般段落輸入 `{image}`。此模式會在標籤位置插入行內圖片，適合表格儲存格或不需浮動定位的版面。圖片的實際二進位資料仍來自原始 File／Blob。

## 七 生字字元樣式與自動字型

所有 `{character}` 標籤必須套用 Word 字元樣式：

```text
WorksheetCharacter
```

在 Word 中可由「樣式」面板建立或套用字元樣式。請把整個 `{character}` 標籤套用同一個 `WorksheetCharacter`，不要只套用大括號或標籤名稱的一部分。

匯出流程會在 `easy-template-x` 渲染前開啟範本 ZIP，修改 `word/styles.xml` 中 `WorksheetCharacter` 的 `w:rFonts`。目前沿用既有預設規則：

| 條件 | Word 字型名稱 | `{character}` 值 |
| --- | --- | --- |
| 一、二年級 | `ㄅ字嗨注音標楷 Regular` | 先呼叫 `resolveBopomofoDisplayCharacter(character, zhuyin)`，可能附 IVS |
| 三至六年級 | `標楷體` | 原始生字，不附 IVS |

程式仍保留內部 `DocxExportOptions.font` 覆寫能力供測試與維護使用，但 UI 不提供手動字型選單。

範本中的 `{zhuyin}` 是一般注音符號文字，與 `{character}` 的 IVS 字型呈現是兩個不同欄位。設計者可依版面需要擇一或同時使用。

重要：不要在 `{character}` 所在 run 上保留直接設定的 `w:rFonts`，否則 Word 的直接格式可能蓋過 `WorksheetCharacter`。字級、顏色、粗體與位置可以直接設定；字型應交給字元樣式。

## 八 動態範本 registry

範本來源資料夾：

```text
src/assets/docx-templates/*.docx
```

建置流程以 `import.meta.glob` 自動掃描，Vite plugin 在建置時把每份 DOCX 轉成 base64 module。瀏覽器解碼成 `ArrayBuffer` 後直接交給 `easy-template-x`，不會在匯出時使用 `fetch`。

registry ID 由去掉副檔名後的檔名正規化而來；顯示名稱是原始檔名去掉 `.docx`。請避免兩份檔案只有空白、全半形或大小寫差異，否則正規化後可能產生相同 ID。

資料夾為空時，UI 會顯示「目前沒有可用的 Word 動態範本」，但其他程式化模板仍可使用。

## 九 Word 編輯注意事項

### easy-template-x 已處理的問題

- 不再依固定段落索引找欄位。
- 不再用 `看`、`目`、`9` 等可能撞名的示範字辨識內容。
- 一般文字標籤被 Word 拆成相鄰 run 時，解析器可跨文字節點尋找分隔符，不必手動解析 XML。
- 圖片 relationship、`word/media/` 與 content type 由 Image plugin 建立。
- 題目數量由 `items` 陣列與範本迴圈決定，不再由程式每五題複製／分頁。

### 仍需注意的問題

- 使用半形 `{`、`}`，不要改成全形括號。
- 一個標籤內不要插入換行、欄位、公式、WordArt 或內容控制項；Loop plugin 明確不支援把迴圈標籤放在內容控制項內。
- 開、關迴圈必須正確配對，並放在相容的段落／表格結構中。
- `{character}` 的整個標籤必須套用 `WorksheetCharacter`，且不要用直接字型格式覆蓋它。
- 圖片替代文字的「說明」欄必須恰好含 `{image}`；不要只寫在圖片標題或檔名。
- 關閉追蹤修訂並接受或拒絕既有修訂。未接受的刪除／插入標記可能讓標籤結構不完整。
- 儲存為 `.docx`，不要使用 `.doc`、`.docm` 或 Word 相容模式。
- 複製貼上標籤後應用 `TemplateHandler.parseTags` 或專案測試驗證；只看 Word 畫面無法發現替代文字放錯欄位或迴圈結構誤判。
- 注音字型不嵌入輸出 DOCX。開啟文件的電腦仍需安裝對應字型，否則 Word 會替代字型。
- 瀏覽器 HTML 預覽仍是共用模擬版面，不會自動解析任意 DOCX 成像素一致的預覽；Word 檔本身是動態範本的版面權威。

## 十 新範本交付前檢查清單

- [ ] 範本位於 `src/assets/docx-templates/`，副檔名為 `.docx`。
- [ ] 已用 Word 的「檢查文件」或等效工具清除文件屬性與個人資訊；`docProps/core.xml` 的 `creator` 與 `lastModifiedBy` 不得含值。專案測試會檢查資料夾內每份 DOCX。
- [ ] 檔名可直接作為 UI 顯示名稱，且不會與其他檔名正規化後重複。
- [ ] Word 可正常開啟範本，頁面尺寸、邊界與方向正確。
- [ ] 所有標籤使用半形大括號且名稱與本文件一致。
- [ ] 多題版面有一組正確配對的 `{#items}` 與 `{/items}`。
- [ ] 候選迴圈使用 `{text}`，不是 `{.}`。
- [ ] 每個 `{character}` 都完整套用 `WorksheetCharacter`。
- [ ] `{character}` run 沒有直接字型設定覆蓋字元樣式。
- [ ] 圖片位置使用文字型 `{image}`，或圖片佔位符的替代文字說明含 `{image}`；位置與 105 × 80 px 比例合適。
- [ ] 無圖片資料時，圖片位置保持空白且沒有示意圖殘留。
- [ ] 已用 `parseTags` 確認所有預期標籤均可辨識。
- [ ] 已用單題、多題、語詞陣列及例句陣列資料測試。
- [ ] 題目中的表格列已設定不允許跨頁分割，資訊區與練習區之間的段落已設定與下段同頁。
- [ ] 已用至少 8 題資料在 Microsoft Word 逐頁確認資訊列與練習格沒有分離。
- [ ] 已測試同一份多題資料中部分有圖片、部分沒有圖片。
- [ ] 已檢查輸出 ZIP 的 `word/media/`，確認教師圖片實際嵌入。
- [ ] 已確認匯出過程沒有 `fetch` 或其他網路請求。
- [ ] 已在 Word 開啟並逐頁檢查文字截斷、圖形重疊、字型替代及分頁。
