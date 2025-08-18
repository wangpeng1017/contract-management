import { NextRequest, NextResponse } from 'next/server';
import { feishuTemplateStorage } from '@/lib/feishu-template-storage';

/**
 * 飞书模板上传API
 * POST /api/feishu/templates/upload
 */
export async function POST(request: NextRequest) {
  try {
    console.log('收到飞书模板上传请求');

    // 解析表单数据
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const templateName = formData.get('templateName') as string;

    // 验证输入
    if (!file) {
      return NextResponse.json({
        success: false,
        error: '请选择要上传的文件'
      }, { status: 400 });
    }

    if (!templateName) {
      return NextResponse.json({
        success: false,
        error: '请提供模板名称'
      }, { status: 400 });
    }

    // 验证文件类型
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: '不支持的文件格式，请上传 PDF、DOC 或 DOCX 文件'
      }, { status: 400 });
    }

    // 验证文件大小（最大10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        error: '文件大小超过限制（最大10MB）'
      }, { status: 400 });
    }

    console.log('文件验证通过:', {
      name: file.name,
      type: file.type,
      size: file.size,
      templateName
    });

    // 转换为Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // 上传到飞书
    const result = await feishuTemplateStorage.uploadTemplate(buffer, file.name, templateName);

    if (result.success) {
      console.log('飞书模板上传成功:', result.templateId);
      
      return NextResponse.json({
        success: true,
        templateId: result.templateId,
        message: '模板上传成功'
      });
    } else {
      console.error('飞书模板上传失败:', result.error);
      
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }

  } catch (error) {
    console.error('飞书模板上传API错误:', error);
    
    return NextResponse.json({
      success: false,
      error: `上传失败: ${error instanceof Error ? error.message : '未知错误'}`
    }, { status: 500 });
  }
}

/**
 * 获取上传状态
 * GET /api/feishu/templates/upload
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: '飞书模板上传API运行正常',
      supportedFormats: ['PDF', 'DOC', 'DOCX'],
      maxFileSize: '10MB',
      features: [
        '自动格式转换',
        '变量提取',
        '完美格式保真',
        '多格式支持'
      ]
    });
  } catch (error) {
    console.error('获取上传状态失败:', error);
    return NextResponse.json({
      success: false,
      error: '服务不可用'
    }, { status: 500 });
  }
}
