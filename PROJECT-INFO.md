# 智能合同管理系统 - 项目信息

## 📊 项目概览

**项目名称**: 智能合同管理系统  
**技术栈**: Next.js 15 + Vercel全栈解决方案  
**开发状态**: 核心架构完成，基础功能实现  
**最后更新**: 2025年1月

## 🏗️ 架构信息

### 技术栈详情
- **前端框架**: Next.js 15 + React 19 + TypeScript
- **样式系统**: Tailwind CSS + Shadcn/ui组件库
- **数据库**: Vercel Postgres + Prisma ORM
- **文件存储**: Vercel Blob Storage
- **AI服务**: Google Gemini API
- **部署平台**: Vercel

### 项目结构
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API路由
│   │   ├── categories/    # 合同分类API
│   │   ├── templates/     # 合同模板API
│   │   └── upload/        # 文件上传API
│   ├── templates/         # 模板管理页面
│   └── ...
├── components/            # React组件
│   ├── ui/               # 基础UI组件
│   └── ...
├── lib/                  # 核心库
│   ├── database.ts       # Prisma数据库客户端
│   ├── blob-storage.ts   # Vercel Blob存储
│   └── gemini.ts         # Gemini AI集成
├── types/                # TypeScript类型
└── utils/                # 工具函数
```

## 🔧 环境配置

### 必需的环境变量
```env
# Vercel Postgres数据库
POSTGRES_URL="postgres://..."
POSTGRES_PRISMA_URL="postgres://...?pgbouncer=true&connect_timeout=15"
POSTGRES_URL_NO_SSL="postgres://..."
POSTGRES_URL_NON_POOLING="postgres://..."

# Vercel Blob存储
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."

# Google Gemini AI (已配置)
GOOGLE_GEMINI_API_KEY=AIzaSyBtw7WLw0Lf749k0j5yeKJpjz1AfWgDsuA

# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MAX_FILE_SIZE=10
```

## 📋 数据库模型

### 核心表结构
1. **contract_categories** - 合同分类
2. **contract_templates** - 合同模板
3. **contract_variables** - 合同变量
4. **generated_contracts** - 生成的合同
5. **chat_sessions** - 聊天会话
6. **chat_messages** - 聊天消息

### 初始化命令
```bash
npm run db:generate  # 生成Prisma客户端
npm run db:push      # 推送数据库模式
npm run db:seed      # 运行种子数据
```

## ✅ 已实现功能

### 1. 基础架构
- [x] Next.js项目搭建
- [x] Vercel Postgres集成
- [x] Vercel Blob存储集成
- [x] Prisma ORM配置
- [x] TypeScript类型系统

### 2. 核心功能
- [x] 合同分类管理
- [x] 合同模板上传
- [x] 文件存储管理
- [x] AI模板分析（Gemini集成）
- [x] 基础UI组件库

### 3. API接口
- [x] `/api/categories` - 分类管理
- [x] `/api/templates` - 模板管理
- [x] `/api/upload` - 文件上传
- [x] `/api/templates/analyze` - AI分析

## 🚧 待开发功能

### 优先级1 - 核心功能
- [ ] AI变量识别完善
- [ ] 表单式合同生成
- [ ] 合同内容预览
- [ ] PDF导出功能

### 优先级2 - 高级功能
- [ ] 对话式合同生成
- [ ] 聊天机器人界面
- [ ] 智能问答系统
- [ ] 合同模板编辑器

### 优先级3 - 增强功能
- [ ] 用户认证系统
- [ ] 合同版本管理
- [ ] 批量处理功能
- [ ] 数据分析面板

## 🚀 部署指南

### 1. Vercel部署
1. 在GitHub上创建仓库并推送代码
2. 在Vercel中导入GitHub仓库
3. 配置环境变量
4. 自动部署

### 2. 数据库设置
1. 在Vercel中创建Postgres数据库
2. 复制连接字符串到环境变量
3. 运行数据库迁移

### 3. 存储设置
1. 在Vercel中创建Blob存储
2. 复制访问令牌到环境变量

## 📞 技术支持

### 文档位置
- 数据库设置: `database/README.md`
- API文档: 各API路由文件中的注释
- 组件文档: 组件文件中的JSDoc注释

### 常用命令
```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run db:studio    # 打开数据库管理界面
npm run lint         # 代码检查
```

## 📈 项目统计

- **总文件数**: 20+ 核心文件
- **代码行数**: 4000+ 行
- **组件数量**: 10+ UI组件
- **API路由**: 4个主要接口
- **数据模型**: 6个核心模型

---

**最后更新**: 2025年1月  
**版本**: v1.0.0-beta  
**状态**: 开发中
