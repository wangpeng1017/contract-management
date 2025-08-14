#!/bin/bash

# Vercel构建脚本 - 确保Prisma客户端正确生成

echo "🔧 开始构建智能合同管理系统..."

# 检查环境变量
if [ -z "$DATABASE_URL" ] && [ -z "$PRISMA_DATABASE_URL" ]; then
  echo "⚠️  警告: 未找到数据库连接URL环境变量"
fi

# 生成Prisma客户端
echo "📦 生成Prisma客户端..."
npx prisma generate

# 检查Prisma客户端是否生成成功
if [ $? -eq 0 ]; then
  echo "✅ Prisma客户端生成成功"
else
  echo "❌ Prisma客户端生成失败"
  exit 1
fi

# 运行Next.js构建
echo "🏗️  开始Next.js构建..."
npx next build

# 检查构建是否成功
if [ $? -eq 0 ]; then
  echo "🎉 构建完成！"
else
  echo "❌ 构建失败"
  exit 1
fi
