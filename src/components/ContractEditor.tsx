'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Save,
  X,
  FileText,
  Edit3,
  AlertCircle
} from 'lucide-react';

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

interface ContractData {
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
}

interface ContractEditorProps {
  contract: ContractData;
  onSave: (updatedContract: ContractData) => void;
  onCancel: () => void;
  saving: boolean;
}

export default function ContractEditor({
  contract,
  onSave,
  onCancel,
  saving
}: ContractEditorProps) {
  const [activeTab, setActiveTab] = useState('content');
  const [editedContent, setEditedContent] = useState(contract.content);
  const [editedVariables, setEditedVariables] = useState(contract.variablesData);
  const [editedGoods, setEditedGoods] = useState(contract.goodsItems || []);
  const [hasChanges, setHasChanges] = useState(false);

  // 辅助函数：安全获取字符串值
  const getStringValue = (value: unknown): string => {
    return String(value || '');
  };

  // 辅助函数：安全获取数字值
  const getNumberValue = (value: unknown): number => {
    return Number(value || 0);
  };

  // 检测是否有变更
  useEffect(() => {
    const contentChanged = editedContent !== contract.content;
    const variablesChanged = JSON.stringify(editedVariables) !== JSON.stringify(contract.variablesData);
    const goodsChanged = JSON.stringify(editedGoods) !== JSON.stringify(contract.goodsItems || []);
    
    setHasChanges(contentChanged || variablesChanged || goodsChanged);
  }, [editedContent, editedVariables, editedGoods, contract]);

  // 更新变量值
  const updateVariable = (key: string, value: unknown) => {
    setEditedVariables(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 更新货物信息
  const updateGoodsItem = (index: number, field: keyof GoodsItem, value: string | number) => {
    setEditedGoods(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // 自动计算相关金额
      if (field === 'unitPriceWithTax' || field === 'quantity') {
        const item = updated[index];
        item.totalPriceWithTax = item.unitPriceWithTax * item.quantity;
        item.totalPriceWithoutTax = item.totalPriceWithTax / 1.13;
        item.vatAmount = item.totalPriceWithTax - item.totalPriceWithoutTax;
      }
      
      return updated;
    });
  };

  // 保存更改
  const handleSave = () => {
    // 计算货物汇总
    const goodsSummary = editedGoods.reduce((summary, item) => ({
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

    const updatedContract: ContractData = {
      ...contract,
      content: editedContent,
      variablesData: editedVariables,
      goodsItems: editedGoods,
      goodsSummary
    };

    onSave(updatedContract);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* 页面头部 */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl text-blue-800">
                  <Edit3 className="h-6 w-6" />
                  编辑合同
                </CardTitle>
                <CardDescription className="mt-1 text-blue-700">
                  编辑合同内容和变量数据 • 模板：{contract.templateName}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    有未保存的更改
                  </Badge>
                )}
                <Badge variant="outline">
                  编辑模式
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* 编辑内容 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              合同内容
            </TabsTrigger>
            <TabsTrigger value="variables" className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              变量数据
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>编辑合同内容</CardTitle>
                <CardDescription>
                  直接编辑合同的文本内容，支持格式化文本
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-96 font-mono text-sm"
                  placeholder="请输入合同内容..."
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="variables" className="space-y-6">
            {/* 基础信息编辑 */}
            <Card>
              <CardHeader>
                <CardTitle>基础合同信息</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">合同编号</label>
                    <Input
                      value={getStringValue(editedVariables.contractNumber)}
                      onChange={(e) => updateVariable('contractNumber', e.target.value)}
                      placeholder="请输入合同编号"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">签订时间</label>
                    <Input
                      type="date"
                      value={getStringValue(editedVariables.signingDate)}
                      onChange={(e) => updateVariable('signingDate', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 甲方信息编辑 */}
            <Card>
              <CardHeader>
                <CardTitle>甲方信息</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">公司名称</label>
                    <Input
                      value={getStringValue(editedVariables.buyerCompanyName)}
                      onChange={(e) => updateVariable('buyerCompanyName', e.target.value)}
                      placeholder="请输入甲方公司名称"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">统一社会信用代码</label>
                    <Input
                      value={getStringValue(editedVariables.buyerCreditCode)}
                      onChange={(e) => updateVariable('buyerCreditCode', e.target.value)}
                      placeholder="请输入信用代码"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">开票名称</label>
                    <Input
                      value={getStringValue(editedVariables.buyerInvoiceName)}
                      onChange={(e) => updateVariable('buyerInvoiceName', e.target.value)}
                      placeholder="请输入开票名称"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">税号</label>
                    <Input
                      value={getStringValue(editedVariables.buyerTaxNumber)}
                      onChange={(e) => updateVariable('buyerTaxNumber', e.target.value)}
                      placeholder="请输入税号"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">单位地址</label>
                    <Input
                      value={getStringValue(editedVariables.buyerAddress)}
                      onChange={(e) => updateVariable('buyerAddress', e.target.value)}
                      placeholder="请输入单位地址"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">电话</label>
                    <Input
                      value={getStringValue(editedVariables.buyerPhone)}
                      onChange={(e) => updateVariable('buyerPhone', e.target.value)}
                      placeholder="请输入电话"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">开户银行</label>
                    <Input
                      value={getStringValue(editedVariables.buyerBankName)}
                      onChange={(e) => updateVariable('buyerBankName', e.target.value)}
                      placeholder="请输入开户银行"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">银行账户</label>
                    <Input
                      value={getStringValue(editedVariables.buyerBankAccount)}
                      onChange={(e) => updateVariable('buyerBankAccount', e.target.value)}
                      placeholder="请输入银行账户"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 乙方信息编辑 */}
            <Card>
              <CardHeader>
                <CardTitle>乙方信息</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">公司名称</label>
                    <Input
                      value={getStringValue(editedVariables.supplierCompanyName)}
                      onChange={(e) => updateVariable('supplierCompanyName', e.target.value)}
                      placeholder="请输入乙方公司名称"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">统一社会信用代码</label>
                    <Input
                      value={getStringValue(editedVariables.supplierCreditCode)}
                      onChange={(e) => updateVariable('supplierCreditCode', e.target.value)}
                      placeholder="请输入信用代码"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">账户名称</label>
                    <Input
                      value={getStringValue(editedVariables.supplierAccountName)}
                      onChange={(e) => updateVariable('supplierAccountName', e.target.value)}
                      placeholder="请输入账户名称"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">开户行</label>
                    <Input
                      value={getStringValue(editedVariables.supplierBankName)}
                      onChange={(e) => updateVariable('supplierBankName', e.target.value)}
                      placeholder="请输入开户行"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">银行账号</label>
                    <Input
                      value={getStringValue(editedVariables.supplierAccountNumber)}
                      onChange={(e) => updateVariable('supplierAccountNumber', e.target.value)}
                      placeholder="请输入银行账号"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 货物信息编辑 */}
            {editedGoods.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>货物信息</CardTitle>
                  <CardDescription>
                    编辑货物详情，价格会自动计算
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {editedGoods.map((item, index) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <h4 className="font-medium mb-3">货物 {index + 1}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">车型商品名称</label>
                            <Input
                              value={item.vehicleModel}
                              onChange={(e) => updateGoodsItem(index, 'vehicleModel', e.target.value)}
                              placeholder="请输入车型名称"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">指导价(元)</label>
                            <Input
                              type="number"
                              value={item.guidePrice || 0}
                              onChange={(e) => updateGoodsItem(index, 'guidePrice', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">采购单价含税(元)</label>
                            <Input
                              type="number"
                              value={item.unitPriceWithTax || 0}
                              onChange={(e) => updateGoodsItem(index, 'unitPriceWithTax', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">数量(辆)</label>
                            <Input
                              type="number"
                              value={item.quantity || 1}
                              onChange={(e) => updateGoodsItem(index, 'quantity', parseInt(e.target.value) || 1)}
                              placeholder="1"
                              min="1"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">含税总价(元)</label>
                            <Input
                              value={item.totalPriceWithTax.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                              disabled
                              className="bg-gray-50"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">不含税总价(元)</label>
                            <Input
                              value={item.totalPriceWithoutTax.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                              disabled
                              className="bg-gray-50"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 合同金额编辑 */}
            <Card>
              <CardHeader>
                <CardTitle>合同金额</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">合同总价数字(元)</label>
                    <Input
                      type="number"
                      value={getNumberValue(editedVariables.contractTotalAmount)}
                      onChange={(e) => updateVariable('contractTotalAmount', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">合同总价大写</label>
                    <Input
                      value={getStringValue(editedVariables.contractTotalAmountInWords)}
                      onChange={(e) => updateVariable('contractTotalAmountInWords', e.target.value)}
                      placeholder="请输入中文大写金额"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 操作按钮 */}
        <Card className="mt-8 bg-gray-50">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    保存更改
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={onCancel}
                disabled={saving}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                取消编辑
              </Button>
              
              {hasChanges && (
                <div className="flex items-center gap-2 text-sm text-orange-600">
                  <AlertCircle className="h-4 w-4" />
                  您有未保存的更改
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
