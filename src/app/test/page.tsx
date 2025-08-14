'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function TestPage() {
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [testing, setTesting] = useState(false);

  // 测试API接口
  const runTests = async () => {
    setTesting(true);
    const results: Record<string, any> = {};

    try {
      // 测试1: 获取分类列表
      console.log('测试1: 获取分类列表');
      const categoriesResponse = await fetch('/api/categories');
      const categoriesResult = await categoriesResponse.json();
      results.categories = {
        success: categoriesResult.success,
        count: categoriesResult.data?.length || 0,
        data: categoriesResult.data
      };

      // 测试2: 获取模板列表
      console.log('测试2: 获取模板列表');
      const templatesResponse = await fetch('/api/templates');
      const templatesResult = await templatesResponse.json();
      results.templates = {
        success: templatesResult.success,
        count: templatesResult.data?.templates?.length || 0,
        data: templatesResult.data
      };

      // 测试3: 测试文件上传（模拟）
      console.log('测试3: 测试文件上传');
      const testFile = new File(['测试合同内容'], 'test-contract.txt', { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', testFile);
      formData.append('container', 'templates');

      try {
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const uploadResult = await uploadResponse.json();
        results.upload = {
          success: uploadResult.success,
          data: uploadResult.data,
          error: uploadResult.error
        };
      } catch (uploadError) {
        results.upload = {
          success: false,
          error: 'Upload test failed: ' + (uploadError as Error).message
        };
      }

      // 测试4: 创建测试模板
      if (results.categories.success && results.categories.data.length > 0) {
        console.log('测试4: 创建测试模板');
        const createTemplateResponse = await fetch('/api/templates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: '测试合同模板',
            description: '这是一个测试用的合同模板',
            categoryId: results.categories.data[0].id,
            filePath: '/test/test-contract.txt',
            fileName: 'test-contract.txt',
            fileSize: 100,
            mimeType: 'text/plain'
          })
        });
        const createTemplateResult = await createTemplateResponse.json();
        results.createTemplate = {
          success: createTemplateResult.success,
          data: createTemplateResult.data,
          error: createTemplateResult.error
        };

        // 测试5: AI分析模板
        if (createTemplateResult.success) {
          console.log('测试5: AI分析模板');
          const analyzeResponse = await fetch('/api/templates/analyze', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              templateId: createTemplateResult.data.id,
              content: `
测试采购合同

甲方：[甲方名称]
地址：[甲方地址]
联系人：[联系人姓名]
电话：[联系电话]

乙方：[乙方名称]
地址：[乙方地址]

合同金额：[合同金额]元
签订日期：[签订日期]
              `
            })
          });
          const analyzeResult = await analyzeResponse.json();
          results.analyze = {
            success: analyzeResult.success,
            variableCount: analyzeResult.data?.variables?.length || 0,
            data: analyzeResult.data,
            error: analyzeResult.error
          };

          // 测试6: 生成合同
          if (analyzeResult.success && analyzeResult.data.variables.length > 0) {
            console.log('测试6: 生成合同');
            const variablesData: Record<string, any> = {};
            analyzeResult.data.variables.forEach((variable: any) => {
              switch (variable.name) {
                case '甲方名称':
                  variablesData[variable.name] = '测试公司A';
                  break;
                case '甲方地址':
                  variablesData[variable.name] = '北京市朝阳区测试街道123号';
                  break;
                case '联系人姓名':
                  variablesData[variable.name] = '张三';
                  break;
                case '联系电话':
                  variablesData[variable.name] = '13800138000';
                  break;
                case '乙方名称':
                  variablesData[variable.name] = '测试公司B';
                  break;
                case '乙方地址':
                  variablesData[variable.name] = '上海市浦东新区测试路456号';
                  break;
                case '合同金额':
                  variablesData[variable.name] = '100000';
                  break;
                case '签订日期':
                  variablesData[variable.name] = new Date().toISOString().split('T')[0];
                  break;
                default:
                  variablesData[variable.name] = `测试${variable.description || variable.name}`;
              }
            });

            const generateResponse = await fetch('/api/contracts/generate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                templateId: createTemplateResult.data.id,
                templateName: '测试合同模板',
                variablesData
              })
            });
            const generateResult = await generateResponse.json();
            results.generate = {
              success: generateResult.success,
              contractId: generateResult.data?.contractId,
              data: generateResult.data,
              error: generateResult.error
            };
          }
        }
      }

      setTestResults(results);
      console.log('所有测试完成:', results);

    } catch (error) {
      console.error('测试过程中出现错误:', error);
      results.error = error instanceof Error ? error.message : '未知错误';
      setTestResults(results);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>系统功能测试</CardTitle>
          <CardDescription>
            测试智能合同管理系统的核心功能
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            <Button 
              onClick={runTests}
              disabled={testing}
              className="w-full"
            >
              {testing ? '测试中...' : '开始测试'}
            </Button>

            {Object.keys(testResults).length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">测试结果：</h3>
                
                {testResults.categories && (
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium">1. 分类列表测试</h4>
                    <p className={testResults.categories.success ? 'text-green-600' : 'text-red-600'}>
                      {testResults.categories.success ? '✅ 成功' : '❌ 失败'}
                      {testResults.categories.success && ` - 找到 ${testResults.categories.count} 个分类`}
                    </p>
                  </div>
                )}

                {testResults.templates && (
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium">2. 模板列表测试</h4>
                    <p className={testResults.templates.success ? 'text-green-600' : 'text-red-600'}>
                      {testResults.templates.success ? '✅ 成功' : '❌ 失败'}
                      {testResults.templates.success && ` - 找到 ${testResults.templates.count} 个模板`}
                    </p>
                  </div>
                )}

                {testResults.upload && (
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium">3. 文件上传测试</h4>
                    <p className={testResults.upload.success ? 'text-green-600' : 'text-red-600'}>
                      {testResults.upload.success ? '✅ 成功' : '❌ 失败'}
                      {testResults.upload.error && ` - ${testResults.upload.error}`}
                    </p>
                  </div>
                )}

                {testResults.createTemplate && (
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium">4. 创建模板测试</h4>
                    <p className={testResults.createTemplate.success ? 'text-green-600' : 'text-red-600'}>
                      {testResults.createTemplate.success ? '✅ 成功' : '❌ 失败'}
                      {testResults.createTemplate.error && ` - ${testResults.createTemplate.error}`}
                    </p>
                  </div>
                )}

                {testResults.analyze && (
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium">5. AI分析测试</h4>
                    <p className={testResults.analyze.success ? 'text-green-600' : 'text-red-600'}>
                      {testResults.analyze.success ? '✅ 成功' : '❌ 失败'}
                      {testResults.analyze.success && ` - 识别到 ${testResults.analyze.variableCount} 个变量`}
                      {testResults.analyze.error && ` - ${testResults.analyze.error}`}
                    </p>
                  </div>
                )}

                {testResults.generate && (
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium">6. 合同生成测试</h4>
                    <p className={testResults.generate.success ? 'text-green-600' : 'text-red-600'}>
                      {testResults.generate.success ? '✅ 成功' : '❌ 失败'}
                      {testResults.generate.success && ` - 合同ID: ${testResults.generate.contractId}`}
                      {testResults.generate.error && ` - ${testResults.generate.error}`}
                    </p>
                  </div>
                )}

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">详细结果：</h4>
                  <pre className="text-xs overflow-auto max-h-96">
                    {JSON.stringify(testResults, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
