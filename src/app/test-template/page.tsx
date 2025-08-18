'use client';

import { useState } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Download, AlertCircle } from 'lucide-react';

interface TestResult {
  success: boolean;
  message?: string;
  error?: string;
  step?: string;
  results?: {
    parsing: {
      success: boolean;
      contentLength?: number;
      markdownLength?: number;
      metadata?: any;
    };
    variableReplacement: {
      success: boolean;
      replacedCount?: number;
      processedLength?: number;
    };
    wordGeneration: {
      success: boolean;
      bufferSize?: number;
      metadata?: any;
    };
  };
  previews?: {
    originalContent?: string;
    originalMarkdown?: string;
    processedMarkdown?: string;
  };
}

export default function TestTemplatePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setTestResult(null);
    }
  };

  const handleTestTemplate = async () => {
    if (!selectedFile) {
      alert('请先选择模板文件');
      return;
    }

    setIsUploading(true);
    setTestResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/test/parse-template', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setTestResult(result);

    } catch (error) {
      setTestResult({
        success: false,
        error: `测试失败: ${error instanceof Error ? error.message : '未知错误'}`,
        step: 'request'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const renderTestResults = () => {
    if (!testResult) return null;

    return (
      <div className="mt-6 space-y-4">
        <div className={`p-4 rounded-lg border ${
          testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {testResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <h3 className="font-semibold">
              {testResult.success ? '测试成功' : '测试失败'}
            </h3>
          </div>
          
          {testResult.message && (
            <p className="text-sm text-gray-600 mb-2">{testResult.message}</p>
          )}
          
          {testResult.error && (
            <p className="text-sm text-red-600 mb-2">错误: {testResult.error}</p>
          )}
          
          {testResult.step && (
            <p className="text-sm text-gray-500">失败步骤: {testResult.step}</p>
          )}
        </div>

        {testResult.results && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800">详细结果:</h4>
            
            {/* 解析结果 */}
            <div className="p-3 bg-gray-50 rounded border">
              <div className="flex items-center gap-2 mb-2">
                {testResult.results.parsing.success ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="font-medium">文档解析</span>
              </div>
              {testResult.results.parsing.success && (
                <div className="text-sm text-gray-600 space-y-1">
                  <p>原始内容长度: {testResult.results.parsing.contentLength}</p>
                  <p>Markdown长度: {testResult.results.parsing.markdownLength}</p>
                  {testResult.results.parsing.metadata && (
                    <p>元数据: {JSON.stringify(testResult.results.parsing.metadata)}</p>
                  )}
                </div>
              )}
            </div>

            {/* 变量替换结果 */}
            <div className="p-3 bg-gray-50 rounded border">
              <div className="flex items-center gap-2 mb-2">
                {testResult.results.variableReplacement.success ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="font-medium">变量替换</span>
              </div>
              {testResult.results.variableReplacement.success && (
                <div className="text-sm text-gray-600 space-y-1">
                  <p>替换变量数: {testResult.results.variableReplacement.replacedCount}</p>
                  <p>处理后长度: {testResult.results.variableReplacement.processedLength}</p>
                </div>
              )}
            </div>

            {/* Word生成结果 */}
            <div className="p-3 bg-gray-50 rounded border">
              <div className="flex items-center gap-2 mb-2">
                {testResult.results.wordGeneration.success ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="font-medium">Word文档生成</span>
              </div>
              {testResult.results.wordGeneration.success && (
                <div className="text-sm text-gray-600 space-y-1">
                  <p>文档大小: {testResult.results.wordGeneration.bufferSize} 字节</p>
                  {testResult.results.wordGeneration.metadata && (
                    <p>生成元数据: {JSON.stringify(testResult.results.wordGeneration.metadata)}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {testResult.previews && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800">内容预览:</h4>
            
            {testResult.previews.originalContent && (
              <div className="p-3 bg-blue-50 rounded border">
                <h5 className="font-medium mb-2">原始HTML内容:</h5>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-auto max-h-32">
                  {testResult.previews.originalContent}
                </pre>
              </div>
            )}

            {testResult.previews.originalMarkdown && (
              <div className="p-3 bg-green-50 rounded border">
                <h5 className="font-medium mb-2">转换后的Markdown:</h5>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-auto max-h-32">
                  {testResult.previews.originalMarkdown}
                </pre>
              </div>
            )}

            {testResult.previews.processedMarkdown && (
              <div className="p-3 bg-yellow-50 rounded border">
                <h5 className="font-medium mb-2">变量替换后的Markdown:</h5>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-auto max-h-32">
                  {testResult.previews.processedMarkdown}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">模板保真度测试</h1>
              <p className="text-gray-600">测试新的文档处理系统的格式保真度</p>
            </div>
          </div>

          {/* 说明信息 */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">测试说明:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>上传.doc或.docx格式的模板文件</li>
                  <li>系统将解析文档并转换为Markdown格式</li>
                  <li>进行模拟变量替换测试</li>
                  <li>重新生成Word文档并检查格式保真度</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 文件上传 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择模板文件
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".doc,.docx"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {selectedFile && (
                <div className="text-sm text-gray-600">
                  已选择: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>
          </div>

          {/* 测试按钮 */}
          <div className="mb-6">
            <button
              onClick={handleTestTemplate}
              disabled={!selectedFile || isUploading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  测试中...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  开始测试
                </>
              )}
            </button>
          </div>

          {/* 测试结果 */}
          {renderTestResults()}
        </div>
      </div>
    </div>
  );
}
