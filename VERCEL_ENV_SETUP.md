# Vercel环境变量配置指南

## 🚨 **部署错误解决方案**

如果遇到以下错误：
```
Environment Variable "BLOB_READ_WRITE_TOKEN" references Secret "blob_read_write_token", which does not exist.
```

请按照以下步骤配置Vercel环境变量。

## 📋 **必需的环境变量列表**

### **1. 数据库配置**
```bash
# Vercel Postgres数据库URL
POSTGRES_URL="postgres://username:password@hostname:port/database"

# Prisma数据库URL（如果使用Prisma Accelerate）
PRISMA_DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=your_api_key"

# 标准数据库URL
DATABASE_URL="postgres://username:password@hostname:port/database"
```

### **2. 文件存储配置**
```bash
# Vercel Blob存储令牌
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxxxxxxx"
```

### **3. AI服务配置**
```bash
# Google Gemini API密钥
GOOGLE_GEMINI_API_KEY="AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### **4. 应用配置**
```bash
# 应用基础URL
NEXT_PUBLIC_APP_URL="https://contract.aifly.me"

# 文件上传限制
NEXT_PUBLIC_MAX_FILE_SIZE="10"

# 支持的文件类型
NEXT_PUBLIC_ALLOWED_FILE_TYPES="application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,application/pdf"
```

### **5. 飞书API配置（可选）**
```bash
# 飞书应用配置
FEISHU_APP_ID="cli_xxxxxxxxxx"
FEISHU_APP_SECRET="xxxxxxxxxxxxxxxxxx"
FEISHU_TENANT_ACCESS_TOKEN="t-xxxxxxxxxxxxxxxxxx"
```

## 🔧 **Vercel环境变量配置步骤**

### **步骤1: 访问Vercel项目设置**
1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择 `contract-management` 项目
3. 点击 **Settings** 标签
4. 选择 **Environment Variables** 选项

### **步骤2: 添加环境变量**
对于每个必需的环境变量：

1. 点击 **Add New** 按钮
2. 输入 **Name**（变量名）
3. 输入 **Value**（变量值）
4. 选择 **Environment**：
   - ✅ Production
   - ✅ Preview  
   - ✅ Development
5. 点击 **Save** 保存

### **步骤3: 获取必需的服务令牌**

#### **Vercel Blob存储令牌**
1. 在Vercel Dashboard中，点击 **Storage** 标签
2. 创建或选择一个Blob存储
3. 复制 **Read & Write Token**
4. 将其设置为 `BLOB_READ_WRITE_TOKEN` 环境变量

#### **Vercel Postgres数据库URL**
1. 在Vercel Dashboard中，点击 **Storage** 标签
2. 创建或选择一个Postgres数据库
3. 复制连接字符串
4. 将其设置为 `POSTGRES_URL` 和 `DATABASE_URL` 环境变量

#### **Google Gemini API密钥**
1. 访问 [Google AI Studio](https://aistudio.google.com/app/apikey)
2. 创建新的API密钥
3. 复制API密钥
4. 将其设置为 `GOOGLE_GEMINI_API_KEY` 环境变量

## 🚀 **重新部署**

配置完所有环境变量后：

1. 返回项目的 **Deployments** 标签
2. 点击最新部署旁的 **...** 菜单
3. 选择 **Redeploy**
4. 确认重新部署

或者，推送新的代码提交来触发自动部署：

```bash
git add .
git commit -m "fix: 修复Vercel环境变量配置"
git push origin master
```

## ✅ **验证部署成功**

部署成功后，访问以下URL验证功能：

- **主页**: https://contract.aifly.me
- **模板管理**: https://contract.aifly.me/templates
- **飞书测试**: https://contract.aifly.me/test-feishu
- **API健康检查**: https://contract.aifly.me/api/test/feishu-integration

## 🔍 **常见问题排查**

### **问题1: 数据库连接失败**
- 检查 `POSTGRES_URL` 是否正确
- 确认数据库服务是否运行
- 验证网络连接权限

### **问题2: Blob存储访问失败**
- 检查 `BLOB_READ_WRITE_TOKEN` 是否有效
- 确认令牌权限包含读写访问
- 验证存储区域配置

### **问题3: AI功能不工作**
- 检查 `GOOGLE_GEMINI_API_KEY` 是否有效
- 确认API配额是否充足
- 验证API密钥权限

## 📞 **获取帮助**

如果仍然遇到问题：

1. 检查Vercel部署日志中的详细错误信息
2. 确认所有环境变量都已正确设置
3. 验证第三方服务（数据库、存储、API）的状态
4. 查看项目的 `README.md` 文件获取更多配置信息

## 🎯 **快速修复命令**

如果您有所有必需的值，可以使用Vercel CLI快速设置：

```bash
# 安装Vercel CLI
npm i -g vercel

# 登录Vercel
vercel login

# 设置环境变量
vercel env add BLOB_READ_WRITE_TOKEN
vercel env add POSTGRES_URL
vercel env add DATABASE_URL
vercel env add GOOGLE_GEMINI_API_KEY
vercel env add NEXT_PUBLIC_APP_URL
vercel env add NEXT_PUBLIC_MAX_FILE_SIZE
vercel env add NEXT_PUBLIC_ALLOWED_FILE_TYPES

# 重新部署
vercel --prod
```
