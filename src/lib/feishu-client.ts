import { Client } from '@larksuiteoapi/node-sdk';
import axios from 'axios';
import FormData from 'form-data';

// 飞书API配置接口
interface FeishuConfig {
  appId: string;
  appSecret: string;
  baseUrl?: string;
}

// 文档导入结果接口
interface ImportResult {
  success: boolean;
  error?: string;
  ticket?: string;
  jobId?: string;
}

// 文档导出结果接口
interface ExportResult {
  success: boolean;
  error?: string;
  ticket?: string;
  fileToken?: string;
  downloadUrl?: string;
}

// 文档信息接口
interface DocumentInfo {
  docToken: string;
  title: string;
  url: string;
  createTime: string;
  updateTime: string;
}

/**
 * 飞书文档API客户端
 * 处理合同模板的导入、处理和导出
 */
class FeishuDocumentClient {
  private client: Client;
  private config: FeishuConfig;
  private accessToken: string | null = null;
  private tokenExpireTime: number = 0;

  constructor(config: FeishuConfig) {
    this.config = {
      baseUrl: 'https://open.feishu.cn',
      ...config
    };

    // 初始化飞书SDK客户端
    this.client = new Client({
      appId: this.config.appId,
      appSecret: this.config.appSecret,
      domain: this.config.baseUrl
    });

    console.log('飞书文档客户端初始化完成');
  }

  /**
   * 获取访问令牌
   */
  private async getAccessToken(): Promise<string> {
    try {
      // 检查token是否过期
      if (this.accessToken && Date.now() < this.tokenExpireTime) {
        return this.accessToken;
      }

      console.log('获取飞书访问令牌...');
      
      const response = await axios.post(`${this.config.baseUrl}/open-apis/auth/v3/tenant_access_token/internal`, {
        app_id: this.config.appId,
        app_secret: this.config.appSecret
      });

      if (response.data.code === 0) {
        this.accessToken = response.data.tenant_access_token;
        // 设置过期时间（提前5分钟刷新）
        this.tokenExpireTime = Date.now() + (response.data.expire - 300) * 1000;
        
        console.log('访问令牌获取成功');
        return this.accessToken;
      } else {
        throw new Error(`获取访问令牌失败: ${response.data.msg}`);
      }
    } catch (error) {
      console.error('获取访问令牌失败:', error);
      throw new Error(`访问令牌获取失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 导入文档到飞书
   */
  async importDocument(file: Buffer, fileName: string, fileType: string): Promise<ImportResult> {
    try {
      console.log('开始导入文档到飞书:', fileName);

      const token = await this.getAccessToken();
      
      // 创建FormData
      const formData = new FormData();
      formData.append('file', file, {
        filename: fileName,
        contentType: this.getContentType(fileType)
      });
      formData.append('file_name', fileName);
      formData.append('type', 'docx'); // 目标格式

      // 发送导入请求
      const response = await axios.post(
        `${this.config.baseUrl}/open-apis/drive/v1/import_tasks`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            ...formData.getHeaders()
          }
        }
      );

      if (response.data.code === 0) {
        console.log('文档导入任务创建成功:', response.data.data.ticket);
        return {
          success: true,
          ticket: response.data.data.ticket
        };
      } else {
        throw new Error(`导入失败: ${response.data.msg}`);
      }
    } catch (error) {
      console.error('文档导入失败:', error);
      return {
        success: false,
        error: `导入失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 查询导入任务状态
   */
  async getImportStatus(ticket: string): Promise<{ success: boolean; status?: string; result?: DocumentInfo; error?: string }> {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(
        `${this.config.baseUrl}/open-apis/drive/v1/import_tasks/${ticket}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.code === 0) {
        const task = response.data.data;
        
        if (task.job_status === 0) {
          return { success: true, status: 'pending' };
        } else if (task.job_status === 1) {
          return { success: true, status: 'processing' };
        } else if (task.job_status === 2) {
          // 导入成功
          return {
            success: true,
            status: 'completed',
            result: {
              docToken: task.job_result.token,
              title: task.job_result.name,
              url: task.job_result.url,
              createTime: new Date().toISOString(),
              updateTime: new Date().toISOString()
            }
          };
        } else {
          return {
            success: false,
            error: `导入失败: ${task.job_error_msg || '未知错误'}`
          };
        }
      } else {
        throw new Error(`查询失败: ${response.data.msg}`);
      }
    } catch (error) {
      console.error('查询导入状态失败:', error);
      return {
        success: false,
        error: `查询失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 获取文档内容
   */
  async getDocumentContent(docToken: string): Promise<{ success: boolean; content?: string; error?: string }> {
    try {
      console.log('获取文档内容:', docToken);
      
      const token = await this.getAccessToken();
      
      const response = await axios.get(
        `${this.config.baseUrl}/open-apis/docx/v1/documents/${docToken}/raw_content`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.code === 0) {
        return {
          success: true,
          content: response.data.data.content
        };
      } else {
        throw new Error(`获取内容失败: ${response.data.msg}`);
      }
    } catch (error) {
      console.error('获取文档内容失败:', error);
      return {
        success: false,
        error: `获取内容失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 复制文档
   */
  async copyDocument(docToken: string, title: string): Promise<{ success: boolean; newDocToken?: string; error?: string }> {
    try {
      console.log('复制文档:', docToken);
      
      const token = await this.getAccessToken();
      
      const response = await axios.post(
        `${this.config.baseUrl}/open-apis/drive/v1/files/${docToken}/copy`,
        {
          name: title,
          type: 'docx'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.code === 0) {
        return {
          success: true,
          newDocToken: response.data.data.file.token
        };
      } else {
        throw new Error(`复制失败: ${response.data.msg}`);
      }
    } catch (error) {
      console.error('复制文档失败:', error);
      return {
        success: false,
        error: `复制失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 导出文档
   */
  async exportDocument(docToken: string, format: 'docx' | 'pdf' = 'docx'): Promise<ExportResult> {
    try {
      console.log('开始导出文档:', docToken);
      
      const token = await this.getAccessToken();
      
      const response = await axios.post(
        `${this.config.baseUrl}/open-apis/drive/v1/export_tasks`,
        {
          file_extension: format,
          token: docToken,
          type: 'docx'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.code === 0) {
        return {
          success: true,
          ticket: response.data.data.ticket
        };
      } else {
        throw new Error(`导出失败: ${response.data.msg}`);
      }
    } catch (error) {
      console.error('文档导出失败:', error);
      return {
        success: false,
        error: `导出失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 查询导出任务状态
   */
  async getExportStatus(ticket: string): Promise<{ success: boolean; status?: string; downloadUrl?: string; error?: string }> {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(
        `${this.config.baseUrl}/open-apis/drive/v1/export_tasks/${ticket}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.code === 0) {
        const task = response.data.data;
        
        if (task.job_status === 0) {
          return { success: true, status: 'pending' };
        } else if (task.job_status === 1) {
          return { success: true, status: 'processing' };
        } else if (task.job_status === 2) {
          return {
            success: true,
            status: 'completed',
            downloadUrl: task.job_result.file_token
          };
        } else {
          return {
            success: false,
            error: `导出失败: ${task.job_error_msg || '未知错误'}`
          };
        }
      } else {
        throw new Error(`查询失败: ${response.data.msg}`);
      }
    } catch (error) {
      console.error('查询导出状态失败:', error);
      return {
        success: false,
        error: `查询失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 获取文件类型对应的Content-Type
   */
  private getContentType(fileType: string): string {
    const contentTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    
    return contentTypes[fileType.toLowerCase()] || 'application/octet-stream';
  }
}

// 导出单例（需要配置后才能使用）
let feishuClient: FeishuDocumentClient | null = null;

export const initFeishuClient = (config: FeishuConfig): FeishuDocumentClient => {
  feishuClient = new FeishuDocumentClient(config);
  return feishuClient;
};

export const getFeishuClient = (): FeishuDocumentClient => {
  if (!feishuClient) {
    throw new Error('飞书客户端未初始化，请先调用 initFeishuClient');
  }
  return feishuClient;
};

export type { FeishuConfig, ImportResult, ExportResult, DocumentInfo };
