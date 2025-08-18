import { NextRequest, NextResponse } from 'next/server';
import { templateStorage } from '@/lib/template-storage';
import { documentProcessor } from '@/lib/document-processor';

// POST /api/templates/[id]/parse - 解析模板文档
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await params;

    // 获取上传的文件
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: '请选择要解析的模板文件'
        },
        { status: 400 }
      );
    }

    console.log('开始解析模板文档:', {
      templateId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    // 使用文档处理器解析文件
    const parseResult = await documentProcessor.parseDocumentFromFile(file);

    if (!parseResult.success) {
      console.error('文档解析失败:', parseResult.error);
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error || '文档解析失败'
        },
        { status: 400 }
      );
    }

    console.log('文档解析成功:', {
      contentLength: parseResult.content?.length,
      markdownLength: parseResult.markdown?.length,
      metadata: parseResult.metadata
    });

    // 存储解析结果
    const storeResult = await templateStorage.storeTemplateContent(templateId, {
      id: templateId,
      originalHtml: parseResult.originalHtml,
      markdown: parseResult.markdown,
      metadata: parseResult.metadata
    });

    if (!storeResult) {
      return NextResponse.json(
        {
          success: false,
          error: '存储解析结果失败'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        templateId,
        parsed: true,
        metadata: parseResult.metadata,
        preview: parseResult.markdown?.substring(0, 500) + '...'
      }
    });

  } catch (error) {
    console.error('模板解析API失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '模板解析失败，请稍后重试'
      },
      { status: 500 }
    );
  }
}

// GET /api/templates/[id]/parse - 获取模板解析状态
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await params;

    // 检查模板是否已解析
    const templateContent = await templateStorage.getTemplateContent(templateId);

    if (!templateContent) {
      return NextResponse.json({
        success: true,
        data: {
          templateId,
          parsed: false,
          message: '模板尚未解析，请上传模板文档进行解析'
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        templateId,
        parsed: true,
        metadata: templateContent.metadata,
        hasMarkdown: !!templateContent.markdown,
        hasHtml: !!templateContent.originalHtml
      }
    });

  } catch (error) {
    console.error('获取模板解析状态失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取解析状态失败'
      },
      { status: 500 }
    );
  }
}
