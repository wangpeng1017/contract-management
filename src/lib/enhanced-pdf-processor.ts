import fs from 'fs';
import pdf from 'pdf-parse';

// 增强的PDF处理结果接口
interface EnhancedPDFResult {
  success: boolean;
  error?: string;
  fullText: string;
  structuredContent: string;
  variables: Array<{
    placeholder: string;
    position: number;
    context: string;
  }>;
  metadata: {
    pageCount: number;
    wordCount: number;
    hasVariables: boolean;
  };
}

/**
 * 增强的PDF处理器
 * 专注于完整内容提取和准确的变量识别
 */
class EnhancedPDFProcessor {
  
  /**
   * 处理PDF文件并提取完整内容
   */
  async processFile(filePath: string): Promise<EnhancedPDFResult> {
    try {
      console.log('开始增强PDF处理:', filePath);

      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          error: '文件不存在',
          fullText: '',
          structuredContent: '',
          variables: [],
          metadata: { pageCount: 0, wordCount: 0, hasVariables: false }
        };
      }

      // 读取PDF文件
      const dataBuffer = fs.readFileSync(filePath);
      
      // 使用pdf-parse提取文本，配置更详细的选项
      const pdfData = await pdf(dataBuffer, {
        // 保持原始格式
        normalizeWhitespace: false,
        // 不合并页面
        pagerender: undefined,
        // 最大页面数
        max: 0
      });

      console.log('PDF基本信息:', {
        pages: pdfData.numpages,
        textLength: pdfData.text.length,
        info: pdfData.info
      });

      // 提取完整文本
      const fullText = pdfData.text;
      
      // 清理和结构化文本
      const structuredContent = this.structureContent(fullText);
      
      // 识别变量占位符
      const variables = this.identifyVariables(fullText);
      
      // 生成元数据
      const metadata = {
        pageCount: pdfData.numpages,
        wordCount: fullText.split(/\s+/).length,
        hasVariables: variables.length > 0
      };

      console.log('增强PDF处理完成:', {
        fullTextLength: fullText.length,
        structuredLength: structuredContent.length,
        variableCount: variables.length,
        metadata
      });

      return {
        success: true,
        fullText,
        structuredContent,
        variables,
        metadata
      };

    } catch (error) {
      console.error('增强PDF处理失败:', error);
      return {
        success: false,
        error: `处理失败: ${error instanceof Error ? error.message : '未知错误'}`,
        fullText: '',
        structuredContent: '',
        variables: [],
        metadata: { pageCount: 0, wordCount: 0, hasVariables: false }
      };
    }
  }

  /**
   * 结构化内容处理
   */
  private structureContent(rawText: string): string {
    console.log('开始结构化内容处理...');
    
    // 清理文本
    let cleanText = rawText
      .replace(/\r\n/g, '\n')  // 统一换行符
      .replace(/\r/g, '\n')    // 统一换行符
      .replace(/\f/g, '\n')    // 替换换页符
      .replace(/\t/g, ' ')     // 替换制表符
      .replace(/ +/g, ' ')     // 合并多个空格
      .trim();

    // 分割成行
    const lines = cleanText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    console.log(`原始行数: ${lines.length}`);
    
    // 重新组织内容
    const structuredLines: string[] = [];
    let currentSection = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 检测标题行（通常较短且可能包含特殊字符）
      if (this.isTitle(line)) {
        if (currentSection) {
          structuredLines.push(currentSection);
          currentSection = '';
        }
        structuredLines.push(`\n## ${line}\n`);
      }
      // 检测条款编号
      else if (this.isClause(line)) {
        if (currentSection) {
          structuredLines.push(currentSection);
          currentSection = '';
        }
        structuredLines.push(`\n### ${line}`);
      }
      // 普通内容行
      else {
        if (currentSection) {
          currentSection += ' ' + line;
        } else {
          currentSection = line;
        }
        
        // 如果行以句号、问号、感叹号结尾，认为是段落结束
        if (line.match(/[。！？；]$/)) {
          structuredLines.push(currentSection);
          currentSection = '';
        }
      }
    }
    
    // 添加最后的内容
    if (currentSection) {
      structuredLines.push(currentSection);
    }
    
    const result = structuredLines.join('\n\n').trim();
    console.log(`结构化后长度: ${result.length}`);
    
    return result;
  }

  /**
   * 识别变量占位符
   */
  private identifyVariables(text: string): Array<{ placeholder: string; position: number; context: string }> {
    const variables: Array<{ placeholder: string; position: number; context: string }> = [];
    
    // 支持的占位符格式
    const patterns = [
      /\[([^\]]+)\]/g,        // [变量名]
      /\{\{([^}]+)\}\}/g,     // {{变量名}}
      /\$\{([^}]+)\}/g,       // ${变量名}
      /【([^】]+)】/g,        // 【变量名】
      /\[([^[\]]*[甲乙丙丁][^[\]]*)\]/g,  // 包含甲乙丙丁的占位符
      /\[([^[\]]*[名称|金额|日期|地点|时间][^[\]]*)\]/g  // 包含关键词的占位符
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const placeholder = match[0];
        const position = match.index;
        
        // 获取上下文（前后各50个字符）
        const start = Math.max(0, position - 50);
        const end = Math.min(text.length, position + placeholder.length + 50);
        const context = text.substring(start, end);
        
        // 避免重复添加
        if (!variables.some(v => v.placeholder === placeholder && Math.abs(v.position - position) < 10)) {
          variables.push({
            placeholder,
            position,
            context
          });
        }
      }
    }

    console.log(`识别到 ${variables.length} 个变量占位符`);
    return variables;
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
        line.match(/^[一二三四五六七八九十]+[、．.]/) ||
        line.match(/^第[一二三四五六七八九十]+[章条]/) ||
        line.match(/^\d+[、．.]/) ||
        line.match(/^[（(]\d+[）)]/)
      )
    );
  }

  /**
   * 判断是否为条款行
   */
  private isClause(line: string): boolean {
    return (
      line.match(/^第[一二三四五六七八九十\d]+条/) ||
      line.match(/^\d+\./) ||
      line.match(/^[一二三四五六七八九十]+[、．]/) ||
      line.match(/^[（(][一二三四五六七八九十\d]+[）)]/)
    );
  }

  /**
   * 替换变量
   */
  replaceVariables(content: string, variables: Record<string, string>): string {
    let result = content;
    
    // 常用变量映射
    const mappings: Record<string, string[]> = {
      '甲方名称': ['[甲方名称]', '【甲方名称】', '{{甲方名称}}', '${甲方名称}', '[甲方]', '【甲方】'],
      '乙方名称': ['[乙方名称]', '【乙方名称】', '{{乙方名称}}', '${乙方名称}', '[乙方]', '【乙方】'],
      '合同金额': ['[合同金额]', '【合同金额】', '{{合同金额}}', '${合同金额}', '[金额]', '【金额】'],
      '签订日期': ['[签订日期]', '【签订日期】', '{{签订日期}}', '${签订日期}', '[日期]', '【日期】'],
      '签订地点': ['[签订地点]', '【签订地点】', '{{签订地点}}', '${签订地点}', '[地点]', '【地点】']
    };

    // 执行替换
    for (const [key, value] of Object.entries(variables)) {
      if (value && typeof value === 'string') {
        // 直接替换
        const directPatterns = [
          `[${key}]`,
          `【${key}】`,
          `{{${key}}}`,
          `\${${key}}`
        ];
        
        for (const pattern of directPatterns) {
          result = result.replace(new RegExp(this.escapeRegExp(pattern), 'g'), value);
        }
        
        // 映射替换
        if (mappings[key]) {
          for (const placeholder of mappings[key]) {
            result = result.replace(new RegExp(this.escapeRegExp(placeholder), 'g'), value);
          }
        }
      }
    }

    return result;
  }

  /**
   * 转义正则表达式特殊字符
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// 导出单例
export const enhancedPDFProcessor = new EnhancedPDFProcessor();
export type { EnhancedPDFResult };
