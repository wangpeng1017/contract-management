import { NextRequest, NextResponse } from 'next/server';
import { put, list } from '@vercel/blob';

// GET /api/test/blob-storage - 测试Blob存储配置
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  try {
    console.log('开始测试Blob存储配置...');
    
    // 检查环境变量
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    console.log('环境变量检查:', {
      hasBlobToken: !!blobToken,
      tokenLength: blobToken?.length,
      tokenPrefix: blobToken?.substring(0, 20) + '...'
    });

    if (!blobToken) {
      return NextResponse.json({
        success: false,
        error: 'BLOB_READ_WRITE_TOKEN 环境变量未配置',
        details: {
          envVars: Object.keys(process.env).filter(key => key.includes('BLOB'))
        }
      }, { status: 500 });
    }

    // 测试创建一个小文件
    const testContent = `测试文件 - ${new Date().toISOString()}`;
    const testBlob = new Blob([testContent], { type: 'text/plain' });
    const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });

    console.log('尝试上传测试文件...');
    const uploadResult = await put(`test/test-${Date.now()}.txt`, testFile, {
      access: 'public',
      addRandomSuffix: false,
    });

    console.log('测试文件上传成功:', uploadResult);

    // 测试列出文件
    console.log('尝试列出文件...');
    const listResult = await list({
      prefix: 'test/',
      limit: 5
    });

    console.log('文件列表获取成功:', listResult);

    return NextResponse.json({
      success: true,
      message: 'Blob存储配置正常',
      data: {
        uploadResult: {
          url: uploadResult.url,
          pathname: uploadResult.pathname,
          size: testFile.size
        },
        listResult: {
          count: listResult.blobs.length,
          blobs: listResult.blobs.slice(0, 3).map(blob => ({
            pathname: blob.pathname,
            size: blob.size,
            uploadedAt: blob.uploadedAt
          }))
        }
      }
    });

  } catch (error) {
    console.error('Blob存储测试失败:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Blob存储测试失败',
      details: {
        message: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : undefined,
        envVars: Object.keys(process.env).filter(key => key.includes('BLOB'))
      }
    }, { status: 500 });
  }
}

// POST /api/test/blob-storage - 测试文件上传
export async function POST(request: NextRequest) {
  try {
    console.log('开始测试文件上传...');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({
        success: false,
        error: '请提供测试文件'
      }, { status: 400 });
    }

    console.log('接收到测试文件:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // 直接使用Vercel Blob API上传
    const pathname = `test-uploads/${Date.now()}-${file.name}`;
    console.log('上传路径:', pathname);

    const result = await put(pathname, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    console.log('测试上传成功:', result);

    return NextResponse.json({
      success: true,
      message: '测试上传成功',
      data: {
        url: result.url,
        pathname: result.pathname,
        size: file.size,
        uploadedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('测试上传失败:', error);
    
    return NextResponse.json({
      success: false,
      error: '测试上传失败',
      details: {
        message: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : undefined
      }
    }, { status: 500 });
  }
}
