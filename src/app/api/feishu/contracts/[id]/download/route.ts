import { NextRequest, NextResponse } from 'next/server';
import { feishuTemplateStorage } from '@/lib/feishu-template-storage';

/**
 * 下载飞书生成的合同文档
 * GET /api/feishu/contracts/[id]/download
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contractId = params.id;
    
    console.log('下载飞书合同文档:', contractId);

    // 获取合同文档
    const result = await feishuTemplateStorage.getContractDocument(contractId);
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 404 });
    }

    if (!result.buffer) {
      return NextResponse.json({
        success: false,
        error: '文档内容不可用'
      }, { status: 500 });
    }

    // 设置响应头
    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    headers.set('Content-Disposition', `attachment; filename="contract-${contractId}.docx"`);
    headers.set('Content-Length', result.buffer.length.toString());

    return new NextResponse(result.buffer, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('下载飞书合同文档失败:', error);
    
    return NextResponse.json({
      success: false,
      error: `下载失败: ${error instanceof Error ? error.message : '未知错误'}`
    }, { status: 500 });
  }
}
