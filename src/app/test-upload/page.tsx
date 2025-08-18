'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestUploadPage() {
  const [testing, setTesting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);

  // 测试Blob存储配置
  const testBlobStorage = async () => {
    setTesting(true);
    setResults(null);
    
    try {
      const response = await fetch('/api/test/blob-storage');
      const result = await response.json();
      setResults(result);
    } catch (error) {
      setResults({
        success: false,
        error: '请求失败',
        details: { message: error instanceof Error ? error.message : '未知错误' }
      });
    } finally {
      setTesting(false);
    }
  };

  // 测试文件上传
  const testFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);

    try {
      // 测试直接上传到Blob存储
      const formData = new FormData();
      formData.append('file', file);

      console.log('开始测试上传:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      const response = await fetch('/api/test/blob-storage', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      setUploadResult(result);

      // 如果直接上传成功，再测试正式的上传API
      if (result.success) {
        console.log('直接上传成功，测试正式API...');
        
        const formData2 = new FormData();
        formData2.append('file', file);
        formData2.append('container', 'templates');

        const response2 = await fetch('/api/upload', {
          method: 'POST',
          body: formData2
        });

        const result2 = await response2.json();
        setUploadResult({
          ...result,
          officialApiResult: result2
        });
      }

    } catch (error) {
      setUploadResult({
        success: false,
        error: '上传测试失败',
        details: { message: error instanceof Error ? error.message : '未知错误' }
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">文件上传调试工具</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Blob存储配置测试 */}
        <Card>
          <CardHeader>
            <CardTitle>Blob存储配置测试</CardTitle>
            <CardDescription>
              测试Vercel Blob存储的基本配置和连接
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testBlobStorage} 
              disabled={testing}
              className="w-full"
            >
              {testing ? '测试中...' : '测试Blob存储'}
            </Button>
            
            {results && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">测试结果:</h4>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-96">
                  {JSON.stringify(results, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 文件上传测试 */}
        <Card>
          <CardHeader>
            <CardTitle>文件上传测试</CardTitle>
            <CardDescription>
              测试实际的文件上传功能
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              type="file"
              accept=".docx,.doc,.pdf"
              onChange={testFileUpload}
              disabled={uploading}
              className="w-full"
            />
            
            {uploading && (
              <p className="text-sm text-gray-600 mt-2">上传测试中...</p>
            )}
            
            {uploadResult && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">上传结果:</h4>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-96">
                  {JSON.stringify(uploadResult, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 环境信息 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>环境信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>支持的文件类型:</strong>
              <ul className="list-disc list-inside mt-1">
                <li>.docx (Word 2007+)</li>
                <li>.doc (Word 97-2003)</li>
                <li>.pdf (PDF文档)</li>
              </ul>
            </div>
            <div>
              <strong>文件大小限制:</strong>
              <p>最大 10MB</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 调试说明 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>调试说明</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p><strong>1. Blob存储测试:</strong> 验证Vercel Blob存储的基本配置和连接性</p>
          <p><strong>2. 文件上传测试:</strong> 测试实际的文件上传流程，包括直接上传和正式API</p>
          <p><strong>3. 查看浏览器控制台:</strong> 更多详细的调试信息会输出到浏览器控制台</p>
          <p><strong>4. 检查网络面板:</strong> 查看具体的HTTP请求和响应</p>
        </CardContent>
      </Card>
    </div>
  );
}
