import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

// GET /api/contracts/[id] - 获取单个合同详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const contract = await prisma.generatedContract.findUnique({
      where: { id },
      include: {
        template: {
          include: {
            category: true,
            variables: {
              orderBy: {
                orderIndex: 'asc'
              }
            }
          }
        }
      }
    });

    if (!contract) {
      return NextResponse.json(
        {
          success: false,
          error: '合同不存在'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: contract
    });

  } catch (error) {
    console.error('获取合同详情失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取合同详情失败'
      },
      { status: 500 }
    );
  }
}

// PUT /api/contracts/[id] - 更新合同内容或状态
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, filePath, content, variablesData } = body;

    const updateData: Record<string, unknown> = {};

    if (status) updateData.status = status;
    if (filePath) updateData.filePath = filePath;
    if (content) updateData.content = content;
    if (variablesData) updateData.variablesData = variablesData;

    const contract = await prisma.generatedContract.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      data: contract
    });

  } catch (error) {
    console.error('更新合同失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '更新合同失败'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/contracts/[id] - 删除合同
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.generatedContract.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: '合同删除成功'
    });

  } catch (error) {
    console.error('删除合同失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '删除合同失败'
      },
      { status: 500 }
    );
  }
}
