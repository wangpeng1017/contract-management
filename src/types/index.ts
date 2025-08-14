// 从Prisma导入生成的类型
export type {
  ContractTemplate,
  ContractVariable,
  ContractCategory,
  GeneratedContract,
  ChatSession,
  ChatMessage
} from '@prisma/client';

// 扩展的合同模板类型（包含关联数据）
export interface ContractTemplateWithRelations {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;
  filePath: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  status: string;
  variablesExtracted: boolean;
  createdAt: Date;
  updatedAt: Date;
  category?: ContractCategory;
  variables: ContractVariable[];
  generatedContracts?: GeneratedContract[];
}

// 扩展的聊天会话类型（包含关联数据）
export interface ChatSessionWithMessages {
  id: string;
  templateId?: string;
  collectedVariables: any;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  messages: ChatMessage[];
}

// 变量类型枚举
export enum VariableType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  EMAIL = 'email',
  PHONE = 'phone',
  ADDRESS = 'address',
  CURRENCY = 'currency',
  PERCENTAGE = 'percentage',
  SELECT = 'select',
  TEXTAREA = 'textarea'
}

// 合同状态枚举
export enum ContractStatus {
  DRAFT = 'draft',
  COMPLETED = 'completed',
  DOWNLOADED = 'downloaded'
}

// 模板状态枚举
export enum TemplateStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PROCESSING = 'processing'
}

// 聊天会话状态枚举
export enum ChatSessionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 文件上传类型
export interface FileUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

// Gemini API响应类型
export interface GeminiAnalysisResult {
  variables: {
    name: string;
    type: VariableType;
    description: string;
    required: boolean;
    placeholder?: string;
  }[];
  confidence: number;
  suggestions?: string[];
}
