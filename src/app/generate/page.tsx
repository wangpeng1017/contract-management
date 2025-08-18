'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronDown, ChevronUp, FileText, Building, Building2, Package, DollarSign, CheckCircle, Plus, Trash2, Layout, Maximize2 } from 'lucide-react';
import Link from 'next/link';
import ContractPreview from '@/components/ContractPreview';
import ContractEditor from '@/components/ContractEditor';
import CompactContractForm from '@/components/CompactContractForm';

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

interface GoodsItem {
  id: string;
  vehicleModel: string;
  guidePrice: number;
  unitPriceWithTax: number;
  quantity: number;
  totalPriceWithTax: number;
  totalPriceWithoutTax: number;
  vatAmount: number;
}

interface VariableModule {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  variables: string[];
  isTable?: boolean; // 标记是否为表格模块
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
    description: '商品详情、价格和数量信息（支持多货物）',
    icon: Package,
    color: 'bg-orange-50 border-orange-200',
    variables: [
      'vehicleModel', 'guidePrice', 'unitPriceWithTax', 'quantity',
      'totalPriceWithTax', 'totalPriceWithoutTax', 'vatAmount'
    ],
    isTable: true
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
  const [isCompactLayout, setIsCompactLayout] = useState(false);
  const [generatedContract, setGeneratedContract] = useState<{
    contractId: string;
    content: string;
    templateName: string;
    createdAt: string;
    variablesData: Record<string, unknown>;
    goodsItems?: GoodsItem[];
    goodsSummary?: {
      totalQuantity: number;
      totalPriceWithTax: number;
      totalPriceWithoutTax: number;
      totalVatAmount: number;
    };
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingWord, setDownloadingWord] = useState(false);
  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [goodsItems, setGoodsItems] = useState<GoodsItem[]>([
    {
      id: '1',
      vehicleModel: '驱逐舰05',
      guidePrice: 0,
      unitPriceWithTax: 0,
      quantity: 1,
      totalPriceWithTax: 0,
      totalPriceWithoutTax: 0,
      vatAmount: 0
    }
  ]);

  // 计算填写进度
  const calculateProgress = () => {
    if (!template) return 0;

    // 分离货物相关变量和其他变量
    const goodsVariables = ['vehicleModel', 'guidePrice', 'unitPriceWithTax', 'quantity', 'totalPriceWithTax', 'totalPriceWithoutTax', 'vatAmount'];
    const requiredVariables = template.variables.filter(v => v.required && !goodsVariables.includes(v.name));

    // 计算非货物字段的完成度
    const filledRequired = requiredVariables.filter(v => {
      const value = formData[v.name];
      return value !== undefined && value !== null && value !== '';
    });

    // 计算货物表格的完成度
    const completedGoodsItems = goodsItems.filter(item =>
      item.vehicleModel.trim() !== '' &&
      item.unitPriceWithTax > 0 &&
      item.quantity > 0
    ).length;

    const goodsProgress = goodsItems.length > 0 ? completedGoodsItems / goodsItems.length : 0;

    // 综合计算进度（货物表格作为一个整体模块）
    const totalModules = requiredVariables.length + 1; // +1 for goods table
    const completedModules = filledRequired.length + goodsProgress;

    return Math.round((completedModules / totalModules) * 100);
  };

  // 计算模块完成状态
  const getModuleCompletionStatus = (moduleVariables: string[]) => {
    if (!template) return { completed: 0, total: 0, percentage: 0 };

    // 如果是货物模块，使用特殊计算逻辑
    const goodsVariables = ['vehicleModel', 'guidePrice', 'unitPriceWithTax', 'quantity', 'totalPriceWithTax', 'totalPriceWithoutTax', 'vatAmount'];
    if (moduleVariables.some(v => goodsVariables.includes(v))) {
      const completedItems = goodsItems.filter(item =>
        item.vehicleModel.trim() !== '' &&
        item.unitPriceWithTax > 0 &&
        item.quantity > 0
      ).length;

      return {
        completed: completedItems,
        total: goodsItems.length,
        percentage: goodsItems.length > 0 ? Math.round((completedItems / goodsItems.length) * 100) : 0
      };
    }

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

  // 货物表格操作函数
  const addGoodsItem = () => {
    const newItem: GoodsItem = {
      id: Date.now().toString(),
      vehicleModel: '',
      guidePrice: 0,
      unitPriceWithTax: 0,
      quantity: 1,
      totalPriceWithTax: 0,
      totalPriceWithoutTax: 0,
      vatAmount: 0
    };
    setGoodsItems(prev => [...prev, newItem]);
  };

  const removeGoodsItem = (id: string) => {
    if (goodsItems.length > 1) {
      setGoodsItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const updateGoodsItem = (id: string, field: keyof GoodsItem, value: string | number) => {
    setGoodsItems(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };

        // 自动计算相关金额
        if (field === 'unitPriceWithTax' || field === 'quantity') {
          const unitPrice = field === 'unitPriceWithTax' ? Number(value) : updatedItem.unitPriceWithTax;
          const qty = field === 'quantity' ? Number(value) : updatedItem.quantity;

          updatedItem.totalPriceWithTax = unitPrice * qty;
          updatedItem.totalPriceWithoutTax = updatedItem.totalPriceWithTax / 1.13; // 假设13%增值税
          updatedItem.vatAmount = updatedItem.totalPriceWithTax - updatedItem.totalPriceWithoutTax;
        }

        return updatedItem;
      }
      return item;
    }));
  };

  // 计算货物汇总信息
  const getGoodsSummary = () => {
    return goodsItems.reduce((summary, item) => ({
      totalQuantity: summary.totalQuantity + item.quantity,
      totalPriceWithTax: summary.totalPriceWithTax + item.totalPriceWithTax,
      totalPriceWithoutTax: summary.totalPriceWithoutTax + item.totalPriceWithoutTax,
      totalVatAmount: summary.totalVatAmount + item.vatAmount
    }), {
      totalQuantity: 0,
      totalPriceWithTax: 0,
      totalPriceWithoutTax: 0,
      totalVatAmount: 0
    });
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

    // 货物相关变量列表
    const goodsVariables = ['vehicleModel', 'guidePrice', 'unitPriceWithTax', 'quantity', 'totalPriceWithTax', 'totalPriceWithoutTax', 'vatAmount'];

    template.variables.forEach(variable => {
      if (variable.required) {
        let isValid = false;

        // 如果是货物相关字段，从goodsItems中验证
        if (goodsVariables.includes(variable.name)) {
          // 检查是否有有效的货物项目
          const hasValidGoods = goodsItems.some(item => {
            switch (variable.name) {
              case 'vehicleModel':
                return item.vehicleModel && item.vehicleModel.trim() !== '';
              case 'guidePrice':
                return item.guidePrice > 0;
              case 'unitPriceWithTax':
                return item.unitPriceWithTax > 0;
              case 'quantity':
                return item.quantity > 0;
              case 'totalPriceWithTax':
                return item.totalPriceWithTax > 0;
              case 'totalPriceWithoutTax':
                return item.totalPriceWithoutTax > 0;
              case 'vatAmount':
                return item.vatAmount > 0;
              default:
                return false;
            }
          });

          isValid = hasValidGoods;
        } else {
          // 非货物字段，从formData中验证
          const value = formData[variable.name];
          isValid = value !== undefined && value !== null && value.toString().trim() !== '';
        }

        if (!isValid) {
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
      // 构造完整的变量数据，将货物信息映射到顶层字段
      const mappedVariablesData: Record<string, unknown> = {
        ...formData,
        // 保留原始货物数据结构
        goodsItems: goodsItems,
        goodsSummary: getGoodsSummary()
      };

      // 如果有货物数据，将第一个货物的信息映射到顶层字段（用于模板变量替换）
      if (goodsItems.length > 0) {
        const firstGoods = goodsItems[0];
        mappedVariablesData.vehicleModel = firstGoods.vehicleModel;
        mappedVariablesData.guidePrice = firstGoods.guidePrice;
        mappedVariablesData.unitPriceWithTax = firstGoods.unitPriceWithTax;
        mappedVariablesData.quantity = firstGoods.quantity;
        mappedVariablesData.totalPriceWithTax = firstGoods.totalPriceWithTax;
        mappedVariablesData.totalPriceWithoutTax = firstGoods.totalPriceWithoutTax;
        mappedVariablesData.vatAmount = firstGoods.vatAmount;
      }



      const response = await fetch('/api/contracts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId: template?.id,
          templateName: template?.name,
          variablesData: mappedVariablesData
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setGeneratedContract({
          ...result.data,
          variablesData: {
            ...formData
          },
          goodsItems: goodsItems,
          goodsSummary: getGoodsSummary()
        });
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

  // 下载Word
  const handleDownloadWord = async () => {
    if (!generatedContract?.contractId) return;

    setDownloadingWord(true);
    try {
      const response = await fetch(`/api/contracts/${generatedContract.contractId}/word`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${generatedContract.templateName}_${new Date().toISOString().split('T')[0]}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Word下载失败');
      }
    } catch (error) {
      console.error('Word下载失败:', error);
      alert('Word下载失败，请稍后重试');
    } finally {
      setDownloadingWord(false);
    }
  };

  // 编辑合同
  const handleEdit = () => {
    setIsEditing(true);
  };

  // 保存编辑
  const handleSaveEdit = async (updatedContract: typeof generatedContract) => {
    if (!updatedContract) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/contracts/${updatedContract.contractId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: updatedContract.content,
          variablesData: updatedContract.variablesData
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setGeneratedContract(updatedContract);
          setIsEditing(false);
          alert('合同保存成功');
        } else {
          console.error('保存失败:', result.error);
          alert(`合同保存失败: ${result.error}`);
        }
      } else {
        const errorText = await response.text();
        console.error('HTTP错误:', response.status, errorText);
        alert(`合同保存失败: HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('合同保存失败:', error);
      alert('合同保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  // 重新生成
  const handleRegenerate = () => {
    setGeneratedContract(null);
    setIsEditing(false);
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

  // 渲染货物表格
  const renderGoodsTable = () => {
    const summary = getGoodsSummary();

    return (
      <div className="space-y-4">
        {/* 表格头部操作 */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            共 {goodsItems.length} 项货物
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addGoodsItem}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            新增货物
          </Button>
        </div>

        {/* 响应式表格容器 */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12 text-center">序号</TableHead>
                  <TableHead className="min-w-[120px]">车型商品名称</TableHead>
                  <TableHead className="min-w-[100px]">指导价(元)</TableHead>
                  <TableHead className="min-w-[120px]">采购单价含税(元)</TableHead>
                  <TableHead className="min-w-[80px]">数量(辆)</TableHead>
                  <TableHead className="min-w-[120px]">含税总价(元)</TableHead>
                  <TableHead className="min-w-[120px]">不含税总价(元)</TableHead>
                  <TableHead className="min-w-[100px]">增值税金(元)</TableHead>
                  <TableHead className="w-20 text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {goodsItems.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-center font-medium">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.vehicleModel}
                        onChange={(e) => updateGoodsItem(item.id, 'vehicleModel', e.target.value)}
                        placeholder="请输入车型名称"
                        className="min-w-[120px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.guidePrice || ''}
                        onChange={(e) => updateGoodsItem(item.id, 'guidePrice', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="min-w-[100px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.unitPriceWithTax || ''}
                        onChange={(e) => updateGoodsItem(item.id, 'unitPriceWithTax', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="min-w-[120px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.quantity || ''}
                        onChange={(e) => updateGoodsItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        placeholder="1"
                        min="1"
                        className="min-w-[80px]"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="text-right font-medium">
                        {item.totalPriceWithTax.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-right">
                        {item.totalPriceWithoutTax.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-right">
                        {item.vatAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeGoodsItem(item.id)}
                        disabled={goodsItems.length <= 1}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* 汇总信息 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">总数量：</span>
              <span className="font-medium">{summary.totalQuantity} 辆</span>
            </div>
            <div>
              <span className="text-gray-600">含税总价：</span>
              <span className="font-medium text-blue-600">
                ¥{summary.totalPriceWithTax.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-gray-600">不含税总价：</span>
              <span className="font-medium">
                ¥{summary.totalPriceWithoutTax.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-gray-600">增值税总额：</span>
              <span className="font-medium">
                ¥{summary.totalVatAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 渲染货物表格模块
  const renderGoodsTableModule = (module: VariableModule) => {
    const isCollapsed = collapsedModules[module.id];
    const IconComponent = module.icon;

    // 计算货物模块完成状态
    const completedItems = goodsItems.filter(item =>
      item.vehicleModel.trim() !== '' &&
      item.unitPriceWithTax > 0 &&
      item.quantity > 0
    ).length;

    return (
      <Card key={module.id} className={`${module.color} transition-all duration-200 hover:shadow-lg border-2`}>
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
                  <Badge variant={completedItems === goodsItems.length ? "default" : "secondary"}>
                    {completedItems}/{goodsItems.length}
                  </Badge>
                  {completedItems === goodsItems.length && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  {isCollapsed ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </div>
              </div>
              <Progress
                value={goodsItems.length > 0 ? (completedItems / goodsItems.length) * 100 : 0}
                className="mt-2"
              />
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0">
              {renderGoodsTable()}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  };

  // 渲染变量模块
  const renderVariableModule = (module: VariableModule) => {
    // 如果是货物表格模块，使用特殊渲染
    if (module.isTable && module.id === 'goods') {
      return renderGoodsTableModule(module);
    }

    const moduleVariables = template?.variables.filter(v =>
      module.variables.includes(v.name)
    ).sort((a, b) => a.orderIndex - b.orderIndex) || [];

    if (moduleVariables.length === 0) return null;

    const completionStatus = getModuleCompletionStatus(module.variables);
    const isCollapsed = collapsedModules[module.id];
    const IconComponent = module.icon;

    return (
      <Card key={module.id} className={`${module.color} transition-all duration-200 hover:shadow-lg border-2`}>
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
    if (isEditing) {
      return (
        <ContractEditor
          contract={generatedContract}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
          saving={saving}
        />
      );
    }

    return (
      <ContractPreview
        contract={generatedContract}
        onEdit={handleEdit}
        onDownloadPdf={handleDownloadPdf}
        onDownloadWord={handleDownloadWord}
        onRegenerate={handleRegenerate}
        downloadingPdf={downloadingPdf}
        downloadingWord={downloadingWord}
      />
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
                <div className="flex items-center gap-4">
                  <div className="flex gap-2">
                    <Button
                      variant={!isCompactLayout ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsCompactLayout(false)}
                      className="flex items-center gap-2"
                    >
                      <Layout className="h-4 w-4" />
                      标准布局
                    </Button>
                    <Button
                      variant={isCompactLayout ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsCompactLayout(true)}
                      className="flex items-center gap-2"
                    >
                      <Maximize2 className="h-4 w-4" />
                      紧凑布局
                    </Button>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{progress}%</div>
                    <div className="text-sm text-gray-600">完成度</div>
                  </div>
                </div>
              </div>
              <Progress value={progress} className="mt-4" />
            </CardHeader>
          </Card>
        </div>

        {/* 条件渲染：紧凑布局 vs 标准布局 */}
        {isCompactLayout ? (
          <CompactContractForm
            template={template}
            formData={formData}
            setFormData={setFormData}
            goodsItems={goodsItems}
            setGoodsItems={setGoodsItems}
            errors={errors}
            onGenerate={handleGenerate}
            generating={generating}
          />
        ) : (
          <div>
            {/* 标准布局 - 模块化表单 - 优化4行布局 */}
            <div className="space-y-10 mb-8">
          {/* 第一行：基础合同信息（全宽） */}
          <div className="w-full">
            <div className="relative">
              <div className="absolute -top-2 -left-2 w-1 h-8 bg-blue-500 rounded-full"></div>
              <div className="mb-2">
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  第一步：基础信息
                </span>
              </div>
              {renderVariableModule(VARIABLE_MODULES.find(m => m.id === 'basic')!)}
            </div>
          </div>

          {/* 分隔线 */}
          <div className="flex items-center justify-center">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            <div className="px-4 text-xs text-gray-500 font-medium">合同主体信息</div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          </div>

          {/* 第二行：甲方信息 + 乙方信息（并排） */}
          <div className="space-y-4">
            <div className="text-center">
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                第二步：合同主体
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="relative order-1">
                <div className="absolute -top-2 -left-2 w-1 h-8 bg-green-500 rounded-full"></div>
                <div className="lg:pr-3">
                  {renderVariableModule(VARIABLE_MODULES.find(m => m.id === 'buyer')!)}
                </div>
              </div>
              <div className="relative order-2">
                <div className="absolute -top-2 -left-2 w-1 h-8 bg-purple-500 rounded-full"></div>
                <div className="lg:pl-3">
                  {renderVariableModule(VARIABLE_MODULES.find(m => m.id === 'supplier')!)}
                </div>
              </div>
            </div>
          </div>

          {/* 分隔线 */}
          <div className="flex items-center justify-center">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            <div className="px-4 text-xs text-gray-500 font-medium">商品与金额</div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          </div>

          {/* 第三行：货物信息（全宽） */}
          <div className="w-full">
            <div className="relative">
              <div className="absolute -top-2 -left-2 w-1 h-8 bg-orange-500 rounded-full"></div>
              <div className="mb-2">
                <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                  第三步：货物详情
                </span>
              </div>
              {renderVariableModule(VARIABLE_MODULES.find(m => m.id === 'goods')!)}
            </div>
          </div>

          {/* 分隔线 */}
          <div className="flex items-center justify-center">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            <div className="px-4 text-xs text-gray-500 font-medium">最终确认</div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          </div>

          {/* 第四行：合同金额（全宽） */}
          <div className="w-full">
            <div className="relative">
              <div className="absolute -top-2 -left-2 w-1 h-8 bg-yellow-500 rounded-full"></div>
              <div className="mb-2">
                <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
                  第四步：合同金额
                </span>
              </div>
              {renderVariableModule(VARIABLE_MODULES.find(m => m.id === 'amount')!)}
            </div>
          </div>
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
        )}
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
