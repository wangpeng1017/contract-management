import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { templateStorage } from '@/lib/template-storage';

// POST /api/contracts/generate - 生成合同
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, variablesData, templateName } = body;

    if (!templateId || !variablesData) {
      return NextResponse.json(
        {
          success: false,
          error: '模板ID和变量数据不能为空'
        },
        { status: 400 }
      );
    }

    // 获取模板信息
    const template = await prisma.contractTemplate.findUnique({
      where: { id: templateId },
      include: {
        variables: {
          orderBy: {
            orderIndex: 'asc'
          }
        }
      }
    });

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: '模板不存在'
        },
        { status: 404 }
      );
    }

    // 验证必填变量
    const missingRequired = template.variables
      .filter(variable => variable.required)
      .filter(variable => !variablesData[variable.name] || variablesData[variable.name].toString().trim() === '')
      .map(variable => variable.description || variable.name);

    if (missingRequired.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `以下必填项不能为空: ${missingRequired.join(', ')}`
        },
        { status: 400 }
      );
    }

    // 使用新的模板处理系统生成合同内容（支持PDF和Word模板）
    console.log('开始生成合同内容，使用格式保真系统');
    const processResult = await templateStorage.processTemplateForContract(templateId, variablesData);

    let contractContent: string;
    let generatedBuffer: Buffer | undefined;

    if (processResult.success && processResult.content) {
      contractContent = processResult.content;
      generatedBuffer = processResult.buffer; // PDF模板可能返回Buffer
      console.log('使用格式保真系统生成成功，类型:', generatedBuffer ? 'PDF模板' : 'Word模板');
    } else {
      console.log('格式保真系统失败，使用传统方法:', processResult.error);
      // 回退到传统方法
      contractContent = await generateContractContent(template, variablesData);
    }

    // 保存生成的合同
    const generatedContract = await prisma.generatedContract.create({
      data: {
        templateId,
        templateName: templateName || template.name,
        content: contractContent,
        variablesData,
        status: 'completed'
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        contractId: generatedContract.id,
        content: contractContent,
        templateName: generatedContract.templateName,
        createdAt: generatedContract.createdAt
      }
    });

  } catch (error) {
    console.error('合同生成失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '合同生成失败'
      },
      { status: 500 }
    );
  }
}

// 生成合同内容
async function generateContractContent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  template: any,
  variablesData: Record<string, unknown>
): Promise<string> {
  // 获取基础模板内容
  let baseContent = getBaseContractTemplate(template.name);

  // 创建变量映射表
  const variableMapping = createVariableMapping(variablesData);

  // 替换所有占位符
  for (const [placeholder, value] of Object.entries(variableMapping)) {
    if (value !== undefined && value !== null && value !== '') {
      const formattedValue = String(value);
      const regex = new RegExp(escapeRegExp(`[${placeholder}]`), 'g');
      baseContent = baseContent.replace(regex, formattedValue);
    }
  }

  // 替换模板变量（基于template.variables）
  for (const variable of template.variables) {
    const value = variablesData[variable.name];
    if (value !== undefined && value !== null) {
      const formattedValue = formatVariableValue(value, variable.type);
      const placeholder = `[${variable.description || variable.name}]`;
      baseContent = baseContent.replace(new RegExp(escapeRegExp(placeholder), 'g'), formattedValue);
    }
  }

  // 添加生成信息
  const currentDate = new Date().toLocaleDateString('zh-CN');
  baseContent += `\n\n--- 合同生成信息 ---\n生成时间：${currentDate}\n模板：${template.name}`;

  return baseContent;
}

// 创建变量映射表
function createVariableMapping(variablesData: Record<string, unknown>): Record<string, unknown> {
  const mapping: Record<string, unknown> = {};

  // 基础合同信息
  if (variablesData.contractNumber) mapping['合同编号'] = variablesData.contractNumber;
  if (variablesData.signingDate) mapping['签订日期'] = variablesData.signingDate;

  // 甲方信息
  if (variablesData.buyerCompanyName) mapping['甲方名称'] = variablesData.buyerCompanyName;
  if (variablesData.buyerCreditCode) mapping['甲方统一社会信用代码'] = variablesData.buyerCreditCode;
  if (variablesData.buyerAddress) mapping['甲方单位地址'] = variablesData.buyerAddress;
  if (variablesData.buyerPhone) mapping['甲方电话'] = variablesData.buyerPhone;
  if (variablesData.buyerBank) mapping['甲方开户银行'] = variablesData.buyerBank;
  if (variablesData.buyerBankAccount) mapping['甲方银行账户'] = variablesData.buyerBankAccount;

  // 乙方信息
  if (variablesData.supplierCompanyName) mapping['乙方名称'] = variablesData.supplierCompanyName;
  if (variablesData.supplierCreditCode) mapping['乙方统一社会信用代码'] = variablesData.supplierCreditCode;
  // 设置默认乙方地址和电话（如果没有提供）
  mapping['乙方地址'] = variablesData.supplierAddress || '广州市天河区';
  mapping['乙方电话'] = variablesData.supplierPhone || '020-12345678';
  if (variablesData.supplierBankName) mapping['乙方开户行'] = variablesData.supplierBankName;
  if (variablesData.supplierAccountNumber) mapping['乙方银行账号'] = variablesData.supplierAccountNumber;

  // 货物信息
  if (variablesData.vehicleModel) mapping['物品名称'] = variablesData.vehicleModel;
  if (variablesData.guidePrice) mapping['指导价'] = formatCurrency(variablesData.guidePrice);
  if (variablesData.quantity) mapping['数量'] = variablesData.quantity;
  if (variablesData.unitPriceWithTax) mapping['单价'] = formatCurrency(variablesData.unitPriceWithTax);
  if (variablesData.totalPriceWithTax) mapping['总价'] = formatCurrency(variablesData.totalPriceWithTax);

  // 合同金额
  if (variablesData.contractTotalAmount) mapping['合同金额'] = formatCurrency(variablesData.contractTotalAmount);
  if (variablesData.contractTotalAmountInWords) mapping['合同金额大写'] = variablesData.contractTotalAmountInWords;

  // 其他常用字段
  mapping['交付地点'] = '买方指定地点';
  mapping['交付日期'] = '合同签订后30个工作日内';
  mapping['验收标准'] = '符合国家相关标准';
  mapping['付款方式'] = '银行转账';
  mapping['定金比例'] = '30';
  mapping['尾款支付时间'] = '货物验收合格后7个工作日内';

  return mapping;
}

// 格式化货币
function formatCurrency(value: unknown): string {
  if (typeof value === 'number') {
    return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return String(value || '0.00');
}

// 获取基础合同模板
function getBaseContractTemplate(templateName: string): string {
  // 根据模板名称返回相应的基础模板
  if (templateName.includes('采购') || templateName.includes('金港')) {
    return `
汽车采购合同

甲方（采购方）：[甲方名称]
统一社会信用代码：[甲方统一社会信用代码]
地址：[甲方单位地址]
电话：[甲方电话]
开户银行：[甲方开户银行]
银行账户：[甲方银行账户]

乙方（供应方）：[乙方名称]
统一社会信用代码：[乙方统一社会信用代码]
地址：[乙方地址]
电话：[乙方电话]
开户行：[乙方开户行]
银行账号：[乙方银行账号]

合同编号：[合同编号]
签订日期：[签订日期]

一、采购车辆信息
车型名称：[物品名称]
指导价：[指导价]元/台
采购单价（含税）：[单价]元/台
数量：[数量]辆
含税总价：[总价]元
合同总价：[合同金额]（[合同金额大写]）

二、交付条款
交付地点：[交付地点]
交付日期：[交付日期]
验收标准：[验收标准]

三、付款条款
付款方式：[付款方式]
定金比例：[定金比例]%
尾款支付时间：[尾款支付时间]

四、质量保证
1. 乙方保证所供车辆为全新正品，符合国家相关标准和技术要求。
2. 车辆质量保证期按国家三包规定执行。
3. 如发现质量问题，乙方应负责免费维修或更换。

五、违约责任
1. 甲方逾期付款的，应按逾期金额每日万分之五向乙方支付违约金。
2. 乙方逾期交货的，应按合同总价每日万分之五向甲方支付违约金。
3. 任何一方违约造成合同无法履行的，违约方应赔偿对方损失。

六、争议解决
本合同履行过程中发生的争议，双方应友好协商解决；协商不成的，提交有管辖权的人民法院解决。

七、其他条款
1. 本合同自双方签字盖章之日起生效。
2. 本合同一式两份，甲乙双方各执一份，具有同等法律效力。
3. 本合同未尽事宜，双方可另行协商补充。

甲方（盖章）：_____________    乙方（盖章）：_____________
法定代表人：_____________    法定代表人：_____________
签订日期：[签订日期]        签订日期：[签订日期]
`;
  } else if (templateName.includes('销售')) {
    return `
销售合同

甲方（销售方）：[甲方名称]
地址：[甲方地址]
联系人：[甲方联系人]
电话：[甲方电话]

乙方（购买方）：[乙方名称]
地址：[乙方地址]
联系人：[乙方联系人]
电话：[乙方电话]

合同编号：[合同编号]
签订日期：[签订日期]

一、销售商品
商品名称：[商品名称]
规格：[商品规格]
数量：[销售数量]
单价：[销售单价]元
总金额：[总金额]元

二、交付安排
交付时间：[交付时间]
交付地点：[交付地点]
运输方式：[运输方式]

三、付款条件
付款方式：[付款方式]
付款期限：[付款期限]
开票信息：[开票信息]

四、质量保证
[质量保证条款]

五、违约责任
[违约责任条款]

甲方（盖章）：_____________ 
乙方（盖章）：_____________
签订日期：[签订日期]
`;
  } else {
    return `
合同

甲方：[甲方名称]
地址：[甲方地址]
联系人：[甲方联系人]
电话：[甲方电话]

乙方：[乙方名称]
地址：[乙方地址]
联系人：[乙方联系人]
电话：[乙方电话]

合同编号：[合同编号]
签订日期：[签订日期]

一、合同内容
[合同具体内容]

二、权利义务
甲方权利义务：[甲方权利义务]
乙方权利义务：[乙方权利义务]

三、合同金额
总金额：[合同金额]元
付款方式：[付款方式]

四、履行期限
开始时间：[开始时间]
结束时间：[结束时间]

五、违约责任
[违约责任条款]

甲方签字：_____________ 
乙方签字：_____________
签订日期：[签订日期]
`;
  }
}

// 格式化变量值
function formatVariableValue(value: unknown, type: string): string {
  if (value === null || value === undefined) {
    return '';
  }

  switch (type) {
    case 'currency':
      return typeof value === 'number' ? value.toFixed(2) : value.toString();
    case 'percentage':
      return typeof value === 'number' ? `${value}%` : `${value}%`;
    case 'date':
      if (value instanceof Date) {
        return value.toLocaleDateString('zh-CN');
      } else if (typeof value === 'string') {
        const date = new Date(value);
        return isNaN(date.getTime()) ? value : date.toLocaleDateString('zh-CN');
      }
      return value.toString();
    default:
      return value.toString();
  }
}

// 转义正则表达式特殊字符
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
