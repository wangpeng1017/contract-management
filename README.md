# 智能合同管理系统

基于AI技术的智能合同管理平台，支持合同模板管理、智能变量识别、表单式合同生成和PDF导出。

## 🚀 功能特性

- **📄 合同模板管理**: 上传和管理各类合同模板，支持分类整理 ✅
- **🤖 AI智能识别**: 基于Google Gemini AI自动识别合同变量字段 ✅
- **📝 表单式生成**: 根据模板变量动态生成表单，快速填写合同 ✅
- **👁️ 实时预览**: 支持合同内容的实时预览和编辑 ✅
- **📥 PDF导出**: 一键导出专业格式的PDF合同文档 ✅
- **🧪 功能测试**: 完整的系统功能测试和验证 ✅
- **💬 对话式生成**: 创新的聊天机器人界面（开发中）

## 🛠️ 技术栈

- **前端**: Next.js 15 + React 19 + TypeScript
- **样式**: Tailwind CSS + Shadcn/ui
- **数据库**: Vercel Postgres + Prisma ORM
- **文件存储**: Vercel Blob Storage
- **AI服务**: Google Gemini API
- **部署**: Vercel Platform

## 📦 安装和设置

### 1. 克隆项目

```bash
git clone <repository-url>
cd contract-management
```

### 2. 安装依赖

```bash
npm install
```

### 3. 环境配置

复制环境变量模板：

```bash
cp .env.local.example .env.local
```

配置以下环境变量：

```env
# Prisma数据库配置（支持Prisma Accelerate）
POSTGRES_URL="postgres://username:password@hostname:port/database"
PRISMA_DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=your_api_key"
DATABASE_URL="postgres://username:password@hostname:port/database"

# Vercel Blob存储配置
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_your_token"

# Google Gemini AI配置
GOOGLE_GEMINI_API_KEY="your_gemini_api_key"

# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MAX_FILE_SIZE=10
NEXT_PUBLIC_ALLOWED_FILE_TYPES=application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

### 4. 数据库设置

```bash
# 生成Prisma客户端
npm run db:generate

# 推送数据库模式
npm run db:push

# 运行种子数据
npm run db:seed
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📚 项目结构

```
contract-management/
├── src/
│   ├── app/                 # Next.js App Router页面
│   │   ├── api/            # API路由
│   │   │   ├── categories/ # 分类管理API
│   │   │   ├── templates/  # 模板管理API
│   │   │   ├── contracts/  # 合同生成API
│   │   │   └── upload/     # 文件上传API
│   │   ├── templates/      # 模板管理页面
│   │   ├── generate/       # 合同生成页面
│   │   ├── test/          # 功能测试页面
│   │   └── ...
│   ├── components/         # React组件
│   │   ├── ui/            # 基础UI组件（Button、Card、Input等）
│   │   └── ...
│   ├── lib/               # 工具库
│   │   ├── database.ts    # Prisma数据库客户端
│   │   ├── blob-storage.ts # Vercel Blob存储
│   │   ├── gemini.ts      # Gemini AI集成
│   │   └── document-parser.ts # 文档解析工具
│   ├── types/             # TypeScript类型定义
│   └── utils/             # 通用工具函数
├── prisma/                # Prisma配置
│   ├── schema.prisma      # 数据库模式
│   ├── seed.js           # 种子数据（JavaScript版本）
│   └── seed.ts           # 种子数据（TypeScript版本）
└── database/              # 数据库文档
    └── README.md         # 数据库设置指南
```

## 🔧 可用脚本

- `npm run dev` - 启动开发服务器
- `npm run build` - 构建生产版本
- `npm run start` - 启动生产服务器
- `npm run lint` - 运行ESLint检查
- `npm run db:generate` - 生成Prisma客户端
- `npm run db:push` - 推送数据库模式
- `npm run db:seed` - 运行种子数据
- `npm run db:studio` - 打开Prisma Studio

## 📖 使用指南

### 1. 上传合同模板

1. 访问 `/templates` 页面
2. 点击"上传模板"按钮
3. 选择 `.docx`、`.doc` 或 `.pdf` 格式的合同模板
4. 系统将自动保存到Vercel Blob存储

### 2. AI分析模板

1. 在模板列表中找到已上传的模板
2. 点击"分析模板"按钮
3. 系统使用Gemini AI自动识别变量字段
4. 分析完成后可查看识别到的变量数量

### 3. 生成合同

#### 表单式生成
1. 点击模板的"生成合同"按钮
2. 填写AI识别的动态表单字段
3. 点击"生成合同"按钮
4. 预览生成的合同内容
5. 点击"下载PDF"导出文档

### 4. 功能测试

1. 访问 `/test` 页面
2. 点击"开始测试"按钮
3. 系统将自动测试所有API接口
4. 查看详细的测试结果报告

## 🚀 部署

### Vercel部署

1. 将代码推送到Git仓库
2. 在Vercel中导入项目
3. 配置环境变量
4. 部署完成后运行数据库迁移

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📞 支持

如有问题，请查看 `database/README.md` 中的详细配置指南。
