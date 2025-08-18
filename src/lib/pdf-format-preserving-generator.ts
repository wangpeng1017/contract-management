import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel, AlignmentType, PageBreak } from 'docx';
import { PDFProcessingResult } from './pdf-document-processor';

// 生成选项接口
interface PDFGenerationOptions {
  preserveFormatting?: boolean;
  includeMetadata?: boolean;
  pageMargins?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  fontFamily?: string;
  fontSize?: number;
  lineSpacing?: number;
}

// 生成结果接口
interface PDFGenerationResult {
  success: boolean;
  error?: string;
  buffer?: Buffer;
  metadata?: {
    pageCount: number;
    wordCount: number;
    variableCount: number;
  };
}

// 变量替换接口
interface VariableReplacement {
  placeholder: string;
  value: string;
  type: 'text' | 'currency' | 'date' | 'percentage';
}

// 样式映射接口
interface StyleMapping {
  fontSize: number;
  fontName: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  alignment?: typeof AlignmentType[keyof typeof AlignmentType];
}

// 布局元素接口
interface LayoutElement {
  type: 'paragraph' | 'table' | 'header' | 'footer' | 'image';
  content: string;
  style: StyleMapping;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  pageNumber: number;
}

/**
 * PDF格式保真生成器
 * 基于PDF解析结果生成保持原始格式的Word文档
 */
class PDFFormatPreservingGenerator {
  private defaultOptions: PDFGenerationOptions = {
    preserveFormatting: true,
    includeMetadata: true,
    pageMargins: { top: 720, bottom: 720, left: 720, right: 720 },
    fontFamily: '宋体',
    fontSize: 12,
    lineSpacing: 1.5
  };

  /**
   * 从PDF解析结果生成Word文档
   */
  async generateWordFromPDF(
    pdfResult: PDFProcessingResult,
    variables: VariableReplacement[] = [],
    options: PDFGenerationOptions = {}
  ): Promise<PDFGenerationResult> {
    try {
      if (!pdfResult.success || !pdfResult.content) {
        return {
          success: false,
          error: 'PDF解析结果无效'
        };
      }

      const mergedOptions = { ...this.defaultOptions, ...options };
      console.log('开始生成Word文档，使用PDF格式保真系统');

      // 第一步：处理变量替换
      const processedContent = this.replaceVariables(pdfResult.content, variables);
      
      // 第二步：分析布局元素
      const layoutElements = this.analyzeLayoutElements(pdfResult, processedContent);
      
      // 第三步：创建Word文档结构
      const docElements = await this.createDocumentElements(layoutElements, mergedOptions);
      
      // 第四步：生成最终文档
      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: mergedOptions.pageMargins
            }
          },
          children: docElements as unknown as readonly import('docx').FileChild[]
        }]
      });

      // 第五步：生成Buffer
      const buffer = await Packer.toBuffer(doc);

      console.log('PDF格式保真Word文档生成成功');
      return {
        success: true,
        buffer,
        metadata: {
          pageCount: pdfResult.metadata?.pageCount || 1,
          wordCount: processedContent.split(/\s+/).length,
          variableCount: variables.length
        }
      };

    } catch (error) {
      console.error('PDF格式保真生成失败:', error);
      return {
        success: false,
        error: `生成失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 替换变量
   */
  private replaceVariables(content: string, variables: VariableReplacement[]): string {
    let processedContent = content;

    console.log('开始变量替换，原始内容长度:', content.length);
    console.log('变量数量:', variables.length);

    for (const variable of variables) {
      const { placeholder, value, type } = variable;

      // 格式化值
      const formattedValue = this.formatValue(value, type);

      // 替换所有出现的占位符
      const regex = new RegExp(this.escapeRegExp(placeholder), 'g');
      const beforeLength = processedContent.length;
      processedContent = processedContent.replace(regex, formattedValue);
      const afterLength = processedContent.length;

      if (beforeLength !== afterLength) {
        console.log(`变量替换成功: ${placeholder} → ${formattedValue}`);
      } else {
        console.log(`变量未找到: ${placeholder}`);
      }
    }

    console.log('变量替换完成，处理后内容长度:', processedContent.length);
    return processedContent;
  }

  /**
   * 分析布局元素
   */
  private analyzeLayoutElements(pdfResult: PDFProcessingResult, content: string): LayoutElement[] {
    const elements: LayoutElement[] = [];
    
    if (!pdfResult.layoutInfo) {
      // 如果没有布局信息，使用简单的文本分析
      return this.createSimpleLayout(content);
    }

    const { paragraphs, tables, headers } = pdfResult.layoutInfo;

    // 处理标题
    for (const header of headers) {
      elements.push({
        type: 'header',
        content: header.text,
        style: {
          fontSize: header.fontSize,
          fontName: header.fontName,
          bold: true,
          alignment: AlignmentType.CENTER
        },
        position: {
          x: header.x,
          y: header.y,
          width: 500,
          height: header.fontSize * 1.2
        },
        pageNumber: 1
      });
    }

    // 处理段落
    for (const paragraph of paragraphs) {
      elements.push({
        type: 'paragraph',
        content: paragraph.text,
        style: {
          fontSize: paragraph.fontSize,
          fontName: paragraph.fontName,
          alignment: this.convertAlignment(paragraph.alignment)
        },
        position: {
          x: paragraph.x,
          y: paragraph.y,
          width: paragraph.width,
          height: paragraph.height
        },
        pageNumber: 1
      });
    }

    // 处理表格
    for (const table of tables) {
      elements.push({
        type: 'table',
        content: this.formatTableContent(table),
        style: {
          fontSize: 12,
          fontName: '宋体'
        },
        position: {
          x: table.x,
          y: table.y,
          width: table.width,
          height: table.height
        },
        pageNumber: 1
      });
    }

    // 按Y坐标排序，确保正确的文档顺序
    elements.sort((a, b) => a.position.y - b.position.y);

    return elements;
  }

  /**
   * 创建简单布局（当没有详细布局信息时）
   */
  private createSimpleLayout(content: string): LayoutElement[] {
    const elements: LayoutElement[] = [];
    const lines = content.split('\n').filter(line => line.trim());

    console.log(`创建简单布局，处理 ${lines.length} 行内容`);

    let currentY = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // 检测不同类型的内容
      const isMainTitle = this.isMainTitle(line);
      const isHeader = this.isHeaderLine(line);
      const isSubHeader = this.isSubHeaderLine(line);
      const isTableRow = this.isTableLine(line);
      const isClause = this.isClauseLine(line);

      let elementType: 'paragraph' | 'table' | 'header' | 'footer' | 'image' = 'paragraph';
      let fontSize = 12;
      let bold = false;
      let alignment: typeof AlignmentType[keyof typeof AlignmentType] = AlignmentType.LEFT;

      if (isMainTitle) {
        elementType = 'header';
        fontSize = 16;
        bold = true;
        alignment = AlignmentType.CENTER;
      } else if (isHeader) {
        elementType = 'header';
        fontSize = 14;
        bold = true;
        alignment = AlignmentType.CENTER;
      } else if (isSubHeader) {
        elementType = 'header';
        fontSize = 13;
        bold = true;
        alignment = AlignmentType.LEFT;
      } else if (isClause) {
        fontSize = 12;
        bold = true;
        alignment = AlignmentType.LEFT;
      } else if (isTableRow) {
        elementType = 'table';
        fontSize = 11;
      }

      elements.push({
        type: elementType,
        content: line,
        style: {
          fontSize,
          fontName: '宋体',
          bold,
          alignment
        },
        position: {
          x: 50,
          y: currentY,
          width: 500,
          height: fontSize + 4
        },
        pageNumber: Math.floor(i / 35) + 1 // 每页35行
      });

      currentY += fontSize + 8;
    }

    console.log(`布局创建完成，生成 ${elements.length} 个元素`);
    return elements;
  }

  /**
   * 创建文档元素
   */
  private async createDocumentElements(
    layoutElements: LayoutElement[],
    options: PDFGenerationOptions
  ): Promise<(Paragraph | Table | PageBreak)[]> {
    const docElements: (Paragraph | Table | PageBreak)[] = [];
    let currentPage = 1;

    for (const element of layoutElements) {
      // 检查是否需要分页
      if (element.pageNumber > currentPage) {
        docElements.push(new PageBreak());
        currentPage = element.pageNumber;
      }

      switch (element.type) {
        case 'header':
          docElements.push(this.createHeaderParagraph(element, options));
          break;
        
        case 'paragraph':
          docElements.push(this.createTextParagraph(element, options));
          break;
        
        case 'table':
          const table = this.createTable(element, options);
          if (table) {
            docElements.push(table);
          }
          break;
        
        default:
          // 默认作为段落处理
          docElements.push(this.createTextParagraph(element, options));
          break;
      }
    }

    return docElements;
  }

  /**
   * 创建标题段落
   */
  private createHeaderParagraph(element: LayoutElement, options: PDFGenerationOptions): Paragraph {
    return new Paragraph({
      heading: this.getHeadingLevel(element.style.fontSize),
      alignment: element.style.alignment || AlignmentType.CENTER,
      spacing: {
        before: 240,
        after: 120
      },
      children: [
        new TextRun({
          text: element.content,
          font: element.style.fontName || options.fontFamily,
          size: (element.style.fontSize || options.fontSize!) * 2,
          bold: element.style.bold || true
        })
      ]
    });
  }

  /**
   * 创建文本段落
   */
  private createTextParagraph(element: LayoutElement, options: PDFGenerationOptions): Paragraph {
    return new Paragraph({
      alignment: element.style.alignment || AlignmentType.LEFT,
      spacing: {
        line: Math.round((options.lineSpacing || 1.5) * 240),
        before: 120,
        after: 120
      },
      indent: {
        firstLine: 480 // 首行缩进2字符
      },
      children: [
        new TextRun({
          text: element.content,
          font: element.style.fontName || options.fontFamily,
          size: (element.style.fontSize || options.fontSize!) * 2,
          bold: element.style.bold || false,
          italics: element.style.italic || false
        })
      ]
    });
  }

  /**
   * 创建表格
   */
  private createTable(element: LayoutElement, options: PDFGenerationOptions): Table | null {
    try {
      // 简化的表格解析
      const rows = element.content.split('\n').filter(row => row.trim());
      if (rows.length === 0) return null;

      const tableRows: TableRow[] = [];
      
      for (const rowText of rows) {
        const cells = this.parseTableRow(rowText);
        if (cells.length > 0) {
          const tableCells = cells.map(cellText => 
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: cellText.trim(),
                      font: options.fontFamily,
                      size: (options.fontSize! - 1) * 2
                    })
                  ]
                })
              ],
              width: {
                size: Math.floor(100 / cells.length),
                type: WidthType.PERCENTAGE
              }
            })
          );
          
          tableRows.push(new TableRow({
            children: tableCells
          }));
        }
      }

      if (tableRows.length === 0) return null;

      return new Table({
        rows: tableRows,
        width: {
          size: 100,
          type: WidthType.PERCENTAGE
        }
      });

    } catch (error) {
      console.error('表格创建失败:', error);
      return null;
    }
  }

  // 辅助方法
  private formatValue(value: string, type: string): string {
    switch (type) {
      case 'currency':
        const num = parseFloat(value);
        return isNaN(num) ? value : `¥${num.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
      
      case 'date':
        const date = new Date(value);
        return isNaN(date.getTime()) ? value : date.toLocaleDateString('zh-CN');
      
      case 'percentage':
        const percent = parseFloat(value);
        return isNaN(percent) ? value : `${percent}%`;
      
      default:
        return value;
    }
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private convertAlignment(alignment: string): typeof AlignmentType[keyof typeof AlignmentType] {
    switch (alignment) {
      case 'center': return AlignmentType.CENTER;
      case 'right': return AlignmentType.RIGHT;
      case 'justify': return AlignmentType.JUSTIFIED;
      default: return AlignmentType.LEFT;
    }
  }

  private formatTableContent(table: { rows: number; columns: number }): string {
    // 简化的表格内容格式化
    return `表格 (${table.rows}行 x ${table.columns}列)`;
  }

  private isHeaderLine(line: string): boolean {
    return line.length < 50 && (
      line.includes('合同') ||
      line.includes('协议') ||
      line.includes('第') && line.includes('条') ||
      line.includes('第') && line.includes('章') ||
      /^\d+\./.test(line)
    );
  }

  private isMainTitle(line: string): boolean {
    return line.length < 30 && (
      line.includes('合同') ||
      line.includes('协议') ||
      line.includes('契约')
    );
  }

  private isSubHeaderLine(line: string): boolean {
    return line.length < 40 && (
      /^第[一二三四五六七八九十\d]+条/.test(line) ||
      /^\d+\.\d+/.test(line) ||
      /^[（(]\d+[）)]/.test(line)
    );
  }

  private isClauseLine(line: string): boolean {
    return (
      /^第[一二三四五六七八九十\d]+条/.test(line) ||
      /^\d+\./.test(line) ||
      /^[一二三四五六七八九十]+[、．]/.test(line)
    );
  }

  private isTableLine(line: string): boolean {
    return line.includes('│') || line.includes('┌') || line.includes('└') ||
           line.includes('├') || line.includes('┤') || line.includes('┬') ||
           (line.split(/\s+/).length > 3 && line.includes('：'));
  }

  private getHeadingLevel(fontSize: number): typeof HeadingLevel[keyof typeof HeadingLevel] {
    if (fontSize >= 16) return HeadingLevel.HEADING_1;
    if (fontSize >= 14) return HeadingLevel.HEADING_2;
    if (fontSize >= 13) return HeadingLevel.HEADING_3;
    return HeadingLevel.HEADING_4;
  }

  private parseTableRow(rowText: string): string[] {
    // 尝试多种分隔符
    const separators = ['│', '|', '\t', '  '];
    
    for (const sep of separators) {
      if (rowText.includes(sep)) {
        return rowText.split(sep).map(cell => cell.trim()).filter(cell => cell);
      }
    }
    
    // 如果没有明显分隔符，按空格分割
    return rowText.split(/\s{2,}/).filter(cell => cell.trim());
  }
}

// 导出单例
export const pdfFormatPreservingGenerator = new PDFFormatPreservingGenerator();
export type { PDFGenerationOptions, PDFGenerationResult, VariableReplacement };
