import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel, AlignmentType } from 'docx';
import MarkdownIt from 'markdown-it';

type DocxElement = Paragraph | Table;

// 简化的 Token 接口
interface SimpleToken {
  type: string;
  tag: string;
  content: string;
}

export interface GenerationOptions {
  preserveFormatting?: boolean;
  includeMetadata?: boolean;
  pageMargins?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  fontFamily?: string;
  fontSize?: number;
}

export interface GenerationResult {
  success: boolean;
  buffer?: Buffer;
  error?: string;
  metadata?: {
    pageCount?: number;
    wordCount?: number;
  };
}

/**
 * 格式保持的文档生成器
 */
export class FormatPreservingGenerator {
  private markdownIt: MarkdownIt;

  constructor() {
    this.markdownIt = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true
    });
  }

  /**
   * 从markdown生成Word文档
   */
  async generateWordFromMarkdown(
    markdown: string, 
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    try {
      const {
        pageMargins = { top: 720, bottom: 720, left: 720, right: 720 },
        fontFamily = '宋体',
        fontSize = 24
      } = options;

      // 解析markdown
      const tokens = this.markdownIt.parse(markdown, {});

      // 转换为docx元素
      const children = this.convertTokensToDocxElements(tokens as SimpleToken[], { fontFamily, fontSize });

      // 创建文档
      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: pageMargins
            }
          },
          children
        }]
      });

      // 生成buffer
      const buffer = await Packer.toBuffer(doc);

      return {
        success: true,
        buffer,
        metadata: {
          wordCount: this.countWords(markdown)
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `文档生成失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 从HTML生成Word文档（保持更多格式）
   */
  async generateWordFromHtml(
    html: string,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    try {
      // 简化的HTML到docx转换
      // 这里可以实现更复杂的HTML解析逻辑
      const cleanText = this.stripHtmlTags(html);
      const paragraphs = cleanText.split('\n').filter(line => line.trim()).map(line => 
        new Paragraph({
          children: [
            new TextRun({
              text: line.trim(),
              font: options.fontFamily || '宋体',
              size: options.fontSize || 24
            })
          ]
        })
      );

      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: options.pageMargins || { top: 720, bottom: 720, left: 720, right: 720 }
            }
          },
          children: paragraphs
        }]
      });

      const buffer = await Packer.toBuffer(doc);

      return {
        success: true,
        buffer,
        metadata: {
          wordCount: this.countWords(cleanText)
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `HTML文档生成失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 将markdown tokens转换为docx元素
   */
  private convertTokensToDocxElements(tokens: SimpleToken[], options: { fontFamily: string; fontSize: number }): DocxElement[] {
    const elements: DocxElement[] = [];
    let i = 0;

    while (i < tokens.length) {
      const token = tokens[i];

      switch (token.type) {
        case 'heading_open':
          const levelNum = parseInt(token.tag.substring(1));
          const headingToken = tokens[i + 1];
          if (headingToken && headingToken.type === 'inline') {
            // 将数字转换为HeadingLevel枚举值
            let headingLevel: typeof HeadingLevel[keyof typeof HeadingLevel];
            switch (levelNum) {
              case 1: headingLevel = HeadingLevel.HEADING_1; break;
              case 2: headingLevel = HeadingLevel.HEADING_2; break;
              case 3: headingLevel = HeadingLevel.HEADING_3; break;
              case 4: headingLevel = HeadingLevel.HEADING_4; break;
              case 5: headingLevel = HeadingLevel.HEADING_5; break;
              case 6: headingLevel = HeadingLevel.HEADING_6; break;
              default: headingLevel = HeadingLevel.HEADING_1; break;
            }

            elements.push(new Paragraph({
              heading: headingLevel,
              children: [
                new TextRun({
                  text: headingToken.content,
                  font: options.fontFamily,
                  size: options.fontSize + (6 - levelNum) * 4,
                  bold: true
                })
              ]
            }));
          }
          i += 3; // skip heading_open, inline, heading_close
          break;

        case 'paragraph_open':
          const paragraphToken = tokens[i + 1];
          if (paragraphToken && paragraphToken.type === 'inline') {
            elements.push(new Paragraph({
              children: this.parseInlineContent(paragraphToken.content, options)
            }));
          }
          i += 3; // skip paragraph_open, inline, paragraph_close
          break;

        case 'table_open':
          const tableElements = this.parseTable(tokens, i);
          elements.push(tableElements.table);
          i = tableElements.nextIndex;
          break;

        case 'hr':
          elements.push(new Paragraph({
            children: [
              new TextRun({
                text: '─'.repeat(50),
                font: options.fontFamily,
                size: options.fontSize
              })
            ],
            alignment: AlignmentType.CENTER
          }));
          i++;
          break;

        default:
          i++;
          break;
      }
    }

    return elements;
  }

  /**
   * 解析内联内容
   */
  private parseInlineContent(content: string, options: { fontFamily: string; fontSize: number }): TextRun[] {
    // 简化的内联解析，可以扩展支持更多格式
    return [
      new TextRun({
        text: content,
        font: options.fontFamily,
        size: options.fontSize
      })
    ];
  }

  /**
   * 解析表格
   */
  private parseTable(tokens: SimpleToken[], startIndex: number): { table: Table; nextIndex: number } {
    const rows: TableRow[] = [];
    let i = startIndex + 1;

    while (i < tokens.length && tokens[i].type !== 'table_close') {
      if (tokens[i].type === 'tr_open') {
        const cells: TableCell[] = [];
        i++; // skip tr_open

        while (i < tokens.length && tokens[i].type !== 'tr_close') {
          if (tokens[i].type === 'td_open' || tokens[i].type === 'th_open') {
            const cellContent = tokens[i + 1];
            if (cellContent && cellContent.type === 'inline') {
              cells.push(new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: cellContent.content,
                        font: '宋体',
                        size: 20
                      })
                    ]
                  })
                ]
              }));
            }
            i += 3; // skip td_open, inline, td_close
          } else {
            i++;
          }
        }

        if (cells.length > 0) {
          rows.push(new TableRow({ children: cells }));
        }
        i++; // skip tr_close
      } else {
        i++;
      }
    }

    const table = new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE
      },
      rows
    });

    return { table, nextIndex: i + 1 };
  }

  /**
   * 移除HTML标签
   */
  private stripHtmlTags(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  }

  /**
   * 统计字数
   */
  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }
}

// 导出单例实例
export const formatPreservingGenerator = new FormatPreservingGenerator();
