# 本機形近字候選查詢

## Handoff
- Owner: Codex
- Goal: 以開放詞典網《漢字拆字字典》繁體版建立可重現的部件與形近字候選索引，提供同步、本機、零網路查詢；不恢復辨析單模板或 domain 欄位。
- Changed files: `scripts/build-chaizi-lookalike-index.py`、`src/assets/chaizi/chaizi-ft.txt`、`src/assets/chaizi/lookalike-index.json`、`src/assets/chaizi/README.md`、`src/infrastructure/chaizi-lookalike.ts`、`src/infrastructure/index.ts`、`tests/chaizi-lookalike.test.ts`、`PROJECT.md`、本文件。
- Dictionary version: 教育部《國語辭典簡編本》版本 unchanged（`dict_concised_2014_20260626`）；新增 kfcd/chaizi revision `e177ab54ce4edf255315a60593ffecbd8167e96b`，原始 `chaizi-ft.txt` SHA-256 `474659d99bd43573f24c62cc5c4b19b67169f4e1647ebf0249b0762a59f4d2b7`，授權 CC BY 3.0。
- Contract change: infrastructure 新增同步純查詢 `lookupLookalikeCandidates(character): string[]` 與 metadata `CHAIZI_LOOKALIKE_METADATA`。查無資料、空字串或非單一字元都回傳 `[]`。沒有新增 `lookalikeCandidates` domain 欄位、`CharacterDiscriminationWorksheetSection`、`WorksheetTemplate` 或 `WorksheetSection` 成員。
- Verified: 匯入 17,936 個漢字、3,101 個部件；以相同來源與 revision 重建後，JSON SHA-256 完全一致（`BB3A50A70F16874C8FF91D4A9180FDDACD25E58DA85826644C30595074DB6B71`）。`賢` 實際回傳 `['堅','婜','孯','掔','硻','竪','緊','腎']`，包含同組的 `堅、竪、緊、腎`；`堅` 回傳 `['婜','孯','掔','硻','竪','緊','腎','菣']`；`竪` 回傳 `['婜','孯','掔','菣','蜸','堅','硻','緊']`。測試另覆蓋不存在字元回傳空陣列與 fetch 零呼叫。`npm run lint` 通過；完整 `npm test` 為 14 檔 73 案例全數通過；`npm run build` 通過（僅既有 dynamic import 與大型 chunk 警告）。
- Risks / open questions: `竪` 原始拆法是 `臣 又 立`，而 `臤` 是 `臣 又`；產生器以「連續部件序列恰好等於另一個已收錄漢字拆法」辨識複合部件，因此兩者能透過 `臤` 關聯。候選按「最少見的共享部件優先、共享部件較多優先、Unicode 碼位」固定排序後最多保留 8 筆；此規則能壓制常見部件造成的龐大集合，但不等同字頻、年級或教學適切度，最終分組仍需另行評估。新增 JSON 約 1.79 MB，會增加前端 bundle；若後續實際使用品質確認但載入成本不可接受，再評估分片或延遲載入。
- Next owner action: 先人工抽查不同字形部件與常見／罕見字的候選品質，確認排序是否適合教師工作流；品質確認前不要恢復辨析 worksheet 或 UI。若日後串接，UI 必須透過受控 service/use case 使用候選，不得直接解析 JSON，也不得把候選視為自動核定的同題分組。
