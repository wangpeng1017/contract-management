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
  private inferVariableType(key: string, value: unknown): 'text' | 'currency' | 'date' | 'percentage' {
    const keyLower = key.toLowerCase();

    // 基于值的类型推断
    if (typeof value === 'string' && /^\d+(\.\d+)?$/.test(value)) {
      // 如果值是数字字符串，可能是货币或百分比
      if (keyLower.includes('rate') || keyLower.includes('percent') || keyLower.includes('比例')) {
        return 'percentage';
      }
    }
    
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
  private generateTraditionalContent(template: { name: string; variables?: Array<{ name: string; description?: string; type?: string; required?: boolean }> }, variablesData: Record<string, unknown>): string {
    // 使用完整的模板逻辑
    let baseContent = this.getBaseContractTemplate(template.name);

    // 创建变量映射表
    const variableMapping = this.createVariableMapping(variablesData);

    // 替换所有占位符
    for (const [placeholder, value] of Object.entries(variableMapping)) {
      if (value !== undefined && value !== null && value !== '') {
        const formattedValue = String(value);
        const regex = new RegExp(this.escapeRegExp(`[${placeholder}]`), 'g');
        baseContent = baseContent.replace(regex, formattedValue);
      }
    }

    // 替换模板变量（基于template.variables）
    if (template.variables) {
      for (const variable of template.variables) {
        const value = variablesData[variable.name];
        if (value !== undefined && value !== null) {
          const formattedValue = this.formatVariableValue(value, variable.type);
          const placeholder = `[${variable.description || variable.name}]`;
          baseContent = baseContent.replace(new RegExp(this.escapeRegExp(placeholder), 'g'), formattedValue);
        }
      }
    }

    // 添加生成信息
    const currentDate = new Date().toLocaleDateString('zh-CN');
    baseContent += `\n\n--- 合同生成信息 ---\n生成时间：${currentDate}\n模板：${template.name}`;

    return baseContent;
  }

  /**
   * 获取基础合同模板
   */
  private getBaseContractTemplate(templateName: string): string {
    // 根据模板名称返回相应的基础模板
    if (templateName.includes('采购') || templateName.includes('金港')) {
      return `
汽车采购合同

甲方（采购方）：[甲方名称]
统一社会信用代码：[甲方统一社会信用代码]
地址：[甲方单位地址]
电话：[甲方电话]
开户银行：[甲方开户银行]
银行账户：[甲方银行账户]

乙方（供应方）：[乙方名称]
统一社会信用代码：[乙方统一社会信用代码]
地址：[乙方地址]
电话：[乙方电话]
开户行：[乙方开户行]
银行账号：[乙方银行账号]

合同编号：[合同编号]
签订日期：[签订日期]

一、采购车辆信息
车型名称：[物品名称]
指导价：[指导价]元/台
采购单价（含税）：[单价]元/台
数量：[数量]辆
含税总价：[总价]元
合同总价：[合同金额]（[合同金额大写]）

二、交付条款
交付地点：[交付地点]
交付日期：[交付日期]
验收标准：[验收标准]

三、付款条款
付款方式：[付款方式]
定金比例：[定金比例]%
尾款支付时间：[尾款支付时间]

四、质量保证
1. 乙方保证所供车辆为全新正品，符合国家相关标准和技术要求。
2. 车辆质量保证期按国家三包规定执行。
3. 如发现质量问题，乙方应负责免费维修或更换。

五、违约责任
1. 甲方逾期付款的，应按逾期金额每日万分之五向乙方支付违约金。
2. 乙方逾期交货的，应按合同总价每日万分之五向甲方支付违约金。
3. 任何一方违约造成合同无法履行的，违约方应赔偿对方损失。

六、争议解决
本合同履行过程中发生的争议，双方应友好协商解决；协商不成的，提交有管辖权的人民法院解决。

七、其他条款
1. 本合同自双方签字盖章之日起生效。
2. 本合同一式两份，甲乙双方各执一份，具有同等法律效力。
3. 本合同未尽事宜，双方可另行协商补充。

甲方（盖章）：_____________    乙方（盖章）：_____________
法定代表人：_____________    法定代表人：_____________
签订日期：[签订日期]        签订日期：[签订日期]
`;
    } else if (templateName.includes('销售')) {
      return `
汽车销售合同

甲方（销售方）：[甲方名称]
统一社会信用代码：[甲方统一社会信用代码]
地址：[甲方单位地址]
电话：[甲方电话]

乙方（购买方）：[乙方名称]
身份证号：[乙方身份证号]
地址：[乙方地址]
电话：[乙方电话]

合同编号：[合同编号]
签订日期：[签订日期]

一、车辆信息
车型名称：[物品名称]
车辆识别代号：[车辆识别代号]
发动机号：[发动机号]
车身颜色：[车身颜色]
销售价格：[合同金额]（[合同金额大写]）

二、交付条款
交付地点：[交付地点]
交付日期：[交付日期]
验收标准：按国家相关标准执行

三、付款条款
付款方式：[付款方式]
首付金额：[首付金额]
贷款金额：[贷款金额]
付款时间：[付款时间]

甲方（盖章）：_____________    乙方（签字）：_____________
法定代表人：_____________
签订日期：[签订日期]        签订日期：[签订日期]
`;
    } else {
      return `
${templateName}

甲方：[甲方名称]
乙方：[乙方名称]
合同金额：[合同金额]
签订日期：[签订日期]

本合同由甲乙双方在平等、自愿、协商一致的基础上签订，双方应严格履行合同条款。

甲方（盖章）：_____________    乙方（盖章）：_____________
签订日期：[签订日期]        签订日期：[签订日期]
`;
    }
  }

  /**
   * 创建变量映射表
   */
  private createVariableMapping(variablesData: Record<string, unknown>): Record<string, unknown> {
    const mapping: Record<string, unknown> = {};

    // 基础映射
    Object.entries(variablesData).forEach(([key, value]) => {
      mapping[key] = value;
    });

    // 特殊映射
    if (variablesData.buyerName) mapping['甲方名称'] = variablesData.buyerName;
    if (variablesData.supplierName) mapping['乙方名称'] = variablesData.supplierName;
    if (variablesData.totalAmount) mapping['合同金额'] = variablesData.totalAmount;
    if (variablesData.signingDate) mapping['签订日期'] = variablesData.signingDate;

    return mapping;
  }

  /**
   * 转义正则表达式特殊字符
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * 格式化变量值
   */
  private formatVariableValue(value: unknown, type?: string): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (type === 'date' && value instanceof Date) {
      return value.toLocaleDateString('zh-CN');
    }

    if (type === 'currency' || type === 'money') {
      const num = Number(value);
      if (!isNaN(num)) {
        return num.toLocaleString('zh-CN', {
          style: 'currency',
          currency: 'CNY',
          minimumFractionDigits: 2
        });
      }
    }

    return String(value || '');
  }
}

// 导出单例实例
export const templateStorage = new TemplateStorage();
