'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

interface ContractTemplate {
  id: string;
  name: string;
  description?: string;
  variables: ContractVariable[];
  category?: {
    name: string;
    color: string;
  };
}

interface ContractVariable {
  id: string;
  name: string;
  type: string;
  description: string;
  required: boolean;
  placeholder?: string;
  defaultValue?: string;
  orderIndex: number;
}

export default function GeneratePage() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get('templateId');
  
  const [template, setTemplate] = useState<ContractTemplate | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedContract, setGeneratedContract] = useState<{
    contractId: string;
    content: string;
    templateName: string;
    createdAt: string;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // 获取模板详情
  useEffect(() => {
    if (templateId) {
      fetchTemplate(templateId);
    } else {
      setLoading(false);
    }
  }, [templateId]);

  const fetchTemplate = async (id: string) => {
    try {
      const response = await fetch(`/api/templates/${id}`);
      const result = await response.json();
      
      if (result.success) {
        setTemplate(result.data);
        // 初始化表单数据
        const initialData: Record<string, unknown> = {};
        result.data.variables.forEach((variable: ContractVariable) => {
          initialData[variable.name] = variable.defaultValue || '';
        });
        setFormData(initialData);
      } else {
        console.error('获取模板失败:', result.error);
      }
    } catch (error) {
      console.error('获取模板失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理表单输入
  const handleInputChange = (variableName: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [variableName]: value
    }));
    
    // 清除错误
    if (errors[variableName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[variableName];
        return newErrors;
      });
    }
  };

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!template) return false;
    
    template.variables.forEach(variable => {
      if (variable.required) {
        const value = formData[variable.name];
        if (!value || value.toString().trim() === '') {
          newErrors[variable.name] = `${variable.description}不能为空`;
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 生成合同
  const handleGenerate = async () => {
    if (!validateForm()) {
      return;
    }
    
    setGenerating(true);
    try {
      const response = await fetch('/api/contracts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId: template?.id,
          templateName: template?.name,
          variablesData: formData
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setGeneratedContract(result.data);
      } else {
        alert('合同生成失败: ' + result.error);
      }
    } catch (error) {
      console.error('合同生成失败:', error);
      alert('合同生成失败，请稍后重试');
    } finally {
      setGenerating(false);
    }
  };

  // 下载PDF
  const handleDownloadPdf = async () => {
    if (!generatedContract?.contractId) return;

    setDownloadingPdf(true);
    try {
      const response = await fetch(`/api/contracts/${generatedContract.contractId}/pdf`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${generatedContract.templateName}_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert('PDF下载失败');
      }
    } catch (error) {
      console.error('PDF下载失败:', error);
      alert('PDF下载失败，请稍后重试');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // 渲染输入字段
  const renderInputField = (variable: ContractVariable) => {
    const value = formData[variable.name] || '';
    const hasError = !!errors[variable.name];
    
    switch (variable.type) {
      case 'textarea':
        return (
          <textarea
            className={`w-full p-2 border rounded-md ${hasError ? 'border-red-500' : 'border-gray-300'}`}
            rows={3}
            value={value}
            placeholder={variable.placeholder || variable.description}
            onChange={(e) => handleInputChange(variable.name, e.target.value)}
          />
        );
      
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleInputChange(variable.name, e.target.value)}
            className={hasError ? 'border-red-500' : ''}
          />
        );
      
      case 'number':
      case 'currency':
        return (
          <Input
            type="number"
            value={value}
            placeholder={variable.placeholder || variable.description}
            onChange={(e) => handleInputChange(variable.name, parseFloat(e.target.value) || '')}
            className={hasError ? 'border-red-500' : ''}
          />
        );
      
      default:
        return (
          <Input
            type="text"
            value={value}
            placeholder={variable.placeholder || variable.description}
            onChange={(e) => handleInputChange(variable.name, e.target.value)}
            className={hasError ? 'border-red-500' : ''}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">加载中...</div>
      </div>
    );
  }

  if (!templateId || !template) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>选择合同模板</CardTitle>
            <CardDescription>
              请先选择一个合同模板来生成合同
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/templates">选择模板</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (generatedContract) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>合同生成成功</CardTitle>
            <CardDescription>
              基于模板 &ldquo;{template.name}&rdquo; 生成的合同
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">合同内容预览：</h3>
                <pre className="whitespace-pre-wrap text-sm">
                  {generatedContract.content}
                </pre>
              </div>
              
              <div className="flex space-x-4">
                <Button onClick={() => setGeneratedContract(null)}>
                  重新生成
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                >
                  {downloadingPdf ? '下载中...' : '下载PDF'}
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/templates">返回模板</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {template.category && (
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: template.category.color }}
                />
              )}
              生成合同：{template.name}
            </CardTitle>
            <CardDescription>
              {template.description || '请填写以下信息来生成合同'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-6">
              {template.variables.map((variable) => (
                <div key={variable.id} className="space-y-2">
                  <label className="block text-sm font-medium">
                    {variable.description}
                    {variable.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  
                  {renderInputField(variable)}
                  
                  {errors[variable.name] && (
                    <p className="text-red-500 text-sm">{errors[variable.name]}</p>
                  )}
                </div>
              ))}
              
              <div className="flex space-x-4 pt-4">
                <Button 
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex-1"
                >
                  {generating ? '生成中...' : '生成合同'}
                </Button>
                
                <Button variant="outline" asChild>
                  <Link href="/templates">取消</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
