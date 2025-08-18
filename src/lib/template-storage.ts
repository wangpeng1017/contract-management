import { prisma } from './database';
import { documentProcessor, VariableReplacement } from './document-processor';
import { pdfDocumentProcessor, PDFProcessingResult } from './pdf-document-processor';
import { pdfFormatPreservingGenerator, VariableReplacement as PDFVariableReplacement } from './pdf-format-preserving-generator';

export interface TemplateContent {
  id: string;
  originalHtml?: string;
  markdown?: string;
  pdfData?: PDFProcessingResult; // 新增PDF数据支持
  fileType?: 'word' | 'pdf'; // 文件类型标识
  metadata?: {
    title?: string;
    wordCount?: number;
    hasImages?: boolean;
    hasTables?: boolean;
    pageCount?: number; // PDF页数
  };
}

export interface ProcessedTemplate {
  success: boolean;
  content?: string;
  markdown?: string;
  buffer?: Buffer; // 新增：支持PDF生成的Word文档Buffer
  error?: string;
}

/**
 * 模板存储和处理服务
 */
export class TemplateStorage {
  
  /**
   * 存储模板的解析内容
   */
  async storeTemplateContent(templateId: string, content: TemplateContent): Promise<boolean> {
    try {
      console.log('存储模板内容:', templateId, '类型:', content.fileType);

      // 将解析后的内容存储到数据库
      await prisma.contractTemplate.update({
        where: { id: templateId },
        data: {
          // 使用JSON字段存储解析后的内容
          // 注意：这需要在数据库schema中添加相应字段
          // 暂时存储在现有字段中
          description: JSON.stringify({
            originalDescription: '',
            parsedContent: content
          })
        }
      });

      return true;
    } catch (error) {
      console.error('存储模板内容失败:', error);
      return false;
    }
  }

  /**
   * 解析并存储PDF模板
   */
  async parseAndStorePDFTemplate(templateId: string, file: File): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('开始解析PDF模板:', templateId);

      // 解析PDF文档
      const parseResult = await pdfDocumentProcessor.parseDocumentFromFile(file);

      if (!parseResult.success) {
        return {
          success: false,
          error: parseResult.error || 'PDF解析失败'
        };
      }

      // 存储解析结果
      const templateContent: TemplateContent = {
        id: templateId,
        pdfData: parseResult,
        fileType: 'pdf',
        metadata: {
          title: parseResult.metadata?.title,
          wordCount: parseResult.content?.split(/\s+/).length || 0,
          hasImages: parseResult.metadata?.hasImages || false,
          hasTables: parseResult.metadata?.hasTables || false,
          pageCount: parseResult.metadata?.pageCount || 1
        }
      };

      const stored = await this.storeTemplateContent(templateId, templateContent);

      if (!stored) {
        return {
          success: false,
          error: '模板存储失败'
        };
      }

      console.log('PDF模板解析和存储成功');
      return { success: true };

    } catch (error) {
      console.error('PDF模板处理失败:', error);
      return {
        success: false,
        error: `PDF处理失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 获取模板的解析内容
   */
  async getTemplateContent(templateId: string): Promise<TemplateContent | null> {
    try {
      const template = await prisma.contractTemplate.findUnique({
        where: { id: templateId }
      });

      if (!template) {
        return null;
      }

      // 尝试从description字段解析内容
      try {
        const parsed = JSON.parse(template.description || '{}');
        if (parsed.parsedContent) {
          return {
            id: templateId,
            ...parsed.parsedContent
          };
        }
      } catch {
        // 如果解析失败，返回null
      }

      return null;
    } catch (error) {
      console.error('获取模板内容失败:', error);
      return null;
    }
  }

  /**
   * 处理模板文档并生成合同内容
   */
  async processTemplateForContract(
    templateId: string,
    variablesData: Record<string, unknown>
  ): Promise<ProcessedTemplate> {
    try {
      // 获取存储的模板内容
      const templateContent = await this.getTemplateContent(templateId);

      if (!templateContent) {
        // 如果没有解析过的内容，使用传统方法
        return this.fallbackToTraditionalGeneration(templateId, variablesData);
      }

      // 根据文件类型选择处理方式
      if (templateContent.fileType === 'pdf' && templateContent.pdfData) {
        return await this.processPDFTemplate(templateContent, variablesData);
      } else if (templateContent.markdown) {
        return await this.processWordTemplate(templateContent, variablesData);
      } else {
        return this.fallbackToTraditionalGeneration(templateId, variablesData);
      }

    } catch (error) {
      console.error('处理模板失败:', error);
      return {
        success: false,
        error: `模板处理失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 处理Word模板
   */
  private async processWordTemplate(
    templateContent: TemplateContent,
    variablesData: Record<string, unknown>
  ): Promise<ProcessedTemplate> {
    try {
      if (!templateContent.markdown) {
        throw new Error('Word模板Markdown内容不存在');
      }

      // 准备变量替换
      const replacements: VariableReplacement[] = this.prepareVariableReplacements(variablesData);

      // 在markdown中进行变量替换
      const processedMarkdown = documentProcessor.replaceVariablesInMarkdown(
        templateContent.markdown,
        replacements
      );

      // 转换回HTML用于预览
      const processedHtml = documentProcessor.markdownToHtml(processedMarkdown);

      return {
        success: true,
        content: processedHtml,
        markdown: processedMarkdown
      };
    } catch (error) {
      return {
        success: false,
        error: `Word模板处理失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 处理PDF模板
   */
  private async processPDFTemplate(
    templateContent: TemplateContent,
    variablesData: Record<string, unknown>
  ): Promise<ProcessedTemplate> {
    try {
      if (!templateContent.pdfData) {
        throw new Error('PDF模板数据不存在');
      }

      console.log('开始处理PDF模板，使用格式保真系统');

      // 准备PDF变量替换
      const pdfReplacements = this.preparePDFVariableReplacements(variablesData);

      // 使用PDF格式保真生成器
      const genResult = await pdfFormatPreservingGenerator.generateWordFromPDF(
        templateContent.pdfData,
        pdfReplacements,
        {
          preserveFormatting: true,
          fontFamily: '宋体',
          fontSize: 12,
          pageMargins: { top: 720, bottom: 720, left: 720, right: 720 }
        }
      );

      if (!genResult.success) {
        throw new Error(genResult.error || 'PDF模板处理失败');
      }

      console.log('PDF模板处理完成，生成Word文档');

      // 返回处理结果，包含生成的内容
      return {
        success: true,
        content: templateContent.pdfData.content || 'PDF模板生成的内容',
        markdown: templateContent.pdfData.content || '',
        buffer: genResult.buffer
      };

    } catch (error) {
      console.error('PDF模板处理失败:', error);
      return {
        success: false,
        error: `PDF模板处理失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 解析并存储模板文档
   */
  async parseAndStoreTemplate(templateId: string, file: File): Promise<boolean> {
    try {
      // 使用文档处理器解析文件
      const result = await documentProcessor.parseDocumentFromFile(file);

      if (!result.success) {
        console.error('文档解析失败:', result.error);
        return false;
      }

      // 存储解析结果
      const templateContent: TemplateContent = {
        id: templateId,
        originalHtml: result.originalHtml,
        markdown: result.markdown,
        metadata: result.metadata
      };

      return await this.storeTemplateContent(templateId, templateContent);

    } catch (error) {
      console.error('解析和存储模板失败:', error);
      return false;
    }
  }

  /**
   * 准备PDF变量替换数组
   */
  private preparePDFVariableReplacements(variablesData: Record<string, unknown>): PDFVariableReplacement[] {
    const replacements: PDFVariableReplacement[] = [];

    // 常用变量映射
    const commonMappings: Record<string, string> = {
      '甲方名称': 'buyerName',
      '乙方名称': 'supplierName',
      '合同金额': 'totalAmount',
      '签订日期': 'signingDate',
      '签订地点': 'signingLocation',
      '甲方': 'buyerName',
      '乙方': 'supplierName',
      '总金额': 'totalAmount',
      '日期': 'signingDate',
      '地点': 'signingLocation'
    };

    // 处理映射的变量
    for (const [chineseName, englishName] of Object.entries(commonMappings)) {
      const value = variablesData[englishName] || variablesData[chineseName];
      if (value !== undefined) {
        // 添加中文占位符
        replacements.push({
          placeholder: `[${chineseName}]`,
          value: String(value),
          type: this.inferVariableType(chineseName, value)
        });
        replacements.push({
          placeholder: `{{${chineseName}}}`,
          value: String(value),
          type: this.inferVariableType(chineseName, value)
        });
        replacements.push({
          placeholder: `\${${chineseName}}`,
          value: String(value),
          type: this.inferVariableType(chineseName, value)
        });
      }
    }

    // 处理其他变量
    for (const [key, value] of Object.entries(variablesData)) {
      if (value !== undefined && !Object.values(commonMappings).includes(key)) {
        const strValue = String(value);
        const varType = this.inferVariableType(key, value);

        // 添加多种格式的占位符
        replacements.push({
          placeholder: `[${key}]`,
          value: strValue,
          type: varType
        });
        replacements.push({
          placeholder: `{{${key}}}`,
          value: strValue,
          type: varType
        });
        replacements.push({
          placeholder: `\${${key}}`,
          value: strValue,
          type: varType
        });
      }
    }

    console.log(`准备了 ${replacements.length} 个PDF变量替换`);
    return replacements;
  }

  /**
   * 准备变量替换数据
   */
  private prepareVariableReplacements(variablesData: Record<string, unknown>): VariableReplacement[] {
    const replacements: VariableReplacement[] = [];

    for (const [key, value] of Object.entries(variablesData)) {
      if (value !== undefined && value !== null && value !== '') {
        replacements.push({
          placeholder: key,
          value: String(value),
          type: this.inferVariableType(key, value)
        });
      }
    }

    // 添加一些常用的映射
    this.addCommonMappings(replacements, variablesData);

    return replacements;
  }

  /**
   * 推断变量类型
   */
  private inferVariableType(key: string, _value: unknown): 'text' | 'currency' | 'date' | 'percentage' {
    const keyLower = key.toLowerCase();
    
    if (keyLower.includes('amount') || keyLower.includes('price') || keyLower.includes('金额') || keyLower.includes('价格')) {
      return 'currency';
    }
    
    if (keyLower.includes('date') || keyLower.includes('time') || keyLower.includes('日期') || keyLower.includes('时间')) {
      return 'date';
    }
    
    if (keyLower.includes('percent') || keyLower.includes('rate') || keyLower.includes('比例') || keyLower.includes('率')) {
      return 'percentage';
    }
    
    return 'text';
  }

  /**
   * 添加常用映射
   */
  private addCommonMappings(replacements: VariableReplacement[], variablesData: Record<string, unknown>) {
    // 添加一些常用的中文占位符映射
    const commonMappings = {
      '甲方名称': variablesData.buyerName || variablesData.甲方名称,
      '乙方名称': variablesData.supplierName || variablesData.乙方名称,
      '合同金额': variablesData.totalAmount || variablesData.合同金额,
      '签订日期': variablesData.signingDate || variablesData.签订日期,
      '签订地点': variablesData.signingLocation || variablesData.签订地点
    };

    for (const [placeholder, value] of Object.entries(commonMappings)) {
      if (value !== undefined && value !== null && value !== '') {
        replacements.push({
          placeholder,
          value: String(value),
          type: this.inferVariableType(placeholder, value)
        });
      }
    }
  }

  /**
   * 传统生成方法的回退
   */
  private async fallbackToTraditionalGeneration(
    templateId: string,
    variablesData: Record<string, unknown>
  ): Promise<ProcessedTemplate> {
    try {
      // 获取模板信息
      const template = await prisma.contractTemplate.findUnique({
        where: { id: templateId },
        include: { variables: true }
      });

      if (!template) {
        return {
          success: false,
          error: '模板不存在'
        };
      }

      // 使用原有的生成逻辑
      const content = this.generateTraditionalContent(template, variablesData);

      return {
        success: true,
        content
      };

    } catch (error) {
      return {
        success: false,
        error: `传统生成失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 传统内容生成
   */
  private generateTraditionalContent(template: { name: string }, variablesData: Record<string, unknown>): string {
    // 这里可以复用原有的getBaseContractTemplate逻辑
    const content = `
    <h1>${template.name}</h1>
    <p>甲方：${variablesData.buyerName || '[甲方名称]'}</p>
    <p>乙方：${variablesData.supplierName || '[乙方名称]'}</p>
    <p>合同金额：${variablesData.totalAmount || '[合同金额]'}</p>
    <p>签订日期：${variablesData.signingDate || '[签订日期]'}</p>
    `;

    return content;
  }
}

// 导出单例实例
export const templateStorage = new TemplateStorage();
