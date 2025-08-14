import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

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

    // 生成合同内容
    const contractContent = await generateContractContent(template, variablesData);

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
  // 获取基础模板内容（这里使用示例内容，实际应用中应该从文件中读取）
  let baseContent = getBaseContractTemplate(template.name);

  // 替换变量
  for (const variable of template.variables) {
    const value = variablesData[variable.name];
    if (value !== undefined && value !== null) {
      // 格式化值
      const formattedValue = formatVariableValue(value, variable.type);
      
      // 替换模板中的占位符
      const placeholder = `[${variable.description || variable.name}]`;
      baseContent = baseContent.replace(new RegExp(escapeRegExp(placeholder), 'g'), formattedValue);
    }
  }

  // 添加生成信息
  const currentDate = new Date().toLocaleDateString('zh-CN');
  baseContent += `\n\n--- 合同生成信息 ---\n生成时间：${currentDate}\n模板：${template.name}`;

  return baseContent;
}

// 获取基础合同模板
function getBaseContractTemplate(templateName: string): string {
  // 根据模板名称返回相应的基础模板
  if (templateName.includes('采购')) {
    return `
采购合同

甲方（采购方）：[甲方名称]
地址：[甲方地址]
联系人：[甲方联系人]
电话：[甲方电话]
邮箱：[甲方邮箱]

乙方（供应方）：[乙方名称]
地址：[乙方地址]
联系人：[乙方联系人]
电话：[乙方电话]
邮箱：[乙方邮箱]

合同编号：[合同编号]
签订日期：[签订日期]

一、采购物品
物品名称：[物品名称]
规格型号：[规格型号]
数量：[数量]
单价：[单价]元
总价：[总价]元

二、交付条款
交付地点：[交付地点]
交付日期：[交付日期]
验收标准：[验收标准]

三、付款条款
付款方式：[付款方式]
定金比例：[定金比例]%
尾款支付时间：[尾款支付时间]

四、违约责任
如一方违约，应承担相应的违约责任，并赔偿对方因此造成的损失。

五、争议解决
本合同履行过程中发生的争议，双方应友好协商解决；协商不成的，提交有管辖权的人民法院解决。

六、其他条款
本合同自双方签字盖章之日起生效，一式两份，甲乙双方各执一份。

甲方签字：_____________ 日期：_____________
乙方签字：_____________ 日期：_____________
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
