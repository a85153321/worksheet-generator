from __future__ import annotations

from pathlib import Path
from tempfile import NamedTemporaryFile
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo
from lxml import etree

W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
NS = {'w': W_NS}
W = f'{{{W_NS}}}'

def text(element: etree._Element) -> str:
    return ''.join(element.xpath('.//w:t/text()', namespaces=NS))

def ensure_first(parent: etree._Element, tag: str) -> etree._Element:
    existing = parent.find(f'w:{tag}', NS)
    if existing is not None:
        return existing
    element = etree.Element(f'{W}{tag}')
    parent.insert(0, element)
    return element

def add_cant_split(row: etree._Element) -> None:
    properties = ensure_first(row, 'trPr')
    if properties.find('w:cantSplit', NS) is None:
        properties.append(etree.Element(f'{W}cantSplit'))

def add_keep_next(paragraph: etree._Element) -> None:
    properties = ensure_first(paragraph, 'pPr')
    if properties.find('w:keepNext', NS) is None:
        properties.append(etree.Element(f'{W}keepNext'))

def patch_document(xml: bytes, source_name: str) -> bytes:
    parser = etree.XMLParser(remove_blank_text=False)
    root = etree.fromstring(xml, parser)
    body = root.find('w:body', NS)
    if body is None:
        raise RuntimeError(f'{source_name}: missing w:body')

    children = list(body)
    loop_start = next((i for i, child in enumerate(children) if '{#items}' in text(child)), None)
    loop_end = next((i for i, child in enumerate(children) if '{/items}' in text(child)), None)
    if loop_start is None or loop_end is None or loop_end <= loop_start:
        raise RuntimeError(f'{source_name}: cannot locate items loop')

    loop_children = children[loop_start + 1:loop_end]
    table_positions = [i for i, child in enumerate(loop_children) if child.tag == f'{W}tbl']
    if len(table_positions) < 2:
        raise RuntimeError(f'{source_name}: expected information and practice tables')

    info_position, practice_position = table_positions[:2]
    info_table = loop_children[info_position]
    practice_table = loop_children[practice_position]
    
    # 1. 表格列防止跨頁切斷
    for row in info_table.findall('w:tr', NS):
        add_cant_split(row)
    for row in practice_table.findall('w:tr', NS):
        add_cant_split(row)

    # 2. 資訊表格與橋接段落 keepNext -> 練習格
    for paragraph in info_table.xpath('.//w:p', namespaces=NS):
        add_keep_next(paragraph)
    for bridge in loop_children[info_position + 1:practice_position]:
        for paragraph in bridge.xpath('self::w:p | .//w:p', namespaces=NS):
            add_keep_next(paragraph)

    # 3. 練習格 keepNext -> 語詞段落（確保田字格與常用語詞同頁）
    for paragraph in practice_table.xpath('.//w:p', namespaces=NS):
        add_keep_next(paragraph)

    # 4. 確保語詞段落自身不含 keepNext（防止題目間連鎖推動）
    words_paragraphs = loop_children[practice_position + 1:]
    for child in words_paragraphs:
        for p in child.xpath('self::w:p | .//w:p', namespaces=NS):
            p_keep = p.find('w:pPr/w:keepNext', NS)
            if p_keep is not None:
                p.find('w:pPr', NS).remove(p_keep)

    # 5. 移除 WorksheetCharacter 上的直接 w:rFonts，避免覆蓋樣式動態字型
    for run in root.xpath('.//w:r[w:rPr/w:rStyle/@w:val="WorksheetCharacter"]', namespaces=NS):
        rFonts = run.find('w:rPr/w:rFonts', NS)
        if rFonts is not None:
            run.find('w:rPr', NS).remove(rFonts)

    # 6. 間距優化：壓縮迴圈段落高度，消滅題間多餘空行，確保一頁可穩定容納 4 題且不跨頁
    def set_exact_spacing(p: etree._Element, before: int, after: int, line: int):
        pPr = ensure_first(p, 'pPr')
        spacing = pPr.find('w:spacing', NS)
        if spacing is None:
            spacing = etree.Element(f'{W}spacing')
            pPr.append(spacing)
        spacing.set(f'{W}before', str(before))
        spacing.set(f'{W}after', str(after))
        spacing.set(f'{W}line', str(line))
        spacing.set(f'{W}lineRule', 'exact')

    # {#items} 與 {/items} 設為 1pt 極小行距，防止 Word 預設段距殘留為空行
    set_exact_spacing(children[loop_start], 0, 0, 20)
    set_exact_spacing(children[loop_end], 0, 0, 20)

    # 橋接段落壓縮為 3pt 行距 (60 dxa)
    for bridge in loop_children[info_position + 1:practice_position]:
        for p in bridge.xpath('self::w:p | .//w:p', namespaces=NS):
            set_exact_spacing(p, 0, 0, 60)

    # 語詞段落上下距微調為 before 2pt (40 dxa), after 3pt (60 dxa)
    for child in words_paragraphs:
        for p in child.xpath('self::w:p | .//w:p', namespaces=NS):
            set_exact_spacing(p, 40, 60, 240)

    return etree.tostring(root, xml_declaration=True, encoding='UTF-8', standalone=True)

def patch_docx(path: Path) -> None:
    with ZipFile(path, 'r') as source:
        entries = [(info, source.read(info.filename)) for info in source.infolist()]
    output_entries = []
    for info, data in entries:
        if info.filename == 'word/document.xml':
            data = patch_document(data, path.name)
        output_entries.append((info, data))

    with NamedTemporaryFile(dir=path.parent, suffix='.docx', delete=False) as temporary:
        temporary_path = Path(temporary.name)
    try:
        with ZipFile(temporary_path, 'w') as output:
            for info, data in output_entries:
                copied = ZipInfo(info.filename, info.date_time)
                copied.compress_type = info.compress_type if info.compress_type is not None else ZIP_DEFLATED
                copied.comment = info.comment
                copied.extra = info.extra
                copied.internal_attr = info.internal_attr
                copied.external_attr = info.external_attr
                copied.create_system = info.create_system
                output.writestr(copied, data)
        temporary_path.replace(path)
    finally:
        temporary_path.unlink(missing_ok=True)

for template in sorted(Path('src/assets/docx-templates').glob('*.docx')):
    if template.name.startswith('~$'):
        continue
    patch_docx(template)
    print(f'Successfully patched {template}')
