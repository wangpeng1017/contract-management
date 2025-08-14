'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ContractTemplate {
  id: string;
  name: string;
  description?: string;
  fileName: string;
  status: string;
  variablesExtracted: boolean;
  createdAt: string;
  category?: {
    name: string;
    color: string;
  };
  _count: {
    variables: number;
    generatedContracts: number;
  };
}

interface ContractCategory {
  id: string;
  name: string;
  color: string;
  _count: {
    templates: number;
  };
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [categories, setCategories] = useState<ContractCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // 获取模板列表
  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      const result = await response.json();
      if (result.success) {
        setTemplates(result.data.templates);
      }
    } catch (error) {
      console.error('获取模板列表失败:', error);
    }
  };

  // 获取分类列表
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const result = await response.json();
      if (result.success) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('获取分类列表失败:', error);
    }
  };

  // 文件上传处理
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // 1. 上传文件
      const formData = new FormData();
      formData.append('file', file);
      formData.append('container', 'templates');

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const uploadResult = await uploadResponse.json();
      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }

      // 2. 创建模板记录
      const templateResponse = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: file.name.replace(/\.[^/.]+$/, ''),
          filePath: uploadResult.data.pathname,
          fileName: uploadResult.data.filename,
          fileSize: uploadResult.data.size,
          mimeType: uploadResult.data.type
        })
      });

      const templateResult = await templateResponse.json();
      if (templateResult.success) {
        await fetchTemplates();
        alert('模板上传成功！');
      } else {
        throw new Error(templateResult.error);
      }

    } catch (error) {
      console.error('文件上传失败:', error);
      alert('文件上传失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setUploading(false);
      // 重置文件输入
      event.target.value = '';
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTemplates(), fetchCategories()]);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">加载中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">合同模板管理</h1>
          <p className="text-muted-foreground mt-2">
            上传和管理您的合同模板，系统将自动识别变量字段
          </p>
        </div>
        <div>
          <Input
            type="file"
            accept=".docx,.doc,.pdf"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
            id="file-upload"
          />
          <Button asChild disabled={uploading}>
            <label htmlFor="file-upload" className="cursor-pointer">
              {uploading ? '上传中...' : '上传模板'}
            </label>
          </Button>
        </div>
      </div>

      {/* 分类统计 */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <div>
                  <p className="text-sm font-medium">{category.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {category._count.templates} 个模板
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 模板列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </div>
                <div className="flex items-center space-x-1">
                  {template.category && (
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: template.category.color }}
                    />
                  )}
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      template.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : template.status === 'processing'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {template.status === 'active' ? '已激活' : 
                     template.status === 'processing' ? '处理中' : '未激活'}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>文件名: {template.fileName}</p>
                <p>变量数量: {template._count.variables}</p>
                <p>使用次数: {template._count.generatedContracts}</p>
                <p>创建时间: {new Date(template.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="mt-4 flex space-x-2">
                <Button size="sm" variant="outline">
                  查看详情
                </Button>
                <Button size="sm" variant="outline">
                  生成合同
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            还没有上传任何模板，点击上方按钮开始上传您的第一个合同模板
          </p>
        </div>
      )}
    </div>
  );
}
