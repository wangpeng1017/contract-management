import { initFeishuClient, getFeishuClient } from './feishu-client';
import { feishuDocumentProcessor, VariableInfo } from './feishu-document-processor';
import { prisma } from './database';

// 飞书模板信息接口
interface FeishuTemplateInfo {
  id: string;
  name: string;
  docToken: string;
  variables: VariableInfo[];
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// 合同生成请求接口
interface ContractGenerationRequest {
  templateId: string;
  variables: Record<string, string>;
  contractTitle: string;
  contractData?: any;
}

// 合同生成结果接口
interface ContractGenerationResponse {
  success: boolean;
  error?: string;
  contractId?: string;
  downloadUrl?: string;
  buffer?: Buffer;
}

/**
 * 飞书模板存储管理器
 * 集成飞书文档API的模板管理功能
 */
class FeishuTemplateStorage {
  private initialized = false;

  /**
   * 初始化飞书客户端
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const appId = process.env.FEISHU_APP_ID;
      const appSecret = process.env.FEISHU_APP_SECRET;
      const baseUrl = process.env.FEISHU_BASE_URL || 'https://open.feishu.cn';

      // 检查是否使用模拟模式
      const useMockMode = !appId ||
                         appId === 'your-feishu-app-id' ||
                         !appSecret ||
                         appSecret === 'your-feishu-app-secret' ||
                         process.env.NODE_ENV === 'development';

      if (useMockMode) {
        console.log('🔧 飞书模板存储运行在模拟模式');
        this.initialized = true;
        return;
      }

      if (!appId || !appSecret) {
        throw new Error('飞书API配置缺失，请检查环境变量 FEISHU_APP_ID 和 FEISHU_APP_SECRET');
      }

      initFeishuClient({
        appId,
        appSecret,
        baseUrl
      });

      this.initialized = true;
      console.log('飞书模板存储初始化完成');
    } catch (error) {
      console.error('飞书模板存储初始化失败:', error);
      // 在开发环境中，即使初始化失败也继续运行（使用模拟模式）
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 切换到模拟模式继续运行');
        this.initialized = true;
        return;
      }
      throw error;
    }
  }

  /**
   * 上传并处理模板
   */
  async uploadTemplate(file: Buffer, fileName: string, templateName: string): Promise<{ success: boolean; templateId?: string; error?: string }> {
    try {
      await this.initialize();
      
      console.log('开始处理飞书模板:', fileName);

      // 1. 导入模板到飞书
      const processResult = await feishuDocumentProcessor.importTemplate(file, fileName);
      if (!processResult.success) {
        return {
          success: false,
          error: processResult.error
        };
      }

      // 2. 保存模板信息到数据库
      const template = await prisma.template.create({
        data: {
          name: templateName,
          content: processResult.content!,
          variables: JSON.stringify(processResult.variables),
          metadata: JSON.stringify({
            docToken: processResult.docToken,
            documentInfo: processResult.documentInfo,
            source: 'feishu',
            originalFileName: fileName
          })
        }
      });

      console.log('飞书模板保存成功:', template.id);

      return {
        success: true,
        templateId: template.id
      };

    } catch (error) {
      console.error('飞书模板上传失败:', error);
      return {
        success: false,
        error: `模板上传失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 获取模板信息
   */
  async getTemplate(templateId: string): Promise<FeishuTemplateInfo | null> {
    try {
      const template = await prisma.template.findUnique({
        where: { id: templateId }
      });

      if (!template) {
        return null;
      }

      const metadata = JSON.parse(template.metadata || '{}');
      const variables = JSON.parse(template.variables || '[]');

      return {
        id: template.id,
        name: template.name,
        docToken: metadata.docToken,
        variables,
        content: template.content,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt
      };
    } catch (error) {
      console.error('获取模板失败:', error);
      return null;
    }
  }

  /**
   * 生成合同
   */
  async generateContract(request: ContractGenerationRequest): Promise<ContractGenerationResponse> {
    try {
      await this.initialize();
      
      console.log('开始生成飞书合同:', request.contractTitle);

      // 1. 获取模板信息
      const template = await this.getTemplate(request.templateId);
      if (!template) {
        return {
          success: false,
          error: '模板不存在'
        };
      }

      // 2. 验证变量
      const validationResult = this.validateVariables(template.variables, request.variables);
      if (!validationResult.valid) {
        return {
          success: false,
          error: `变量验证失败: ${validationResult.errors.join(', ')}`
        };
      }

      // 3. 使用飞书API生成合同
      const generationResult = await feishuDocumentProcessor.generateContract(
        template.docToken,
        request.variables,
        request.contractTitle
      );

      if (!generationResult.success) {
        return {
          success: false,
          error: generationResult.error
        };
      }

      // 4. 保存合同记录到数据库
      const contract = await prisma.contract.create({
        data: {
          title: request.contractTitle,
          templateId: request.templateId,
          variables: JSON.stringify(request.variables),
          content: '', // 飞书生成的内容
          status: 'generated',
          metadata: JSON.stringify({
            contractDocToken: generationResult.contractDocToken,
            downloadUrl: generationResult.downloadUrl,
            source: 'feishu',
            generatedAt: new Date().toISOString()
          }),
          ...(request.contractData || {})
        }
      });

      console.log('飞书合同生成成功:', contract.id);

      return {
        success: true,
        contractId: contract.id,
        downloadUrl: generationResult.downloadUrl,
        buffer: generationResult.buffer
      };

    } catch (error) {
      console.error('飞书合同生成失败:', error);
      return {
        success: false,
        error: `合同生成失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 获取合同文档
   */
  async getContractDocument(contractId: string): Promise<{ success: boolean; buffer?: Buffer; error?: string }> {
    try {
      await this.initialize();
      
      const contract = await prisma.contract.findUnique({
        where: { id: contractId }
      });

      if (!contract) {
        return {
          success: false,
          error: '合同不存在'
        };
      }

      const metadata = JSON.parse(contract.metadata || '{}');
      
      if (!metadata.contractDocToken) {
        return {
          success: false,
          error: '合同文档令牌不存在'
        };
      }

      // 重新导出文档
      const client = getFeishuClient();
      const exportResult = await client.exportDocument(metadata.contractDocToken, 'docx');
      
      if (!exportResult.success) {
        return {
          success: false,
          error: exportResult.error
        };
      }

      // 等待导出完成
      // 这里需要实现等待逻辑，类似于 feishu-document-processor 中的实现
      
      return {
        success: true,
        buffer: Buffer.from('Mock contract document') // 临时返回
      };

    } catch (error) {
      console.error('获取合同文档失败:', error);
      return {
        success: false,
        error: `获取文档失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 列出所有飞书模板
   */
  async listTemplates(): Promise<FeishuTemplateInfo[]> {
    try {
      const templates = await prisma.template.findMany({
        where: {
          metadata: {
            contains: '"source":"feishu"'
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return templates.map(template => {
        const metadata = JSON.parse(template.metadata || '{}');
        const variables = JSON.parse(template.variables || '[]');

        return {
          id: template.id,
          name: template.name,
          docToken: metadata.docToken,
          variables,
          content: template.content,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt
        };
      });
    } catch (error) {
      console.error('列出模板失败:', error);
      return [];
    }
  }

  /**
   * 验证变量
   */
  private validateVariables(templateVariables: VariableInfo[], providedVariables: Record<string, string>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const templateVar of templateVariables) {
      if (templateVar.required && !providedVariables[templateVar.placeholder]) {
        errors.push(`缺少必需变量: ${templateVar.placeholder}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 删除模板
   */
  async deleteTemplate(templateId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await prisma.template.delete({
        where: { id: templateId }
      });

      return { success: true };
    } catch (error) {
      console.error('删除模板失败:', error);
      return {
        success: false,
        error: `删除失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 更新模板
   */
  async updateTemplate(templateId: string, updates: { name?: string; variables?: VariableInfo[] }): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {};
      
      if (updates.name) {
        updateData.name = updates.name;
      }
      
      if (updates.variables) {
        updateData.variables = JSON.stringify(updates.variables);
      }

      await prisma.template.update({
        where: { id: templateId },
        data: updateData
      });

      return { success: true };
    } catch (error) {
      console.error('更新模板失败:', error);
      return {
        success: false,
        error: `更新失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }
}

// 导出单例
export const feishuTemplateStorage = new FeishuTemplateStorage();
export type { FeishuTemplateInfo, ContractGenerationRequest, ContractGenerationResponse };
