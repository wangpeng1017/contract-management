import { GoogleGenerativeAI } from '@google/generative-ai';
import { VariableType } from '@/types';

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
    const prompt = `
请分析以下合同模板内容，识别出所有需要填写的变量字段。

合同内容：
${content}

请按照以下JSON格式返回结果：
{
  "variables": [
    {
      "name": "变量名称（英文，使用驼峰命名法）",
      "type": "变量类型（text/number/date/email/phone/address/currency/percentage/select/textarea）",
      "description": "变量描述（中文）",
      "required": true/false,
      "placeholder": "占位符文本（可选）"
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

请仔细分析合同中的占位符、空白处、需要填写的字段，并给出合理的变量类型和描述。
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

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

    // 如果JSON解析失败，返回默认结果
    return {
      variables: [],
      confidence: 0.5,
      suggestions: ['AI分析失败，请手动添加变量']
    };

  } catch (error) {
    console.error('Gemini AI分析失败:', error);
    throw new Error('AI分析失败，请稍后重试');
  }
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
