import mammoth from 'mammoth';
import TurndownService from 'turndown';
import MarkdownIt from 'markdown-it';

export interface DocumentProcessingResult {
  success: boolean;
  content?: string;
  markdown?: string;
  originalHtml?: string;
  error?: string;
  metadata?: {
    title?: string;
    wordCount?: number;
    hasImages?: boolean;
    hasTables?: boolean;
  };
}

export interface VariableReplacement {
  placeholder: string;
  value: string;
  type?: 'text' | 'currency' | 'date' | 'percentage';
}

/**
 * 文档处理器 - 负责文档格式保真度处理
 */
export class DocumentProcessor {
  private turndownService: TurndownService;
  private markdownIt: MarkdownIt;

  constructor() {
    // 配置Turndown服务以保持更多格式信息
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      emDelimiter: '*',
      strongDelimiter: '**',
      linkStyle: 'inlined',
      linkReferenceStyle: 'full'
    });

    // 保持表格格式
    this.turndownService.keep(['table', 'thead', 'tbody', 'tr', 'th', 'td']);
    
    // 保持一些重要的HTML标签
    this.turndownService.keep(['div', 'span', 'p']);

    // 配置MarkdownIt
    this.markdownIt = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true
    });
  }

  /**
   * 从文件路径解析Word文档
   */
  async parseDocumentFromPath(filePath: string): Promise<DocumentProcessingResult> {
    try {
      // 这里应该从实际文件系统或Blob存储读取文件
      // 由于演示目的，我们先返回模拟结果
      return {
        success: false,
        error: '文件路径解析功能需要实现文件系统访问'
      };
    } catch (error) {
      return {
        success: false,
        error: `文件解析失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 从File对象解析Word文档
   */
  async parseDocumentFromFile(file: File): Promise<DocumentProcessingResult> {
    try {
      // 检查文件类型
      if (!this.isValidDocumentFile(file)) {
        return {
          success: false,
          error: '不支持的文件类型，请上传.doc或.docx文件'
        };
      }

      // 将File转换为ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // 使用mammoth解析文档
      const result = await mammoth.convertToHtml({ arrayBuffer });
      
      if (result.messages.length > 0) {
        console.warn('文档解析警告:', result.messages);
      }

      // 转换为markdown
      const markdown = this.turndownService.turndown(result.value);

      // 提取元数据
      const metadata = this.extractMetadata(result.value, markdown);

      return {
        success: true,
        content: result.value,
        originalHtml: result.value,
        markdown,
        metadata
      };

    } catch (error) {
      return {
        success: false,
        error: `文档解析失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 在markdown中进行变量替换
   */
  replaceVariablesInMarkdown(
    markdown: string, 
    replacements: VariableReplacement[]
  ): string {
    let processedMarkdown = markdown;

    for (const replacement of replacements) {
      const { placeholder, value, type = 'text' } = replacement;
      
      // 格式化值
      const formattedValue = this.formatValue(value, type);
      
      // 创建正则表达式来匹配占位符
      // 支持多种占位符格式: [placeholder], {{placeholder}}, ${placeholder}
      const patterns = [
        new RegExp(`\\[${this.escapeRegExp(placeholder)}\\]`, 'g'),
        new RegExp(`\\{\\{${this.escapeRegExp(placeholder)}\\}\\}`, 'g'),
        new RegExp(`\\$\\{${this.escapeRegExp(placeholder)}\\}`, 'g')
      ];

      for (const pattern of patterns) {
        processedMarkdown = processedMarkdown.replace(pattern, formattedValue);
      }
    }

    return processedMarkdown;
  }

  /**
   * 将markdown转换回HTML
   */
  markdownToHtml(markdown: string): string {
    return this.markdownIt.render(markdown);
  }

  /**
   * 检查是否为有效的文档文件
   */
  private isValidDocumentFile(file: File): boolean {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
    ];
    
    const validExtensions = ['.doc', '.docx'];
    
    return validTypes.includes(file.type) || 
           validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  }

  /**
   * 提取文档元数据
   */
  private extractMetadata(html: string, markdown: string) {
    const metadata: {
      wordCount: number;
      hasImages: boolean;
      hasTables: boolean;
      title?: string;
    } = {
      wordCount: markdown.split(/\s+/).length,
      hasImages: /<img[^>]*>/i.test(html),
      hasTables: /<table[^>]*>/i.test(html)
    };

    // 尝试提取标题
    const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (titleMatch) {
      metadata.title = titleMatch[1].replace(/<[^>]*>/g, '').trim();
    }

    return metadata;
  }

  /**
   * 格式化值
   */
  private formatValue(value: string, type: string): string {
    switch (type) {
      case 'currency':
        const num = parseFloat(value);
        return isNaN(num) ? value : num.toLocaleString('zh-CN', { 
          style: 'currency', 
          currency: 'CNY' 
        });
      
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

  /**
   * 转义正则表达式特殊字符
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// 导出单例实例
export const documentProcessor = new DocumentProcessor();
