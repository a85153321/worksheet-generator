from pathlib import Path
from shutil import copy2
from zipfile import ZIP_DEFLATED, ZipFile

from lxml import etree


SOURCE = Path(r"C:\Users\a1234\Downloads\生字學習單test.docx")
OUTPUT = Path(r"C:\Users\a1234\Desktop\學習單\worksheet-generator\outputs\生字學習單test-標籤補全.docx")
TEMP = OUTPUT.with_suffix(".docx.tmp")
W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
NS = {"w": W}


def qn(local: str) -> str:
    return f"{{{W}}}{local}"


OUTPUT.parent.mkdir(parents=True, exist_ok=True)
copy2(SOURCE, OUTPUT)

with ZipFile(OUTPUT, "r") as source, ZipFile(TEMP, "w", ZIP_DEFLATED) as target:
    for info in source.infolist():
        data = source.read(info.filename)
        if info.filename == "word/document.xml":
            root = etree.fromstring(data)
            tables = root.xpath(".//w:tbl", namespaces=NS)
            if len(tables) != 1:
                raise RuntimeError(f"Expected one metadata table, found {len(tables)}")
            table = tables[0]
            cells = table.xpath("./w:tr[1]/w:tc", namespaces=NS)
            if len(cells) != 3:
                raise RuntimeError(f"Expected three metadata cells, found {len(cells)}")

            question_texts = cells[0].xpath(".//w:t", namespaces=NS)
            question_joined = "".join(node.text or "" for node in question_texts)
            if "1" not in question_joined:
                raise RuntimeError("Could not find the fixed question number")
            replaced = False
            for node in question_texts:
                if not replaced and node.text and "1" in node.text:
                    node.text = node.text.replace("1", "{questionNumber}", 1)
                    replaced = True

            metadata_texts = cells[1].xpath(".//w:t", namespaces=NS)
            character_nodes = [node for node in metadata_texts if node.text == "{character}"]
            if len(character_nodes) != 2:
                raise RuntimeError(f"Expected two metadata character tags, found {len(character_nodes)}")
            character_nodes[1].text = "{zhuyin}"

            character_runs = root.xpath(
                ".//w:r[w:t[contains(., '{character}')]]",
                namespaces=NS,
            )
            if not character_runs:
                raise RuntimeError("No character tags found")
            for run in character_runs:
                r_pr = run.find("w:rPr", namespaces=NS)
                if r_pr is None:
                    r_pr = etree.Element(qn("rPr"))
                    run.insert(0, r_pr)
                style = r_pr.find("w:rStyle", namespaces=NS)
                if style is None:
                    style = etree.Element(qn("rStyle"))
                    r_pr.insert(0, style)
                style.set(qn("val"), "WorksheetCharacter")
                fonts = r_pr.find("w:rFonts", namespaces=NS)
                if fonts is not None:
                    r_pr.remove(fonts)
            data = etree.tostring(root, xml_declaration=True, encoding="UTF-8", standalone=True)

        elif info.filename == "word/styles.xml":
            root = etree.fromstring(data)
            existing = root.xpath(
                ".//w:style[@w:styleId='WorksheetCharacter']",
                namespaces=NS,
            )
            if not existing:
                style = etree.Element(qn("style"))
                style.set(qn("type"), "character")
                style.set(qn("customStyle"), "1")
                style.set(qn("styleId"), "WorksheetCharacter")
                name = etree.SubElement(style, qn("name"))
                name.set(qn("val"), "WorksheetCharacter")
                based_on = etree.SubElement(style, qn("basedOn"))
                based_on.set(qn("val"), "DefaultParagraphFont")
                ui_priority = etree.SubElement(style, qn("uiPriority"))
                ui_priority.set(qn("val"), "1")
                semi_hidden = etree.SubElement(style, qn("semiHidden"))
                unhide = etree.SubElement(style, qn("unhideWhenUsed"))
                r_pr = etree.SubElement(style, qn("rPr"))
                fonts = etree.SubElement(r_pr, qn("rFonts"))
                for attr in ("ascii", "hAnsi", "eastAsia", "cs"):
                    fonts.set(qn(attr), "DFKai-SB")
                root.append(style)
            data = etree.tostring(root, xml_declaration=True, encoding="UTF-8", standalone=True)

        target.writestr(info, data)

TEMP.replace(OUTPUT)
print(OUTPUT)
