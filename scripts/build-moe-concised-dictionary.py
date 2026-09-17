"""Build the browser lookup asset from the MOE Concised Mandarin Dictionary XLSX.

The source text is copied verbatim into a structural JSON representation. Run with:
  python scripts/build-moe-concised-dictionary.py <source.xlsx> <output.json>
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pandas as pd


REQUIRED_COLUMNS = ["字詞名", "字詞號", "部首字", "總筆畫數", "注音一式", "釋義"]


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("usage: build-moe-concised-dictionary.py <source.xlsx> <output.json>")

    source_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    frame = pd.read_excel(source_path, dtype=str, keep_default_na=False)
    missing_columns = [column for column in REQUIRED_COLUMNS if column not in frame.columns]
    if missing_columns:
        raise ValueError(f"missing columns: {', '.join(missing_columns)}")
    if frame["字詞號"].duplicated().any():
        raise ValueError("字詞號 must be unique")

    entries: list[list[str | int]] = []
    entry_ids_by_term: dict[str, list[str]] = {}
    entry_ids_by_character: dict[str, list[str]] = {}

    for row in frame.to_dict("records"):
        word_number = row["字詞號"].strip()
        word_name = row["字詞名"].strip()
        radical = row["部首字"].strip()
        stroke_count = int(row["總筆畫數"].strip())
        zhuyin = row["注音一式"].strip()
        definition = row["釋義"].replace("_x000D_\n", "\n").strip()
        entries.append([word_number, word_name, zhuyin, radical, stroke_count, definition])
        entry_ids_by_term.setdefault(word_name, []).append(word_number)
        for character in dict.fromkeys(word_name):
            if "\u3400" <= character <= "\u9fff" or "\U00020000" <= character <= "\U0003134f":
                entry_ids_by_character.setdefault(character, []).append(word_number)

    payload = {
        "metadata": {
            "title": "國語辭典簡編本",
            "version": "2014_20260626",
            "sourceUrl": "https://language.moe.gov.tw/001/Upload/Files/site_content/M0001/respub/index.html",
            "license": "創用CC-姓名標示-禁止改作 3.0 臺灣（CC BY-ND 3.0 TW）",
            "recordCount": len(entries),
            "tupleFields": ["wordNumber", "wordName", "zhuyin", "radical", "strokeCount", "definition"],
        },
        "entries": entries,
        "entryIdsByTerm": entry_ids_by_term,
        "entryIdsByCharacter": entry_ids_by_character,
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
