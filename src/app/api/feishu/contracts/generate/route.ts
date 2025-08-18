import { NextRequest, NextResponse } from 'next/server';
import { feishuTemplateStorage } from '@/lib/feishu-template-storage';

/**
 * 飞书合同生成API
 * POST /api/feishu/contracts/generate
 */
export async function POST(request: NextRequest) {
  try {
    console.log('收到飞书合同生成请求');

    const body = await request.json();
    const { templateId, variables, contractTitle, contractData } = body;

    // 验证输入
    if (!templateId) {
      return NextResponse.json({
        success: false,
        error: '请提供模板ID'
      }, { status: 400 });
    }

    if (!variables || typeof variables !== 'object') {
      return NextResponse.json({
        success: false,
        error: '请提供变量数据'
      }, { status: 400 });
    }

    if (!contractTitle) {
      return NextResponse.json({
        success: false,
        error: '请提供合同标题'
      }, { status: 400 });
    }

    console.log('合同生成参数:', {
      templateId,
      contractTitle,
      variableCount: Object.keys(variables).length
    });

    // 生成合同
    const result = await feishuTemplateStorage.generateContract({
      templateId,
      variables,
      contractTitle,
      contractData
    });

    if (result.success) {
      console.log('飞书合同生成成功:', result.contractId);
      
      return NextResponse.json({
        success: true,
        contractId: result.contractId,
        downloadUrl: result.downloadUrl,
        message: '合同生成成功'
      });
    } else {
      console.error('飞书合同生成失败:', result.error);
      
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }

  } catch (error) {
    console.error('飞书合同生成API错误:', error);
    
    return NextResponse.json({
      success: false,
      error: `生成失败: ${error instanceof Error ? error.message : '未知错误'}`
    }, { status: 500 });
  }
}

/**
 * 获取生成状态
 * GET /api/feishu/contracts/generate
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: '飞书合同生成API运行正常',
      features: [
        '基于飞书文档API',
        '完美格式保真',
        '智能变量替换',
        '多格式导出'
      ],
      supportedOutputFormats: ['DOCX', 'PDF'],
      processing: {
        averageTime: '10-30秒',
        maxFileSize: '50MB',
        concurrentLimit: 10
      }
    });
  } catch (error) {
    console.error('获取生成状态失败:', error);
    return NextResponse.json({
      success: false,
      error: '服务不可用'
    }, { status: 500 });
  }
}
