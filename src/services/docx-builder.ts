import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
  AlignmentType,
  ShadingType,
  Packer,
  Footer,
} from 'docx'
import type {
  WorksheetDoc,
  WorksheetSection,
  CharacterWorksheetSection,
  WordWorksheetSection,
  SentenceWorksheetSection,
  PictureWorksheetSection,
  CharacterDiscriminationWorksheetSection,
  ReadingComprehensionWorksheetSection,
} from './contracts'

const FONT_FAMILY = 'DFKai-SB'

const borderThin = {
  style: BorderStyle.SINGLE,
  size: 1,
  color: 'CBD5E1',
}

const borderDashed = {
  style: BorderStyle.DASHED,
  size: 1,
  color: '94A3B8',
}

const templateNameMap: Record<string, string> = {
  'character-practice': '生字田字格練習單',
  'word-practice': '詞語積木擴展單',
  'sentence-practice': '句型仿寫應用單',
  'picture-practice': '看圖識字練習單',
  'character-discrimination': '字音字形辨析單',
  'reading-comprehension': '閱讀理解評量單',
}

/**
 * 建立學習單共同紙頭（標題、版型副標、學生作答資訊欄）
 */
function createPageHeader(
  doc: WorksheetDoc,
  templateTitle: string,
): Paragraph[] {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 80 },
      children: [
        new TextRun({
          text: doc.title || '國小國語單元評量學習單',
          bold: true,
          size: 34,
          font: FONT_FAMILY,
          color: '0F172A',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 120 },
      children: [
        new TextRun({
          text: `版型：${templateTitle} ｜ 國小 ${doc.grade} 年級`,
          size: 20,
          font: FONT_FAMILY,
          color: '64748B',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 140 },
      children: [
        new TextRun({
          text: '____ 年 ____ 班    座號：____    姓名：____________    得分：______',
          size: 22,
          font: FONT_FAMILY,
          color: '334155',
        }),
      ],
    }),
  ]
}

/**
 * 建立指引橫幅
 */
function createInstructionBanner(text: string): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: 'F8FAFC' },
            borders: {
              top: borderThin,
              bottom: borderThin,
              left: { style: BorderStyle.SINGLE, size: 8, color: '0284C7' },
              right: borderThin,
            },
            margins: { top: 100, bottom: 100, left: 140, right: 140 },
            children: [
              new Paragraph({
                spacing: { before: 40, after: 40 },
                children: [
                  new TextRun({
                    text,
                    bold: true,
                    size: 20,
                    font: FONT_FAMILY,
                    color: '1E293B',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  })
}

/**
 * 1. 渲染生字田字格 (character-practice)
 */
function renderCharacterSections(
  sections: CharacterWorksheetSection[],
  doc: WorksheetDoc,
): (Paragraph | Table)[] {
  const result: (Paragraph | Table)[] = [
    createInstructionBanner('【壹、生字筆順與田字格習寫】 觀察字形與部首，再依正確筆順在田字格端正習寫。'),
  ]

  const charMap = new Map(doc.sourceAnalysis?.characters.map((c) => [c.character, c]))

  sections.forEach((sec, idx) => {
    const item = sec.item
    const analysis = charMap.get(item.character)
    const words = analysis?.words || []

    result.push(
      new Paragraph({
        spacing: { before: 180, after: 60 },
        children: [
          new TextRun({
            text: `生字第 ${idx + 1} 題：【 ${item.character} 】  `,
            bold: true,
            size: 24,
            font: FONT_FAMILY,
            color: '0F172A',
          }),
          new TextRun({
            text: `部首：${item.radical || '—'}    筆畫：${item.strokeCount || '—'} 畫    讀音：${item.zhuyin || '—'}`,
            size: 20,
            font: FONT_FAMILY,
            color: '475569',
          }),
        ],
      }),
    )

    // 田字格表格：8 格（示範字、描字、練習 1~6）
    const cellWidthDxa = 1180
    const cells: TableCell[] = [
      // 示範字 (紅字)
      new TableCell({
        width: { size: cellWidthDxa, type: WidthType.DXA },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 2, color: 'EF4444' },
          bottom: { style: BorderStyle.SINGLE, size: 2, color: 'EF4444' },
          left: { style: BorderStyle.SINGLE, size: 2, color: 'EF4444' },
          right: { style: BorderStyle.SINGLE, size: 2, color: 'EF4444' },
        },
        shading: { type: ShadingType.CLEAR, fill: 'FEF2F2' },
        margins: { top: 120, bottom: 120, left: 60, right: 60 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: item.character,
                bold: true,
                size: 36,
                font: FONT_FAMILY,
                color: 'DC2626',
              }),
            ],
          }),
        ],
      }),
      // 描字 (淺灰字)
      new TableCell({
        width: { size: cellWidthDxa, type: WidthType.DXA },
        borders: {
          top: borderDashed,
          bottom: borderDashed,
          left: borderDashed,
          right: borderDashed,
        },
        margins: { top: 120, bottom: 120, left: 60, right: 60 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: item.character,
                size: 32,
                font: FONT_FAMILY,
                color: 'CBD5E1',
              }),
            ],
          }),
        ],
      }),
    ]

    // 6 格空白練習格
    for (let i = 1; i <= 6; i++) {
      cells.push(
        new TableCell({
          width: { size: cellWidthDxa, type: WidthType.DXA },
          borders: {
            top: borderDashed,
            bottom: borderDashed,
            left: borderDashed,
            right: borderDashed,
          },
          margins: { top: 120, bottom: 120, left: 60, right: 60 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `${i}`,
                  size: 16,
                  font: FONT_FAMILY,
                  color: 'CBD5E1',
                }),
              ],
            }),
          ],
        }),
      )
    }

    result.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [new TableRow({ children: cells })],
      }),
    )

    // 造詞參考
    result.push(
      new Paragraph({
        spacing: { before: 60, after: 140 },
        children: [
          new TextRun({
            text: '【常用詞語造詞參考】：',
            bold: true,
            size: 20,
            font: FONT_FAMILY,
            color: '334155',
          }),
          new TextRun({
            text: words.length > 0 ? words.join('、') : '________________、________________',
            size: 20,
            font: FONT_FAMILY,
            color: '475569',
          }),
        ],
      }),
    )
  })

  return result
}

/**
 * 2. 渲染詞語積木 (word-practice)
 */
function renderWordSections(
  sections: WordWorksheetSection[],
): (Paragraph | Table)[] {
  const result: (Paragraph | Table)[] = [
    createInstructionBanner('【貳、詞語積木擴展與習寫】 讀一讀詞語積木，在書寫格端正寫一次，並完成延伸造詞。'),
  ]

  sections.forEach((sec) => {
    const item = sec.item

    result.push(
      new Paragraph({
        spacing: { before: 160, after: 80 },
        children: [
          new TextRun({
            text: `生字核心：【 ${item.character} 】`,
            bold: true,
            size: 24,
            font: FONT_FAMILY,
            color: '0284C7',
          }),
        ],
      }),
    )

    const rows: TableRow[] = item.words.map((w) => {
      return new TableRow({
        children: [
          new TableCell({
            width: { size: 28, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: 'F0F9FF' },
            borders: { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin },
            margins: { top: 80, bottom: 80, left: 100, right: 100 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `【${w.text}】`,
                    bold: true,
                    size: 22,
                    font: FONT_FAMILY,
                    color: '0369A1',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 72, type: WidthType.PERCENTAGE },
            borders: { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin },
            margins: { top: 80, bottom: 80, left: 100, right: 100 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: '書寫練習：____________________  延伸造詞：____________________',
                    size: 20,
                    font: FONT_FAMILY,
                    color: '64748B',
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    })

    result.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows,
      }),
    )
  })

  return result
}

/**
 * 3. 渲染句型仿寫 (sentence-practice)
 */
function renderSentenceSections(
  sections: SentenceWorksheetSection[],
): (Paragraph | Table)[] {
  const result: (Paragraph | Table)[] = [
    createInstructionBanner('【參、句型仿寫與情境造句】 細讀課文情境教學例句，分析句型結構，並仿寫完整通順的句子。'),
  ]

  sections.forEach((sec) => {
    const item = sec.item

    result.push(
      new Paragraph({
        spacing: { before: 160, after: 60 },
        children: [
          new TextRun({
            text: `生字造句應用：【 ${item.character} 】    `,
            bold: true,
            size: 24,
            font: FONT_FAMILY,
            color: '166534',
          }),
          new TextRun({
            text: '教師評閱：[ 優 ． 良 ． 可 ] 簽章：_______',
            size: 18,
            font: FONT_FAMILY,
            color: '64748B',
          }),
        ],
      }),
    )

    item.sentences.forEach((s) => {
      result.push(
        new Paragraph({
          spacing: { before: 60, after: 60 },
          children: [
            new TextRun({
              text: '📖 課文情境例句：',
              bold: true,
              size: 22,
              font: FONT_FAMILY,
              color: '1E293B',
            }),
            new TextRun({
              text: s.text,
              size: 22,
              font: FONT_FAMILY,
              color: '334155',
            }),
          ],
        }),
        new Paragraph({
          spacing: { before: 40, after: 40 },
          children: [
            new TextRun({
              text: '✍️ 句型仿寫 ① ____________________________________________________________________',
              size: 20,
              font: FONT_FAMILY,
              color: '475569',
            }),
          ],
        }),
        new Paragraph({
          spacing: { before: 40, after: 120 },
          children: [
            new TextRun({
              text: '✍️ 句型仿寫 ② ____________________________________________________________________',
              size: 20,
              font: FONT_FAMILY,
              color: '475569',
            }),
          ],
        }),
      )
    })
  })

  return result
}

/**
 * 4. 渲染字音字形辨析 (character-discrimination)
 */
function renderDiscriminationSections(
  sections: CharacterDiscriminationWorksheetSection[],
): (Paragraph | Table)[] {
  const result: (Paragraph | Table)[] = [
    createInstructionBanner('【字音字形辨析評量】 仔細觀察生字之形近字與多音字特徵，辨別字形差異與破音用法，並完成習寫與造詞。'),
  ]

  sections.forEach((sec) => {
    const item = sec.item
    const hasLookalikes = item.lookalikeCandidates && item.lookalikeCandidates.length > 0
    const hasMultiPron = item.multiPronunciations && item.multiPronunciations.length > 0

    result.push(
      new Paragraph({
        spacing: { before: 160, after: 60 },
        children: [
          new TextRun({
            text: `辨析核心：【 ${item.character} 】    `,
            bold: true,
            size: 24,
            font: FONT_FAMILY,
            color: '0F172A',
          }),
          new TextRun({
            text: `標準讀音：${item.zhuyin || '—'}    教師評閱：[ 優 ． 良 ． 可 ]`,
            size: 20,
            font: FONT_FAMILY,
            color: '475569',
          }),
        ],
      }),
    )

    if (hasLookalikes) {
      result.push(
        new Paragraph({
          spacing: { before: 60, after: 40 },
          children: [
            new TextRun({
              text: '🔍 形近字字形辨析（比一比部首與筆畫差異，並完成造詞）：',
              bold: true,
              size: 20,
              font: FONT_FAMILY,
              color: 'B45309',
            }),
          ],
        }),
      )

      const lookalikeRows: TableRow[] = [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.CLEAR, fill: 'FEF2F2' },
              borders: { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin },
              margins: { top: 60, bottom: 60, left: 80, right: 80 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `[目標字] ${item.character}`,
                      bold: true,
                      size: 22,
                      font: FONT_FAMILY,
                      color: 'B91C1C',
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 70, type: WidthType.PERCENTAGE },
              borders: { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin },
              margins: { top: 60, bottom: 60, left: 80, right: 80 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: '造詞：________________________    造句：________________________',
                      size: 20,
                      font: FONT_FAMILY,
                      color: '64748B',
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ]

      item.lookalikeCandidates.forEach((c) => {
        lookalikeRows.push(
          new TableRow({
            children: [
              new TableCell({
                width: { size: 30, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.CLEAR, fill: 'F0F9FF' },
                borders: { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin },
                margins: { top: 60, bottom: 60, left: 80, right: 80 },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `[形近字] ${c.character}（${c.radical || '—'}部 / ${c.strokeCount || '—'}畫）`,
                        bold: true,
                        size: 20,
                        font: FONT_FAMILY,
                        color: '0284C7',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 70, type: WidthType.PERCENTAGE },
                borders: { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin },
                margins: { top: 60, bottom: 60, left: 80, right: 80 },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: '造詞：________________________    造句：________________________',
                        size: 20,
                        font: FONT_FAMILY,
                        color: '64748B',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        )
      })

      result.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: lookalikeRows,
        }),
      )
    }

    if (hasMultiPron) {
      result.push(
        new Paragraph({
          spacing: { before: 100, after: 40 },
          children: [
            new TextRun({
              text: '🔊 多音字語境破音辨析（讀出不同讀音，觀察詞語搭配並練習造句）：',
              bold: true,
              size: 20,
              font: FONT_FAMILY,
              color: '0369A1',
            }),
          ],
        }),
      )

      item.multiPronunciations.forEach((p, pIdx) => {
        result.push(
          new Paragraph({
            spacing: { before: 40, after: 40 },
            children: [
              new TextRun({
                text: `讀音 ${pIdx + 1}：【${p.pronunciation}】 詞語：${p.word || '—'}  ｜  造句：________________________________________________`,
                size: 20,
                font: FONT_FAMILY,
                color: '334155',
              }),
            ],
          }),
        )
      })
    }

    // 習寫橫線
    result.push(
      new Paragraph({
        spacing: { before: 80, after: 40 },
        children: [
          new TextRun({
            text: '✍️ 綜合字音字形筆記與辨析習寫：',
            bold: true,
            size: 20,
            font: FONT_FAMILY,
            color: '334155',
          }),
        ],
      }),
      new Paragraph({
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({
            text: '① ____________________________________________________________________',
            size: 20,
            font: FONT_FAMILY,
            color: '64748B',
          }),
        ],
      }),
      new Paragraph({
        spacing: { before: 40, after: 120 },
        children: [
          new TextRun({
            text: '② ____________________________________________________________________',
            size: 20,
            font: FONT_FAMILY,
            color: '64748B',
          }),
        ],
      }),
    )
  })

  return result
}

/**
 * 5. 渲染閱讀理解評量單 (reading-comprehension) - 純選擇題，無問答題
 */
function renderReadingSections(
  sections: ReadingComprehensionWorksheetSection[],
): (Paragraph | Table)[] {
  const result: (Paragraph | Table)[] = [
    createInstructionBanner('【閱讀理解評量單】 請仔細閱讀以下短文，再完成文意與生詞理解選擇題。'),
  ]

  sections.forEach((sec) => {
    const { passage, multipleChoiceQuestions } = sec.item

    // 閱讀短文方框 (使用 Table 邊框包裹)
    result.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                shading: { type: ShadingType.CLEAR, fill: 'F8FAFC' },
                borders: {
                  top: borderThin,
                  bottom: borderThin,
                  left: borderThin,
                  right: borderThin,
                },
                margins: { top: 120, bottom: 120, left: 160, right: 160 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 40, after: 100 },
                    children: [
                      new TextRun({
                        text: `📖 【${passage.title}】`,
                        bold: true,
                        size: 26,
                        font: FONT_FAMILY,
                        color: '0F172A',
                      }),
                    ],
                  }),
                  new Paragraph({
                    spacing: { before: 40, after: 40 },
                    children: [
                      new TextRun({
                        text: passage.text,
                        size: 22,
                        font: FONT_FAMILY,
                        color: '334155',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    )

    // 選擇題大標
    result.push(
      new Paragraph({
        spacing: { before: 180, after: 80 },
        children: [
          new TextRun({
            text: '壹、文意與生詞理解選擇題（請將最適合的答案填入括號中）：',
            bold: true,
            size: 22,
            font: FONT_FAMILY,
            color: '0369A1',
          }),
        ],
      }),
    )

    // 各題題幹與選項
    multipleChoiceQuestions.forEach((q, qIdx) => {
      const optionLabels = ['①', '②', '③', '④']
      const optionsText = q.options
        .map((opt, oIdx) => `${optionLabels[oIdx] || `(${oIdx + 1})`} ${opt}`)
        .join('    ')

      result.push(
        new Paragraph({
          spacing: { before: 80, after: 40 },
          children: [
            new TextRun({
              text: `（\u3000）${qIdx + 1}. `,
              bold: true,
              size: 22,
              font: FONT_FAMILY,
              color: '0F172A',
            }),
            new TextRun({
              text: q.prompt,
              size: 22,
              font: FONT_FAMILY,
              color: '1E293B',
            }),
          ],
        }),
        new Paragraph({
          spacing: { before: 20, after: 100 },
          indent: { left: 480 },
          children: [
            new TextRun({
              text: optionsText,
              size: 20,
              font: FONT_FAMILY,
              color: '475569',
            }),
          ],
        }),
      )
    })
  })

  return result
}

/**
 * 6. 渲染看圖識字 (picture-practice)
 */
function renderPictureSections(
  sections: PictureWorksheetSection[],
): (Paragraph | Table)[] {
  const result: (Paragraph | Table)[] = [
    createInstructionBanner('【伍、看圖識字與表達】 觀察情境，寫出對應的生字，並造出一個完整的句子。'),
  ]

  sections.forEach((sec) => {
    const item = sec.item

    result.push(
      new Paragraph({
        spacing: { before: 160, after: 80 },
        children: [
          new TextRun({
            text: `生字：【 ${item.character} 】`,
            bold: true,
            size: 24,
            font: FONT_FAMILY,
            color: '0F172A',
          }),
        ],
      }),
      new Paragraph({
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({
            text: '看圖寫字：（部首：________ ｜ 筆畫：________ 畫）',
            size: 20,
            font: FONT_FAMILY,
            color: '475569',
          }),
        ],
      }),
      new Paragraph({
        spacing: { before: 40, after: 120 },
        children: [
          new TextRun({
            text: '看圖造詞與造句：____________________________________________________',
            size: 20,
            font: FONT_FAMILY,
            color: '475569',
          }),
        ],
      }),
    )
  })

  return result
}

/**
 * 依據模板分流產生各 section 的 docx 元素
 */
function renderPageSections(
  sections: WorksheetSection[],
  doc: WorksheetDoc,
): (Paragraph | Table)[] {
  switch (doc.template) {
    case 'character-practice':
      return renderCharacterSections(
        sections.filter((s): s is CharacterWorksheetSection => s.kind === 'character'),
        doc,
      )
    case 'word-practice':
      return renderWordSections(
        sections.filter((s): s is WordWorksheetSection => s.kind === 'word'),
      )
    case 'sentence-practice':
      return renderSentenceSections(
        sections.filter((s): s is SentenceWorksheetSection => s.kind === 'sentence'),
      )
    case 'character-discrimination':
      return renderDiscriminationSections(
        sections.filter((s): s is CharacterDiscriminationWorksheetSection => s.kind === 'character-discrimination'),
      )
    case 'reading-comprehension':
      return renderReadingSections(
        sections.filter((s): s is ReadingComprehensionWorksheetSection => s.kind === 'reading-comprehension'),
      )
    case 'picture-practice':
      return renderPictureSections(
        sections.filter((s): s is PictureWorksheetSection => s.kind === 'picture'),
      )
    default:
      return renderCharacterSections(
        sections.filter((s): s is CharacterWorksheetSection => s.kind === 'character'),
        doc,
      )
  }
}

/**
 * 建立標準 Word 文件模型 (Document)
 */
export function createDocxDocument(doc: WorksheetDoc): Document {
  const templateTitle = templateNameMap[doc.template] || '國語學習單'
  const totalPages = doc.pages.length > 0 ? doc.pages.length : 1

  const docxSections = (doc.pages.length > 0 ? doc.pages : [{ pageNumber: 1, blocks: [], sections: [] }]).map(
    (page, pageIdx) => {
      const headerElements = createPageHeader(doc, templateTitle)
      const sectionElements = renderPageSections(page.sections, doc)

      return {
        properties: {
          page: {
            size: {
              width: 11906, // A4 寬度 (210mm)
              height: 16838, // A4 高度 (297mm)
            },
            margin: {
              top: 720, // 12.7mm (0.5 inch)
              bottom: 720,
              left: 720,
              right: 720,
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `第 ${pageIdx + 1} 頁 ／ 共 ${totalPages} 頁（A4 格式）`,
                    size: 18,
                    font: FONT_FAMILY,
                    color: '94A3B8',
                  }),
                ],
              }),
            ],
          }),
        },
        children: [...headerElements, ...sectionElements],
      }
    },
  )

  return new Document({
    styles: {
      default: {
        document: {
          run: {
            font: FONT_FAMILY,
            size: 22,
            color: '1E293B',
          },
        },
      },
    },
    sections: docxSections,
  })
}

/**
 * 產生純前端 Word Blob 檔案
 */
export async function generateDocxBlob(doc: WorksheetDoc): Promise<Blob> {
  const document = createDocxDocument(doc)
  return await Packer.toBlob(document)
}

/**
 * 瀏覽器端純前端直接觸發 Word (.docx) 下載
 */
export async function exportWorksheetToDocx(
  doc: WorksheetDoc,
  filename?: string,
): Promise<void> {
  const blob = await generateDocxBlob(doc)
  const downloadName =
    filename ||
    `${(doc.title || templateNameMap[doc.template] || '國語學習單').replace(/[\\/:*?"<>|]/g, '_')}.docx`

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = downloadName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
