## 0. 與工具整合

- **Codex CLI 會自動讀取 repo 根目錄的 `AGENTS.md`** 作為預設指示，不需要每次手動貼規則。建議在根目錄建立一份精簡的 `AGENTS.md`，內容指向本文件與 `PROJECT.md`，例如：

  ```md
  # AGENTS.md

  本專案的協作規則請先閱讀：
  - ./PROJECT.md（產品藍圖、架構、AI 呼叫規範）
  - ./AGENT_COLLABORATION.md（分工邊界、交接格式、Git 規範）

  Codex 只負責 src/domain、src/services、src/infrastructure、tests 中的邏輯測試。
  修改前請先確認未提交變更，不覆寫 Antigravity 的檔案。
  ```

- Antigravity 若有自己讀取專案設定的機制（例如專屬的 rules／context 檔），可比照辦理，指向同樣兩份文件，確保兩邊看到的規則永遠一致、不需要各自維護一份副本。