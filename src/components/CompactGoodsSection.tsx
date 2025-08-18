'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Calculator } from 'lucide-react';

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

interface CompactGoodsSectionProps {
  goodsItems: GoodsItem[];
  setGoodsItems: (items: GoodsItem[]) => void;
  onAmountChange?: (totalAmount: number, totalAmountWords: string) => void;
}

export default function CompactGoodsSection({ 
  goodsItems, 
  setGoodsItems, 
  onAmountChange 
}: CompactGoodsSectionProps) {
  // 添加新货物
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
    setGoodsItems([...goodsItems, newItem]);
  };

  // 删除货物
  const removeGoodsItem = (id: string) => {
    const newItems = goodsItems.filter(item => item.id !== id);
    setGoodsItems(newItems);
    calculateTotalAmount(newItems);
  };

  // 更新货物信息
  const updateGoodsItem = (id: string, field: keyof GoodsItem, value: string | number) => {
    const newItems = goodsItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // 自动计算相关金额
        if (field === 'unitPriceWithTax' || field === 'quantity') {
          const unitPrice = field === 'unitPriceWithTax' ? Number(value) : updatedItem.unitPriceWithTax;
          const quantity = field === 'quantity' ? Number(value) : updatedItem.quantity;
          
          updatedItem.totalPriceWithTax = unitPrice * quantity;
          updatedItem.totalPriceWithoutTax = updatedItem.totalPriceWithTax / 1.13; // 假设13%增值税
          updatedItem.vatAmount = updatedItem.totalPriceWithTax - updatedItem.totalPriceWithoutTax;
        }
        
        return updatedItem;
      }
      return item;
    });
    
    setGoodsItems(newItems);
    calculateTotalAmount(newItems);
  };

  // 计算总金额
  const calculateTotalAmount = (items: GoodsItem[]) => {
    const totalAmount = items.reduce((sum, item) => sum + item.totalPriceWithTax, 0);
    const totalAmountWords = convertToChineseNumber(totalAmount);
    onAmountChange?.(totalAmount, totalAmountWords);
  };

  // 数字转中文大写
  const convertToChineseNumber = (num: number): string => {
    if (num === 0) return '零元整';
    
    const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
    const units = ['', '拾', '佰', '仟', '万', '拾', '佰', '仟', '亿'];
    
    const numStr = Math.floor(num).toString();
    let result = '';
    
    for (let i = 0; i < numStr.length; i++) {
      const digit = parseInt(numStr[i]);
      const unitIndex = numStr.length - i - 1;
      
      if (digit !== 0) {
        result += digits[digit] + units[unitIndex];
      } else if (result && !result.endsWith('零')) {
        result += '零';
      }
    }
    
    return result.replace(/零+$/, '') + '元整';
  };

  // 获取汇总信息
  const getSummary = () => {
    const totalQuantity = goodsItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = goodsItems.reduce((sum, item) => sum + item.totalPriceWithTax, 0);
    const totalVat = goodsItems.reduce((sum, item) => sum + item.vatAmount, 0);
    
    return { totalQuantity, totalAmount, totalVat };
  };

  const summary = getSummary();

  return (
    <div className="space-y-3">
      {/* 货物列表 */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {goodsItems.map((item, index) => (
          <Card key={item.id} className="border border-gray-200">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="text-xs">
                  货物 {index + 1}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeGoodsItem(item.id)}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">车型名称</Label>
                  <Input
                    value={item.vehicleModel}
                    onChange={(e) => updateGoodsItem(item.id, 'vehicleModel', e.target.value)}
                    placeholder="驱逐舰05"
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">指导价</Label>
                  <Input
                    type="number"
                    value={item.guidePrice || ''}
                    onChange={(e) => updateGoodsItem(item.id, 'guidePrice', Number(e.target.value))}
                    placeholder="300000"
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">含税单价</Label>
                  <Input
                    type="number"
                    value={item.unitPriceWithTax || ''}
                    onChange={(e) => updateGoodsItem(item.id, 'unitPriceWithTax', Number(e.target.value))}
                    placeholder="280000"
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">数量</Label>
                  <Input
                    type="number"
                    value={item.quantity || ''}
                    onChange={(e) => updateGoodsItem(item.id, 'quantity', Number(e.target.value))}
                    placeholder="1"
                    className="h-7 text-xs"
                  />
                </div>
              </div>
              
              {/* 计算结果 */}
              {item.totalPriceWithTax > 0 && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                  <div className="flex justify-between">
                    <span>含税总价:</span>
                    <span className="font-medium">¥{item.totalPriceWithTax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>不含税:</span>
                    <span>¥{item.totalPriceWithoutTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>增值税:</span>
                    <span>¥{item.vatAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 添加货物按钮 */}
      <Button
        variant="outline"
        size="sm"
        onClick={addGoodsItem}
        className="w-full h-8 text-xs"
      >
        <Plus className="h-3 w-3 mr-1" />
        添加货物
      </Button>

      {/* 汇总信息 */}
      {goodsItems.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">汇总统计</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="text-gray-600">总数量</div>
                <div className="font-medium text-blue-900">{summary.totalQuantity} 辆</div>
              </div>
              <div className="text-center">
                <div className="text-gray-600">总金额</div>
                <div className="font-medium text-blue-900">¥{summary.totalAmount.toLocaleString()}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-600">增值税</div>
                <div className="font-medium text-blue-900">¥{summary.totalVat.toFixed(2)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
