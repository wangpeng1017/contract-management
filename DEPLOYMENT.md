# 智能合同管理系统 - 部署指南

## 🚀 Vercel部署指南

### 前置要求

1. **GitHub仓库**: 确保代码已推送到GitHub
2. **Vercel账户**: 注册并登录 [Vercel](https://vercel.com)
3. **数据库**: 准备Prisma Accelerate或Vercel Postgres数据库
4. **存储服务**: 准备Vercel Blob存储
5. **AI服务**: 获取Google Gemini API密钥

### 步骤1: 导入项目到Vercel

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 选择 "Import Git Repository"
4. 选择您的GitHub仓库：`wangpeng1017/contract-management`
5. 配置项目设置：
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 步骤2: 配置环境变量

在Vercel项目设置中添加以下环境变量：

#### 数据库配置
```
POSTGRES_URL=postgres://username:password@hostname:port/database?sslmode=require
PRISMA_DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=your_api_key
DATABASE_URL=postgres://username:password@hostname:port/database?sslmode=require
```

#### 存储配置
```
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_your_token
```

#### AI服务配置
```
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
```

#### 应用配置
```
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_APP_NAME=智能合同管理系统
NEXT_PUBLIC_MAX_FILE_SIZE=10
NEXT_PUBLIC_ALLOWED_FILE_TYPES=application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,application/pdf
```

### 步骤3: 配置数据库

#### 选项A: 使用Vercel Postgres

1. 在Vercel项目中，转到 "Storage" 标签
2. 点击 "Create Database"
3. 选择 "Postgres"
4. 创建数据库并复制连接字符串
5. 将连接字符串添加到环境变量

#### 选项B: 使用Prisma Accelerate

1. 访问 [Prisma Data Platform](https://cloud.prisma.io/)
2. 创建项目并配置Accelerate
3. 获取Accelerate连接字符串
4. 将连接字符串添加到环境变量

### 步骤4: 配置Vercel Blob存储

1. 在Vercel项目中，转到 "Storage" 标签
2. 点击 "Create Database"
3. 选择 "Blob"
4. 创建存储并复制访问令牌
5. 将令牌添加到环境变量

### 步骤5: 部署和初始化

1. 点击 "Deploy" 开始部署
2. 部署完成后，在Vercel项目设置中运行以下命令：

```bash
# 生成Prisma客户端
npx prisma generate

# 推送数据库模式
npx prisma db push

# 运行种子数据
npx prisma db seed
```

### 步骤6: 验证部署

1. 访问部署的应用URL
2. 测试以下功能：
   - 主页加载
   - 模板管理页面
   - 功能测试页面
   - API接口响应

## 🔧 本地开发环境

### 安装依赖

```bash
npm install
```

### 配置环境变量

```bash
cp .env.example .env.local
# 编辑 .env.local 文件，填入实际配置
```

### 初始化数据库

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 📋 部署检查清单

- [ ] GitHub仓库代码最新
- [ ] Vercel项目创建成功
- [ ] 所有环境变量配置完成
- [ ] 数据库连接正常
- [ ] Blob存储配置正确
- [ ] Gemini API密钥有效
- [ ] 数据库模式推送成功
- [ ] 种子数据运行成功
- [ ] 应用访问正常
- [ ] 核心功能测试通过

## 🚨 常见问题

### 数据库连接失败
- 检查数据库URL格式是否正确
- 确认数据库服务是否运行
- 验证网络连接和防火墙设置

### 文件上传失败
- 检查Blob存储令牌是否正确
- 确认文件大小和类型限制
- 验证存储桶权限设置

### AI分析失败
- 检查Gemini API密钥是否有效
- 确认API配额是否充足
- 验证网络连接到Google服务

## 📞 技术支持

如遇到部署问题，请：

1. 检查Vercel部署日志
2. 查看浏览器控制台错误
3. 参考项目文档：`README.md`
4. 查看数据库配置：`database/README.md`

---

**最后更新**: 2025年1月14日  
**适用版本**: v1.0.0-rc
