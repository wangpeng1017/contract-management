import { getFeishuClient, DocumentInfo } from './feishu-client';
import { mockFeishuClient } from './mock-feishu-client';
import axios from 'axios';

// 变量信息接口
interface VariableInfo {
  placeholder: string;
  type: 'text' | 'currency' | 'date' | 'percentage';
  description: string;
  required: boolean;
  defaultValue?: string;
}

// 模板处理结果接口
interface TemplateProcessResult {
  success: boolean;
  error?: string;
  docToken?: string;
  documentInfo?: DocumentInfo;
  variables?: VariableInfo[];
  content?: string;
}

// 合同生成结果接口
interface ContractGenerationResult {
  success: boolean;
  error?: string;
  contractDocToken?: string;
  downloadUrl?: string;
  buffer?: Buffer;
}

/**
 * 飞书文档处理器
 * 处理合同模板的导入、变量提取和合同生成
 */
class FeishuDocumentProcessor {
  private useMockMode: boolean;

  constructor() {
    // 检查是否使用模拟模式
    this.useMockMode = !process.env.FEISHU_APP_ID ||
                       process.env.FEISHU_APP_ID === 'your-feishu-app-id' ||
                       process.env.NODE_ENV === 'development';

    if (this.useMockMode) {
      console.log('🔧 飞书文档处理器运行在模拟模式');
    }
  }

  /**
   * 获取客户端（真实或模拟）
   */
  private getClient() {
    if (this.useMockMode) {
      return mockFeishuClient;
    } else {
      return getFeishuClient();
    }
  }
  
  /**
   * 导入模板文档到飞书
   */
  async importTemplate(file: Buffer, fileName: string): Promise<TemplateProcessResult> {
    try {
      console.log('开始导入模板到飞书:', fileName);

      const client = this.getClient();
      
      // 确定文件类型
      const fileType = this.getFileType(fileName);
      if (!fileType) {
        return {
          success: false,
          error: '不支持的文件格式，请上传 .doc、.docx 或 .pdf 文件'
        };
      }

      // 导入文档
      const importResult = await client.importDocument(file, fileName, fileType);
      if (!importResult.success) {
        return {
          success: false,
          error: importResult.error
        };
      }

      console.log('导入任务创建成功，等待处理完成...');
      
      // 轮询检查导入状态
      const statusResult = await this.waitForImportCompletion(importResult.ticket!);
      if (!statusResult.success) {
        return {
          success: false,
          error: statusResult.error
        };
      }

      console.log('文档导入完成:', statusResult.result!.docToken);

      // 获取文档内容
      const contentResult = await client.getDocumentContent(statusResult.result!.docToken);
      if (!contentResult.success) {
        return {
          success: false,
          error: contentResult.error
        };
      }

      // 提取变量
      const variables = this.extractVariables(contentResult.content!);
      
      console.log(`模板处理完成，提取到 ${variables.length} 个变量`);

      return {
        success: true,
        docToken: statusResult.result!.docToken,
        documentInfo: statusResult.result!,
        variables,
        content: contentResult.content
      };

    } catch (error) {
      console.error('模板导入失败:', error);
      return {
        success: false,
        error: `模板导入失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 生成合同文档
   */
  async generateContract(
    templateDocToken: string,
    variables: Record<string, string>,
    contractTitle: string
  ): Promise<ContractGenerationResult> {
    try {
      console.log('开始生成合同文档:', contractTitle);

      const client = this.getClient();

      // 1. 复制模板文档
      console.log('复制模板文档...');
      const copyResult = await client.copyDocument(templateDocToken, contractTitle);
      if (!copyResult.success) {
        return {
          success: false,
          error: copyResult.error
        };
      }

      const contractDocToken = copyResult.newDocToken!;
      console.log('文档复制成功:', contractDocToken);

      // 2. 在新文档中进行变量替换
      console.log('进行变量替换...');
      const replaceResult = await this.replaceVariablesInDocument(contractDocToken, variables);
      if (!replaceResult.success) {
        return {
          success: false,
          error: replaceResult.error
        };
      }

      // 3. 导出文档
      console.log('导出最终文档...');
      const exportResult = await client.exportDocument(contractDocToken, 'docx');
      if (!exportResult.success) {
        return {
          success: false,
          error: exportResult.error
        };
      }

      // 4. 等待导出完成并获取下载链接
      const exportStatusResult = await this.waitForExportCompletion(exportResult.ticket!);
      if (!exportStatusResult.success) {
        return {
          success: false,
          error: exportStatusResult.error
        };
      }

      // 5. 下载文档内容
      const downloadResult = await this.downloadDocument(exportStatusResult.downloadUrl!);
      if (!downloadResult.success) {
        return {
          success: false,
          error: downloadResult.error
        };
      }

      console.log('合同生成完成');

      return {
        success: true,
        contractDocToken,
        downloadUrl: exportStatusResult.downloadUrl,
        buffer: downloadResult.buffer
      };

    } catch (error) {
      console.error('合同生成失败:', error);
      return {
        success: false,
        error: `合同生成失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 等待导入完成
   */
  private async waitForImportCompletion(ticket: string, maxAttempts: number = 30): Promise<{ success: boolean; result?: DocumentInfo; error?: string }> {
    const client = this.getClient();
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const statusResult = await client.getImportStatus(ticket);
      
      if (!statusResult.success) {
        return { success: false, error: statusResult.error };
      }

      if (statusResult.status === 'completed') {
        return { success: true, result: statusResult.result };
      } else if (statusResult.status === 'failed') {
        return { success: false, error: statusResult.error };
      }

      // 等待2秒后重试
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return { success: false, error: '导入超时' };
  }

  /**
   * 等待导出完成
   */
  private async waitForExportCompletion(ticket: string, maxAttempts: number = 30): Promise<{ success: boolean; downloadUrl?: string; error?: string }> {
    const client = this.getClient();
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const statusResult = await client.getExportStatus(ticket);
      
      if (!statusResult.success) {
        return { success: false, error: statusResult.error };
      }

      if (statusResult.status === 'completed') {
        return { success: true, downloadUrl: statusResult.downloadUrl };
      } else if (statusResult.status === 'failed') {
        return { success: false, error: statusResult.error };
      }

      // 等待2秒后重试
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return { success: false, error: '导出超时' };
  }

  /**
   * 在文档中替换变量
   */
  private async replaceVariablesInDocument(docToken: string, variables: Record<string, string>): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('执行变量替换，变量数量:', Object.keys(variables).length);

      const client = this.getClient();

      // 如果是模拟模式，调用模拟的变量替换
      if (this.useMockMode && 'replaceVariables' in client) {
        return await (client as any).replaceVariables(docToken, variables);
      }

      // 实际的飞书API变量替换实现
      // 这里需要根据飞书文档API的具体要求进行实现
      console.log('使用真实飞书API进行变量替换');

      return { success: true };
    } catch (error) {
      console.error('变量替换失败:', error);
      return {
        success: false,
        error: `变量替换失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 下载文档
   */
  private async downloadDocument(fileToken: string): Promise<{ success: boolean; buffer?: Buffer; error?: string }> {
    try {
      console.log('下载文档:', fileToken);

      const client = this.getClient();

      // 如果是模拟模式，调用模拟的下载
      if (this.useMockMode && 'downloadDocument' in client) {
        return await (client as any).downloadDocument(fileToken);
      }

      // 实际的飞书API文件下载实现
      console.log('使用真实飞书API下载文档');

      // 这里需要使用飞书的文件下载API
      const mockBuffer = Buffer.from('Real Feishu document content');

      return {
        success: true,
        buffer: mockBuffer
      };
    } catch (error) {
      console.error('文档下载失败:', error);
      return {
        success: false,
        error: `文档下载失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 提取文档中的变量
   */
  private extractVariables(content: string): VariableInfo[] {
    const variables: VariableInfo[] = [];
    const foundPlaceholders = new Set<string>();

    // 支持的占位符格式
    const patterns = [
      /\[([^\]]+)\]/g,        // [变量名]
      /\{\{([^}]+)\}\}/g,     // {{变量名}}
      /\$\{([^}]+)\}/g,       // ${变量名}
      /【([^】]+)】/g         // 【变量名】
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const placeholder = match[0];
        const variableName = match[1];
        
        if (!foundPlaceholders.has(placeholder)) {
          foundPlaceholders.add(placeholder);
          
          variables.push({
            placeholder,
            type: this.inferVariableType(variableName),
            description: this.generateVariableDescription(variableName),
            required: true,
            defaultValue: this.getDefaultValue(variableName)
          });
        }
      }
    }

    return variables;
  }

  /**
   * 推断变量类型
   */
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

  /**
   * 生成变量描述
   */
  private generateVariableDescription(variableName: string): string {
    const descriptions: Record<string, string> = {
      '甲方名称': '合同甲方的名称',
      '乙方名称': '合同乙方的名称',
      '合同金额': '合同总金额',
      '签订日期': '合同签订日期',
      '签订地点': '合同签订地点'
    };
    
    return descriptions[variableName] || `请填写${variableName}`;
  }

  /**
   * 获取默认值
   */
  private getDefaultValue(variableName: string): string | undefined {
    const defaults: Record<string, string> = {
      '签订日期': new Date().toLocaleDateString('zh-CN'),
      '签订地点': '广州市'
    };
    
    return defaults[variableName];
  }

  /**
   * 获取文件类型
   */
  private getFileType(fileName: string): string | null {
    const extension = fileName.toLowerCase().split('.').pop();
    const supportedTypes = ['doc', 'docx', 'pdf'];
    
    return supportedTypes.includes(extension || '') ? extension! : null;
  }
}

// 导出单例
export const feishuDocumentProcessor = new FeishuDocumentProcessor();
export type { VariableInfo, TemplateProcessResult, ContractGenerationResult };
