'use client';

import { useState } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Trash2 } from 'lucide-react';

interface PDFTestResult {
  success: boolean;
  message?: string;
  error?: string;
  step?: string;
  results?: {
    parsing: {
      success: boolean;
      contentLength?: number;
      pageCount?: number;
      hasImages?: boolean;
      hasTables?: boolean;
      metadata?: {
        title?: string;
        author?: string;
        pageCount: number;
        hasImages: boolean;
        hasTables: boolean;
      };
    };
    variableReplacement: {
      success: boolean;
      replacedCount?: number;
      variables?: Array<{
        placeholder: string;
        type: string;
        value: string;
      }>;
    };
    wordGeneration: {
      success: boolean;
      bufferSize?: number;
      metadata?: {
        pageCount?: number;
        wordCount?: number;
      };
    };
  };
  previews?: {
    originalContent?: string;
    layoutInfo?: {
      paragraphCount: number;
      tableCount: number;
      headerCount: number;
    };
    pageInfo?: Array<{
      pageNumber: number;
      textLength: number;
      textItemCount: number;
      hasImages: boolean;
    }>;
  };
}

export default function TestPDFPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [testResult, setTestResult] = useState<PDFTestResult | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 验证文件类型
      if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
        alert('请选择PDF格式的文件');
        return;
      }
      setSelectedFile(file);
      setTestResult(null);
    }
  };

  const handleTestPDF = async () => {
    if (!selectedFile) {
      alert('请先选择PDF模板文件');
      return;
    }

    setIsUploading(true);
    setTestResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/test/parse-pdf', {
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

  const handleClearFiles = async () => {
    setIsClearing(true);
    try {
      const response = await fetch('/api/test/parse-pdf', {
        method: 'DELETE'
      });
      
      const result = await response.json();
      if (result.success) {
        alert('测试文件清理完成');
      } else {
        alert('清理失败: ' + result.error);
      }
    } catch (error) {
      alert('清理失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsClearing(false);
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
              {testResult.success ? 'PDF测试成功' : 'PDF测试失败'}
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
            
            {/* PDF解析结果 */}
            <div className="p-3 bg-gray-50 rounded border">
              <div className="flex items-center gap-2 mb-2">
                {testResult.results.parsing.success ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="font-medium">PDF文档解析</span>
              </div>
              {testResult.results.parsing.success && (
                <div className="text-sm text-gray-600 space-y-1">
                  <p>内容长度: {testResult.results.parsing.contentLength}</p>
                  <p>页面数量: {testResult.results.parsing.pageCount}</p>
                  <p>包含图像: {testResult.results.parsing.hasImages ? '是' : '否'}</p>
                  <p>包含表格: {testResult.results.parsing.hasTables ? '是' : '否'}</p>
                  {testResult.results.parsing.metadata && (
                    <div className="mt-2">
                      <p className="font-medium">元数据:</p>
                      <p>标题: {testResult.results.parsing.metadata.title || '未知'}</p>
                      <p>作者: {testResult.results.parsing.metadata.author || '未知'}</p>
                    </div>
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
                  {testResult.results.variableReplacement.variables && (
                    <div className="mt-2">
                      <p className="font-medium">测试变量:</p>
                      <div className="max-h-32 overflow-y-auto">
                        {testResult.results.variableReplacement.variables.map((variable, index) => (
                          <div key={index} className="text-xs bg-white p-1 rounded mb-1">
                            <span className="font-mono">{variable.placeholder}</span> → 
                            <span className="ml-1">{variable.value}</span>
                            <span className="ml-1 text-gray-500">({variable.type})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                    <div>
                      <p>页数: {testResult.results.wordGeneration.metadata.pageCount}</p>
                      <p>字数: {testResult.results.wordGeneration.metadata.wordCount}</p>
                    </div>
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
                <h5 className="font-medium mb-2">PDF原始内容:</h5>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-auto max-h-32">
                  {testResult.previews.originalContent}
                </pre>
              </div>
            )}

            {testResult.previews.layoutInfo && (
              <div className="p-3 bg-green-50 rounded border">
                <h5 className="font-medium mb-2">布局分析结果:</h5>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>段落数量: {testResult.previews.layoutInfo.paragraphCount}</p>
                  <p>表格数量: {testResult.previews.layoutInfo.tableCount}</p>
                  <p>标题数量: {testResult.previews.layoutInfo.headerCount}</p>
                </div>
              </div>
            )}

            {testResult.previews.pageInfo && (
              <div className="p-3 bg-yellow-50 rounded border">
                <h5 className="font-medium mb-2">页面信息:</h5>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {testResult.previews.pageInfo.map((page, index) => (
                    <div key={index} className="text-xs bg-white p-2 rounded">
                      <p>页面 {page.pageNumber}: {page.textLength} 字符, {page.textItemCount} 文本项</p>
                      <p>包含图像: {page.hasImages ? '是' : '否'}</p>
                    </div>
                  ))}
                </div>
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
            <FileText className="w-8 h-8 text-red-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">PDF模板保真度测试</h1>
              <p className="text-gray-600">测试PDF文档处理系统的完整内容提取和格式保真度</p>
            </div>
          </div>

          {/* 说明信息 */}
          <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">PDF模板处理说明:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>上传PDF格式的模板文件</li>
                  <li>系统将提取完整的文本内容和布局信息</li>
                  <li>识别变量占位符: [变量], {'{{变量}}'}, ${'${变量}'}</li>
                  <li>进行模拟变量替换测试</li>
                  <li>生成保持原始格式的Word文档</li>
                  <li>验证PDF到Word的转换质量和格式保真度</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 文件上传 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择PDF模板文件
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
              />
              {selectedFile && (
                <div className="text-sm text-gray-600">
                  已选择: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="mb-6 flex gap-4">
            <button
              onClick={handleTestPDF}
              disabled={!selectedFile || isUploading}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  测试中...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  开始PDF测试
                </>
              )}
            </button>

            <button
              onClick={handleClearFiles}
              disabled={isClearing}
              className="flex items-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isClearing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  清理中...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  清理临时文件
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
