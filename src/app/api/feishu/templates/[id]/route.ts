import { NextRequest, NextResponse } from 'next/server';
import { feishuTemplateStorage } from '@/lib/feishu-template-storage';

/**
 * 获取飞书模板详情
 * GET /api/feishu/templates/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const templateId = resolvedParams.id;
    
    console.log('获取飞书模板详情:', templateId);

    const template = await feishuTemplateStorage.getTemplate(templateId);
    
    if (!template) {
      return NextResponse.json({
        success: false,
        error: '模板不存在'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        name: template.name,
        variables: template.variables,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
        source: 'feishu'
      }
    });

  } catch (error) {
    console.error('获取飞书模板失败:', error);
    
    return NextResponse.json({
      success: false,
      error: `获取模板失败: ${error instanceof Error ? error.message : '未知错误'}`
    }, { status: 500 });
  }
}

/**
 * 更新飞书模板
 * PUT /api/feishu/templates/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const templateId = resolvedParams.id;
    const body = await request.json();
    
    console.log('更新飞书模板:', templateId, body);

    const result = await feishuTemplateStorage.updateTemplate(templateId, {
      name: body.name,
      variables: body.variables
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '模板更新成功'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }

  } catch (error) {
    console.error('更新飞书模板失败:', error);
    
    return NextResponse.json({
      success: false,
      error: `更新失败: ${error instanceof Error ? error.message : '未知错误'}`
    }, { status: 500 });
  }
}

/**
 * 删除飞书模板
 * DELETE /api/feishu/templates/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const templateId = resolvedParams.id;
    
    console.log('删除飞书模板:', templateId);

    const result = await feishuTemplateStorage.deleteTemplate(templateId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '模板删除成功'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }

  } catch (error) {
    console.error('删除飞书模板失败:', error);
    
    return NextResponse.json({
      success: false,
      error: `删除失败: ${error instanceof Error ? error.message : '未知错误'}`
    }, { status: 500 });
  }
}
