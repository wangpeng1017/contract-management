/**
 * 测试相关的TypeScript类型定义
 */

// 基础测试结果接口
export interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: Record<string, unknown>;
}

// 测试摘要接口
export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  warnings: number;
}

// 飞书集成测试结果
export interface FeishuIntegrationTestResult {
  success: boolean;
  status: 'success' | 'error' | 'warning';
  message: string;
  results: {
    timestamp: string;
    tests: TestResult[];
  };
  summary: TestSummary;
}

// 合同生成结果
export interface ContractGenerationResult {
  success: boolean;
  contractId?: string;
  downloadUrl?: string;
  error?: string;
  data?: {
    contractId: string;
    downloadUrl: string;
    testVariables?: Record<string, string>;
    processingTime?: string;
  };
}

// 文件上传结果
export interface FileUploadResult {
  success: boolean;
  error?: string;
  details?: {
    message: string;
  };
  data?: {
    pathname: string;
    filename: string;
    size: number;
    type: string;
  };
}

// Blob存储测试结果
export interface BlobStorageTestResult {
  success: boolean;
  error?: string;
  details?: {
    message: string;
  };
  uploadResult?: FileUploadResult;
  officialApiResult?: FileUploadResult;
}

// 模板变量接口
export interface TemplateVariable {
  id: string;
  name: string;
  type: string;
  description?: string;
  defaultValue?: string;
  required: boolean;
  orderIndex: number;
}

// 模板接口
export interface Template {
  id: string;
  name: string;
  description?: string;
  filePath: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  status: string;
  variablesExtracted: boolean;
  createdAt: string;
  updatedAt: string;
  variables: TemplateVariable[];
}

// 端到端测试结果
export interface E2ETestResult {
  testCase: string;
  success: boolean;
  error?: string;
  timestamp: string;
  overallScore?: number;
  results?: {
    contractGeneration: ContractGenerationResult;
    formatFidelity: FormatFidelityResult[];
  };
  summary?: {
    variablesProcessed: number;
    expectedVariables: number;
    fidelityScore: number;
    allChecksPass: boolean;
  };
  recommendations?: string[];
}

// 格式保真度检查结果
export interface FormatFidelityResult {
  name: string;
  description: string;
  passed: boolean;
  score: number;
  details: string;
}

// 测试用例验证结果
export interface TestCaseValidationResult {
  valid: boolean;
  errors: string[];
}

// 端到端测试摘要
export interface E2ETestSummary {
  total: number;
  passed: number;
  failed: number;
  passRate: number;
  averageFidelityScore: number;
  status: 'success' | 'partial' | 'failed';
}

// React组件状态类型
export interface ComponentState {
  testing: boolean;
  uploading: boolean;
  results: BlobStorageTestResult | null;
  uploadResult: BlobStorageTestResult | null;
}

// API响应基础类型
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
  details?: Record<string, unknown>;
}

// 飞书API响应类型
export interface FeishuApiResponse extends ApiResponse {
  feishuDocument?: {
    id: string;
    url: string;
    title: string;
  };
  isFeishuIntegration?: boolean;
}
