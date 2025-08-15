'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, FileText, Building, Building2, Package, DollarSign, CheckCircle } from 'lucide-react';
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

interface VariableModule {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  variables: string[];
}

// 定义变量分组模块
const VARIABLE_MODULES: VariableModule[] = [
  {
    id: 'basic',
    title: '基础合同信息',
    description: '合同的基本信息和标识',
    icon: FileText,
    color: 'bg-blue-50 border-blue-200',
    variables: ['contractNumber', 'signingDate']
  },
  {
    id: 'buyer',
    title: '甲方信息',
    description: '采购方的公司信息和开票信息',
    icon: Building,
    color: 'bg-green-50 border-green-200',
    variables: [
      'buyerCompanyName', 'buyerCreditCode', 'buyerInvoiceName',
      'buyerTaxNumber', 'buyerAddress', 'buyerPhone',
      'buyerBankName', 'buyerBankAccount'
    ]
  },
  {
    id: 'supplier',
    title: '乙方信息',
    description: '供货方的公司信息和银行信息',
    icon: Building2,
    color: 'bg-purple-50 border-purple-200',
    variables: [
      'supplierCompanyName', 'supplierCreditCode', 'supplierAccountName',
      'supplierBankName', 'supplierAccountNumber'
    ]
  },
  {
    id: 'goods',
    title: '货物信息',
    description: '商品详情、价格和数量信息',
    icon: Package,
    color: 'bg-orange-50 border-orange-200',
    variables: [
      'vehicleModel', 'guidePrice', 'unitPriceWithTax', 'quantity',
      'totalPriceWithTax', 'totalPriceWithoutTax', 'vatAmount'
    ]
  },
  {
    id: 'amount',
    title: '合同金额',
    description: '合同总价和大写金额',
    icon: DollarSign,
    color: 'bg-yellow-50 border-yellow-200',
    variables: ['contractTotalAmount', 'contractTotalAmountInWords']
  }
];

function GeneratePageContent() {
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
  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});

  // 计算填写进度
  const calculateProgress = () => {
    if (!template) return 0;
    const requiredVariables = template.variables.filter(v => v.required);
    const filledRequired = requiredVariables.filter(v => {
      const value = formData[v.name];
      return value !== undefined && value !== null && value !== '';
    });
    return Math.round((filledRequired.length / requiredVariables.length) * 100);
  };

  // 计算模块完成状态
  const getModuleCompletionStatus = (moduleVariables: string[]) => {
    if (!template) return { completed: 0, total: 0, percentage: 0 };

    const moduleTemplateVars = template.variables.filter(v =>
      moduleVariables.includes(v.name) && v.required
    );
    const completed = moduleTemplateVars.filter(v => {
      const value = formData[v.name];
      return value !== undefined && value !== null && value !== '';
    }).length;

    return {
      completed,
      total: moduleTemplateVars.length,
      percentage: moduleTemplateVars.length > 0 ? Math.round((completed / moduleTemplateVars.length) * 100) : 100
    };
  };

  // 切换模块折叠状态
  const toggleModule = (moduleId: string) => {
    setCollapsedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

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
    const value = String(formData[variable.name] || '');
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

  // 渲染变量模块
  const renderVariableModule = (module: VariableModule) => {
    const moduleVariables = template?.variables.filter(v =>
      module.variables.includes(v.name)
    ).sort((a, b) => a.orderIndex - b.orderIndex) || [];

    if (moduleVariables.length === 0) return null;

    const completionStatus = getModuleCompletionStatus(module.variables);
    const isCollapsed = collapsedModules[module.id];
    const IconComponent = module.icon;

    return (
      <Card key={module.id} className={`${module.color} transition-all duration-200 hover:shadow-md`}>
        <Collapsible open={!isCollapsed} onOpenChange={() => toggleModule(module.id)}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-opacity-80 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <IconComponent className="h-5 w-5" />
                  <div>
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {module.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={completionStatus.percentage === 100 ? "default" : "secondary"}>
                    {completionStatus.completed}/{completionStatus.total}
                  </Badge>
                  {completionStatus.percentage === 100 && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  {isCollapsed ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </div>
              </div>
              {completionStatus.total > 0 && (
                <Progress value={completionStatus.percentage} className="mt-2" />
              )}
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {moduleVariables.map((variable) => (
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
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
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

  const progress = calculateProgress();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* 页面头部 */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    {template.category && (
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: template.category.color }}
                      />
                    )}
                    生成合同：{template.name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {template.description || '请填写以下信息来生成合同'}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{progress}%</div>
                  <div className="text-sm text-gray-600">完成度</div>
                </div>
              </div>
              <Progress value={progress} className="mt-4" />
            </CardHeader>
          </Card>
        </div>

        {/* 模块化表单 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {VARIABLE_MODULES.map(module => renderVariableModule(module))}
        </div>

        {/* 操作按钮 */}
        <Card className="bg-gray-50">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleGenerate}
                disabled={generating || progress < 100}
                className="flex-1 h-12 text-lg"
                size="lg"
              >
                {generating ? '生成中...' : progress < 100 ? `请完成所有必填项 (${progress}%)` : '生成合同'}
              </Button>

              <Button variant="outline" asChild className="h-12">
                <Link href="/templates">取消</Link>
              </Button>
            </div>

            {progress < 100 && (
              <p className="text-sm text-gray-600 mt-2 text-center">
                请填写所有标有 <span className="text-red-500">*</span> 的必填字段
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <GeneratePageContent />
    </Suspense>
  );
}
