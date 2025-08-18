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

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: '合同ID不能为空'
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status, filePath, content, variablesData } = body;

    const updateData: Record<string, unknown> = {};

    if (status !== undefined) updateData.status = status;
    if (filePath !== undefined) updateData.filePath = filePath;
    if (content !== undefined) updateData.content = content;
    if (variablesData !== undefined) updateData.variablesData = variablesData;

    // 检查是否有数据需要更新
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '没有提供需要更新的数据'
        },
        { status: 400 }
      );
    }

    // 先检查合同是否存在
    const existingContract = await prisma.generatedContract.findUnique({
      where: { id }
    });

    if (!existingContract) {
      return NextResponse.json(
        {
          success: false,
          error: '合同不存在'
        },
        { status: 404 }
      );
    }

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

    // 提供更详细的错误信息
    let errorMessage = '更新合同失败';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage
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
