import { GoogleGenerativeAI } from '@google/generative-ai';
import { VariableType } from '@/types';

// 检查API密钥
if (!process.env.GOOGLE_GEMINI_API_KEY) {
  console.error('GOOGLE_GEMINI_API_KEY环境变量未设置');
}

// 初始化Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

// 获取Gemini模型
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// 分析合同模板并提取变量
export async function analyzeContractTemplate(content: string): Promise<{
  variables: Array<{
    name: string;
    type: VariableType;
    description: string;
    required: boolean;
    placeholder?: string;
  }>;
  confidence: number;
  suggestions?: string[];
}> {
  try {
    console.log('Gemini API Key存在:', !!process.env.GOOGLE_GEMINI_API_KEY);
    console.log('分析内容长度:', content.length);
    const prompt = `
请分析以下合同模板内容，识别出所有需要填写的变量字段。请特别关注合同中的关键信息字段。

合同内容：
${content}

请按照以下JSON格式返回结果，必须包含以下关键变量（如果合同中存在相关信息）：

{
  "variables": [
    // 基础合同信息
    {
      "name": "contractNumber",
      "type": "text",
      "description": "合同编号",
      "required": true,
      "placeholder": "请输入合同编号"
    },
    {
      "name": "signingDate",
      "type": "date",
      "description": "签订时间",
      "required": true,
      "placeholder": "请选择签订日期"
    },

    // 甲方信息（采购方）
    {
      "name": "buyerCompanyName",
      "type": "text",
      "description": "甲方公司名称",
      "required": true,
      "placeholder": "广州有限公司"
    },
    {
      "name": "buyerCreditCode",
      "type": "text",
      "description": "甲方统一社会信用代码",
      "required": true,
      "placeholder": "914401153475269766"
    },

    // 乙方信息（供货方）
    {
      "name": "supplierCompanyName",
      "type": "text",
      "description": "乙方公司名称",
      "required": true,
      "placeholder": "广州舶源科技有限公司"
    },
    {
      "name": "supplierCreditCode",
      "type": "text",
      "description": "乙方统一社会信用代码",
      "required": true,
      "placeholder": "91440101MA9XYTH73D"
    },

    // 货物信息
    {
      "name": "vehicleModel",
      "type": "text",
      "description": "车型商品名称",
      "required": true,
      "placeholder": "驱逐舰05"
    },
    {
      "name": "guidePrice",
      "type": "currency",
      "description": "指导价（元/台）",
      "required": true,
      "placeholder": "请输入指导价"
    },
    {
      "name": "unitPriceWithTax",
      "type": "currency",
      "description": "采购单价含税",
      "required": true,
      "placeholder": "请输入含税单价"
    },
    {
      "name": "quantity",
      "type": "number",
      "description": "数量（辆）",
      "required": true,
      "placeholder": "请输入数量"
    },
    {
      "name": "totalPriceWithTax",
      "type": "currency",
      "description": "采购含税总价",
      "required": true,
      "placeholder": "请输入含税总价"
    },
    {
      "name": "totalPriceWithoutTax",
      "type": "currency",
      "description": "不含税总价",
      "required": true,
      "placeholder": "请输入不含税总价"
    },
    {
      "name": "vatAmount",
      "type": "currency",
      "description": "增值税金总额",
      "required": true,
      "placeholder": "请输入增值税金额"
    },

    // 合同金额
    {
      "name": "contractTotalAmount",
      "type": "currency",
      "description": "合同总价数字",
      "required": true,
      "placeholder": "请输入合同总价"
    },
    {
      "name": "contractTotalAmountInWords",
      "type": "text",
      "description": "合同总价大写",
      "required": true,
      "placeholder": "请输入中文大写金额"
    },

    // 乙方银行信息
    {
      "name": "supplierAccountName",
      "type": "text",
      "description": "乙方账户名称",
      "required": true,
      "placeholder": "广州舶源科技有限公司"
    },
    {
      "name": "supplierBankName",
      "type": "text",
      "description": "乙方开户行",
      "required": true,
      "placeholder": "招商银行青岛分行市南支行"
    },
    {
      "name": "supplierAccountNumber",
      "type": "text",
      "description": "乙方银行账号",
      "required": true,
      "placeholder": "532914066410788"
    },

    // 甲方开票信息
    {
      "name": "buyerInvoiceName",
      "type": "text",
      "description": "甲方开票名称",
      "required": true,
      "placeholder": "广州金港汽车国际贸易有限公司"
    },
    {
      "name": "buyerTaxNumber",
      "type": "text",
      "description": "甲方税号",
      "required": true,
      "placeholder": "914401153475269766"
    },
    {
      "name": "buyerAddress",
      "type": "address",
      "description": "甲方单位地址",
      "required": true,
      "placeholder": "广州市南沙区龙穴街港荣一街3号405-4室"
    },
    {
      "name": "buyerPhone",
      "type": "phone",
      "description": "甲方电话",
      "required": true,
      "placeholder": "020-39002350"
    },
    {
      "name": "buyerBankName",
      "type": "text",
      "description": "甲方开户银行",
      "required": true,
      "placeholder": "中国建设银行广州黄阁分理处"
    },
    {
      "name": "buyerBankAccount",
      "type": "text",
      "description": "甲方银行账户",
      "required": true,
      "placeholder": "44050139210100000070"
    }
  ],
  "confidence": 0.95,
  "suggestions": ["改进建议1", "改进建议2"]
}

变量类型说明：
- text: 普通文本
- number: 数字
- date: 日期
- email: 邮箱地址
- phone: 电话号码
- address: 地址
- currency: 货币金额
- percentage: 百分比
- select: 选择项（如果有固定选项）
- textarea: 长文本

请基于上述模板，分析合同内容并返回完整的变量列表。如果合同中还有其他重要字段，请一并包含。
`;

    console.log('发送Gemini API请求...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log('Gemini API响应长度:', text.length);
    console.log('Gemini API响应预览:', text.substring(0, 500));

    // 尝试解析JSON响应
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          variables: parsed.variables || [],
          confidence: parsed.confidence || 0.8,
          suggestions: parsed.suggestions || []
        };
      }
    } catch (parseError) {
      console.error('解析Gemini响应失败:', parseError);
    }

    // 如果JSON解析失败，返回完整的关键变量模板
    console.log('JSON解析失败，返回完整变量模板');
    return getCompleteVariableTemplate();

  } catch (error) {
    console.error('Gemini AI分析失败:', error);
    console.log('返回降级方案：完整变量模板');

    // 不抛出错误，而是返回完整的降级方案
    return getCompleteVariableTemplate();
  }
}

// 获取完整的变量模板（降级方案）
function getCompleteVariableTemplate() {
  return {
    variables: [
      // 基础合同信息
      {
        name: 'contractNumber',
        type: 'text' as VariableType,
        description: '合同编号',
        required: true,
        placeholder: '请输入合同编号'
      },
      {
        name: 'signingDate',
        type: 'date' as VariableType,
        description: '签订时间',
        required: true,
        placeholder: '请选择签订日期'
      },

      // 甲方信息（采购方）
      {
        name: 'buyerCompanyName',
        type: 'text' as VariableType,
        description: '甲方公司名称',
        required: true,
        placeholder: '广州有限公司'
      },
      {
        name: 'buyerCreditCode',
        type: 'text' as VariableType,
        description: '甲方统一社会信用代码',
        required: true,
        placeholder: '914401153475269766'
      },

      // 乙方信息（供货方）
      {
        name: 'supplierCompanyName',
        type: 'text' as VariableType,
        description: '乙方公司名称',
        required: true,
        placeholder: '广州舶源科技有限公司'
      },
      {
        name: 'supplierCreditCode',
        type: 'text' as VariableType,
        description: '乙方统一社会信用代码',
        required: true,
        placeholder: '91440101MA9XYTH73D'
      },

      // 货物信息
      {
        name: 'vehicleModel',
        type: 'text' as VariableType,
        description: '车型商品名称',
        required: true,
        placeholder: '驱逐舰05'
      },
      {
        name: 'guidePrice',
        type: 'currency' as VariableType,
        description: '指导价（元/台）',
        required: true,
        placeholder: '请输入指导价'
      },
      {
        name: 'unitPriceWithTax',
        type: 'currency' as VariableType,
        description: '采购单价含税',
        required: true,
        placeholder: '请输入含税单价'
      },
      {
        name: 'quantity',
        type: 'number' as VariableType,
        description: '数量（辆）',
        required: true,
        placeholder: '请输入数量'
      },
      {
        name: 'totalPriceWithTax',
        type: 'currency' as VariableType,
        description: '采购含税总价',
        required: true,
        placeholder: '请输入含税总价'
      },
      {
        name: 'totalPriceWithoutTax',
        type: 'currency' as VariableType,
        description: '不含税总价',
        required: true,
        placeholder: '请输入不含税总价'
      },
      {
        name: 'vatAmount',
        type: 'currency' as VariableType,
        description: '增值税金总额',
        required: true,
        placeholder: '请输入增值税金额'
      },

      // 合同金额
      {
        name: 'contractTotalAmount',
        type: 'currency' as VariableType,
        description: '合同总价数字',
        required: true,
        placeholder: '请输入合同总价'
      },
      {
        name: 'contractTotalAmountInWords',
        type: 'text' as VariableType,
        description: '合同总价大写',
        required: true,
        placeholder: '请输入中文大写金额'
      },

      // 乙方银行信息
      {
        name: 'supplierAccountName',
        type: 'text' as VariableType,
        description: '乙方账户名称',
        required: true,
        placeholder: '广州舶源科技有限公司'
      },
      {
        name: 'supplierBankName',
        type: 'text' as VariableType,
        description: '乙方开户行',
        required: true,
        placeholder: '招商银行青岛分行市南支行'
      },
      {
        name: 'supplierAccountNumber',
        type: 'text' as VariableType,
        description: '乙方银行账号',
        required: true,
        placeholder: '532914066410788'
      },

      // 甲方开票信息
      {
        name: 'buyerInvoiceName',
        type: 'text' as VariableType,
        description: '甲方开票名称',
        required: true,
        placeholder: '广州金港汽车国际贸易有限公司'
      },
      {
        name: 'buyerTaxNumber',
        type: 'text' as VariableType,
        description: '甲方税号',
        required: true,
        placeholder: '914401153475269766'
      },
      {
        name: 'buyerAddress',
        type: 'address' as VariableType,
        description: '甲方单位地址',
        required: true,
        placeholder: '广州市南沙区龙穴街港荣一街3号405-4室'
      },
      {
        name: 'buyerPhone',
        type: 'phone' as VariableType,
        description: '甲方电话',
        required: true,
        placeholder: '020-39002350'
      },
      {
        name: 'buyerBankName',
        type: 'text' as VariableType,
        description: '甲方开户银行',
        required: true,
        placeholder: '中国建设银行广州黄阁分理处'
      },
      {
        name: 'buyerBankAccount',
        type: 'text' as VariableType,
        description: '甲方银行账户',
        required: true,
        placeholder: '44050139210100000070'
      }
    ],
    confidence: 0.8,
    suggestions: ['AI服务暂时不可用，已提供完整的合同变量模板，包含22个关键字段']
  };
}

// 生成对话式问题
export async function generateChatQuestion(
  templateName: string,
  variable: {
    name: string;
    type: string;
    description: string;
    required: boolean;
  },
  context?: Record<string, unknown>
): Promise<string> {
  try {
    const contextInfo = context ? `已收集的信息：${JSON.stringify(context, null, 2)}` : '';
    
    const prompt = `
你是一个专业的合同助手，正在帮助用户填写"${templateName}"合同。

当前需要收集的变量信息：
- 变量名：${variable.name}
- 类型：${variable.type}
- 描述：${variable.description}
- 是否必填：${variable.required ? '是' : '否'}

${contextInfo}

请生成一个友好、专业的问题来收集这个变量的信息。问题应该：
1. 简洁明了
2. 符合中文表达习惯
3. 根据变量类型给出适当的提示
4. 如果是必填项，要适当强调重要性

直接返回问题文本，不需要其他格式。
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();

  } catch (error) {
    console.error('生成对话问题失败:', error);
    // 返回默认问题
    return `请提供${variable.description}信息：`;
  }
}

// 验证用户输入
export async function validateUserInput(
  input: string,
  variable: {
    name: string;
    type: string;
    description: string;
    required: boolean;
  }
): Promise<{
  isValid: boolean;
  normalizedValue?: unknown;
  error?: string;
  suggestion?: string;
}> {
  try {
    // 基础验证
    if (variable.required && (!input || input.trim() === '')) {
      return {
        isValid: false,
        error: '这是必填项，请提供相关信息'
      };
    }

    if (!input || input.trim() === '') {
      return {
        isValid: true,
        normalizedValue: null
      };
    }

    // 根据类型进行验证
    switch (variable.type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input)) {
          return {
            isValid: false,
            error: '请输入有效的邮箱地址',
            suggestion: '例如：example@company.com'
          };
        }
        break;

      case 'phone':
        const phoneRegex = /^1[3-9]\d{9}$/;
        const cleanPhone = input.replace(/\D/g, '');
        if (!phoneRegex.test(cleanPhone)) {
          return {
            isValid: false,
            error: '请输入有效的手机号码',
            suggestion: '例如：13800138000'
          };
        }
        return {
          isValid: true,
          normalizedValue: cleanPhone
        };

      case 'number':
        const num = parseFloat(input);
        if (isNaN(num)) {
          return {
            isValid: false,
            error: '请输入有效的数字'
          };
        }
        return {
          isValid: true,
          normalizedValue: num
        };

      case 'currency':
        const currencyRegex = /^\d+(\.\d{1,2})?$/;
        const cleanCurrency = input.replace(/[^\d.]/g, '');
        if (!currencyRegex.test(cleanCurrency)) {
          return {
            isValid: false,
            error: '请输入有效的金额',
            suggestion: '例如：1000.00'
          };
        }
        return {
          isValid: true,
          normalizedValue: parseFloat(cleanCurrency)
        };

      case 'date':
        const date = new Date(input);
        if (isNaN(date.getTime())) {
          return {
            isValid: false,
            error: '请输入有效的日期',
            suggestion: '例如：2024-01-01 或 2024年1月1日'
          };
        }
        return {
          isValid: true,
          normalizedValue: date.toISOString().split('T')[0]
        };

      default:
        return {
          isValid: true,
          normalizedValue: input.trim()
        };
    }

    return {
      isValid: true,
      normalizedValue: input.trim()
    };

  } catch (error) {
    console.error('验证用户输入失败:', error);
    return {
      isValid: true,
      normalizedValue: input.trim()
    };
  }
}
