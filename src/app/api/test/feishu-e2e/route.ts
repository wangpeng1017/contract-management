import { NextRequest, NextResponse } from 'next/server';
import { contractTestCases, formatFidelityChecks, generateTestReport } from '@/lib/test-data/contract-test-cases';
import { feishuTemplateStorage } from '@/lib/feishu-template-storage';
import { prisma } from '@/lib/database';

/**
 * 飞书API端到端测试
 * POST /api/test/feishu-e2e - 执行完整的端到端测试套件
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, testCaseNames = [], runAllTests = true } = body;

    console.log('开始飞书端到端测试:', { templateId, testCaseNames, runAllTests });

    if (!templateId) {
      return NextResponse.json({
        success: false,
        error: '请提供模板ID进行测试'
      }, { status: 400 });
    }

    // 获取模板信息
    const template = await prisma.template.findUnique({
      where: { id: templateId },
      include: { variables: true }
    });

    if (!template) {
      return NextResponse.json({
        success: false,
        error: '模板不存在'
      }, { status: 404 });
    }

    console.log('找到模板:', { name: template.name, variableCount: template.variables.length });

    // 选择要运行的测试用例
    let testCasesToRun = contractTestCases;
    if (!runAllTests && testCaseNames.length > 0) {
      testCasesToRun = contractTestCases.filter(tc => testCaseNames.includes(tc.name));
    }

    // 为每个测试用例设置模板ID
    testCasesToRun = testCasesToRun.map(tc => ({ ...tc, templateId }));

    console.log(`准备运行 ${testCasesToRun.length} 个测试用例`);

    const testResults = [];
    let overallSuccess = true;

    // 执行每个测试用例
    for (const testCase of testCasesToRun) {
      console.log(`执行测试用例: ${testCase.name}`);
      
      try {
        // 1. 验证测试数据
        const validationResult = validateTestCase(testCase, template.variables);
        if (!validationResult.valid) {
          testResults.push({
            testCase: testCase.name,
            success: false,
            error: `测试数据验证失败: ${validationResult.errors.join(', ')}`,
            timestamp: new Date().toISOString()
          });
          overallSuccess = false;
          continue;
        }

        // 2. 执行合同生成
        const contractResult = await generateContractWithFeishu(testCase);
        
        if (!contractResult.success) {
          testResults.push({
            testCase: testCase.name,
            success: false,
            error: `合同生成失败: ${contractResult.error}`,
            timestamp: new Date().toISOString()
          });
          overallSuccess = false;
          continue;
        }

        // 3. 执行格式保真度检查
        const fidelityResults = await performFidelityChecks(
          template.filePath,
          contractResult.data.downloadUrl
        );

        // 4. 生成测试报告
        const testReport = generateTestReport(testCase, contractResult, fidelityResults);
        testResults.push(testReport);

        if (!testReport.success) {
          overallSuccess = false;
        }

        console.log(`测试用例 ${testCase.name} 完成:`, { 
          success: testReport.success, 
          score: testReport.overallScore 
        });

      } catch (error) {
        console.error(`测试用例 ${testCase.name} 执行失败:`, error);
        testResults.push({
          testCase: testCase.name,
          success: false,
          error: `测试执行异常: ${error instanceof Error ? error.message : '未知错误'}`,
          timestamp: new Date().toISOString()
        });
        overallSuccess = false;
      }
    }

    // 生成总体测试报告
    const summary = generateTestSummary(testResults);

    console.log('端到端测试完成:', summary);

    return NextResponse.json({
      success: overallSuccess,
      message: overallSuccess ? '所有测试通过' : '部分测试失败',
      summary,
      results: testResults,
      template: {
        id: template.id,
        name: template.name,
        variableCount: template.variables.length
      }
    });

  } catch (error) {
    console.error('端到端测试失败:', error);
    return NextResponse.json({
      success: false,
      error: `测试失败: ${error instanceof Error ? error.message : '未知错误'}`,
      details: { error: error instanceof Error ? error.stack : error }
    }, { status: 500 });
  }
}

/**
 * 验证测试用例数据
 */
function validateTestCase(testCase: any, templateVariables: any[]) {
  const errors = [];
  const templateVarNames = templateVariables.map(v => v.name);

  // 检查必填字段
  for (const requiredField of testCase.validationRules.requiredFields) {
    if (!testCase.variables[requiredField]) {
      errors.push(`缺少必填字段: ${requiredField}`);
    }
  }

  // 检查格式验证
  for (const [field, pattern] of Object.entries(testCase.validationRules.formatValidation)) {
    const value = testCase.variables[field];
    if (value && !(pattern as RegExp).test(value)) {
      errors.push(`字段 ${field} 格式不正确: ${value}`);
    }
  }

  // 检查变量是否在模板中存在
  for (const varName of Object.keys(testCase.variables)) {
    if (!templateVarNames.includes(varName)) {
      console.warn(`变量 ${varName} 在模板中不存在`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 使用飞书API生成合同
 */
async function generateContractWithFeishu(testCase: any) {
  try {
    const result = await feishuTemplateStorage.generateContract({
      templateId: testCase.templateId,
      variables: testCase.variables,
      contractTitle: `测试合同-${testCase.name}`,
      contractData: { 
        testMode: true,
        testCase: testCase.name
      }
    });

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

/**
 * 执行格式保真度检查
 */
async function performFidelityChecks(originalTemplatePath: string, generatedContractUrl: string) {
  const results = [];

  for (const check of formatFidelityChecks) {
    try {
      // 这里应该实现实际的格式比较逻辑
      // 目前返回模拟结果
      const result = check.checkFunction(originalTemplatePath, generatedContractUrl);
      results.push({
        name: check.name,
        description: check.description,
        ...result
      });
    } catch (error) {
      results.push({
        name: check.name,
        description: check.description,
        passed: false,
        score: 0,
        details: `检查失败: ${error instanceof Error ? error.message : '未知错误'}`
      });
    }
  }

  return results;
}

/**
 * 生成测试摘要
 */
function generateTestSummary(testResults: any[]) {
  const total = testResults.length;
  const passed = testResults.filter(r => r.success).length;
  const failed = total - passed;
  
  const scores = testResults
    .filter(r => r.overallScore !== undefined)
    .map(r => r.overallScore);
  
  const averageScore = scores.length > 0 
    ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : 0;

  return {
    total,
    passed,
    failed,
    passRate: Math.round((passed / total) * 100),
    averageFidelityScore: averageScore,
    status: failed === 0 ? 'success' : passed > 0 ? 'partial' : 'failed'
  };
}
