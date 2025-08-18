/**
 * 模拟飞书API客户端
 * 用于演示和测试飞书文档API集成功能
 */

import { DocumentInfo } from './feishu-client';

// 模拟的文档导入结果
interface MockImportResult {
  success: boolean;
  error?: string;
  ticket?: string;
  jobId?: string;
}

// 模拟的文档导出结果
interface MockExportResult {
  success: boolean;
  error?: string;
  ticket?: string;
  fileToken?: string;
  downloadUrl?: string;
}

/**
 * 模拟飞书文档API客户端
 * 提供与真实API相同的接口，但使用模拟数据
 */
interface MockDocument {
  docToken: string;
  title: string;
  url: string;
  createTime: string;
  updateTime: string;
  content: string;
}

interface MockTicket {
  status: string;
  result?: MockDocument;
  downloadUrl?: string;
}

class MockFeishuDocumentClient {
  private mockDocuments: Map<string, MockDocument> = new Map();
  private mockTickets: Map<string, MockTicket> = new Map();

  constructor() {
    console.log('模拟飞书文档客户端初始化完成');
  }

  /**
   * 模拟导入文档到飞书
   */
  async importDocument(file: Buffer, fileName: string, fileType: string): Promise<MockImportResult> {
    try {
      console.log('模拟导入文档到飞书:', fileName, '类型:', fileType);

      // 模拟处理延迟
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 生成模拟ticket
      const ticket = `mock_import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 模拟文档信息
      const mockDoc = {
        docToken: `mock_doc_${Date.now()}`,
        title: fileName.replace(/\.[^/.]+$/, ''),
        url: `https://mock.feishu.cn/docs/${ticket}`,
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString(),
        content: this.extractMockContent(file, fileName)
      };

      // 存储模拟数据
      this.mockDocuments.set(mockDoc.docToken, mockDoc);
      this.mockTickets.set(ticket, {
        status: 'completed',
        result: mockDoc
      });

      console.log('模拟文档导入任务创建成功:', ticket);
      return {
        success: true,
        ticket: ticket
      };
    } catch (error) {
      console.error('模拟文档导入失败:', error);
      return {
        success: false,
        error: `导入失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 模拟查询导入任务状态
   */
  async getImportStatus(ticket: string): Promise<{ success: boolean; status?: string; result?: DocumentInfo; error?: string }> {
    try {
      console.log('模拟查询导入状态:', ticket);

      const mockTask = this.mockTickets.get(ticket);
      if (!mockTask) {
        return {
          success: false,
          error: '任务不存在'
        };
      }

      return {
        success: true,
        status: 'completed',
        result: mockTask.result
      };
    } catch (error) {
      console.error('模拟查询导入状态失败:', error);
      return {
        success: false,
        error: `查询失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 模拟获取文档内容
   */
  async getDocumentContent(docToken: string): Promise<{ success: boolean; content?: string; error?: string }> {
    try {
      console.log('模拟获取文档内容:', docToken);

      const mockDoc = this.mockDocuments.get(docToken);
      if (!mockDoc) {
        return {
          success: false,
          error: '文档不存在'
        };
      }

      return {
        success: true,
        content: mockDoc.content
      };
    } catch (error) {
      console.error('模拟获取文档内容失败:', error);
      return {
        success: false,
        error: `获取内容失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 模拟复制文档
   */
  async copyDocument(docToken: string, title: string): Promise<{ success: boolean; newDocToken?: string; error?: string }> {
    try {
      console.log('模拟复制文档:', docToken);

      const originalDoc = this.mockDocuments.get(docToken);
      if (!originalDoc) {
        return {
          success: false,
          error: '原文档不存在'
        };
      }

      // 创建新文档
      const newDocToken = `mock_doc_copy_${Date.now()}`;
      const newDoc = {
        ...originalDoc,
        docToken: newDocToken,
        title: title,
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString()
      };

      this.mockDocuments.set(newDocToken, newDoc);

      return {
        success: true,
        newDocToken: newDocToken
      };
    } catch (error) {
      console.error('模拟复制文档失败:', error);
      return {
        success: false,
        error: `复制失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 模拟导出文档
   */
  async exportDocument(docToken: string, format: 'docx' | 'pdf' = 'docx'): Promise<MockExportResult> {
    try {
      console.log('模拟开始导出文档:', docToken);

      const mockDoc = this.mockDocuments.get(docToken);
      if (!mockDoc) {
        return {
          success: false,
          error: '文档不存在'
        };
      }

      // 生成模拟导出ticket
      const ticket = `mock_export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 存储导出任务
      this.mockTickets.set(ticket, {
        status: 'completed',
        downloadUrl: `mock_download_${docToken}_${format}`
      });

      return {
        success: true,
        ticket: ticket
      };
    } catch (error) {
      console.error('模拟文档导出失败:', error);
      return {
        success: false,
        error: `导出失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 模拟查询导出任务状态
   */
  async getExportStatus(ticket: string): Promise<{ success: boolean; status?: string; downloadUrl?: string; error?: string }> {
    try {
      console.log('模拟查询导出状态:', ticket);

      const mockTask = this.mockTickets.get(ticket);
      if (!mockTask) {
        return {
          success: false,
          error: '任务不存在'
        };
      }

      return {
        success: true,
        status: 'completed',
        downloadUrl: mockTask.downloadUrl
      };
    } catch (error) {
      console.error('模拟查询导出状态失败:', error);
      return {
        success: false,
        error: `查询失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 提取模拟内容
   */
  private extractMockContent(file: Buffer, fileName: string): string {
    // 根据文件名生成模拟内容
    const baseContent = `
# ${fileName.replace(/\.[^/.]+$/, '')}

## 合同基本信息
- 甲方：[甲方名称]
- 乙方：[乙方名称]
- 合同金额：[合同金额]
- 签订日期：[签订日期]
- 签订地点：[签订地点]

## 第一条 合同目的
根据《中华人民共和国民法典》及有关法律、法规的规定，本着平等、自愿、诚实信用的原则，经双方友好协商，就相关事宜达成一致，签订本合同，以资共同遵守。

## 第二条 合同条款
2.1 本合同总价款为【合同金额】元。
2.2 甲方通过【银行转账】方式向乙方指定账户支付款项。
2.3 合同履行期限为【15】个工作日。

## 第三条 违约责任
3.1 甲方逾期支付款项的，每逾期一日按逾期未支付款金额的万分之二向乙方支付违约金。
3.2 乙方逾期交付的，每逾期一日按应交付金额的万分之二向甲方支付违约金。

## 第四条 争议解决
凡因本合同所发生的或与本合同有关的一切争议，由双方协商解决，协商不能解决的，应提交甲方所在地有管辖权的人民法院诉讼解决。

## 第五条 其他
5.1 本合同一式贰份，甲方执壹份，乙方执壹份，具有同等法律效力。
5.2 本合同自甲乙双方签字盖章之日起生效。

甲方（签字）：________________    乙方（签字）：________________

签订时间：${new Date().toLocaleDateString('zh-CN')}
`;

    return baseContent.trim();
  }

  /**
   * 模拟变量替换
   */
  async replaceVariables(docToken: string, variables: Record<string, string>): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('模拟变量替换:', docToken, Object.keys(variables).length);

      const mockDoc = this.mockDocuments.get(docToken);
      if (!mockDoc) {
        return {
          success: false,
          error: '文档不存在'
        };
      }

      // 模拟变量替换
      let content = mockDoc.content;
      for (const [placeholder, value] of Object.entries(variables)) {
        const regex = new RegExp(this.escapeRegExp(placeholder), 'g');
        content = content.replace(regex, value);
      }

      // 更新文档内容
      mockDoc.content = content;
      mockDoc.updateTime = new Date().toISOString();

      return { success: true };
    } catch (error) {
      console.error('模拟变量替换失败:', error);
      return {
        success: false,
        error: `变量替换失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 转义正则表达式特殊字符
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * 模拟下载文档
   */
  async downloadDocument(downloadUrl: string): Promise<{ success: boolean; buffer?: Buffer; error?: string }> {
    try {
      console.log('模拟下载文档:', downloadUrl);

      // 生成模拟Word文档内容
      const mockContent = `
模拟生成的Word文档内容

这是一个通过飞书API生成的模拟合同文档。
在实际应用中，这里将是完整的Word文档二进制内容。

生成时间: ${new Date().toLocaleString()}
下载链接: ${downloadUrl}
`;

      const buffer = Buffer.from(mockContent, 'utf8');

      return {
        success: true,
        buffer: buffer
      };
    } catch (error) {
      console.error('模拟文档下载失败:', error);
      return {
        success: false,
        error: `下载失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }
}

// 导出模拟客户端
export const mockFeishuClient = new MockFeishuDocumentClient();
export type { MockImportResult, MockExportResult };
