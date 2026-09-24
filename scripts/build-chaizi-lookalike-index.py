"""Build a local lookalike-candidate index from kfcd/chaizi traditional data.

Run with:
  python scripts/build-chaizi-lookalike-index.py \
    src/assets/chaizi/chaizi-ft.txt \
    src/assets/chaizi/lookalike-index.json \
    <source-revision>
"""

from __future__ import annotations

import hashlib
import json
import sys
from collections import defaultdict
from pathlib import Path


CANDIDATE_LIMIT = 8
SOURCE_URL = "https://github.com/kfcd/chaizi"
LICENSE = "Creative Commons Attribution 3.0 Unported (CC BY 3.0)"


def parse_source(source_path: Path) -> dict[str, list[tuple[str, ...]]]:
    decompositions: dict[str, list[tuple[str, ...]]] = {}
    for line_number, raw_line in enumerate(source_path.read_text(encoding="utf-8").splitlines(), 1):
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        fields = line.split("\t")
        character = fields[0].strip()
        if len(character) != 1 or len(fields) < 2:
            raise ValueError(f"invalid chaizi row at line {line_number}")
        variants = [tuple(field.split()) for field in fields[1:] if field.strip()]
        if not variants or any(not variant for variant in variants):
            raise ValueError(f"missing decomposition at line {line_number}")
        decompositions.setdefault(character, []).extend(variants)
    return decompositions


def build_components(
    decompositions: dict[str, list[tuple[str, ...]]],
) -> dict[str, list[str]]:
    """Keep direct parts and recognize composite characters from contiguous parts.

    Example: 竪 is 臣 又 立 while 臤 is 臣 又, so 竪 also receives 臤 as a
    recognized component without using radical or stroke-count heuristics.
    """
    characters_by_sequence: dict[tuple[str, ...], list[str]] = defaultdict(list)
    for character, variants in decompositions.items():
        for variant in variants:
            characters_by_sequence[variant].append(character)

    components_by_character: dict[str, list[str]] = {}
    for character, variants in decompositions.items():
        components: set[str] = set()
        for variant in variants:
            components.update(variant)
            for start in range(len(variant)):
                for end in range(start + 2, len(variant) + 1):
                    for composite in characters_by_sequence.get(variant[start:end], []):
                        if composite != character:
                            components.add(composite)
        components_by_character[character] = sorted(components)
    return components_by_character


def reverse_index(components_by_character: dict[str, list[str]]) -> dict[str, list[str]]:
    characters_by_component: dict[str, list[str]] = defaultdict(list)
    for character, components in components_by_character.items():
        for component in components:
            characters_by_component[component].append(character)
    return {
        component: sorted(characters)
        for component, characters in sorted(characters_by_component.items())
    }


def build_candidates(
    components_by_character: dict[str, list[str]],
    characters_by_component: dict[str, list[str]],
) -> dict[str, list[str]]:
    component_sets = {
        character: set(components)
        for character, components in components_by_character.items()
    }
    candidates_by_character: dict[str, list[str]] = {}
    for character, components in components_by_character.items():
        candidates = {
            candidate
            for component in components
            for candidate in characters_by_component[component]
            if candidate != character
        }

        def rank(candidate: str) -> tuple[int, int, str]:
            shared = component_sets[character] & component_sets[candidate]
            rarest_shared_component_size = min(
                len(characters_by_component[component]) for component in shared
            )
            return (rarest_shared_component_size, -len(shared), candidate)

        candidates_by_character[character] = sorted(candidates, key=rank)[:CANDIDATE_LIMIT]
    return candidates_by_character


def main() -> None:
    if len(sys.argv) != 4:
        raise SystemExit(
            "usage: build-chaizi-lookalike-index.py <chaizi-ft.txt> "
            "<output.json> <source-revision>"
        )

    source_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    source_revision = sys.argv[3].strip()
    source_bytes = source_path.read_bytes()
    decompositions = parse_source(source_path)
    components_by_character = build_components(decompositions)
    characters_by_component = reverse_index(components_by_character)
    candidates_by_character = build_candidates(
        components_by_character,
        characters_by_component,
    )

    payload = {
        "metadata": {
            "title": "漢字拆字字典繁體版衍生形近字候選索引",
            "sourceName": "開放詞典網《漢字拆字字典》繁體版",
            "sourceUrl": SOURCE_URL,
            "sourceRevision": source_revision,
            "sourceFile": source_path.name,
            "sourceFileSha256": hashlib.sha256(source_bytes).hexdigest(),
            "license": LICENSE,
            "characterCount": len(components_by_character),
            "componentCount": len(characters_by_component),
            "candidateLimit": CANDIDATE_LIMIT,
            "candidateOrdering": (
                "rarest shared component first, then more shared components, "
                "then Unicode code-point order"
            ),
            "compositeRecognition": (
                "a contiguous component sequence that exactly matches another "
                "recorded character decomposition is also indexed as a component"
            ),
        },
        "componentsByCharacter": components_by_character,
        "charactersByComponent": characters_by_component,
        "candidatesByCharacter": candidates_by_character,
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
