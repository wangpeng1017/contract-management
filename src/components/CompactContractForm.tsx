'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  FileText,
  Building,
  Building2,
  Package,
  Calculator,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Upload,
  Copy
} from 'lucide-react';
import CompactGoodsSection from './CompactGoodsSection';

interface ContractVariable {
  id: string;
  name: string;
  type: string;
  description: string;
  required: boolean;
  placeholder?: string;
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

interface CompactContractFormProps {
  template: {
    id: string;
    name: string;
    variables: ContractVariable[];
  };
  formData: Record<string, unknown>;
  setFormData: (data: Record<string, unknown>) => void;
  goodsItems: GoodsItem[];
  setGoodsItems: (items: GoodsItem[]) => void;
  errors: Record<string, string>;
  onGenerate: () => void;
  generating: boolean;
}

export default function CompactContractForm({
  template,
  formData,
  setFormData,
  goodsItems,
  setGoodsItems,
  errors,
  onGenerate,
  generating
}: CompactContractFormProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    buyer: true,
    supplier: true,
    goods: true,
    amount: true
  });

  const [activeTab, setActiveTab] = useState('form');

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // 智能填写功能
  const handleSmartFill = (sectionId: string) => {
    // TODO: 实现智能填写逻辑
    console.log('智能填写:', sectionId);
  };

  // 处理金额变化
  const handleAmountChange = (totalAmount: number, totalAmountWords: string) => {
    setFormData({
      ...formData,
      contractTotalAmount: totalAmount,
      contractTotalAmountInWords: totalAmountWords
    });
  };

  // 渲染输入字段
  const renderField = (variable: ContractVariable, colSpan: string = 'col-span-1') => {
    const value = String(formData[variable.name] || '');
    const hasError = !!errors[variable.name];

    return (
      <div key={variable.id} className={`${colSpan} space-y-1`}>
        <Label htmlFor={variable.name} className="text-xs font-medium text-gray-700">
          {variable.description}
          {variable.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Input
          id={variable.name}
          type={variable.type === 'currency' ? 'number' : variable.type === 'date' ? 'date' : 'text'}
          value={value}
          onChange={(e) => setFormData({ ...formData, [variable.name]: e.target.value })}
          placeholder={variable.placeholder}
          className={`h-8 text-sm ${hasError ? 'border-red-500' : ''}`}
        />
        {hasError && (
          <p className="text-xs text-red-500">{errors[variable.name]}</p>
        )}
      </div>
    );
  };

  // 获取模块变量
  const getModuleVariables = (moduleId: string) => {
    const moduleVariables: Record<string, string[]> = {
      basic: ['contractNumber', 'signingDate'],
      buyer: [
        'buyerCompanyName', 'buyerCreditCode', 'buyerInvoiceName',
        'buyerTaxNumber', 'buyerAddress', 'buyerPhone',
        'buyerBankName', 'buyerBankAccount'
      ],
      supplier: [
        'supplierCompanyName', 'supplierCreditCode', 'supplierAccountName',
        'supplierBankName', 'supplierAccountNumber'
      ]
    };
    
    return template.variables.filter(v => moduleVariables[moduleId]?.includes(v.name));
  };

  // 计算进度
  const calculateProgress = () => {
    const totalFields = template.variables.length + (goodsItems.length > 0 ? 1 : 0);
    const filledFields = template.variables.filter(v => formData[v.name]).length + 
                        (goodsItems.length > 0 ? 1 : 0);
    return Math.round((filledFields / totalFields) * 100);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部进度条 */}
      <div className="bg-white border-b px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">生成合同</h1>
            <p className="text-sm text-gray-600">模板：{template.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${calculateProgress()}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700">{calculateProgress()}%</span>
            </div>
            <Button 
              onClick={onGenerate}
              disabled={generating || calculateProgress() < 100}
              className="px-6"
            >
              {generating ? '生成中...' : '生成合同'}
            </Button>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="mx-6 mt-4 w-fit">
            <TabsTrigger value="form" className="text-sm">表单填写</TabsTrigger>
            <TabsTrigger value="preview" className="text-sm">数据预览</TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="flex-1 overflow-auto px-6 pb-6">
            <div className="grid grid-cols-12 gap-4 h-fit">
              {/* 左侧：基础信息和甲方信息 */}
              <div className="col-span-4 space-y-4">
                {/* 基础信息 */}
                <Card className="border-blue-200 bg-blue-50/50">
                  <Collapsible 
                    open={expandedSections.basic} 
                    onOpenChange={() => toggleSection('basic')}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="pb-3 cursor-pointer hover:bg-blue-100/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <CardTitle className="text-sm font-medium">基础合同信息</CardTitle>
                          </div>
                          {expandedSections.basic ? 
                            <ChevronUp className="h-4 w-4" /> : 
                            <ChevronDown className="h-4 w-4" />
                          }
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-1 gap-3">
                          {getModuleVariables('basic').map(variable => 
                            renderField(variable, 'col-span-1')
                          )}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>

                {/* 甲方信息 */}
                <Card className="border-green-200 bg-green-50/50">
                  <Collapsible 
                    open={expandedSections.buyer} 
                    onOpenChange={() => toggleSection('buyer')}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="pb-3 cursor-pointer hover:bg-green-100/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-green-600" />
                            <CardTitle className="text-sm font-medium">甲方信息</CardTitle>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSmartFill('buyer');
                              }}
                              className="h-6 px-2 text-xs"
                            >
                              <Sparkles className="h-3 w-3 mr-1" />
                              智能填写
                            </Button>
                          </div>
                          {expandedSections.buyer ? 
                            <ChevronUp className="h-4 w-4" /> : 
                            <ChevronDown className="h-4 w-4" />
                          }
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-1 gap-3">
                          {getModuleVariables('buyer').map(variable => 
                            renderField(variable, 'col-span-1')
                          )}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              </div>

              {/* 中间：乙方信息和货物信息 */}
              <div className="col-span-4 space-y-4">
                {/* 乙方信息 */}
                <Card className="border-purple-200 bg-purple-50/50">
                  <Collapsible 
                    open={expandedSections.supplier} 
                    onOpenChange={() => toggleSection('supplier')}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="pb-3 cursor-pointer hover:bg-purple-100/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-purple-600" />
                            <CardTitle className="text-sm font-medium">乙方信息</CardTitle>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSmartFill('supplier');
                              }}
                              className="h-6 px-2 text-xs"
                            >
                              <Sparkles className="h-3 w-3 mr-1" />
                              智能填写
                            </Button>
                          </div>
                          {expandedSections.supplier ? 
                            <ChevronUp className="h-4 w-4" /> : 
                            <ChevronDown className="h-4 w-4" />
                          }
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-1 gap-3">
                          {getModuleVariables('supplier').map(variable => 
                            renderField(variable, 'col-span-1')
                          )}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>

                {/* 货物信息 */}
                <Card className="border-orange-200 bg-orange-50/50">
                  <Collapsible 
                    open={expandedSections.goods} 
                    onOpenChange={() => toggleSection('goods')}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="pb-3 cursor-pointer hover:bg-orange-100/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-orange-600" />
                            <CardTitle className="text-sm font-medium">货物信息</CardTitle>
                            <Badge variant="secondary" className="text-xs">
                              {goodsItems.length} 项
                            </Badge>
                          </div>
                          {expandedSections.goods ? 
                            <ChevronUp className="h-4 w-4" /> : 
                            <ChevronDown className="h-4 w-4" />
                          }
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <CompactGoodsSection
                          goodsItems={goodsItems}
                          setGoodsItems={setGoodsItems}
                          onAmountChange={handleAmountChange}
                        />
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              </div>

              {/* 右侧：合同金额和操作区域 */}
              <div className="col-span-4 space-y-4">
                {/* 合同金额 */}
                <Card className="border-indigo-200 bg-indigo-50/50">
                  <Collapsible 
                    open={expandedSections.amount} 
                    onOpenChange={() => toggleSection('amount')}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="pb-3 cursor-pointer hover:bg-indigo-100/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calculator className="h-4 w-4 text-indigo-600" />
                            <CardTitle className="text-sm font-medium">合同金额</CardTitle>
                          </div>
                          {expandedSections.amount ? 
                            <ChevronUp className="h-4 w-4" /> : 
                            <ChevronDown className="h-4 w-4" />
                          }
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-1 gap-3">
                          {template.variables
                            .filter(v => ['contractTotalAmount', 'contractTotalAmountInWords'].includes(v.name))
                            .map(variable => renderField(variable, 'col-span-1'))
                          }
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>

                {/* 快捷操作 */}
                <Card className="border-gray-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">快捷操作</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                      <Upload className="h-3 w-3 mr-2" />
                      上传图片识别
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                      <Copy className="h-3 w-3 mr-2" />
                      批量导入文本
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 overflow-auto px-6 pb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">数据预览</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-50 p-4 rounded overflow-auto">
                  {JSON.stringify({ formData, goodsItems }, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
