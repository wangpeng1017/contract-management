#!/usr/bin/env node

/**
 * 检查Prisma客户端是否正确生成
 * 用于Vercel构建过程中的验证
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 检查Prisma客户端生成状态...');

// 检查Prisma客户端文件是否存在
const prismaClientPath = path.join(process.cwd(), 'node_modules', '.prisma', 'client');
const prismaIndexPath = path.join(prismaClientPath, 'index.js');

if (!fs.existsSync(prismaClientPath)) {
  console.error('❌ Prisma客户端目录不存在:', prismaClientPath);
  process.exit(1);
}

if (!fs.existsSync(prismaIndexPath)) {
  console.error('❌ Prisma客户端入口文件不存在:', prismaIndexPath);
  process.exit(1);
}

console.log('✅ Prisma客户端文件存在');

// 尝试导入Prisma客户端
try {
  const { PrismaClient } = require('@prisma/client');
  console.log('✅ Prisma客户端可以正常导入');
  
  // 创建客户端实例（不连接数据库）
  const prisma = new PrismaClient();
  console.log('✅ Prisma客户端实例创建成功');
  
  console.log('🎉 Prisma客户端检查通过！');
} catch (error) {
  console.error('❌ Prisma客户端导入失败:', error.message);
  process.exit(1);
}
