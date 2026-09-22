# Template execution contract

- Reference: `C:\Users\a1234\Downloads\生字學習單test.docx`
- SHA-256: `dcfa98ab77f4ae6b045ba6b95b698017fa42efb80247c73c3fbbc2c677151399`
- Pages: 1; sections: 1; package parts: 17.
- Evidence: `.tmp/user-template-review/original-page-1.png`, `.tmp/user-template-review/style-evidence.json`.

## Page system

- A4 portrait, 8.27 × 11.69 inches.
- Margins: 0.50 inch on every side.
- No distinct first-page header/footer; one section only.

## Structure and editable slots

- Body title and student-information line are fixed text and must be preserved.
- `{#items}` and `{/items}` bracket one repeating question block.
- The first body table contains question number, character metadata, and `{image}`.
- The practice row is one anchored Word group drawing (`wpg:wgp`) inside `mc:AlternateContent`, with a VML fallback and approximately thirty text-box/shape children. Preserve the group and fallback byte structure except for text-run tags.
- The final paragraph contains `{wordCandidatesText}`.
- Required repair: replace the fixed question-number text `1` with `{questionNumber}`; replace the metadata reading slot's incorrect `{character}` with `{zhuyin}`; add/apply the `WorksheetCharacter` character style to all remaining `{character}` runs without direct run fonts.
- Optional fields not represented by this design (`title`, sentence candidates) remain intentionally absent.

## Package preservation

- Preserve all package parts and relationships except `word/document.xml` and `word/styles.xml`.
- `word/document.xml`: only tag text, character-style references, and direct-font removal may change.
- `word/styles.xml`: only add `WorksheetCharacter` when missing.
- Preserve media, relationships, settings, theme, numbering, headers/footers, drawing geometry, VML fallback, and content types.

## Fidelity gates

- Source remains byte-for-byte unchanged.
- Output remains one A4 page and visually matches the source except for visible tag corrections.
- easy-template-x `parseTags` must recognize `items`, `questionNumber`, `character`, `zhuyin`, `radical`, `strokeCount`, `image`, and `wordCandidatesText`.
- Word must open and export the repaired copy without a repair prompt.
