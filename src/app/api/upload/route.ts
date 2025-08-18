import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, generateSafeFilename, validateFileType, validateFileSize } from '@/lib/blob-storage';

// POST /api/upload - 上传文件到Vercel Blob存储
export async function POST(request: NextRequest) {
  try {
    console.log('开始处理文件上传请求...');

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const container = formData.get('container') as string;

    console.log('接收到的参数:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      container
    });

    if (!file) {
      console.log('错误: 没有接收到文件');
      return NextResponse.json(
        {
          success: false,
          error: '请选择要上传的文件'
        },
        { status: 400 }
      );
    }

    // 验证文件类型
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'application/pdf' // .pdf
    ];

    console.log('文件类型验证:', {
      fileType: file.type,
      allowedTypes,
      isValid: validateFileType(file, allowedTypes)
    });

    if (!validateFileType(file, allowedTypes)) {
      console.log('错误: 文件类型不支持');
      return NextResponse.json(
        {
          success: false,
          error: '不支持的文件类型，请上传 .docx、.doc 或 .pdf 文件'
        },
        { status: 400 }
      );
    }

    // 验证文件大小（最大10MB）
    const maxSizeInMB = parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '10');
    console.log('文件大小验证:', {
      fileSize: file.size,
      maxSizeInMB,
      maxSizeInBytes: maxSizeInMB * 1024 * 1024,
      isValid: validateFileSize(file, maxSizeInMB)
    });

    if (!validateFileSize(file, maxSizeInMB)) {
      console.log('错误: 文件大小超限');
      return NextResponse.json(
        {
          success: false,
          error: `文件大小不能超过 ${maxSizeInMB}MB`
        },
        { status: 400 }
      );
    }

    // 生成安全的文件名
    const safeFilename = generateSafeFilename(file.name, 'template');
    console.log('生成的安全文件名:', safeFilename);

    // 检查环境变量
    console.log('环境变量检查:', {
      hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
      blobTokenLength: process.env.BLOB_READ_WRITE_TOKEN?.length
    });

    // 上传文件
    console.log('开始上传文件到Vercel Blob...');
    const result = await uploadFile(
      file,
      container === 'generated' ? 'GENERATED' : 'TEMPLATES',
      safeFilename
    );
    console.log('文件上传成功:', result);

    return NextResponse.json({
      success: true,
      data: {
        url: result.url,
        pathname: result.pathname,
        filename: safeFilename,
        originalName: file.name,
        size: file.size,
        type: file.type
      }
    });

  } catch (error) {
    console.error('文件上传失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '文件上传失败，请稍后重试'
      },
      { status: 500 }
    );
  }
}
