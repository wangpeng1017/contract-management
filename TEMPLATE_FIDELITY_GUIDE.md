# 合同模板保真度系统使用指南

## 概述

本系统实现了基于 markdownify 技术的合同模板保真度解决方案，确保生成的合同文件与原始模板在格式、样式、布局等方面完全一致。

## 核心特性

### ✅ 完全保持模板原貌
- 生成的合同文件除变量替换部分外，其他所有内容与原始模板完全一致
- 保持格式、样式、布局、字体、段落间距等
- 支持复杂的 Word 文档格式（表格、样式、页眉页脚等）

### 🔄 智能文档处理流程
1. **文档解析**: 使用 mammoth.js 将 .doc/.docx 文件转换为 HTML
2. **格式转换**: 使用 turndown 将 HTML 转换为 markdown 格式
3. **变量替换**: 在 markdown 中进行智能变量替换
4. **文档重建**: 使用 docx 库将 markdown 转换回 Word 格式

### 🎯 智能变量替换
- 支持多种占位符格式：`[变量名]`、`{{变量名}}`、`${变量名}`
- 智能类型推断：文本、货币、日期、百分比
- 防止重复替换已有数据

## 技术架构

### 核心组件

#### 1. DocumentProcessor (`src/lib/document-processor.ts`)
```typescript
// 解析Word文档
const result = await documentProcessor.parseDocumentFromFile(file);

// 变量替换
const processedMarkdown = documentProcessor.replaceVariablesInMarkdown(
  markdown, 
  replacements
);
```

#### 2. FormatPreservingGenerator (`src/lib/format-preserving-generator.ts`)
```typescript
// 生成Word文档
const genResult = await formatPreservingGenerator.generateWordFromMarkdown(
  markdown,
  { preserveFormatting: true }
);
```

#### 3. TemplateStorage (`src/lib/template-storage.ts`)
```typescript
// 处理模板并生成合同
const result = await templateStorage.processTemplateForContract(
  templateId, 
  variablesData
);
```

## API 端点

### 模板解析
```http
POST /api/templates/{templateId}/parse
Content-Type: multipart/form-data

# 上传模板文件进行解析
```

### 获取解析状态
```http
GET /api/templates/{templateId}/parse

# 检查模板是否已解析
```

### 测试解析功能
```http
POST /api/test/parse-template
Content-Type: multipart/form-data

# 测试模板解析和生成功能
```

## 使用流程

### 1. 模板解析
1. 访问 `/test-template` 页面
2. 上传 `.doc` 或 `.docx` 模板文件
3. 系统自动解析并转换为 markdown 格式
4. 查看解析结果和预览

### 2. 合同生成
1. 在合同生成页面填写变量数据
2. 系统使用解析后的模板进行变量替换
3. 生成保持原始格式的合同文档

### 3. 格式验证
1. 下载生成的 Word 文档
2. 对比原始模板文件
3. 验证格式保真度

## 变量占位符规范

### 支持的格式
```
[甲方名称]          # 方括号格式
{{乙方名称}}        # 双花括号格式
${合同金额}         # 美元符号格式
```

### 变量类型
- **文本**: 普通文本内容
- **货币**: 自动格式化为货币格式
- **日期**: 自动格式化为日期格式
- **百分比**: 自动添加百分号

### 常用变量映射
```typescript
const commonMappings = {
  '甲方名称': 'buyerName',
  '乙方名称': 'supplierName', 
  '合同金额': 'totalAmount',
  '签订日期': 'signingDate',
  '签订地点': 'signingLocation'
};
```

## 测试和验证

### 测试页面功能
访问 `/test-template` 页面进行测试：

1. **文件上传**: 选择模板文件
2. **解析测试**: 查看解析结果
3. **变量替换**: 模拟变量替换
4. **格式验证**: 检查生成的文档

### 测试结果指标
- ✅ 文档解析成功率
- ✅ 变量替换准确性
- ✅ Word文档生成质量
- ✅ 格式保真度

## 错误处理

### 常见问题
1. **文件格式不支持**: 确保上传 .doc 或 .docx 文件
2. **解析失败**: 检查文档是否损坏或加密
3. **变量未替换**: 检查占位符格式是否正确
4. **格式丢失**: 检查原始文档的复杂度

### 回退机制
系统提供传统生成方法作为回退：
- 当格式保真系统失败时自动切换
- 保证系统的稳定性和可用性

## 性能优化

### 缓存策略
- 解析结果存储在数据库中
- 避免重复解析相同模板
- 提高生成速度

### 内存管理
- 大文件分块处理
- 及时释放临时资源
- 优化内存使用

## 部署说明

### 依赖安装
```bash
npm install mammoth turndown markdown-it @types/turndown @types/markdown-it
```

### 环境要求
- Node.js 18+
- 足够的内存处理大型文档
- 文件系统访问权限

## 未来扩展

### 计划功能
- [ ] 支持更多文档格式 (.odt, .rtf)
- [ ] 图片和图表的保真处理
- [ ] 批量模板处理
- [ ] 模板版本管理
- [ ] 高级格式保持算法

### 技术改进
- [ ] 使用 pandoc 提高转换质量
- [ ] 实现增量解析
- [ ] 添加格式验证工具
- [ ] 性能监控和优化

## 支持和反馈

如有问题或建议，请：
1. 查看测试页面的详细错误信息
2. 检查浏览器控制台日志
3. 提供原始模板文件用于调试
4. 描述期望的格式保真效果

---

**注意**: 本系统专为解决合同模板保真度问题而设计，确保生成的合同文件在视觉上与原始模板完全一致。
