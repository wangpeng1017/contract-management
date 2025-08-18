import { prisma } from './database';
import { documentProcessor, VariableReplacement } from './document-processor';

export interface TemplateContent {
  id: string;
  originalHtml?: string;
  markdown?: string;
  metadata?: {
    title?: string;
    wordCount?: number;
    hasImages?: boolean;
    hasTables?: boolean;
  };
}

export interface ProcessedTemplate {
  success: boolean;
  content?: string;
  markdown?: string;
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
      
      if (!templateContent || !templateContent.markdown) {
        // 如果没有解析过的内容，使用传统方法
        return this.fallbackToTraditionalGeneration(templateId, variablesData);
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
      console.error('处理模板失败:', error);
      return {
        success: false,
        error: `模板处理失败: ${error instanceof Error ? error.message : '未知错误'}`
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
   * 准备变量替换数组
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
