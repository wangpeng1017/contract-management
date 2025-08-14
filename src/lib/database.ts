import { PrismaClient } from '@prisma/client';

// 全局Prisma客户端实例
declare global {
  var prisma: PrismaClient | undefined;
}

// 创建Prisma客户端实例，优化Vercel部署
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL,
      },
    },
  });
};

export const prisma = globalThis.prisma || createPrismaClient();

// 在开发环境中避免热重载时创建多个实例
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// 确保在Vercel环境中正确关闭连接
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

// 数据库表名常量（保持向后兼容）
export const TABLES = {
  CONTRACT_TEMPLATES: 'contract_templates',
  CONTRACT_VARIABLES: 'contract_variables',
  GENERATED_CONTRACTS: 'generated_contracts',
  CONTRACT_CATEGORIES: 'contract_categories',
  CHAT_SESSIONS: 'chat_sessions',
  CHAT_MESSAGES: 'chat_messages'
} as const;

// Vercel Blob存储常量
export const BLOB_CONTAINERS = {
  TEMPLATES: 'contract-templates',
  GENERATED: 'generated-contracts'
} as const;
