import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, generateSafeFilename, validateFileType, validateFileSize } from '@/lib/blob-storage';

// POST /api/upload - 上传文件到Vercel Blob存储
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const container = formData.get('container') as string;

    if (!file) {
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

    if (!validateFileType(file, allowedTypes)) {
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
    if (!validateFileSize(file, maxSizeInMB)) {
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

    // 上传文件
    const result = await uploadFile(
      file,
      container === 'generated' ? 'GENERATED' : 'TEMPLATES',
      safeFilename
    );

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
