import { NextRequest, NextResponse } from 'next/server';
import { feishuTemplateStorage } from '@/lib/feishu-template-storage';

/**
 * 飞书集成测试API
 * GET /api/test/feishu-integration - 测试飞书API连接
 * POST /api/test/feishu-integration - 测试完整的飞书合同生成流程
 */

export async function GET() {
  try {
    console.log('开始飞书集成测试...');
    
    const testResults = {
      timestamp: new Date().toISOString(),
      tests: [] as Array<{
        name: string;
        status: 'success' | 'error' | 'warning';
        message: string;
        details?: any;
      }>
    };

    // 1. 测试飞书客户端初始化
    try {
      await feishuTemplateStorage.initialize();
      testResults.tests.push({
        name: '飞书客户端初始化',
        status: 'success',
        message: '飞书客户端初始化成功'
      });
    } catch (error) {
      testResults.tests.push({
        name: '飞书客户端初始化',
        status: 'error',
        message: `初始化失败: ${error instanceof Error ? error.message : '未知错误'}`,
        details: { error: error instanceof Error ? error.stack : error }
      });
    }

    // 2. 测试环境变量
    const requiredEnvVars = [
      'FEISHU_APP_ID',
      'FEISHU_APP_SECRET',
      'FEISHU_TENANT_ACCESS_TOKEN'
    ];

    for (const envVar of requiredEnvVars) {
      const value = process.env[envVar];
      testResults.tests.push({
        name: `环境变量 ${envVar}`,
        status: value ? 'success' : 'error',
        message: value ? '已配置' : '未配置',
        details: value ? { configured: true, length: value.length } : { configured: false }
      });
    }

    // 3. 测试模板列表获取
    try {
      const templates = await feishuTemplateStorage.listTemplates();
      testResults.tests.push({
        name: '模板列表获取',
        status: 'success',
        message: `成功获取 ${templates.length} 个模板`,
        details: { templateCount: templates.length, templates: templates.map(t => ({ id: t.id, name: t.name })) }
      });
    } catch (error) {
      testResults.tests.push({
        name: '模板列表获取',
        status: 'error',
        message: `获取失败: ${error instanceof Error ? error.message : '未知错误'}`,
        details: { error: error instanceof Error ? error.stack : error }
      });
    }

    // 4. 计算总体状态
    const hasErrors = testResults.tests.some(test => test.status === 'error');
    const hasWarnings = testResults.tests.some(test => test.status === 'warning');

    return NextResponse.json({
      success: !hasErrors,
      status: hasErrors ? 'error' : hasWarnings ? 'warning' : 'success',
      message: hasErrors ? '飞书集成测试失败' : hasWarnings ? '飞书集成测试有警告' : '飞书集成测试通过',
      results: testResults,
      summary: {
        total: testResults.tests.length,
        passed: testResults.tests.filter(t => t.status === 'success').length,
        failed: testResults.tests.filter(t => t.status === 'error').length,
        warnings: testResults.tests.filter(t => t.status === 'warning').length
      }
    });

  } catch (error) {
    console.error('飞书集成测试失败:', error);
    return NextResponse.json({
      success: false,
      error: `测试失败: ${error instanceof Error ? error.message : '未知错误'}`,
      details: { error: error instanceof Error ? error.stack : error }
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, testVariables, contractTitle = '测试合同' } = body;

    console.log('开始飞书合同生成测试:', { templateId, contractTitle });

    if (!templateId) {
      return NextResponse.json({
        success: false,
        error: '请提供模板ID进行测试'
      }, { status: 400 });
    }

    // 默认测试变量
    const defaultTestVariables = {
      '合同编号': 'TEST-2025-001',
      '签订时间': '2025-08-18',
      '甲方公司名称': '测试甲方公司',
      '乙方公司名称': '测试乙方公司',
      '合同金额': '100000',
      '合同总价大写': '壹拾万元整'
    };

    const variables = { ...defaultTestVariables, ...testVariables };

    console.log('使用测试变量:', variables);

    // 调用飞书合同生成
    const result = await feishuTemplateStorage.generateContract({
      templateId,
      variables,
      contractTitle,
      contractData: { testMode: true }
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '飞书合同生成测试成功',
        data: {
          contractId: result.contractId,
          downloadUrl: result.downloadUrl,
          testVariables: variables,
          processingTime: new Date().toISOString()
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: `飞书合同生成测试失败: ${result.error}`,
        details: { result }
      }, { status: 500 });
    }

  } catch (error) {
    console.error('飞书合同生成测试失败:', error);
    return NextResponse.json({
      success: false,
      error: `测试失败: ${error instanceof Error ? error.message : '未知错误'}`,
      details: { error: error instanceof Error ? error.stack : error }
    }, { status: 500 });
  }
}
