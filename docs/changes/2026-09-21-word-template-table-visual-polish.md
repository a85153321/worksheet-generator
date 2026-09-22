## Handoff
- Owner: Codex
- Goal: Improve the easy-template-x reference worksheet visual design using only stable Word table cells, while restoring the red demonstration, gray tracing, dashed handwriting, and purple radical roles.
- Changed files: `src/assets/docx-templates/生字學習單注音版.docx`, `tests/reference-template-docx.test.ts`, `docs/changes/2026-09-21-word-template-table-visual-polish.md`
- Dictionary version: unchanged
- Contract change: none. The existing `{#items}`, `{character}`, `{radical}`, `{strokeCount}`, `{zhuyin}`, `{image}`, and `{wordCandidatesText}` tags are unchanged.
- Verified: The template was rendered with real easy-template-x data in Microsoft Word and exported to a one-page PDF. Visual inspection confirmed that two items fit within the A4 margins, all five practice cells are close to square, gutter spacing is visible, and no content clips or overlaps. `tests/reference-template-docx.test.ts` verifies the semantic colors, dashed borders, fixed table layout, and five-square/four-gutter grid. Full test, lint, and build results are recorded in the completion response.
- Risks / open questions: The design intentionally uses table borders and fills instead of the former grouped Word drawings. The optional image cell is 1.35 inches wide and will remain visually subordinate to the learning cells. Exact font appearance still depends on the selected worksheet font being installed on the viewing computer.
- Next owner action: Open the generated visual-check DOCX or PDF at 100% zoom and confirm whether the current red `#EF4444`, purple `#7030A0`, and 1.25-inch practice-cell scale should become the final house style.
