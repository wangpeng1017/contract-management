'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  FileText,
  Edit,
  Download,
  FileDown,
  Eye,
  X,
  RefreshCw,
  Building,
  Package,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';

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

interface ContractPreviewProps {
  contract: ContractData;
  onEdit: () => void;
  onDownloadPdf: () => void;
  onDownloadWord: () => void;
  onRegenerate: () => void;
  downloadingPdf: boolean;
  downloadingWord: boolean;
}

export default function ContractPreview({
  contract,
  onEdit,
  onDownloadPdf,
  onDownloadWord,
  onRegenerate,
  downloadingPdf,
  downloadingWord
}: ContractPreviewProps) {
  const [activeTab, setActiveTab] = useState('preview');

  // 辅助函数：安全获取字符串值
  const getStringValue = (value: unknown): string => {
    return String(value || '未填写');
  };

  // 辅助函数：安全获取数字值并格式化
  const getFormattedNumber = (value: unknown): string => {
    const num = Number(value || 0);
    return num.toLocaleString('zh-CN', { minimumFractionDigits: 2 });
  };

  // 渲染变量数据预览
  const renderVariablesPreview = () => {
    const { variablesData } = contract;
    
    return (
      <div className="space-y-6">
        {/* 基础合同信息 */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-blue-600" />
              基础合同信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-600">合同编号：</span>
                <span className="ml-2">{getStringValue(variablesData.contractNumber)}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">签订时间：</span>
                <span className="ml-2">{getStringValue(variablesData.signingDate)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 甲方信息 */}
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building className="h-5 w-5 text-green-600" />
              甲方信息（采购方）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-600">公司名称：</span>
                <span className="ml-2">{getStringValue(variablesData.buyerCompanyName)}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">信用代码：</span>
                <span className="ml-2">{getStringValue(variablesData.buyerCreditCode)}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">开票名称：</span>
                <span className="ml-2">{getStringValue(variablesData.buyerInvoiceName)}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">税号：</span>
                <span className="ml-2">{getStringValue(variablesData.buyerTaxNumber)}</span>
              </div>
              <div className="md:col-span-2">
                <span className="text-sm font-medium text-gray-600">地址：</span>
                <span className="ml-2">{getStringValue(variablesData.buyerAddress)}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">电话：</span>
                <span className="ml-2">{getStringValue(variablesData.buyerPhone)}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">开户银行：</span>
                <span className="ml-2">{getStringValue(variablesData.buyerBankName)}</span>
              </div>
              <div className="md:col-span-2">
                <span className="text-sm font-medium text-gray-600">银行账户：</span>
                <span className="ml-2">{getStringValue(variablesData.buyerBankAccount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 乙方信息 */}
        <Card className="bg-purple-50 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building className="h-5 w-5 text-purple-600" />
              乙方信息（供货方）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-600">公司名称：</span>
                <span className="ml-2">{getStringValue(variablesData.supplierCompanyName)}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">信用代码：</span>
                <span className="ml-2">{getStringValue(variablesData.supplierCreditCode)}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">账户名称：</span>
                <span className="ml-2">{getStringValue(variablesData.supplierAccountName)}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">开户行：</span>
                <span className="ml-2">{getStringValue(variablesData.supplierBankName)}</span>
              </div>
              <div className="md:col-span-2">
                <span className="text-sm font-medium text-gray-600">银行账号：</span>
                <span className="ml-2">{getStringValue(variablesData.supplierAccountNumber)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 货物信息 */}
        {contract.goodsItems && contract.goodsItems.length > 0 && (
          <Card className="bg-orange-50 border-orange-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5 text-orange-600" />
                货物信息
                <Badge variant="secondary">{contract.goodsItems.length} 项货物</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>序号</TableHead>
                      <TableHead>车型商品名称</TableHead>
                      <TableHead>指导价(元)</TableHead>
                      <TableHead>采购单价含税(元)</TableHead>
                      <TableHead>数量(辆)</TableHead>
                      <TableHead>含税总价(元)</TableHead>
                      <TableHead>不含税总价(元)</TableHead>
                      <TableHead>增值税金(元)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contract.goodsItems.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{item.vehicleModel}</TableCell>
                        <TableCell>{item.guidePrice.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell>{item.unitPriceWithTax.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell className="font-medium text-blue-600">
                          {item.totalPriceWithTax.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>{item.totalPriceWithoutTax.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell>{item.vatAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* 汇总信息 */}
              {contract.goodsSummary && (
                <div className="mt-4 bg-white p-4 rounded-lg border">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">总数量：</span>
                      <span className="font-medium">{contract.goodsSummary.totalQuantity} 辆</span>
                    </div>
                    <div>
                      <span className="text-gray-600">含税总价：</span>
                      <span className="font-medium text-blue-600">
                        ¥{contract.goodsSummary.totalPriceWithTax.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">不含税总价：</span>
                      <span className="font-medium">
                        ¥{contract.goodsSummary.totalPriceWithoutTax.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">增值税总额：</span>
                      <span className="font-medium">
                        ¥{contract.goodsSummary.totalVatAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 合同金额 */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5 text-yellow-600" />
              合同金额
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-600">合同总价数字：</span>
                <span className="ml-2 font-medium text-lg text-blue-600">
                  ¥{getFormattedNumber(variablesData.contractTotalAmount)}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">合同总价大写：</span>
                <span className="ml-2">{getStringValue(variablesData.contractTotalAmountInWords)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* 页面头部 */}
        <Card className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl text-green-800">
                  <FileText className="h-6 w-6" />
                  合同生成成功
                </CardTitle>
                <CardDescription className="mt-1 text-green-700">
                  基于模板 &ldquo;{contract.templateName}&rdquo; 生成的合同 • 生成时间：{new Date(contract.createdAt).toLocaleString('zh-CN')}
                </CardDescription>
              </div>
              <Badge variant="default" className="bg-green-600">
                已生成
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* 主要内容 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              合同预览
            </TabsTrigger>
            <TabsTrigger value="variables" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              变量数据
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>合同内容预览</CardTitle>
                <CardDescription>
                  以下是生成的完整合同内容，所有变量已替换为实际值
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-white border rounded-lg p-6 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                    {contract.content}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="variables" className="space-y-6">
            {renderVariablesPreview()}
          </TabsContent>
        </Tabs>

        {/* 操作按钮 */}
        <Card className="mt-8 bg-gray-50">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={onEdit} className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                编辑合同
              </Button>
              
              <Button 
                variant="outline" 
                onClick={onDownloadPdf}
                disabled={downloadingPdf}
                className="flex items-center gap-2"
              >
                {downloadingPdf ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4" />
                )}
                {downloadingPdf ? '生成PDF中...' : '导出PDF'}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={onDownloadWord}
                disabled={downloadingWord}
                className="flex items-center gap-2"
              >
                {downloadingWord ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {downloadingWord ? '生成Word中...' : '导出Word'}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={onRegenerate}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                重新生成
              </Button>
              
              <Button variant="ghost" asChild>
                <Link href="/templates" className="flex items-center gap-2">
                  <X className="h-4 w-4" />
                  返回模板
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
