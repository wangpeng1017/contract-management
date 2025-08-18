import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import pdf2pic from 'pdf2pic';

// PDF文档处理结果接口
interface PDFProcessingResult {
  success: boolean;
  error?: string;
  content?: string;
  pages?: PDFPageData[];
  metadata?: PDFMetadata;
  layoutInfo?: LayoutInfo;
}

// PDF页面数据接口
interface PDFPageData {
  pageNumber: number;
  text: string;
  textItems: TextItem[];
  images?: string[]; // base64编码的页面图像
  dimensions: {
    width: number;
    height: number;
  };
}

// 文本项接口
interface TextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
  color?: string;
}

// PDF元数据接口
interface PDFMetadata {
  title?: string;
  author?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  pageCount: number;
  hasImages: boolean;
  hasTables: boolean;
}

// 布局信息接口
interface LayoutInfo {
  paragraphs: ParagraphInfo[];
  tables: TableInfo[];
  headers: HeaderInfo[];
  footers: FooterInfo[];
}

interface ParagraphInfo {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
  alignment: 'left' | 'center' | 'right' | 'justify';
  lineHeight: number;
}

interface TableInfo {
  x: number;
  y: number;
  width: number;
  height: number;
  rows: number;
  columns: number;
  cells: TableCell[];
}

interface TableCell {
  text: string;
  row: number;
  column: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface HeaderInfo {
  text: string;
  level: number;
  x: number;
  y: number;
  fontSize: number;
  fontName: string;
}

interface FooterInfo {
  text: string;
  x: number;
  y: number;
  fontSize: number;
}

// 变量占位符接口
interface VariablePlaceholder {
  text: string;
  type: 'text' | 'currency' | 'date' | 'percentage';
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
  pageNumber: number;
}

/**
 * PDF文档处理器
 * 专门处理PDF模板文件的解析、布局分析和变量识别
 */
class PDFDocumentProcessor {
  private pdf2picOptions = {
    density: 300,           // 高分辨率
    saveFilename: "page",
    savePath: "./temp",
    format: "png",
    width: 2480,           // A4纸张宽度 (300 DPI)
    height: 3508           // A4纸张高度 (300 DPI)
  };

  /**
   * 从文件路径解析PDF文档
   */
  async parseDocumentFromPath(filePath: string): Promise<PDFProcessingResult> {
    try {
      console.log('开始解析PDF文档:', filePath);

      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          error: '文件不存在'
        };
      }

      // 读取PDF文件
      const dataBuffer = fs.readFileSync(filePath);
      return await this.parseDocumentFromBuffer(dataBuffer);

    } catch (error) {
      console.error('PDF解析失败:', error);
      return {
        success: false,
        error: `PDF解析失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 从Buffer解析PDF文档
   */
  async parseDocumentFromBuffer(buffer: Buffer): Promise<PDFProcessingResult> {
    try {
      console.log('开始解析PDF Buffer, 大小:', buffer.length);

      // 第一步：提取基本文本内容，使用更好的配置
      const pdfData = await pdf(buffer, {
        // 不合并页面
        pagerender: undefined,
        // 最大页面数
        max: 0
      });

      console.log('PDF基本信息提取完成:', {
        pages: pdfData.numpages,
        textLength: pdfData.text.length
      });

      // 第二步：提取元数据
      const metadata = this.extractMetadata(pdfData);

      // 第三步：处理和清理文本内容
      const cleanedContent = this.cleanAndStructureText(pdfData.text);
      console.log('文本清理完成，长度:', cleanedContent.length);

      // 第四步：生成页面图像（用于布局分析）
      const pageImages = await this.generatePageImages(buffer);

      // 第五步：分析布局结构
      const layoutInfo = await this.analyzeLayout(pdfData, pageImages);

      // 第六步：识别变量占位符
      const variables = this.identifyVariables(pdfData.text, layoutInfo);

      console.log('PDF处理完成:', {
        originalTextLength: pdfData.text.length,
        cleanedTextLength: cleanedContent.length,
        pageCount: metadata.pageCount,
        variableCount: variables.length,
        paragraphCount: layoutInfo.paragraphs.length,
        tableCount: layoutInfo.tables.length
      });

      return {
        success: true,
        content: cleanedContent, // 使用清理后的内容
        metadata,
        layoutInfo,
        pages: await this.extractPageData(pdfData, pageImages)
      };

    } catch (error) {
      console.error('PDF Buffer解析失败:', error);
      return {
        success: false,
        error: `PDF解析失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 从File对象解析PDF文档
   */
  async parseDocumentFromFile(file: File): Promise<PDFProcessingResult> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return await this.parseDocumentFromBuffer(buffer);
    } catch (error) {
      return {
        success: false,
        error: `文件读取失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 清理和结构化文本内容
   */
  private cleanAndStructureText(rawText: string): string {
    console.log('开始清理和结构化文本内容...');

    // 清理文本
    const cleanText = rawText
      .replace(/\r\n/g, '\n')  // 统一换行符
      .replace(/\r/g, '\n')    // 统一换行符
      .replace(/\f/g, '\n')    // 替换换页符
      .replace(/\t/g, ' ')     // 替换制表符
      .replace(/ +/g, ' ')     // 合并多个空格
      .trim();

    // 分割成行并过滤空行
    const lines = cleanText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    console.log(`原始行数: ${lines.length}`);

    // 重新组织内容，保持原始结构
    const structuredLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 跳过页码行
      if (line.match(/第\s*\d+\s*页\s*共\s*\d+\s*页/) || line.match(/^\d+\s*\/\s*\d+$/)) {
        continue;
      }

      // 跳过格式设置行
      if (line.includes('设置了格式:') || line.includes('突出显示')) {
        continue;
      }

      // 检测标题行
      if (this.isTitle(line)) {
        structuredLines.push(`\n# ${line}\n`);
      }
      // 检测条款编号
      else if (this.isClause(line)) {
        structuredLines.push(`\n## ${line}\n`);
      }
      // 检测子条款
      else if (this.isSubClause(line)) {
        structuredLines.push(`\n### ${line}\n`);
      }
      // 普通内容行
      else {
        structuredLines.push(line);
      }
    }

    const result = structuredLines.join('\n').trim();
    console.log(`结构化后长度: ${result.length}`);

    return result;
  }

  /**
   * 判断是否为子条款行
   */
  private isSubClause(line: string): boolean {
    return (
      !!line.match(/^\d+\.\d+/) ||  // 2.1, 2.2 等
      !!line.match(/^[（(]\d+[）)]/) ||  // (1), (2) 等
      !!line.match(/^[一二三四五六七八九十]+[、．]/) ||  // 一、二、等
      !!line.match(/^\d+[）)]/)  // 1) 2) 等
    );
  }

  /**
   * 判断是否为标题行
   */
  private isTitle(line: string): boolean {
    return (
      line.length < 50 && (
        line.includes('合同') ||
        line.includes('协议') ||
        line.includes('契约') ||
        line.includes('条款') ||
        !!line.match(/^[一二三四五六七八九十]+[、．.]/) ||
        !!line.match(/^第[一二三四五六七八九十]+[章条]/) ||
        !!line.match(/^\d+[、．.]/) ||
        !!line.match(/^[（(]\d+[）)]/)
      )
    );
  }

  /**
   * 判断是否为条款行
   */
  private isClause(line: string): boolean {
    return (
      !!line.match(/^第[一二三四五六七八九十\d]+条/) ||
      !!line.match(/^\d+\./) ||
      !!line.match(/^[一二三四五六七八九十]+[、．]/) ||
      !!line.match(/^[（(][一二三四五六七八九十\d]+[）)]/)
    );
  }

  /**
   * 提取PDF元数据
   */
  private extractMetadata(pdfData: { info?: Record<string, unknown>; numpages: number; text: string }): PDFMetadata {
    const info = pdfData.info || {};

    // 安全的类型转换函数
    const safeStringConvert = (value: unknown): string | undefined => {
      return typeof value === 'string' ? value : undefined;
    };

    const safeDateConvert = (value: unknown): Date | undefined => {
      if (typeof value === 'string' || value instanceof Date) {
        const date = new Date(value);
        return isNaN(date.getTime()) ? undefined : date;
      }
      return undefined;
    };

    return {
      title: safeStringConvert(info.Title),
      author: safeStringConvert(info.Author),
      creator: safeStringConvert(info.Creator),
      producer: safeStringConvert(info.Producer),
      creationDate: safeDateConvert(info.CreationDate),
      modificationDate: safeDateConvert(info.ModDate),
      pageCount: pdfData.numpages,
      hasImages: this.detectImages(pdfData.text),
      hasTables: this.detectTables(pdfData.text)
    };
  }

  /**
   * 生成页面图像
   */
  private async generatePageImages(buffer: Buffer): Promise<string[]> {
    try {
      // 创建临时目录
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // 转换PDF为图像
      const convert = pdf2pic.fromBuffer(buffer, this.pdf2picOptions);
      const results = await convert.bulk(-1); // 转换所有页面

      const images: string[] = [];
      for (const result of results) {
        const resultWithBase64 = result as { base64?: string };
        if (resultWithBase64.base64) {
          images.push(resultWithBase64.base64);
        }
      }

      console.log(`生成了 ${images.length} 个页面图像`);
      return images;

    } catch (error) {
      console.error('页面图像生成失败:', error);
      return [];
    }
  }

  /**
   * 分析文档布局
   */
  private async analyzeLayout(pdfData: { text: string }, pageImages: string[]): Promise<LayoutInfo> {
    // 这里实现布局分析逻辑
    // 基于文本内容和页面图像分析段落、表格、标题等结构
    console.log(`分析布局，页面图像数量: ${pageImages.length}`);
    
    const paragraphs: ParagraphInfo[] = [];
    const tables: TableInfo[] = [];
    const headers: HeaderInfo[] = [];
    const footers: FooterInfo[] = [];

    // 简化的布局分析（实际实现会更复杂）
    const lines = pdfData.text.split('\n').filter((line: string) => line.trim());
    
    let currentY = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // 检测标题（通常是较短的行，可能包含特殊格式）
      if (this.isHeader(line)) {
        headers.push({
          text: line,
          level: this.getHeaderLevel(line),
          x: 50, // 默认左边距
          y: currentY,
          fontSize: this.estimateFontSize(line),
          fontName: 'SimSun'
        });
      } 
      // 检测表格行
      else if (this.isTableRow(line)) {
        // 表格处理逻辑
        const tableInfo = this.parseTableRow(line, currentY);
        if (tableInfo) {
          tables.push(tableInfo);
        }
      }
      // 普通段落
      else {
        paragraphs.push({
          text: line,
          x: 50,
          y: currentY,
          width: 500,
          height: 20,
          fontSize: 12,
          fontName: 'SimSun',
          alignment: 'left',
          lineHeight: 1.5
        });
      }

      currentY += 25; // 行间距
    }

    return {
      paragraphs,
      tables,
      headers,
      footers
    };
  }

  /**
   * 提取页面数据
   */
  private async extractPageData(pdfData: { text: string; numpages: number }, pageImages: string[]): Promise<PDFPageData[]> {
    const pages: PDFPageData[] = [];
    
    // 简化实现：将文本平均分配到各页面
    const totalText = pdfData.text;
    const pageCount = pdfData.numpages;
    const textPerPage = Math.ceil(totalText.length / pageCount);

    for (let i = 0; i < pageCount; i++) {
      const startIndex = i * textPerPage;
      const endIndex = Math.min((i + 1) * textPerPage, totalText.length);
      const pageText = totalText.substring(startIndex, endIndex);

      pages.push({
        pageNumber: i + 1,
        text: pageText,
        textItems: this.extractTextItems(pageText, i + 1),
        images: pageImages[i] ? [pageImages[i]] : [],
        dimensions: {
          width: 595.32, // A4宽度（点）
          height: 841.92  // A4高度（点）
        }
      });
    }

    return pages;
  }

  /**
   * 提取文本项
   */
  private extractTextItems(text: string, pageNumber: number): TextItem[] {
    const items: TextItem[] = [];
    const lines = text.split('\n');

    // 使用页面编号进行处理
    console.log(`提取第${pageNumber}页的文本项，共${lines.length}行`);
    
    let currentY = 50;
    for (const line of lines) {
      if (line.trim()) {
        items.push({
          text: line.trim(),
          x: 50,
          y: currentY,
          width: line.length * 8, // 估算宽度
          height: 16,
          fontSize: 12,
          fontName: 'SimSun'
        });
        currentY += 20;
      }
    }

    return items;
  }

  /**
   * 识别变量占位符
   */
  private identifyVariables(text: string, layoutInfo: LayoutInfo): VariablePlaceholder[] {
    const variables: VariablePlaceholder[] = [];
    
    // 支持的占位符格式
    const patterns = [
      /\[([^\]]+)\]/g,        // [变量名]
      /\{\{([^}]+)\}\}/g,     // {{变量名}}
      /\$\{([^}]+)\}/g        // ${变量名}
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const placeholder = match[0];
        const variableName = match[1];
        
        // 估算位置（实际实现需要更精确的定位）
        const position = this.estimatePosition(placeholder, text, layoutInfo);
        
        variables.push({
          text: placeholder,
          type: this.inferVariableType(variableName),
          x: position.x,
          y: position.y,
          width: placeholder.length * 8,
          height: 16,
          fontSize: 12,
          fontName: 'SimSun',
          pageNumber: position.pageNumber
        });
      }
    }

    return variables;
  }

  // 辅助方法
  private detectImages(text: string): boolean {
    return text.includes('图') || text.includes('Image') || text.includes('图片');
  }

  private detectTables(text: string): boolean {
    return text.includes('│') || text.includes('┌') || text.includes('└') || 
           text.includes('表') || text.includes('Table');
  }

  private isHeader(line: string): boolean {
    return line.length < 50 && (
      line.includes('第') && line.includes('条') ||
      line.includes('章') ||
      /^\d+\./.test(line) ||
      line.includes('合同') ||
      line.includes('协议')
    );
  }

  private getHeaderLevel(line: string): number {
    if (line.includes('第') && line.includes('章')) return 1;
    if (line.includes('第') && line.includes('条')) return 2;
    if (/^\d+\./.test(line)) return 3;
    return 2;
  }

  private estimateFontSize(line: string): number {
    if (this.getHeaderLevel(line) === 1) return 16;
    if (this.getHeaderLevel(line) === 2) return 14;
    return 12;
  }

  private isTableRow(line: string): boolean {
    return line.includes('│') || line.includes('┌') || line.includes('└') ||
           (line.split(/\s+/).length > 3 && line.includes('：'));
  }

  private parseTableRow(line: string, y: number): TableInfo | null {
    // 简化的表格解析
    if (this.isTableRow(line)) {
      return {
        x: 50,
        y: y,
        width: 500,
        height: 20,
        rows: 1,
        columns: line.split(/\s+/).length,
        cells: []
      };
    }
    return null;
  }

  private estimatePosition(placeholder: string, text: string, layoutInfo: LayoutInfo): { x: number; y: number; pageNumber: number } {
    // 简化的位置估算
    const index = text.indexOf(placeholder);
    const beforeText = text.substring(0, index);
    const lines = beforeText.split('\n').length;

    // 使用布局信息进行更精确的定位
    console.log(`估算变量位置，布局信息包含${layoutInfo.paragraphs.length}个段落`);
    
    return {
      x: 50,
      y: lines * 20,
      pageNumber: Math.ceil(lines / 40) // 假设每页40行
    };
  }

  private inferVariableType(variableName: string): 'text' | 'currency' | 'date' | 'percentage' {
    const name = variableName.toLowerCase();

    if (name.includes('金额') || name.includes('价格') || name.includes('费用') || name.includes('amount') || name.includes('price')) {
      return 'currency';
    }
    if (name.includes('日期') || name.includes('时间') || name.includes('date') || name.includes('time')) {
      return 'date';
    }
    if (name.includes('比例') || name.includes('率') || name.includes('percent') || name.includes('%')) {
      return 'percentage';
    }

    return 'text';
  }

}

// 导出单例
export const pdfDocumentProcessor = new PDFDocumentProcessor();
export type { PDFProcessingResult, PDFPageData, PDFMetadata, LayoutInfo, VariablePlaceholder };
