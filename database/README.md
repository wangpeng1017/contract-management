# 数据库设置指南 - Vercel Postgres

## 1. 创建Vercel Postgres数据库

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard) 并登录
2. 在项目页面中，点击 "Storage" 标签
3. 点击 "Create Database"
4. 选择 "Postgres"
5. 输入数据库名称（如：contract-management）
6. 选择地区（建议选择离您最近的地区）
7. 点击 "Create"

## 2. 获取数据库连接信息

数据库创建完成后：

1. 在数据库详情页面，点击 ".env.local" 标签
2. 复制所有环境变量到您的 `.env.local` 文件

## 3. 配置环境变量

将获取的信息填入 `.env.local` 文件：

```env
# Vercel Postgres数据库配置
POSTGRES_URL="postgres://username:password@hostname:port/database"
POSTGRES_PRISMA_URL="postgres://username:password@hostname:port/database?pgbouncer=true&connect_timeout=15"
POSTGRES_URL_NO_SSL="postgres://username:password@hostname:port/database"
POSTGRES_URL_NON_POOLING="postgres://username:password@hostname:port/database"
POSTGRES_USER="username"
POSTGRES_HOST="hostname"
POSTGRES_PASSWORD="password"
POSTGRES_DATABASE="database"

# Vercel Blob存储配置
BLOB_READ_WRITE_TOKEN="your_vercel_blob_read_write_token"

# Google Gemini API配置
GOOGLE_GEMINI_API_KEY=AIzaSyBtw7WLw0Lf749k0j5yeKJpjz1AfWgDsuA
```

## 4. 设置Vercel Blob存储

1. 在Vercel项目页面，点击 "Storage" 标签
2. 点击 "Create Database"
3. 选择 "Blob"
4. 输入存储名称（如：contract-files）
5. 点击 "Create"
6. 复制 `BLOB_READ_WRITE_TOKEN` 到 `.env.local` 文件

## 5. 初始化数据库

运行以下命令来设置数据库：

```bash
# 生成Prisma客户端
npm run db:generate

# 推送数据库模式到Vercel Postgres
npm run db:push

# 运行种子数据（创建默认分类）
npm run db:seed
```

## 6. 验证设置

数据库设置完成后，您可以使用以下命令查看数据库：

```bash
# 打开Prisma Studio查看数据库
npm run db:studio
```

您应该能看到以下表：
- contract_categories（已包含默认分类数据）
- contract_templates
- contract_variables
- generated_contracts
- chat_sessions
- chat_messages

## 7. 部署到Vercel

1. 将代码推送到Git仓库
2. 在Vercel中连接您的Git仓库
3. 在部署设置中添加环境变量
4. 部署完成后，在Vercel项目设置中运行数据库迁移：

```bash
npx prisma db push
npx prisma db seed
```

## 8. 本地开发

对于本地开发，确保您的 `.env.local` 文件包含所有必要的环境变量，然后运行：

```bash
npm run dev
```

完成以上步骤后，您的数据库就配置完成了！
