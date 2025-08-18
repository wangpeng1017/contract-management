'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Download, Trash2, Settings } from 'lucide-react';

interface VariableInfo {
  placeholder: string;
  type: 'text' | 'currency' | 'date' | 'percentage';
  description: string;
  required: boolean;
  defaultValue?: string;
}

interface TemplateInfo {
  id: string;
  name: string;
  variables: VariableInfo[];
  createdAt: string;
  updatedAt: string;
  source: string;
}

interface UploadResult {
  success: boolean;
  templateId?: string;
  error?: string;
  message?: string;
}

interface GenerationResult {
  success: boolean;
  contractId?: string;
  downloadUrl?: string;
  error?: string;
  message?: string;
}

export default function FeishuTestPage() {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [templateInfo, setTemplateInfo] = useState<TemplateInfo | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [contractTitle, setContractTitle] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [templateName, setTemplateName] = useState('');

  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setTemplateName(file.name.replace(/\.[^/.]+$/, '')); // 移除扩展名
      setUploadStatus('idle');
      setUploadResult(null);
      setTemplateInfo(null);
    }
  };

  // 上传模板
  const handleUpload = async () => {
    if (!selectedFile || !templateName.trim()) {
      alert('请选择文件并输入模板名称');
      return;
    }

    setUploadStatus('uploading');
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('templateName', templateName.trim());

      const response = await fetch('/api/feishu/templates/upload', {
        method: 'POST',
        body: formData
      });

      const result: UploadResult = await response.json();
      setUploadResult(result);

      if (result.success && result.templateId) {
        setUploadStatus('success');
        // 获取模板详情
        await fetchTemplateInfo(result.templateId);
      } else {
        setUploadStatus('error');
      }
    } catch (error) {
      console.error('上传失败:', error);
      setUploadStatus('error');
      setUploadResult({
        success: false,
        error: `上传失败: ${error instanceof Error ? error.message : '未知错误'}`
      });
    }
  };

  // 获取模板信息
  const fetchTemplateInfo = async (templateId: string) => {
    try {
      const response = await fetch(`/api/feishu/templates/${templateId}`);
      const result = await response.json();

      if (result.success) {
        setTemplateInfo(result.template);
        // 初始化变量值
        const initialVariables: Record<string, string> = {};
        result.template.variables.forEach((variable: VariableInfo) => {
          initialVariables[variable.placeholder] = variable.defaultValue || '';
        });
        setVariables(initialVariables);
      }
    } catch (error) {
      console.error('获取模板信息失败:', error);
    }
  };

  // 更新变量值
  const handleVariableChange = (placeholder: string, value: string) => {
    setVariables(prev => ({
      ...prev,
      [placeholder]: value
    }));
  };

  // 生成合同
  const handleGenerateContract = async () => {
    if (!templateInfo || !contractTitle.trim()) {
      alert('请填写合同标题');
      return;
    }

    // 验证必需变量
    const missingVariables = templateInfo.variables
      .filter(variable => variable.required && !variables[variable.placeholder]?.trim())
      .map(variable => variable.placeholder);

    if (missingVariables.length > 0) {
      alert(`请填写必需变量: ${missingVariables.join(', ')}`);
      return;
    }

    setGenerationStatus('generating');
    setGenerationResult(null);

    try {
      const response = await fetch('/api/feishu/contracts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId: templateInfo.id,
          variables,
          contractTitle: contractTitle.trim()
        })
      });

      const result: GenerationResult = await response.json();
      setGenerationResult(result);

      if (result.success) {
        setGenerationStatus('success');
      } else {
        setGenerationStatus('error');
      }
    } catch (error) {
      console.error('生成合同失败:', error);
      setGenerationStatus('error');
      setGenerationResult({
        success: false,
        error: `生成失败: ${error instanceof Error ? error.message : '未知错误'}`
      });
    }
  };

  // 下载合同
  const handleDownloadContract = async () => {
    if (!generationResult?.contractId) return;

    try {
      const response = await fetch(`/api/feishu/contracts/${generationResult.contractId}/download`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${contractTitle || 'contract'}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('下载失败');
      }
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载失败');
    }
  };

  // 重置状态
  const handleReset = () => {
    setSelectedFile(null);
    setTemplateName('');
    setUploadStatus('idle');
    setUploadResult(null);
    setTemplateInfo(null);
    setVariables({});
    setGenerationStatus('idle');
    setGenerationResult(null);
    setContractTitle('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            飞书文档API合同生成测试
          </h1>
          <p className="text-gray-600">
            基于飞书文档API的完美格式保真合同生成解决方案
          </p>
        </div>

        {/* 功能特性 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">🚀 技术特性</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-blue-800">
            <div>✅ 完美格式保真</div>
            <div>✅ 多格式支持</div>
            <div>✅ 智能变量替换</div>
            <div>✅ 云端处理</div>
          </div>
        </div>

        {/* 第一步：模板上传 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Upload className="mr-2" size={20} />
            第一步：上传合同模板
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择模板文件 (支持 PDF, DOC, DOCX)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {selectedFile && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  模板名称
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入模板名称"
                />
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!selectedFile || !templateName.trim() || uploadStatus === 'uploading'}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
            >
              {uploadStatus === 'uploading' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  上传中...
                </>
              ) : (
                <>
                  <Upload size={16} className="mr-2" />
                  上传到飞书
                </>
              )}
            </button>
          </div>

          {/* 上传结果 */}
          {uploadResult && (
            <div className={`mt-4 p-4 rounded-md ${uploadResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center">
                {uploadResult.success ? (
                  <CheckCircle className="text-green-600 mr-2" size={20} />
                ) : (
                  <XCircle className="text-red-600 mr-2" size={20} />
                )}
                <span className={uploadResult.success ? 'text-green-800' : 'text-red-800'}>
                  {uploadResult.success ? uploadResult.message : uploadResult.error}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 第二步：变量配置 */}
        {templateInfo && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Settings className="mr-2" size={20} />
              第二步：配置变量
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                合同标题 *
              </label>
              <input
                type="text"
                value={contractTitle}
                onChange={(e) => setContractTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入合同标题"
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                模板变量 ({templateInfo.variables.length} 个)
              </h3>
              
              {templateInfo.variables.map((variable, index) => (
                <div key={index} className="border border-gray-200 rounded-md p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      {variable.placeholder}
                      {variable.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {variable.type}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{variable.description}</p>
                  
                  <input
                    type={variable.type === 'date' ? 'date' : 'text'}
                    value={variables[variable.placeholder] || ''}
                    onChange={(e) => handleVariableChange(variable.placeholder, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={variable.defaultValue || `输入${variable.placeholder}`}
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handleGenerateContract}
              disabled={!contractTitle.trim() || generationStatus === 'generating'}
              className="mt-6 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
            >
              {generationStatus === 'generating' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  生成中...
                </>
              ) : (
                <>
                  <FileText size={16} className="mr-2" />
                  生成合同
                </>
              )}
            </button>
          </div>
        )}

        {/* 第三步：合同下载 */}
        {generationResult && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Download className="mr-2" size={20} />
              第三步：下载合同
            </h2>

            <div className={`p-4 rounded-md ${generationResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {generationResult.success ? (
                    <CheckCircle className="text-green-600 mr-2" size={20} />
                  ) : (
                    <XCircle className="text-red-600 mr-2" size={20} />
                  )}
                  <span className={generationResult.success ? 'text-green-800' : 'text-red-800'}>
                    {generationResult.success ? generationResult.message : generationResult.error}
                  </span>
                </div>

                {generationResult.success && (
                  <button
                    onClick={handleDownloadContract}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                  >
                    <Download size={16} className="mr-2" />
                    下载合同
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 重置按钮 */}
        <div className="text-center">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center mx-auto"
          >
            <Trash2 size={16} className="mr-2" />
            重新开始
          </button>
        </div>
      </div>
    </div>
  );
}
