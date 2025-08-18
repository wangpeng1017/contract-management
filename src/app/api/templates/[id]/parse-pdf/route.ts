import { NextRequest, NextResponse } from 'next/server';
import { templateStorage } from '@/lib/template-storage';

// POST /api/templates/[id]/parse-pdf - 解析PDF模板文档
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await params;

    // 获取上传的PDF文件
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: '请选择要解析的PDF模板文件'
        },
        { status: 400 }
      );
    }

    // 验证文件类型
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        {
          success: false,
          error: '请上传PDF格式的文件'
        },
        { status: 400 }
      );
    }

    console.log('开始解析PDF模板文档:', {
      templateId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    // 使用PDF模板存储服务解析文件
    const parseResult = await templateStorage.parseAndStorePDFTemplate(templateId, file);

    if (!parseResult.success) {
      console.error('PDF模板解析失败:', parseResult.error);
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error || 'PDF模板解析失败'
        },
        { status: 400 }
      );
    }

    console.log('PDF模板解析成功');

    return NextResponse.json({
      success: true,
      data: {
        templateId,
        parsed: true,
        fileType: 'pdf',
        message: 'PDF模板解析成功，已启用格式保真系统'
      }
    });

  } catch (error) {
    console.error('PDF模板解析API失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'PDF模板解析失败，请稍后重试'
      },
      { status: 500 }
    );
  }
}

// GET /api/templates/[id]/parse-pdf - 获取PDF模板解析状态
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await params;

    // 检查PDF模板是否已解析
    const templateContent = await templateStorage.getTemplateContent(templateId);

    if (!templateContent) {
      return NextResponse.json({
        success: true,
        data: {
          templateId,
          parsed: false,
          fileType: 'unknown',
          message: 'PDF模板尚未解析，请上传PDF模板文档进行解析'
        }
      });
    }

    if (templateContent.fileType !== 'pdf') {
      return NextResponse.json({
        success: true,
        data: {
          templateId,
          parsed: false,
          fileType: templateContent.fileType || 'unknown',
          message: '当前模板不是PDF格式'
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        templateId,
        parsed: true,
        fileType: 'pdf',
        metadata: templateContent.metadata,
        hasPDFData: !!templateContent.pdfData,
        pageCount: templateContent.metadata?.pageCount || 0,
        wordCount: templateContent.metadata?.wordCount || 0,
        hasImages: templateContent.metadata?.hasImages || false,
        hasTables: templateContent.metadata?.hasTables || false
      }
    });

  } catch (error) {
    console.error('获取PDF模板解析状态失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取解析状态失败'
      },
      { status: 500 }
    );
  }
}
